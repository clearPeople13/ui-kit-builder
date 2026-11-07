import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)))
const componentsDir = path.join(rootDir, 'packages/ui-kit/src/components')
const rootPackage = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))

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

/**
 * 校验单个导出的 slots 声明（A21 slot 契约层）。
 *
 * spec.mjs 里 slots 是唯一的"实现侧事实"（组件代码渲染什么，就声明什么），
 * 写错字段在这里直接报出组件/导出/插槽三级定位，而不是让下游 d.ts / demo meta
 * 生成出看不懂的产物。校验通过原样返回（不拷贝），保持 spec 对象引用透明。
 */
export function validateExportSlots(componentId, exportName, slots) {
  if (slots === undefined || slots === null) {
    return slots ?? undefined
  }
  const where = `组件 ${componentId} 的导出 ${exportName}`
  if (!Array.isArray(slots)) {
    throw new Error(`${where} 的 slots 必须是数组`)
  }
  const seen = new Set()
  for (const slot of slots) {
    if (!slot || typeof slot !== 'object' || Array.isArray(slot)) {
      throw new Error(`${where} 的 slots 每一项都必须是对象`)
    }
    if (typeof slot.name !== 'string' || !slot.name.trim()) {
      throw new Error(`${where} 存在没有名字的 slot 声明（name 必须是非空字符串）`)
    }
    if (seen.has(slot.name)) {
      throw new Error(`${where} 的 slot "${slot.name}" 重复声明`)
    }
    seen.add(slot.name)
    if (slot.scope != null && (typeof slot.scope !== 'object' || Array.isArray(slot.scope))) {
      throw new Error(`${where} 的 slot "${slot.name}" 的 scope 必须是对象或 null`)
    }
    for (const [scopeProp, scopeType] of Object.entries(slot.scope ?? {})) {
      if (typeof scopeType !== 'string' || !scopeType.trim()) {
        throw new Error(`${where} 的 slot "${slot.name}" 作用域属性 ${scopeProp} 缺少类型字符串`)
      }
    }
    if (typeof slot.fallback !== 'boolean') {
      throw new Error(`${where} 的 slot "${slot.name}" 的 fallback 必须是布尔（是否有默认内容）`)
    }
    if (slot.description !== undefined && typeof slot.description !== 'string') {
      throw new Error(`${where} 的 slot "${slot.name}" 的 description 必须是字符串`)
    }
    if (slot.renderedVia !== undefined && (typeof slot.renderedVia !== 'string' || !slot.renderedVia.trim())) {
      throw new Error(`${where} 的 slot "${slot.name}" 的 renderedVia 必须是非空字符串（豁免说明）`)
    }
  }
  return slots
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
    if (!Array.isArray(spec.exports)) {
      throw new Error(`组件 ${entry.name} 的 spec.mjs 缺少 exports 数组`)
    }
    for (const item of spec.exports) {
      validateExportSlots(spec.id, item.name, item.slots)
    }
    components[spec.id] = spec
  }

  return {
    name: '@demo/ui-kit',
    // 版本只有 package.json 一处事实源，产物 package.json 随 registry.version 走（A8）
    version: rootPackage.version,
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
    // 递归进行中的特性：进入 visit 立即标记，A↔B 互 requires 的旧实现
    // 要到递归返回后才入 seen，会无限展开直到 RangeError 爆栈（A4）；
    // 撞见进行中的特性说明 requires 成环，是注册表编写错误，抛 400 而不是默默吞掉。
    const visiting = new Set()

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
      if (visiting.has(featureId)) {
        const error = new Error(`特性 requires 存在循环依赖: ${featureId}`)
        error.status = 400
        throw error
      }
      visiting.add(featureId)
      for (const dependency of feature.requires ?? []) {
        visit(dependency)
      }
      visiting.delete(featureId)
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
