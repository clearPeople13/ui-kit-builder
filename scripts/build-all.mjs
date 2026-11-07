import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { buildProfile, sanitizeName } from './build-lib.mjs'
import { writeDemoMeta } from './generate-demo-meta.mjs'
import { profileCatalog } from './profile-catalog.mjs'

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
// profiles/*.json 即清单唯一来源（F-75）；按文件名排序，sizes.json 与 dist 顺序都跟着它走
const profileEntries = profileCatalog(rootDir)
const profileNames = profileEntries.map((entry) => entry.dirName)
const sizesPath = path.join(rootDir, 'sizes.json')
const distDir = path.join(rootDir, 'dist')
// 特性边际试算不进 dist/：它只是体积测量脚手架，不该出现在包列表或产物目录里
const tempRoot = path.join(rootDir, '.build', 'feature-deltas')
const cachePath = path.join(rootDir, '.build', 'feature-size-cache.json')
const fingerprintPath = path.join(rootDir, '.build', 'build-fingerprint.json')
const SIZE_KEYS = ['jsBytes', 'cssBytes', 'totalBytes', 'gzipBytes']

/**
 * 特性边际必须有符号：0 既可能是"真的没变"，也可能是"负数被夹平"，
 * 后者会让体积预算与裁剪决策同时失真（F-69）。负值原样落盘并打一条日志。
 */
export function delta(base, target) {
  const result = {}
  for (const key of SIZE_KEYS) {
    result[key] = target[key] - base[key]
  }
  return result
}

/** dist 下不属于当前 profile 清单、也不在自定义包命名空间的目录（F-70） */
export function staleDistDirs(existingDirs, reservedNames) {
  return existingDirs.filter((name) => name !== 'custom' && !reservedNames.has(name))
}

/**
 * 本机可用的构建并发度：留一个核给门禁自身与文件系统。
 *
 * 上限原来写死 6，而单次特性边际试算是一条 esbuild + postcss + 文件读写链，CPU 并不吃满；
 * 16 核机器上 6 路冷启动约 7–8 分钟，8 路实测约 6 分钟。
 * 不再往上加：10 路压测时出现过一次 EMFILE（postcss 打开 core.css 失败），
 * 构建阶段偶发红比慢几分钟更贵。热缓存（全部命中）不受并发度影响。
 */
function concurrency() {
  const cpus = os.availableParallelism?.() ?? os.cpus().length
  return Math.max(2, Math.min(8, cpus - 1))
}

/** 单次特性边际试算的实测耗时（16 核 / 6 路时 175 个特性约 9 分钟，折合单次约 18s），只用于给"还要多久"一个量级 */
const FEATURE_COLD_SECONDS = 18

/** 固定并发池：结果按输入顺序返回，任一任务失败则整轮失败 */
async function mapPool(items, limit, worker) {
  const results = new Array(items.length)
  let cursor = 0
  async function pull() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await worker(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, pull))
  return results
}

function walkFiles(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkFiles(full, files)
    } else {
      files.push(full)
    }
  }
}

/**
 * 边际体积算法版本，进入缓存键。
 *
 * 缓存键原来直接包含本文件全文，结果"改一句日志文案"也要重算 175 个特性边际——
 * 实测冷启动 467s，开发时一天能撞好几次。边际算法本身与日志无关，
 * 所以改成显式版本号：**只要改了影响字节统计 / 差值 / 输出结构的代码，就把它 +1**；
 * 只改日志、注释、进度提示不用动。治理校验会扫 diff：动了算法特征却没加版本号直接报红。
 */
export const SIZE_ALGO_VERSION = 2

/**
 * 构建输入的指纹：产物与特性边际只取决于组件源码、profile 配置、注册表与构建器本身。
 * 这些内容都没变时，上次算出的边际值与已构建产物仍然成立；Node / 平台也进指纹，避免换环境后误复用。
 * 注意这里仍包含 build-all.mjs 全文——verify:reuse 宁可多重算一次，也不能复用到口径不明的产物。
 */
