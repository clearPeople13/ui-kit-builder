// 调试台重数据惰性化基准（G4）
// 用法：node scripts/bench-heavy.mjs
// 断言：导入 presets/scenes 模块时不物化重数据（heavyRows 工厂未被调用），
//       首次取值才生成且按引用共享；并对比 presetValues 在新旧路径下的成本。
import { createRequire } from 'node:module'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const esbuild = require('esbuild')

const consumerRoot = join(import.meta.dirname, '..')
const outDir = join(tmpdir(), 'ui-kit-bench-g4')
rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

// demo 模块是 extensionless 的 TS，直接用 esbuild 打成单个 ESM 再动态导入
await esbuild.build({
  entryPoints: [join(consumerRoot, 'src/demo/scenes.ts'), join(consumerRoot, 'src/demo/presets.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  outdir: outDir,
  outExtension: { '.js': '.mjs' },
  logLevel: 'silent'
})

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)}MB`
const time = (fn) => {
  const start = performance.now()
  const result = fn()
  return { ms: performance.now() - start, result }
}

// ---- 1. 导入模块：重数据不得物化 ----
const heapBeforeImport = process.memoryUsage().heapUsed
const demo = await import(pathToFileURL(join(outDir, 'scenes.mjs')).href)
const presets = await import(pathToFileURL(join(outDir, 'presets.mjs')).href)
const heapAfterImport = process.memoryUsage().heapUsed

const tablePresets = presets.SCENE_PRESETS.Table
const heavyIds = ['heavy-data', 'heavy-data-20k', 'heavy-data-100k', 'heavy-variable', 'heavy-tree']
const heavyPresets = heavyIds.map((id) => {
  const preset = tablePresets.find((item) => item.id === id)
  if (!preset) {
    throw new Error(`缺少预设 ${id}`)
  }
  return preset
})

let failed = false
const assert = (ok, message) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${message}`)
  if (!ok) {
    failed = true
  }
}

const lazyBefore = heavyPresets.every((preset) => typeof preset.values.data === 'function')
assert(lazyBefore, '导入模块后 heavy 预设的 data 仍是工厂函数（未物化）')
assert(
  heapAfterImport - heapBeforeImport < 64 * 1024 * 1024,
  `导入模块堆增长 ${mb(heapAfterImport - heapBeforeImport)} < 64MB（17.5 万行若 eager 生成约为数百 MB）`
)

// 普通预设不受影响：仍是物化好的数组
const spanPreset = tablePresets.find((item) => item.id === 'span')
assert(Array.isArray(spanPreset.values.data) && spanPreset.values.data.length === 8, '普通预设（span）的 data 仍是物化数组')

// ---- 2. presetValues 成本对比（以 10 万行场景为例）----
const entry = { name: 'Table', controls: [] }
const core = new Set(['core'])
const preset100k = heavyPresets.find((preset) => preset.id === 'heavy-data-100k')

const first = time(() => demo.presetValues(entry, preset100k, core))
const rows = first.result.data
assert(Array.isArray(rows) && rows.length === 100000, `首次 presetValues(100k) 物化出 ${rows.length} 行`)
console.log(`INFO  首次 presetValues(100k)：${first.ms.toFixed(1)}ms（含一次性生成，工厂内部缓存）`)

const second = time(() => demo.presetValues(entry, preset100k, core))
assert(second.result.data === rows, '第二次 presetValues(100k) 返回同一引用（按引用共享，零拷贝）')
console.log(`INFO  第二次 presetValues(100k)：${second.ms.toFixed(2)}ms（缓存命中）`)

// 旧路径代价：structuredClone 整个 10 万行数组（每次切场景都发生）
const clone = time(() => structuredClone(rows))
console.log(`INFO  旧路径 structuredClone(100k)：${clone.ms.toFixed(1)}ms —— 现在每次切换已省下`)
console.log(
  `INFO  切到 10 万行场景成本：首次生成 ${first.ms.toFixed(1)}ms（一次性），其后 ${second.ms.toFixed(2)}ms；旧实现额外 +${clone.ms.toFixed(1)}ms 深拷贝`
)

// ---- 3. 小值仍深拷贝（属性面板隔离不被破坏）----
const resolvedSpan = demo.presetValues(entry, spanPreset, core)
assert(
  resolvedSpan.data !== spanPreset.values.data && resolvedSpan.data.length === spanPreset.values.data.length,
  '小值（span 8 行）presetValues 仍返回深拷贝，与预设原始值隔离'
)

// ---- 4. 其余 heavy 工厂惰性解析 ----
for (const preset of heavyPresets) {
  const value = presets.resolvePresetValue(preset.values.data)
  const length = Array.isArray(value) ? value.length : 0
  const expect = { 'heavy-data': 5000, 'heavy-data-20k': 20000, 'heavy-data-100k': 100000, 'heavy-variable': 50000 }[preset.id]
  assert(preset.id === 'heavy-tree' ? length === 20 : length === expect, `${preset.id} 首次解析行数正确（${length}${preset.id === 'heavy-tree' ? ' 根节点，展开后 5220 行' : ''}）`)
  assert(presets.resolvePresetValue(preset.values.data) === value, `${preset.id} 重复解析返回缓存引用`)
}

console.log(failed ? '\n基准结论：存在失败断言' : '\n基准结论：全部断言通过 —— 重数据惰性化生效')
process.exit(failed ? 1 : 0)
