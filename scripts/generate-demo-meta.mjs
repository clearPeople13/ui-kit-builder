import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { loadRegistry } from '../registry.mjs'
import { CATEGORY_ORDER, categoryOf } from './demo-categories.mjs'
import { profileCatalog } from './profile-catalog.mjs'
import { PROP_DESCRIPTIONS } from './prop-descriptions.mjs'

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const outputFile = path.join(rootDir, 'examples/consumer/src/demo/meta.json')
const distDir = path.join(rootDir, 'dist')

// label 与排序都从 profiles/*.json 读，调试台不再维护第二份包名表（F-75）
const profiles = profileCatalog(rootDir)
const PACKAGE_LABELS = Object.fromEntries(profiles.map((entry) => [entry.dirName, entry.label]))
const PACKAGE_ORDER = profiles.map((entry) => entry.dirName)

function readConsumerDependencies() {
  const consumerPkgPath = path.join(rootDir, 'examples/consumer/package.json')
  if (!fs.existsSync(consumerPkgPath)) {
    return new Set()
  }
  const consumerPkg = JSON.parse(fs.readFileSync(consumerPkgPath, 'utf8'))
  return new Set(Object.keys(consumerPkg.dependencies ?? {}))
}

function readPackages(installed) {
  if (!fs.existsSync(distDir)) {
    return []
  }
  const packages = []
  for (const entry of fs.readdirSync(distDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }
    const metaPath = path.join(distDir, entry.name, 'meta.json')
    const pkgPath = path.join(distDir, entry.name, 'package.json')
    if (!fs.existsSync(metaPath) || !fs.existsSync(pkgPath)) {
      continue
    }
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    if (!installed.has(pkg.name)) {
      continue
    }
    packages.push({
      id: entry.name,
      label: PACKAGE_LABELS[entry.name] ?? meta.name,
      npm: pkg.name,
      prefix: meta.prefix,
      features: meta.features ?? [],
      componentFeatures: pkg.uiKit?.components ?? {},
      components: meta.components ?? [],
      selection: meta.selection ?? {},
      files: meta.files ?? [],
      sizes: {
        js: meta.jsBytes ?? 0,
        css: meta.cssBytes ?? 0,
        total: meta.totalBytes ?? 0,
        gzip: meta.gzipBytes ?? 0
      }
    })
  }
  packages.sort((left, right) => {
    const leftIndex = PACKAGE_ORDER.indexOf(left.id)
    const rightIndex = PACKAGE_ORDER.indexOf(right.id)
    return (leftIndex < 0 ? 99 : leftIndex) - (rightIndex < 0 ? 99 : rightIndex) || left.id.localeCompare(right.id)
  })
  return packages
}

function pickProp(prop) {
  const picked = {
    name: prop.name,
    type: prop.type
  }
  if (prop.default !== undefined) {
    picked.default = prop.default
  }
  if (prop.offValue !== undefined) {
    picked.offValue = prop.offValue
  }
  const description =
    prop.description && prop.description !== prop.name ? prop.description : PROP_DESCRIPTIONS[prop.name]
  if (description) {
    picked.description = description
  }
  return picked
}

export async function writeDemoMeta() {
  const registry = await loadRegistry()
  const components = registry.order.map((id) => {
    const spec = registry.components[id]
    return {
      id,
      title: spec.title,
      description: spec.description ?? '',
      order: spec.order ?? 999,
      category: categoryOf(id),
      exports: spec.exports.map((entry) => ({
        name: entry.name,
        coreProps: entry.coreProps.map(pickProp),
        features: Object.entries(entry.features ?? {}).map(([featureId, feature]) => ({
          id: featureId,
          title: feature.title,
          description: feature.description ?? '',
          props: (feature.props ?? []).map(pickProp)
        })),
        methods: Object.values(entry.features ?? {})
          .flatMap((feature) => feature.methods ?? [])
          .map((method) => method.name)
      }))
    }
  })
  const meta = {
    base: registry.name,
    version: registry.version,
    categories: CATEGORY_ORDER,
    components,
    packages: readPackages(readConsumerDependencies())
  }
  fs.mkdirSync(path.dirname(outputFile), { recursive: true })
  fs.writeFileSync(outputFile, `${JSON.stringify(meta, null, 2)}\n`, 'utf8')
  return meta
}

const entryUrl = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (entryUrl === import.meta.url) {
  writeDemoMeta()
    .then((meta) => {
      const exports = meta.components.reduce((total, component) => total + component.exports.length, 0)
      console.log(`调试台元数据已生成: ${path.relative(rootDir, outputFile)}`)
      console.log(`组件 ${meta.components.length} 个 · 导出 ${exports} 个`)
    })
    .catch((error) => {
      console.error(error.message)
      process.exit(1)
    })
}