export function sourceFingerprint() {
  const hash = crypto.createHash('sha1')
  hash.update(`node=${process.version}\nplatform=${process.platform}\narch=${process.arch}\n`)
  const files = []
  walkFiles(path.join(rootDir, 'packages/ui-kit/src'), files)
  walkFiles(path.join(rootDir, 'profiles'), files)
  for (const extra of [
    'registry.mjs',
    'scripts/build-lib.mjs',
    'scripts/build-all.mjs',
    'package.json',
    'package-lock.json'
  ]) {
    files.push(path.join(rootDir, extra))
  }
  files.sort()
  for (const file of files) {
    hash.update(path.relative(rootDir, file))
    hash.update('\0')
    hash.update(fs.readFileSync(file))
  }
  return hash.digest('hex')
}

const profileCachePath = path.join(rootDir, '.build', 'profile-cache.json')
const componentSrcDir = path.join(rootDir, 'packages/ui-kit/src/components')
const sharedSrcDir = path.join(rootDir, 'packages/ui-kit/src/shared')

function fingerprintFiles(files, salt = '') {
  const hash = crypto.createHash('sha1')
  hash.update(`node=${process.version}\nplatform=${process.platform}\narch=${process.arch}\n`)
  if (salt) {
    hash.update(`salt=${salt}\n`)
  }
  const sorted = [...files].sort()
  for (const file of sorted) {
    hash.update(path.relative(rootDir, file))
    hash.update('\0')
    hash.update(fs.readFileSync(file))
  }
  return hash.digest('hex')
}

function builtinInputs() {
  // build-all.mjs 全文不进键：它是编排与计量脚本，改日志文案不该让 175 个特性重算。
  // 计量口径由 SIZE_ALGO_VERSION 代表，改算法时显式 +1（治理校验会盯这条）。
  // tsconfig.json / vite.config.mjs 会被 esbuild / vite 读取（target、alias、插件都会进产物），
  // package.json 是产物版本号来源，缺一都会让"配置变了但缓存没失效"（A2）。
  return [
    path.join(rootDir, 'registry.mjs'),
    path.join(rootDir, 'scripts/build-lib.mjs'),
    path.join(rootDir, 'package.json'),
    path.join(rootDir, 'package-lock.json'),
    path.join(rootDir, 'tsconfig.json'),
    path.join(rootDir, 'vite.config.mjs')
  ]
}

/** 缓存键里的计量口径盐：版本号一变，所有组件 / profile 的缓存同时失效 */
function algoSalt() {
  return `size-algo=v${SIZE_ALGO_VERSION}`
}

function sourceFiles(files) {
  walkFiles(sharedSrcDir, files)
  return files
}

const RELATIVE_SPEC_RE = /['"](\.{1,2}\/[^'"]+)['"]/g

/**
 * 组件目录里的相对 import 引用到哪些兄弟组件目录。
 * table / tree / tree-v2 / transfer 都 `import { createCheckbox } from '../checkbox/core'`：
 * 指纹只算"选中目录 + shared"时，改 checkbox 不会让含 table 的 profile / table 组件缓存失效，
 * 门禁会复用到陈旧产物（A2）。
 */
function siblingComponentDeps(componentDir) {
  const deps = new Set()
  const files = []
  walkFiles(componentDir, files)
  for (const file of files) {
    if (!/\.(?:ts|js|mjs|css)$/.test(file)) {
      continue
    }
    const text = fs.readFileSync(file, 'utf8')
    for (const match of text.matchAll(RELATIVE_SPEC_RE)) {
      const relative = path.relative(componentSrcDir, path.resolve(componentDir, match[1]))
      // ../shared / ../../... 之类的目标由 shared 与其它机制覆盖，这里只管兄弟组件
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        continue
      }
      const sibling = relative.split(path.sep)[0]
      if (sibling && sibling !== path.basename(componentDir) && fs.existsSync(path.join(componentSrcDir, sibling))) {
        deps.add(sibling)
      }
    }
  }
  return deps
}

/** 选中组件集合 + 相对 import 闭包引用的兄弟组件（含传递依赖），去重后用于指纹 */
function componentClosure(ids) {
  const closure = new Set(ids.filter((id) => fs.existsSync(path.join(componentSrcDir, id))))
  const queue = [...closure]
  while (queue.length) {
    const id = queue.shift()
    for (const dep of siblingComponentDeps(path.join(componentSrcDir, id))) {
      if (!closure.has(dep)) {
        closure.add(dep)
        queue.push(dep)
      }
    }
  }
  return closure
}

