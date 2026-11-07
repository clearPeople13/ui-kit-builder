#!/usr/bin/env node
/**
 * 变更范围 → 测试范围（受影响测试选择器）
 *
 * 问题：改一个组件的 core.ts 也要把 13 段门禁全跑一遍（真实耗时约 135s，
 * 其中浏览器层 46s、覆盖率 24s、视觉 12s 与这次改动毫无关系），
 * 反馈周期被无关层拖长，开发者就会绕过门禁直接用 `npm test` 甚至不跑。
 *
 * 做法：把"文件 → 受影响层 + 受影响用例"写成一张可测的表，
 * `node scripts/ci.mjs --changed` 据此只跑真正能观察到这次改动的阶段与文件。
 *
 * 三条边界（宁可多跑，不可漏跑）：
 *   1. 影响面拿不准的一律升级为全量：共享模块、src 根入口、构建器、profile、
 *      测试基础设施、package.json；未知路径同样回落全量。
 *   2. 组件用例按"真的 import 了这个组件"匹配，而不是按名字子串——
 *      否则 button 出现在 alert.spec.ts 里就会把整个组件层拉进来。
 *   3. 产物相关层（build / verify / size-budget）不能省：组件用例读的是
 *      `dist/full/ui-kit.js`，不重建就是拿旧产物在测新代码。
 *
 * 本模块只做判定，不执行命令；执行与计时在 ci.mjs。
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(fileURLToPath(new URL('../', import.meta.url)))

/** 门禁阶段的规范顺序，与 ci.mjs 的 STAGES 对齐；选择器只用它排序，不复制阶段定义 */
export const STAGE_ORDER = [
  'build',
  'format',
  'typecheck',
  'lint',
  'verify',
  'governance',
  'test',
  'test:build',
  'test:profiles',
  'test:browser',
  'visual',
  'test:coverage',
  'consumer'
]

/** 只在本地存在、与门禁无关的路径：出现时直接忽略，不把范围升级成全量 */
const IGNO = [
  'dist/',
  '.build/',
  'node_modules/',
  'coverage/',
  'visual-report/',
  'ci-report.json',
  'examples/consumer/dist/',
  'examples/consumer/node_modules/',
  '_scratch/',
  '.tmp/',
  '.trae-html-share-packages/',
  '.workbuddy/'
]

/** prettier 的作用范围（与 package.json 的 format:check glob 一一对应） */
const FORMAT_SCOPE = [
  /^packages\/ui-kit\/src\/.+\.ts$/,
  /^scripts\/.+\.mjs$/,
  /^tools\/.+\.mjs$/,
  /^registry\.mjs$/,
  /^configurator\/.+\.(js|css|html)$/,
  /^index\.html$/,
  /^examples\/consumer\/[^/]+\.mjs$/,
  /^examples\/consumer\/scripts\/.+\.mjs$/,
  /^examples\/consumer\/.+\.(html|css)$/,
  /^examples\/consumer\/src\/.+\.(ts|mjs)$/,
  /^tests\/.+\.ts$/,
  /^vitest\.[^/]*\.config\.ts$/
]

/** eslint 的作用范围（ts/mjs/js；ignores 交给 eslint 自己判定） */
const LINT_SCOPE = [/\.(ts|mjs|js)$/]

function git(args, root) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

// 89 个组件 × 95 个用例文件的匹配会重复读同一批文件，进程内缓存一次即可（只读测试文件，不会被构建改动）
const textCache = new Map()

function read(root, rel) {
  const key = `${root}\u0000${rel}`
  if (textCache.has(key)) {
    return textCache.get(key)
  }
  let text = ''
  try {
    text = readFileSync(path.join(root, rel), 'utf8')
  } catch {
    text = ''
  }
  textCache.set(key, text)
  return text
}

function list(root, relDir, ext) {
  const abs = path.join(root, relDir)
  if (!existsSync(abs)) {
    return []
  }
  return readdirSync(abs)
    .filter((name) => name.endsWith(ext))
    .map((name) => `${relDir}/${name}`)
}

