import { SCENE_PRESETS, resolvePresetValue, type ScenePreset } from './presets'
import { featureAvailable, type DemoPackage } from './packages'
import type { PlaygroundEntry } from './playground'

export interface SceneView extends ScenePreset {
  available: boolean
  reason: string
}

const DEFAULT_SCENE: ScenePreset = { id: 'base', label: '默认示例', values: {} }

export function requiredFeatures(requires: ScenePreset['requires']): string[] {
  if (!requires) {
    return []
  }
  return Array.isArray(requires) ? requires : [requires]
}

export function entryScenes(entry: PlaygroundEntry): ScenePreset[] {
  const presets = SCENE_PRESETS[entry.name]
  return presets && presets.length ? presets : [DEFAULT_SCENE]
}

export function sceneViews(entry: PlaygroundEntry, target: DemoPackage, componentId: string): SceneView[] {
  return entryScenes(entry).map((preset) => {
    const missing = requiredFeatures(preset.requires).filter(
      (feature) => !featureAvailable(target, componentId, feature)
    )
    const available = missing.length === 0
    return {
      ...preset,
      available,
      reason: available ? '' : `当前包未启用 ${missing.join('、')}`
    }
  })
}

export function groupDefaults(entry: PlaygroundEntry, groupId: string): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const control of entry.controls) {
    if (control.featureId !== groupId) {
      continue
    }
    if (control.kind === 'switch') {
      values[control.name] = true
      continue
    }
    if (control.sampleValue === undefined || control.sampleValue === null || control.sampleValue === '') {
      continue
    }
    values[control.name] = cloneValue(control.sampleValue)
  }
  return values
}

export function presetValues(
  entry: PlaygroundEntry,
  preset: ScenePreset | undefined,
  enabledGroups: Set<string>
): Record<string, unknown> {
  if (!preset) {
    return {}
  }
  const controls = new Map(entry.controls.map((control) => [control.name, control]))
  const values: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(preset.values)) {
    const control = controls.get(name)
    if (control && control.featureId !== 'core' && !enabledGroups.has(control.featureId)) {
      continue
    }
    // 惰性工厂：取值时才物化（工厂内部缓存），重数据按引用共享（表格只读），
    // 不再 structuredClone 整个大数组；其余小/可变值保留深拷贝，维持属性面板隔离
    values[name] = typeof value === 'function' ? resolvePresetValue(value) : cloneValue(value)
  }
  return values
}

export function dropGroupValues(
  values: Record<string, unknown>,
  entry: PlaygroundEntry,
  groupId: string
): Record<string, unknown> {
  const names = new Set(
    entry.controls.filter((control) => control.featureId === groupId).map((control) => control.name)
  )
  const next: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(values)) {
    if (!names.has(name)) {
      next[name] = value
    }
  }
  return next
}

export function cloneValue<T>(value: T): T {
  try {
    return structuredClone(value)
  } catch {
    return value
  }
}