/**
 * 组件级缓存键：该组件自己 + 相对 import 闭包引用的兄弟组件源码 + shared
 * + 注册表 + 构建器口径（A10 / A2）。闭包必须进来：table 引用 checkbox/core，
 * 漏掉的话改 checkbox 不会让 table 的组件级缓存失效。
 * 改一个组件（含它的依赖闭包）只让相关组件重算，不用把 175 个特性全部重打一遍。
 */
export function componentFingerprint(componentId) {
  const dir = path.join(componentSrcDir, componentId)
  if (!fs.existsSync(dir)) {
    return null
  }
  const files = [...builtinInputs(), path.join(rootDir, 'profiles/full.json')]
  for (const id of componentClosure([componentId])) {
    walkFiles(path.join(componentSrcDir, id), files)
  }
  sourceFiles(files)
  return fingerprintFiles(files, algoSalt())
}

function profileInputFiles(entry) {
  const files = [...builtinInputs(), path.join(rootDir, 'profiles', entry.fileName)]
  const components = entry.config.components
  const ids =
    components && typeof components === 'object' && !Array.isArray(components)
      ? Object.keys(components)
      : fs.readdirSync(componentSrcDir).filter((name) => fs.existsSync(path.join(componentSrcDir, name)))
  // 选中组件的相对 import 闭包一并进指纹（A2）：table 没勾选 checkbox 时，
  // 产物里仍打包了 checkbox/core，闭包外的源码变化同样必须让缓存失效。
  for (const id of componentClosure(ids)) {
    const dir = path.join(componentSrcDir, id)
    if (fs.existsSync(dir)) {
      walkFiles(dir, files)
    }
  }
  sourceFiles(files)
  return files
}

/** profile 级缓存键：profile 配置 + 选中组件源码 + shared + 注册表 + build-lib（C2） */
export function profileFingerprint(profileName) {
  const entry = profileEntries.find((item) => item.profileName === profileName || item.dirName === profileName)
  if (!entry) {
    return null
  }
  return fingerprintFiles(profileInputFiles(entry), algoSalt())
}

function readFeatureCache() {
  try {
    const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
    return cache?.version === 2 && cache.components ? cache.components : null
  } catch {
    return null
  }
}

function componentFeatures(component) {
  return Object.entries(Object.assign({}, ...component.exports.map((item) => item.features ?? {})))
}

function groupFeatures(registry, features) {
  const grouped = {}
  for (const component of Object.values(registry.components)) {
    const own = {}
    for (const [id] of componentFeatures(component)) {
      if (features[id]) {
        own[id] = features[id]
      }
    }
    grouped[component.id] = own
  }
  return grouped
}

function writeFeatureCache(fingerprints, grouped) {
  const components = {}
  for (const [componentId, features] of Object.entries(grouped)) {
    if (!Object.keys(features).length || !fingerprints[componentId]) {
      continue
    }
    components[componentId] = { fingerprint: fingerprints[componentId], features }
  }
  fs.mkdirSync(path.dirname(cachePath), { recursive: true })
  fs.writeFileSync(
    cachePath,
    `${JSON.stringify({ version: 2, generatedAt: new Date().toISOString(), components }, null, 2)}\n`,
    'utf8'
  )
}

function readProfileCache() {
  try {
    const cache = JSON.parse(fs.readFileSync(profileCachePath, 'utf8'))
    return cache?.version === 1 && cache.profiles ? cache.profiles : null
  } catch {
    return null
  }
}

function writeProfileCache(profiles) {
  fs.mkdirSync(path.dirname(profileCachePath), { recursive: true })
  fs.writeFileSync(
    profileCachePath,
    `${JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), profiles }, null, 2)}\n`,
    'utf8'
  )
}

/** 缓存命中的前提是产物三件套仍在且 meta 能解析，缺一件就当未命中 */
function reusableProfileMeta(entry) {
  const dir = path.join(distDir, entry.dirName)
  for (const file of ['ui-kit.js', 'meta.json', 'package.json', 'index.d.ts']) {
    if (!fs.existsSync(path.join(dir, file))) {
      return null
    }
  }
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'))
    return meta.name === entry.dirName ? meta : null
  } catch {
    return null
  }
}

