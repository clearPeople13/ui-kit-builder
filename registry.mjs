import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)))
const componentsDir = path.join(rootDir, 'packages/ui-kit/src/components')

let registryPromise = null

/**
 * 同一次构建里 build:all / build-lib / 调试台会反复要注册表，没有进程内缓存时
 * 每次都要重新 import 90 个 spec.mjs（冷构建日志里出现过 2 次以上加载）。
 * 这里按进程 memo：同一 Node 进程只解析一次；dev 侧要看最新 spec 时传 { fresh: true }（C3）。
 */
export async function loadRegistry({ fresh = false } = {}) {
  if (fresh) {
    registryPromise = null
  }
  if (!registryPromise) {
    registryPromise = readRegistry().catch((error) => {
      registryPromise = null
      throw error
    })
  }
  return registryPromise
}

async function readRegistry() {
  const components = {}

  const entries = fs
    .readdirSync(componentsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name))

  for (const entry of entries) {
    const specPath = path.join(componentsDir, entry.name, 'spec.mjs')
    if (!fs.existsSync(specPath)) {
      continue
    }
    const spec = (await import(`${pathToFileURL(specPath).href}?v=${fs.statSync(specPath).mtimeMs}`)).default
    components[spec.id] = spec
  }

  return {
    name: '@demo/ui-kit',
    version: '0.3.0',
    components,
    order: Object.keys(components).sort((left, right) => {
      return (components[left].order ?? 999) - (components[right].order ?? 999) || left.localeCompare(right)
    })
  }
}

export function resolveSelection(registry, requested = {}) {
  const selection = {}
  const componentIds = Object.keys(requested)

  for (const componentId of componentIds) {
    const component = registry.components[componentId]
    if (!component) {
      const error = new Error(`未知组件: ${componentId}`)
      error.status = 400
      throw error
    }

    const featureIds = requested[componentId]
    if (!Array.isArray(featureIds) || featureIds.some((id) => typeof id !== 'string')) {
      const error = new Error(`组件 ${componentId} 的 features 必须是字符串数组`)
      error.status = 400
      throw error
    }

    const available = Object.assign({}, ...component.exports.map((item) => item.features ?? {}))
    const resolved = []
    const seen = new Set()

    function visit(featureId) {
      if (seen.has(featureId)) {
        return
      }
      const feature = available[featureId]
      if (!feature) {
        const error = new Error(`未知特性: ${featureId}`)
        error.status = 400
        throw error
      }
      for (const dependency of feature.requires ?? []) {
        visit(dependency)
      }
      seen.add(featureId)
      resolved.push(featureId)
    }

    for (const featureId of featureIds) {
      visit(featureId)
    }
    selection[componentId] = resolved
  }

  return selection
}

export function selectionFromFeatures(registry, featureIds = []) {
  const requested = {}
  for (const featureId of featureIds) {
    const componentId = Object.keys(registry.components).find((id) => {
      return registry.components[id].exports.some((item) => featureId in (item.features ?? {}))
    })
    if (!componentId) {
      const error = new Error(`未知特性: ${featureId}`)
      error.status = 400
      throw error
    }
    requested[componentId] ??= []
    requested[componentId].push(featureId)
  }
  return requested
}

export function allComponentsSelection(registry) {
  return Object.fromEntries(Object.keys(registry.components).map((id) => [id, []]))
}

export function fullSelection(registry) {
  return Object.fromEntries(
    Object.keys(registry.components).map((id) => [
      id,
      registry.components[id].exports.flatMap((item) => Object.keys(item.features ?? {}))
    ])
  )
}
