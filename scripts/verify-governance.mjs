#!/usr/bin/env node
/**
 * 第八批 · 治理校验（静态、秒级，门禁的一段）
 *
 * "测试做了却没拦住缺陷"暴露的三个流程缺口，在这里全部变成机器判定：
 *   1. 影响面清单：改了共享模块 → 同族组件必须有组件层回归用例；
 *      改了含浮层/输入的组件 → 必须有浏览器层场景契约用例
 *   2. 特性裁剪静态守卫：feature 提供的布尔 prop 不许用 props.x !== false 判断
 *      （特性被裁掉时 x 是 undefined，会被当成"启用"，F-64）
 *   3. 文档数字与产物对齐：README 组件数、门禁段数、守卫挂账必须登记
 *   4. 缺陷编号唯一性 / 连续性：并行分支撞号、顺延漏号、三处文档口径滞后
 *   5. 改动面取 `git diff HEAD`：已暂存（git add）的改动也必须被扫描，
 *      否则开发者只要先 add 就能让影响面清单静默跳过
 * 不构建、不跑用例，失败即非零退出。
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SRC = 'packages/ui-kit/src'
const failures = []
const notes = []

function git(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

function read(rel) {
  try {
    return readFileSync(join(ROOT, rel), 'utf8')
  } catch {
    return ''
  }
}

function filesUnder(dirRel, ext = '.ts') {
  const out = []
  const walk = (rel) => {
    const abs = join(ROOT, rel)
    if (!existsSync(abs)) {
      return
    }
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const next = `${rel}/${entry.name}`
      if (entry.isDirectory()) {
        walk(next)
      } else if (entry.name.endsWith(ext)) {
        out.push(next)
      }
    }
  }
  walk(dirRel)
  return out
}

function fail(message) {
  failures.push(message)
}

function pascal(id) {
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

const componentIds = readdirSync(join(ROOT, SRC, 'components'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
const componentSpecs = filesUnder('tests/components', '.spec.ts')
const browserSpecs = filesUnder('tests/browser', '.spec.ts')

function hasComponentSpec(id) {
  const name = pascal(id)
  return componentSpecs.some((file) => {
    const text = read(file)
    return text.includes(name) || text.includes(id)
  })
}

// ---- 1. 改动面与影响面清单 ----
const base = ['main', 'origin/main'].find((candidate) => git(['rev-parse', '--verify', candidate]).length)
const changed = [
  ...new Set([
    ...(base ? git(['diff', '--name-only', `${base}...HEAD`]) : []),
    // HEAD 而非空参数：同时覆盖未暂存与已暂存，pre-commit 前改动通常已在索引里
    ...git(['diff', '--name-only', 'HEAD']),
    ...git(['ls-files', '--others', '--exclude-standard'])
  ])
].filter((file) => file.startsWith(`${SRC}/`))

for (const file of changed.filter((item) => /^packages\/ui-kit\/src\/shared\/.+\.ts$/.test(item))) {
  const stem = file.match(/shared\/([^/]+)\.ts$/)?.[1]
  if (!stem) {
    continue
  }
  const family = componentIds.filter((id) =>
    filesUnder(`${SRC}/components/${id}`).some((source) => read(source).includes(`shared/${stem}`))
  )
  notes.push(`共享模块 shared/${stem}.ts → 同族组件 ${family.length} 个：${family.join(', ')}`)
  for (const id of family) {
    if (!hasComponentSpec(id)) {
      fail(`改了 shared/${stem}.ts，但同族组件 ${id} 没有组件层回归用例`)
    }
  }
}

// 只在这次 diff 真的动了"点击 / 焦点 / 浮层"代码时才要求浏览器层场景，
// 避免改一行纯逻辑也要被迫补一个 Playwright 文件。组件层用例证不了焦点链，
// 所以这类改动必须留下真实浏览器里的操作序列。
const componentDiff = [
  ...(base ? git(['diff', '--no-color', `${base}...HEAD`, '--', `${SRC}/components`]) : []),
  ...git(['diff', '--no-color', 'HEAD', '--', `${SRC}/components`])
].join('\n')
const interactiveTouched = new Set()
for (const block of componentDiff.split(/^diff --git /m).slice(1)) {
  const path = block.split('\n')[0].match(/^a\/(\S+)\s+b\//)?.[1]
  const id = path?.match(/^packages\/ui-kit\/src\/components\/([^/]+)\//)?.[1]
  if (!id || !path?.endsWith('core.ts')) {
    continue
  }
  const lines = block
    .split('\n')
    .filter((line) => /^[+-]/.test(line) && !/^(\+\+\+|---)/.test(line))
    .join('\n')
  if (/onClick|onBlur|onFocus|pointerdown|Teleport|useFloatingPanel|h\('input'|keydown/.test(lines)) {
    interactiveTouched.add(id)
  }
}

// 新增但还没被 git 跟踪的 core.ts 不会出现在 diff 文本里，按全文补扫一次
for (const file of changed) {
  if (!file.endsWith('/core.ts') || componentDiff.includes(`a/${file}`)) {
    continue
  }
  const id = file.match(/^packages\/ui-kit\/src\/components\/([^/]+)\//)?.[1]
  if (id && /onClick|onBlur|onFocus|pointerdown|Teleport|useFloatingPanel|h\('input'|keydown/.test(read(file))) {
    interactiveTouched.add(id)
  }
}
for (const id of interactiveTouched) {
  const scenes = browserSpecs.filter((file) => file.includes(id))
  if (!scenes.length) {
    fail(`本次改动触及 ${id} 的点击/焦点/浮层代码，但浏览器层没有场景契约用例`)
  } else {
    notes.push(`场景覆盖 ${id}：组件层 ✓ / 浏览器层 ${scenes.length} 个文件`)
  }
}
if (!changed.length) {
  notes.push('本次无源码改动，影响面清单跳过')
}

// ---- 2. 特性裁剪静态守卫 ----
// 白名单每一项都必须在 REQUIREMENTS.md 写下"已审计但无害"的结论与理由，
// 否则 fail：白名单不许变成绕过检查的后门。
// A- 前缀是"审计结论（已确认无害）"，不是缺陷编号；F- 前缀只给真缺陷用。
const AUDITED = {
  'avatar.teleported': 'A-1',
  'form.showMessage': 'A-2',
  'form.validateOnRuleChange': 'A-3',
  'tooltip.enterable': 'A-4'
}
const requirementsText = read('REQUIREMENTS.md')
for (const id of componentIds) {
  const featureFiles = filesUnder(`${SRC}/components/${id}/features`, '.ts').filter((file) =>
    file.endsWith('/index.ts')
  )
  const booleans = new Set()
  for (const file of featureFiles) {
    for (const match of read(file).matchAll(/(\w+)\s*:\s*\{\s*type:\s*Boolean\b/g)) {
      booleans.add(match[1])
    }
  }
  const core = read(`${SRC}/components/${id}/core.ts`)
  for (const name of booleans) {
    if (!new RegExp(`props\\.${name}\\s*!==\\s*false`).test(core)) {
      continue
    }
    if (core.includes(`'${name}' in props`)) {
      notes.push(`${id}.${name} 已有 in props 存在性守卫，跳过`)
      continue
    }
    const key = `${id}.${name}`
    if (AUDITED[key]) {
      if (!requirementsText.includes(key)) {
        fail(`白名单 ${key}（${AUDITED[key]}）没有在 REQUIREMENTS.md 写下审计结论`)
      } else {
        notes.push(`已审计但无害：${key}（${AUDITED[key]}）`)
      }
      continue
    }
    fail(
      `${id}/core.ts 用 props.${name} !== false 判断特性开关；${name} 由 feature 提供，裁剪掉时是 undefined 会被当成启用（F-64）`
    )
  }
}
notes.push(`特性裁剪静态守卫：扫描 ${componentIds.length} 个组件目录`)

// ---- 3. 文档数字与产物对齐 ----
const meta = JSON.parse(read('examples/consumer/src/demo/meta.json') || '{}')
const componentCount = Array.isArray(meta.components) ? meta.components.length : 0
const readmeCount = Number(read('README.md').match(/(\d+)\s*个组件的场景预设/)?.[1] ?? 0)
if (!componentCount || readmeCount !== componentCount) {
  fail(`README 组件数 ${readmeCount} 与 demo/meta.json 的 ${componentCount} 不一致（F-52 复发）`)
}
const pkg = JSON.parse(read('package.json'))
const ciText = read('scripts/ci.mjs')
const stageCount = (ciText.match(/\{\s*name:/g) ?? []).length
// quality 既可能是硬编码 && 链，也可能委托给 ci.mjs（构建流水线优化后的形态）；两种都要校对段数
const qualityScript = pkg.scripts.quality ?? ''
const qualityCount = qualityScript.includes('ci.mjs') ? stageCount : (qualityScript.match(/npm run /g) ?? []).length
const stated = { 九段: 9, 十段: 10, 十一段: 11, 十二段: 12, 十三段: 13 }[
  read('KNOWLEDGE.md').match(/唯一门禁（([^）]+)）/)?.[1]
]
if (qualityCount !== stageCount || stated !== stageCount) {
  fail(`门禁段数不一致：quality ${qualityCount} / ci STAGES ${stageCount} / KNOWLEDGE ${stated ?? '未标注'}`)
}
// 并行分支合并 ci.mjs 时很容易把 governance 段覆盖掉，让治理校验自己变成"没进门禁的脚本"
if (!/name:\s*['"]governance['"]/.test(ciText) || !pkg.scripts['verify:governance']) {
  fail('门禁 STAGES 缺少 governance 段或 package.json 缺 verify:governance（并行合并易覆盖，必须补回）')
}
notes.push(`文档数字：组件 ${componentCount}、门禁 ${stageCount} 段（governance 已接入）`)

// ---- 3.0 视觉体检能力的自守卫 ----
// 像素基线的前提是"当前这版是对的"，只能防漂移、发现不了本来就有双层边框。
// 视觉体检器是唯一能发现"现状就长歪了"的一层，因此它的存在、规则集、
// 豁免名单与重点场景都要静态锁死，防止合并 ci.mjs / 改探针页时被悄悄架空。
const visualText = read('scripts/visual-audit.mjs')
const harnessText = read('tests/browser/harness/main.ts')
if (!/name:\s*['"]visual['"]/.test(ciText) || !pkg.scripts['audit:visual']) {
  fail('门禁 STAGES 缺少 visual 段或 package.json 缺 audit:visual（视觉体检能力被摘掉）')
}
const ruleBody = visualText.match(/export const AUDIT_RULES = \[([^\]]+)\]/)?.[1] ?? ''
const ruleCount = (ruleBody.match(/'[^']+'/g) ?? []).length
if (ruleCount < 6) {
  fail(`视觉体检规则集只剩 ${ruleCount} 条（要求至少 6 条），规则被删空会让门禁空转`)
}
const skipBody = harnessText.match(/const GALLERY_SKIP = \[([^\]]*)\]/)?.[1] ?? ''
const nonVisualBody = visualText.match(/export const NON_VISUAL = \[([^\]]*)\]/)?.[1] ?? ''
for (const match of skipBody.matchAll(/'([^']+)'/g)) {
  if (!nonVisualBody.includes(`'${match[1]}'`)) {
    fail(`harness 跳过了 ${match[1]}，但视觉体检的 NON_VISUAL 豁免清单没有登记它`)
  }
}
const focusBody = visualText.match(/const FOCUS_SCENES = \[([^\]]*)\]/)?.[1] ?? ''
const focusScenes = [...focusBody.matchAll(/'([^']+)'/g)].map((match) => match[1])
for (const scene of focusScenes) {
  if (!harnessText.includes(`'${scene}':`) && !harnessText.includes(`${scene}: scene`)) {
    fail(`视觉体检的重点场景 ${scene} 没有在 harness 的 scenes 里登记，画廊会拿到空白页`)
  }
}
if (!visualText.includes('process.exit(errors.length ? 1 : 0)')) {
  fail('视觉体检器没有按 error 数量决定退出码，门禁段会永远绿')
}
notes.push(`视觉体检自守卫：${ruleCount} 条规则 / ${focusScenes.length} 个重点场景 / 豁免清单与 harness 对齐`)

// ---- 3.1 缺陷编号唯一性 / 连续性 / 三处文档口径 ----
// 两条并行分支各自按"开工时的最大编号 + 1"登记，合入后会出现同号不同缺陷；
// 这条守卫让撞号、断档、文档口径滞后在门禁第六段直接报红，而不是靠维护者记得 fetch main。
const definedIds = [...read('REQUIREMENTS.md').matchAll(/^\|\s*F-(\d+)\s*\|/gm)].map((match) => Number(match[1]))
const seenIds = new Set()
for (const id of definedIds) {
  if (seenIds.has(id)) {
    fail(`REQUIREMENTS.md 里 F-${id} 被定义两次（并行分支撞号，合入前必须顺延）`)
  }
  seenIds.add(id)
}
const maxId = Math.max(0, ...definedIds)
for (let id = 1; id <= maxId; id += 1) {
  if (!seenIds.has(id)) {
    fail(`REQUIREMENTS.md 缺陷编号断档：缺 F-${id}（顺延编号时漏改或删多了）`)
  }
}
for (const doc of ['README.md', 'KNOWLEDGE.md']) {
  const claimed = read(doc).match(/共记录\s*(\d+)\s*条缺陷（F-1…F-(\d+)）/)
  if (!claimed) {
    fail(`${doc} 缺少「共记录 N 条缺陷（F-1…F-N）」口径`)
    continue
  }
  if (Number(claimed[1]) !== maxId || Number(claimed[2]) !== maxId) {
    fail(`${doc} 缺陷口径 ${claimed[1]} 条 / F-1…F-${claimed[2]} 与 REQUIREMENTS 的 ${maxId} 条不一致（合入后要同步）`)
  }
}
notes.push(`缺陷编号：已登记 ${definedIds.length} 条，最大 F-${maxId}（唯一性 / 连续性 / 口径由上方校验判定）`)

// 守卫挂账必须与 REQUIREMENTS 的缺陷登记对应，避免"守卫长期挂着却没人认领"
const guardRel = 'tests/findings.spec.ts'
if (existsSync(join(ROOT, guardRel))) {
  const requirements = read('REQUIREMENTS.md')
  const ids = new Set([...read(guardRel).matchAll(/F-(\d+)/g)].map((match) => Number(match[1])))
  for (const id of ids) {
    if (!requirements.includes(`F-${id}`)) {
      fail(`守卫里的 F-${id} 没有登记进 REQUIREMENTS.md（报障必须落盘）`)
    }
  }
  notes.push(`守卫挂账 ${ids.size} 条，登记校验通过`)
}

console.log('[governance] 治理校验')
for (const note of notes) {
  console.log(`  · ${note}`)
}
if (failures.length) {
  for (const item of failures) {
    console.error(`  ✗ ${item}`)
  }
  console.error(`[governance] ${failures.length} 项未通过`)
  process.exit(1)
}
console.log('[governance] 全部检查通过')