/** 清掉上次中断留下的试算产物；旧版本曾把它们写进 dist/ 与 .build/，一并迁移清理 */
function cleanTempArtifacts() {
  fs.rmSync(tempRoot, { recursive: true, force: true })
  const buildRoot = path.join(rootDir, '.build')
  if (fs.existsSync(buildRoot)) {
    for (const entry of fs.readdirSync(buildRoot, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith('feat-')) {
        fs.rmSync(path.join(buildRoot, entry.name), { recursive: true, force: true })
      }
    }
  }
  if (!fs.existsSync(distDir)) {
    return
  }
  for (const entry of fs.readdirSync(distDir, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith('feat-')) {
      fs.rmSync(path.join(distDir, entry.name), { recursive: true, force: true })
    }
  }
}

/** 删掉不再是当前 profile 清单成员的 dist 目录；先打印再删除，custom/ 永远保留 */
export function cleanStaleProfiles(reservedNames) {
  if (!fs.existsSync(distDir)) {
    return []
  }
  const existing = fs
    .readdirSync(distDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
  const stale = staleDistDirs(existing, reservedNames)
  for (const name of stale) {
    console.log(`[build] 清理陈旧产物 dist/${name}`)
    fs.rmSync(path.join(distDir, name), { recursive: true, force: true })
  }
  return stale
}

function readBuildFingerprint() {
  try {
    const record = JSON.parse(fs.readFileSync(fingerprintPath, 'utf8'))
    return typeof record.fingerprint === 'string' ? record : null
  } catch {
    return null
  }
}

function writeBuildFingerprint(fingerprint) {
  fs.mkdirSync(path.dirname(fingerprintPath), { recursive: true })
  fs.writeFileSync(
    fingerprintPath,
    `${JSON.stringify({ fingerprint, generatedAt: new Date().toISOString() }, null, 2)}\n`,
    'utf8'
  )
}

/**
 * 当前产物是不是"由当前源码构建的"。
 *
 * pre-commit 只想知道"要不要因为产物过期而重建"：过期时不该在提交钩子里闷头重打 198 份包
 * （实测 8 分钟，钩子会超时），而应该跳过库级校验、把重建留给 pre-push 的全量门禁。
 */
export function builtArtifactsFresh() {
  const recorded = readBuildFingerprint()
  return Boolean(recorded && recorded.fingerprint === sourceFingerprint())
}

/** 门禁里已经构建过一次时，verify 直接复用 sizes.json 的记录，不再重复打 198 份包 */
function loadBuiltResults() {
  try {
    // 产物是否可信不取决于"文件还在"，而取决于构建它的源码是否还是当前源码（F-72）
    const recorded = readBuildFingerprint()
    if (!recorded) {
      console.log('[build] 缺少 .build/build-fingerprint.json，重新构建')
      return null
    }
    if (recorded.fingerprint !== sourceFingerprint()) {
      console.log('[build] 源码指纹与上次构建不一致，重新构建')
      return null
    }
    const sizes = JSON.parse(fs.readFileSync(sizesPath, 'utf8'))
    const results = Object.values(sizes.profiles ?? {})
    if (results.length !== profileNames.length) {
      return null
    }
    for (const result of results) {
      if (!fs.existsSync(path.join(rootDir, result.dir, 'ui-kit.js'))) {
        return null
      }
    }
    return { results, sizes, reused: true }
  } catch {
    return null
  }
}

export async function buildAllProfiles({ reuse = false, cache = process.env.UIKIT_NO_BUILD_CACHE !== '1' } = {}) {
  if (reuse) {
    const built = loadBuiltResults()
    if (built) {
      console.log('[build] 复用本轮机禁产出的 sizes.json 与 20 份 profile，跳过重复构建')
      return built
    }
    // 产物缺失或被删过就退回完整构建，--reuse 只承诺"能复用才复用"
  }

  cleanTempArtifacts()
  const fingerprint = sourceFingerprint()
  // 删掉清单里已经不存在的历史 profile，避免它们继续被 /api/packages 当成可安装产物（F-70）
  cleanStaleProfiles(new Set(profileNames))

  const useCache = cache
  const previousProfiles = useCache ? readProfileCache() : null
  const nextProfiles = {}
  let profileHits = 0
  const profileStarted = Date.now()
  const results = await mapPool(profileEntries, concurrency(), async (entry) => {
    const profileKey = useCache ? profileFingerprint(entry.profileName) : null
    if (useCache && profileKey && previousProfiles?.[entry.dirName]?.fingerprint === profileKey) {
      // 配置与选中组件源码都没变，产物三件套也都在：直接复用上次的 meta，不再打一遍包（C2）
      const meta = reusableProfileMeta(entry)
      if (meta) {
        profileHits += 1
        nextProfiles[entry.dirName] = previousProfiles[entry.dirName]
        return meta
      }
    }
    const result = await buildProfile({
      ...entry.config,
      name: entry.config.name ?? entry.profileName
    })
    if (useCache && profileKey) {
      nextProfiles[entry.dirName] = { fingerprint: profileKey, generatedAt: new Date().toISOString() }
    }
    return result
  })
  if (useCache) {
    writeProfileCache(nextProfiles)
  }
  const profileSeconds = ((Date.now() - profileStarted) / 1000).toFixed(1)
  console.log(
    `[build] ${profileNames.length} 份正式 profile 完成（${concurrency()} 路并发，${profileSeconds}s${
      profileHits ? `，命中缓存 ${profileHits} 份` : ''
    }）`
  )

  const { loadRegistry, fullSelection } = await import('../registry.mjs')
  const registry = await loadRegistry()
  const computed = {}

  // 特性边际统一用「full 去掉该特性」的临时产物与 full 相减，
  // 得到该特性在完整产物里的边际成本。这样 175 个特性都有真实体积数据，
  // 也不会因"某两份 profile 恰好配对"而走出另一套口径。
  // 临时产物写 .build/feature-deltas/，并在 try/finally 里清理，dist/ 永远只有 20 份正式包。
  const fullResult = results.find((result) => result.name === 'full')
  if (fullResult) {
    const componentFingerprints = {}
    for (const component of Object.values(registry.components)) {
      componentFingerprints[component.id] = componentFingerprint(component.id)
    }
    // 键从"全局一次哈希"改成"组件级指纹"：任一组件源码变化只重算它自己的特性（A10）
    const cached = useCache ? readFeatureCache() : null
    const fullSel = fullSelection(registry)
    const pending = []

    for (const component of Object.values(registry.components)) {
      const cachedComponent = cached?.[component.id]
      const usable = cachedComponent && cachedComponent.fingerprint === componentFingerprints[component.id]
      for (const [id, feature] of Object.entries(
        Object.assign({}, ...component.exports.map((item) => item.features ?? {}))
      )) {
        if (usable && cachedComponent.features[id]) {
          computed[id] = cachedComponent.features[id]
          continue
        }
        pending.push({ component, id, feature })
      }
    }

    const persist = () => writeFeatureCache(componentFingerprints, groupFeatures(registry, computed))
    if (pending.length) {
      const tempStarted = Date.now()
      const chunk = concurrency()
      // 冷启动到底在干什么、要多久，必须开跑就说：以前只有一个进度条沉默 8 分钟，
      // 外部只能靠猜是在正常重建还是卡死（上一批次就在这里盲等了 529s）。
      const estimate = Math.ceil((pending.length * FEATURE_COLD_SECONDS) / chunk)
      console.log(
        `[build] 需要重算 ${pending.length} 个特性边际（并发 ${chunk} 路，单次约 ${FEATURE_COLD_SECONDS}s，` +
          `量级 ${Math.ceil(estimate / 60)} 分钟，后续按实际进度修正）；其余命中组件级缓存`
      )
      let completed = 0
      try {
        await mapPool(pending, chunk, async ({ component, id, feature }) => {
          const minusSel = JSON.parse(JSON.stringify(fullSel))
          minusSel[component.id] = (minusSel[component.id] ?? []).filter((featureId) => featureId !== id)
          const name = `__feat_${id}`
          const result = await buildProfile({
            name,
            prefix: 'ui',
            components: minusSel,
            outDir: path.relative(rootDir, path.join(tempRoot, sanitizeName(name)))
          })
          computed[id] = {
            title: feature.title,
            component: component.id,
            ...delta(result, fullResult)
          }
          completed += 1
          // 每完成一批（并发窗口）就落盘，进程中断时已完成的部分不会白算（A10）；
          // 同时按"已完成比例 + 实际耗时"报一次进度，估算随真实吞吐修正，
          // 不要用一个固定的 18s 常数骗人（第一次实测就偏了 50%）。
          if (useCache && completed % chunk === 0) {
            persist()
          }
          if (completed % (chunk * 2) === 0 || completed === pending.length) {
            const elapsed = (Date.now() - tempStarted) / 1000
            const remain = (elapsed / completed) * (pending.length - completed)
            console.log(
              `[build] 特性边际 ${completed}/${pending.length}（已用 ${(elapsed / 60).toFixed(1)} 分钟，` +
                `预计还需 ${(remain / 60).toFixed(1)} 分钟）`
            )
          }
        })
      } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true })
        // 每个临时 profile 的入口 TS 落在 .build/<name>/，比产物目录更晚被遗忘
        for (const { id } of pending) {
          fs.rmSync(path.join(rootDir, '.build', sanitizeName(`__feat_${id}`)), { recursive: true, force: true })
        }
      }
      if (useCache) {
        persist()
      }
      const tempSeconds = ((Date.now() - tempStarted) / 1000).toFixed(1)
      console.log(`[build] ${pending.length} 个特性边际临时产物完成（${concurrency()} 路并发，${tempSeconds}s）`)
    } else if (cached) {
      console.log(`[build] ${Object.keys(computed).length} 个特性的边际体积命中组件级缓存，跳过临时构建`)
    }
  }

  // 输出顺序固定按 registry 的组件 / 特性顺序，缓存命中与并发完成顺序都不会让 sizes.json 抖动
  const features = {}
  for (const component of Object.values(registry.components)) {
    for (const id of Object.keys(Object.assign({}, ...component.exports.map((item) => item.features ?? {})))) {
      if (computed[id]) {
        features[id] = computed[id]
      }
    }
  }

  const negative = Object.entries(features).filter(([, feature]) => SIZE_KEYS.some((key) => feature[key] < 0))
  if (negative.length) {
    console.log(
      `[build] ${negative.length} 个特性边际为负值（裁掉特性反而变大），已按原始差值写入 sizes.json：${negative
        .slice(0, 5)
        .map(([id]) => id)
        .join(', ')}${negative.length > 5 ? ' 等' : ''}`
    )
  }

  // 指纹与 sizes.json 同批落盘：下一次 verify:reuse / build:all --reuse 只有指纹一致才敢复用（F-72）
  writeBuildFingerprint(fingerprint)

  const payload = {
    profiles: Object.fromEntries(results.map((result) => [result.name, result])),
    features
  }
  // 产物没变就沿用上次的 generatedAt，避免每次构建/门禁都把 sizes.json 弄脏
  let previous = null
  try {
    previous = JSON.parse(fs.readFileSync(sizesPath, 'utf8'))
  } catch {
    previous = null
  }
  const unchanged =
    previous && JSON.stringify({ profiles: previous.profiles, features: previous.features }) === JSON.stringify(payload)

  const sizes = {
    generatedAt: unchanged ? previous.generatedAt : new Date().toISOString(),
    ...payload
  }

  fs.writeFileSync(sizesPath, `${JSON.stringify(sizes, null, 2)}\n`, 'utf8')
  await writeDemoMeta()
  return { results, sizes, reused: false }
}

async function main() {
  const reuse = process.argv.includes('--reuse')
  const { results, reused } = await buildAllProfiles({ reuse })
  if (reused) {
    return
  }
  console.table(
    results.map((result) => ({
      profile: result.name,
      features: result.features.join(' + ') || 'core only',
      js: `${(result.jsBytes / 1024).toFixed(1)} kB`,
      css: `${(result.cssBytes / 1024).toFixed(1)} kB`,
      gzip: `${(result.gzipBytes / 1024).toFixed(1)} kB`
    }))
  )
}

const entryUrl = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (entryUrl === import.meta.url) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
