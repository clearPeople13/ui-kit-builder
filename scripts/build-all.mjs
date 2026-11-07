import fs from 'node:fs'
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

function delta(base, target) {
  return {
    jsBytes: Math.max(0, target.jsBytes - base.jsBytes),
    cssBytes: Math.max(0, target.cssBytes - base.cssBytes),
    totalBytes: Math.max(0, target.totalBytes - base.totalBytes),
    gzipBytes: Math.max(0, target.gzipBytes - base.gzipBytes)
  }
}

function sameFeatures(left, right) {
  return left.length === right.length && left.every((id) => right.includes(id))
}

export async function buildAllProfiles() {
  const results = []

  for (const profileName of profileNames) {
    const configPath = path.join(rootDir, 'profiles', `${profileName}.json`)
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    results.push(
      await buildProfile({
        ...config,
        name: config.name ?? profileName
      })
    )
  }

  const { loadRegistry, fullSelection } = await import('../registry.mjs')
  const registry = await loadRegistry()
  const features = {}

  // 先用现有 20 份 profile 里能配对的特性填一遍（requires 与 requires+[id] 恰好都存在的情况）
  for (const component of Object.values(registry.components)) {
    for (const [id, feature] of Object.entries(
      Object.assign({}, ...component.exports.map((item) => item.features ?? {}))
    )) {
      const requires = feature.requires ?? []
      const baseProfile = results.find((result) => sameFeatures(result.features, requires))
      const targetProfile = results.find((result) => sameFeatures(result.features, [...requires, id]))
      if (!baseProfile || !targetProfile) {
        continue
      }
      features[id] = {
        title: feature.title,
        component: component.id,
        ...delta(baseProfile, targetProfile)
      }
    }
  }

  // F-27 修复：剩下没有配对的特性，用「full 去掉该特性」的临时产物与 full 相减，
  // 得到该特性在完整产物里的边际成本。这样 178 个特性都有真实体积数据，
  // 不再因为 20 份 profile 都是全特性集而让 features 段恒空。
  const fullResult = results.find((result) => result.name === 'full')
  if (fullResult) {
    const fullSel = fullSelection(registry)
    const tempDirs = []
    for (const component of Object.values(registry.components)) {
      for (const [id, feature] of Object.entries(
        Object.assign({}, ...component.exports.map((item) => item.features ?? {}))
      )) {
        if (features[id]) {
          continue
        }
        const minusSel = JSON.parse(JSON.stringify(fullSel))
        minusSel[component.id] = (minusSel[component.id] ?? []).filter((fid) => fid !== id)
        const tempName = `__feat_${id}`
        tempDirs.push(tempName)
        const minusResult = await buildProfile({
          name: tempName,
          prefix: 'ui',
          components: minusSel
        })
        features[id] = {
          title: feature.title,
          component: component.id,
          ...delta(minusResult, fullResult)
        }
      }
    }
    // 清理临时产物目录（buildProfile 会对 name 做 sanitize），避免污染 dist/
    for (const name of tempDirs) {
      const dir = path.join(rootDir, 'dist', sanitizeName(name))
      fs.rmSync(dir, { recursive: true, force: true })
    }
  }

  const sizesPath = path.join(rootDir, 'sizes.json')
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
  return { results, sizes }
}

async function main() {
  const { results } = await buildAllProfiles()
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