function pascal(id) {
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/** 组件 id → 真正 import 了它的组件层用例（按 import 语句判定，避免名字子串误伤） */
export function componentSpecs(id, root = ROOT) {
  const named = `tests/components/${id}.spec.ts`
  const hits = list(root, 'tests/components', '.spec.ts').filter((file) => {
    if (file === named) {
      return true
    }
    const text = read(root, file)
    const imported = new RegExp(
      `import\\s*\\{[\\s\\S]*?\\b${pascal(id)}\\b[\\s\\S]*?\\}\\s*from\\s*['"]@ui-kit-full['"]`
    ).test(text)
    return imported
  })
  return hits
}

/**
 * 组件 id → 提到它的浏览器层场景。
 * 只认两类强信号：文件名带组件 id 的专属场景，或 `openScene('<id>')` 直接点名。
 * 裸词 / 类名匹配会把 attributes.spec.ts 里随手写的 `h('button')` 也算进来，
 * 一个按钮改动就多跑 4 个泛化套件——泛化套件留给全量门禁，内循环要的是该组件的专属现场。
 */
export function browserSpecs(id, root = ROOT) {
  const files = list(root, 'tests/browser', '.spec.ts')
  const named = files.filter((file) => path.basename(file, '.spec.ts').includes(id))
  if (named.length) {
    return named
  }
  return files.filter((file) => {
    const text = read(root, file)
    return text.includes(`openScene('${id}'`) || text.includes(`openScene("${id}"`)
  })
}

/** 本次改动涉及哪些文件：分支差异 + 已暂存 + 未暂存 + 未跟踪 */
export function readChangedFiles({ root = ROOT, base = null } = {}) {
  const resolved =
    base ?? ['origin/main', 'main'].find((ref) => git(['rev-parse', '--verify', ref], root).length) ?? null
  const files = new Set()
  if (resolved) {
    for (const file of git(['diff', '--name-only', `${resolved}...HEAD`], root)) {
      files.add(file)
    }
  }
  // HEAD 而非空参数：同时覆盖未暂存与已暂存，pre-commit 前的改动通常已在索引里
  for (const file of git(['diff', '--name-only', 'HEAD'], root)) {
    files.add(file)
  }
  for (const file of git(['ls-files', '--others', '--exclude-standard'], root)) {
    files.add(file)
  }
  return [...files].filter((file) => !IGNO.some((prefix) => file.startsWith(prefix))).sort()
}

/**
 * 单文件 → 受影响层。
 * 返回 { full: true, reason } 表示必须全量；否则返回 { stages: [{ name, files? }], reason }。
 */
function impactOf(file, root) {
  const component = file.match(/^packages\/ui-kit\/src\/components\/([^/]+)\//)

  // ---- 源码 ----
  if (file.startsWith('packages/ui-kit/src/shared/')) {
    return { full: true, reason: '改了共享模块，影响面覆盖全部组件' }
  }
  if (component) {
    return componentImpact(component[1], file, root)
  }
  if (file.startsWith('packages/ui-kit/src/')) {
    return { full: true, reason: '改了组件库入口 / 主题 / 未分类源码，影响面不确定' }
  }

  // ---- 构建器与注册表 ----
  if (/^registry\.mjs$/.test(file) || /^scripts\/(build-lib|build-all)\.mjs$/.test(file)) {
    return {
      stages: [
        { name: 'build' },
        { name: 'verify' },
        { name: 'test:build' },
        { name: 'test:profiles' },
        { name: 'visual' }
      ],
      reason: '改了构建器 / 注册表，产物与全部 profile 都要重验'
    }
  }
  if (file.startsWith('profiles/')) {
    return {
      stages: [
        { name: 'build' },
        { name: 'verify' },
        { name: 'test:build', files: ['tests/build/profile-contract.spec.ts', 'tests/build/size-budget.spec.ts'] },
        { name: 'test:profiles' }
      ],
      reason: '改了 profile 配置，裁剪结果与 20 份产物运行时都要重验'
    }
  }

  // ---- 门禁自身 ----
  if (/^scripts\/ci\.mjs$/.test(file) || /^scripts\/test-impact\.mjs$/.test(file)) {
    return {
      stages: [
        {
          name: 'test:build',
          files: ['tests/build/ci-stages.spec.ts', 'tests/build/test-impact.spec.ts']
        }
      ],
      reason: '改了门禁选择器本身'
    }
  }
  if (/^scripts\/verify\.mjs$/.test(file)) {
    return { stages: [{ name: 'verify' }], reason: '改了库级校验器' }
  }
  if (/^scripts\/verify-governance\.mjs$/.test(file)) {
    return { stages: [], reason: '改了治理校验器（治理段本就会跑）' }
  }
  if (/^scripts\/visual-audit\.mjs$/.test(file)) {
    return { stages: [{ name: 'visual' }], reason: '改了视觉体检器，必须亲眼确认体检本身还能跑' }
  }
  if (/^scripts\/generate-demo-meta\.mjs$/.test(file)) {
    return {
      stages: [{ name: 'test:build', files: ['tests/build/demo-meta.spec.ts'] }],
      reason: '改了调试台元数据生成器'
    }
  }
  if (/^scripts\/sync-consumer-deps\.mjs$/.test(file)) {
    return {
      stages: [{ name: 'test:build', files: ['tests/build/consumer-deps.spec.ts'] }],
      reason: '改了消费方依赖同步脚本'
    }
  }
  if (file.startsWith('scripts/') || file.startsWith('tools/')) {
    return { full: true, reason: `改了未分类脚本 ${file}，影响面不确定` }
  }

  // ---- 可视化构建器 / 调试台 ----
  if (file.startsWith('configurator/')) {
    return {
      stages: [
        { name: 'test:build', files: ['tests/build/dev-api.spec.ts'] },
        { name: 'test:browser', files: ['tests/browser/configurator.spec.ts'] }
      ],
      reason: '改了可视化构建器，接口契约与浏览器行为都要重验'
    }
  }
  if (file.startsWith('examples/consumer/')) {
    return {
      stages: [{ name: 'consumer' }, { name: 'visual' }],
      reason: '改了调试台（消费方真实界面），消费方校验与现场体检都要跑'
    }
  }

  // ---- 用例自身 ----
  if (file.startsWith('tests/components/')) {
    return file.endsWith('.spec.ts')
      ? { stages: [{ name: 'test', files: [file] }], reason: '改了组件层用例' }
      : { stages: [{ name: 'test' }], reason: '改了组件层公共夹具，整个组件层重跑' }
  }
  if (file.startsWith('tests/build/')) {
    return file.endsWith('.spec.ts')
      ? { stages: [{ name: 'test:build', files: [file] }], reason: '改了构建器侧用例' }
      : { stages: [{ name: 'test:build' }], reason: '改了构建器侧公共夹具，整层重跑' }
  }
  if (file.startsWith('tests/browser/')) {
    return file.endsWith('.spec.ts')
      ? { stages: [{ name: 'test:browser', files: [file] }], reason: '改了浏览器层用例' }
      : { stages: [{ name: 'test:browser' }], reason: '改了浏览器层夹具 / 场景页，整层重跑' }
  }
  if (file.startsWith('tests/profiles/')) {
    return { stages: [{ name: 'test:profiles' }], reason: '改了 profile 运行时用例' }
  }
  if (file.startsWith('tests/')) {
    return { stages: [{ name: 'test' }], reason: '改了未分类用例' }
  }

  // ---- 生成物与文档 ----
  if (file === 'sizes.json') {
    return {
      stages: [{ name: 'test:build', files: ['tests/build/size-budget.spec.ts', 'tests/build/tree-shaking.spec.ts'] }],
      reason: '改了体积清单（生成物），体积与树摇契约要重验'
    }
  }
  if (file === 'examples/consumer/src/demo/meta.json') {
    return {
      stages: [{ name: 'test:build', files: ['tests/build/demo-meta.spec.ts'] }],
      reason: '改了调试台元数据（生成物）'
    }
  }
  if (/^[^/]+\.md$/.test(file)) {
    return { stages: [], reason: '只改文档（治理段会核对口径）' }
  }

  // ---- 兜底 ----
  return { full: true, reason: `未识别的改动 ${file}，按全量处理` }
}

/** 组件目录内的一次改动：按文件类型决定要不要拉上视觉 / 浏览器 / 体积层 */
function componentImpact(id, file, root) {
  const stages = [{ name: 'build' }, { name: 'verify' }]
  const specs = componentSpecs(id, root)
  if (specs.length) {
    stages.push({ name: 'test', files: specs })
  }
  const buildSpecs = ['tests/build/size-budget.spec.ts', 'tests/build/tree-shaking.spec.ts']
  if (file.endsWith('.css')) {
    buildSpecs.push('tests/build/css-vars.spec.ts', 'tests/build/core-css.spec.ts')
  }
  stages.push({ name: 'test:build', files: buildSpecs })

  const touchesDom = file.endsWith('.css') || file.endsWith('/core.ts')
  if (touchesDom) {
    // 视觉体检是唯一能发现"现状就长歪了"的一层（F-66 双层边框），样式 / DOM 改动不能跳
    stages.push({ name: 'visual' })
    const scenes = browserSpecs(id, root)
    if (scenes.length) {
      stages.push({ name: 'test:browser', files: scenes })
    }
  }
  if (file.endsWith('spec.mjs')) {
    stages.push({ name: 'governance' })
  }

  const where = `组件 ${id}：${specs.length} 个组件层用例${touchesDom ? '、视觉体检' : ''}`
  return { stages, reason: where }
}

function inFormatScope(file) {
  return FORMAT_SCOPE.some((pattern) => pattern.test(file))
}

function inLintScope(file) {
  return LINT_SCOPE.some((pattern) => pattern.test(file))
}

/**
 * 改动列表 → 执行计划。
 * scope: none（无改动）/ scoped（只跑受影响层）/ full（拿不准，回落全量）
 */
export function planFromChanges({ files = [], root = ROOT } = {}) {
  const clean = [...new Set(files)].filter((file) => !IGNO.some((prefix) => file.startsWith(prefix)))
  const stages = new Set()
  const narrow = new Map()
  const wide = new Set()
  const reasons = []
  let fullReason = null

  const add = (name, filter) => {
    if (!STAGE_ORDER.includes(name)) {
      throw new Error(`未知门禁阶段 ${name}（STAGE_ORDER 未登记）`)
    }
    stages.add(name)
    if (!filter) {
      wide.add(name)
      narrow.delete(name)
      return
    }
    // 同一层既有"整层"又有"部分文件"时，整层优先：漏跑比多跑贵得多
    if (wide.has(name)) {
      return
    }
    const merged = new Set(narrow.get(name) ?? [])
    filter.forEach((item) => merged.add(item))
    narrow.set(name, merged)
  }

  for (const file of clean) {
    const impact = impactOf(file, root)
    if (impact.full) {
      fullReason = impact.fullReason ?? impact.reason
      continue
    }
    reasons.push(impact.reason)
    for (const stage of impact.stages ?? []) {
      add(stage.name, stage.files)
    }
  }

  if (!clean.length) {
    return { scope: 'none', stages: [], filters: {}, reasons: ['本次无改动'], files: [] }
  }
  if (fullReason) {
    return { scope: 'full', stages: [...STAGE_ORDER], filters: {}, reasons: [fullReason], files: clean }
  }

  // 格式 / lint / 类型三层跟着改动文件走：改文档或样式时不必整仓扫一遍
  const formatFiles = clean.filter(inFormatScope)
  if (formatFiles.length) {
    add('format', formatFiles)
  }
  const lintFiles = clean.filter(inLintScope)
  if (lintFiles.length) {
    add('lint', lintFiles)
  }
  if (clean.some((file) => /\.(ts|mjs|js)$/.test(file))) {
    add('typecheck')
  }
  // 治理段秒级且负责"影响面清单 / 文档口径 / 编号连续"，任何改动都跑
  add('governance')

  const ordered = STAGE_ORDER.filter((name) => stages.has(name))
  const filters = {}
  for (const name of ordered) {
    if (!wide.has(name) && narrow.has(name)) {
      filters[name] = [...narrow.get(name)].sort()
    }
  }
  return {
    scope: 'scoped',
    stages: ordered,
    filters,
    reasons: [...new Set(reasons)],
    files: clean
  }
}

/** 给人看的一行摘要 */
export function describePlan(plan) {
  if (plan.scope === 'none') {
    return '无改动，无需跑门禁'
  }
  if (plan.scope === 'full') {
    return `全量（${plan.reasons[0]}）`
  }
  const narrowed = Object.entries(plan.filters)
    .map(([stage, list]) => `${stage} ${list.length} 个文件`)
    .join('、')
  return `受影响层 ${plan.stages.length} 段（${narrowed || '整层'}）`
}

// 直接运行：打印计划，便于人工确认（不执行任何用例）
const entryUrl = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (entryUrl === import.meta.url) {
  const plan = planFromChanges({ files: readChangedFiles() })
  console.log(`scope: ${plan.scope}`)
  console.log(`files: ${plan.files.length}`)
  for (const file of plan.files) {
    console.log(`  - ${file}`)
  }
  console.log(`stages: ${plan.stages.join(', ') || '(none)'}`)
  for (const [stage, list] of Object.entries(plan.filters)) {
    console.log(`  ${stage}: ${list.join(' ')}`)
  }
  console.log(`summary: ${describePlan(plan)}`)
}
