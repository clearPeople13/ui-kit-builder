import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { buildProfile } from './build-lib.mjs'
import { writeDemoMeta } from './generate-demo-meta.mjs'

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const profileNames = ['core', 'bg-color', 'gradient', 'full', 'branded', 'chinese', 'cute']

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

  const { loadRegistry } = await import('../registry.mjs')
  const registry = await loadRegistry()
  const features = {}

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

  const sizes = {
    generatedAt: new Date().toISOString(),
    profiles: Object.fromEntries(results.map((result) => [result.name, result])),
    features
  }

  fs.writeFileSync(path.join(rootDir, 'sizes.json'), `${JSON.stringify(sizes, null, 2)}\n`, 'utf8')
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
