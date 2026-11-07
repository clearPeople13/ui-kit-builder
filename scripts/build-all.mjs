import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { buildProfile, sanitizeName } from './build-lib.mjs'
import { writeDemoMeta } from './generate-demo-meta.mjs'

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const profileNames = [
  'core',
  'full',
  'branded',
  'chinese',
  'cute',
  'antd',
  'arco',
  'tdesign',
  'naive',
  'viewui',
  'vant',
  'varlet',
  'semi',
  'material3',
  'bootstrap',
  'shadcn',
  'fluent',
  'carbon',
  'mantine',
  'ios'
]
const sizesPath = path.join(rootDir, 'sizes.json')
const distDir = path.join(rootDir, 'dist')
// 特性边际试算不进 dist/：它只是体积测量脚手架，不该出现在包列表或产物目录里
const tempRoot = path.join(rootDir, '.build', 'feature-deltas')
const cachePath = path.join(rootDir, '.build', 'feature-size-cache.json')
const fingerprintPath = path.join(rootDir, '.build', 'build-fingerprint.json')
const SIZE_KEYS = ['jsBytes', 'cssBytes', 'totalBytes', 'gzipBytes']

/**
 * 特性边际必须有符号：0 既可能是"真的没变"，也可能是"负数被夹平"，
 * 后者会让体积预算与裁剪决策同时失真（F-67）。负值原样落盘并打一条日志。
 */
export function delta(base, target) {
  const result = {}
  for (const key of SIZE_KEYS) {
    result[key] = target[key] - base[key]
  }
  return result
}

/** dist 下不属于当前 profile 清单、也不在自定义包命名空间的目录（F-68） */
export function staleDistDirs(existingDirs, reservedNames) {
  return existingDirs.filter((name) => name !== 'custom' && !reservedNames.has(name))
}

/** 本机可用的构建并发度：留一个核给门禁自身与文件系统，最多 6 路 */
function concurrency() {
  const cpus = os.availableParallelism?.() ?? os.cpus().length
  return Math.max(2, Math.min(6, cpus - 1))
}

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
 * 构建输入的指纹：产物与特性边际只取决于组件源码、profile 配置、注册表与构建器本身。
 * 这些内容都没变时，上次算出的边际值与已构建产物仍然成立；Node / 平台也进指纹，避免换环境后误复用。
 * 构建脚本自身（build-all.mjs）也算输入：改了边际算法就必须重算，否则缓存会把旧口径钉死（F-69）。
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

function readFeatureCache(fingerprint) {
  try {
    const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
    return cache?.fingerprint === fingerprint && cache.features ? cache.features : null
  } catch {
    return null
  }
}

function writeFeatureCache(fingerprint, features) {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true })
  fs.writeFileSync(
    cachePath,
    `${JSON.stringify({ fingerprint, generatedAt: new Date().toISOString(), features }, null, 2)}\n`,
    'utf8'
  )
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

/** 门禁里已经构建过一次时，verify 直接复用 sizes.json 的记录，不再重复打 198 份包 */
function loadBuiltResults() {
  try {
    // 产物是否可信不取决于"文件还在"，而取决于构建它的源码是否还是当前源码（F-70）
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
  const profileConfigs = profileNames.map((profileName) => {
    const configPath = path.join(rootDir, 'profiles', `${profileName}.json`)
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    return { profileName, dirName: sanitizeName(config.name ?? profileName), config }
  })
  // 删掉清单里已经不存在的历史 profile，避免它们继续被 /api/packages 当成可安装产物（F-68）
  cleanStaleProfiles(new Set(profileConfigs.map((item) => item.dirName)))

  const profileStarted = Date.now()
  const results = await mapPool(profileConfigs, concurrency(), ({ profileName, config }) =>
    buildProfile({
      ...config,
      name: config.name ?? profileName
    })
  )
  const profileSeconds = ((Date.now() - profileStarted) / 1000).toFixed(1)
  console.log(`[build] ${profileNames.length} 份正式 profile 完成（${concurrency()} 路并发，${profileSeconds}s）`)

  const { loadRegistry, fullSelection } = await import('../registry.mjs')
  const registry = await loadRegistry()
  const features = {}

  // 特性边际统一用「full 去掉该特性」的临时产物与 full 相减，
  // 得到该特性在完整产物里的边际成本。这样 178 个特性都有真实体积数据，
  // 也不会因"某两份 profile 恰好配对"而走出另一套口径。
  // 临时产物写 .build/feature-deltas/，并在 try/finally 里清理，dist/ 永远只有 20 份正式包。
  const fullResult = results.find((result) => result.name === 'full')
  if (fullResult) {
    const cached = cache ? readFeatureCache(fingerprint) : null
    const fullSel = fullSelection(registry)
    const pending = []

    for (const component of Object.values(registry.components)) {
      for (const [id, feature] of Object.entries(
        Object.assign({}, ...component.exports.map((item) => item.features ?? {}))
      )) {
        if (cached?.[id]) {
          features[id] = cached[id]
          continue
        }
        pending.push({ component, id, feature })
      }
    }

    if (pending.length) {
      const tempStarted = Date.now()
      try {
        const built = await mapPool(pending, concurrency(), async ({ component, id }) => {
          const minusSel = JSON.parse(JSON.stringify(fullSel))
          minusSel[component.id] = (minusSel[component.id] ?? []).filter((featureId) => featureId !== id)
          const name = `__feat_${id}`
          return buildProfile({
            name,
            prefix: 'ui',
            components: minusSel,
            outDir: path.relative(rootDir, path.join(tempRoot, sanitizeName(name)))
          })
        })
        pending.forEach(({ component, id, feature }, index) => {
          features[id] = {
            title: feature.title,
            component: component.id,
            ...delta(built[index], fullResult)
          }
        })
      } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true })
        // 每个临时 profile 的入口 TS 落在 .build/<name>/，比产物目录更晚被遗忘
        for (const { id } of pending) {
          fs.rmSync(path.join(rootDir, '.build', sanitizeName(`__feat_${id}`)), { recursive: true, force: true })
        }
      }
      const tempSeconds = ((Date.now() - tempStarted) / 1000).toFixed(1)
      console.log(`[build] ${pending.length} 个特性边际临时产物完成（${concurrency()} 路并发，${tempSeconds}s）`)
    } else if (cached) {
      console.log(`[build] ${Object.keys(features).length} 个特性的边际体积命中内容哈希缓存，跳过临时构建`)
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

    if (cache) {
      writeFeatureCache(fingerprint, features)
    }
  }

  // 指纹与 sizes.json 同批落盘：下一次 verify:reuse / build:all --reuse 只有指纹一致才敢复用（F-70）
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
