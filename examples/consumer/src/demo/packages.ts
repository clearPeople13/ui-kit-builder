import { computed, shallowRef } from 'vue'
import metaJson from './meta.json'

export interface DemoPackageFile {
  file: string
  bytes: number
  gzipBytes: number
}

export interface DemoPackage {
  id: string
  label: string
  npm: string
  prefix: string
  features: string[]
  componentFeatures: Record<string, string[]>
  components: string[]
  selection: Record<string, string[]>
  files: DemoPackageFile[]
  sizes: {
    js: number
    css: number
    total: number
    gzip: number
  }
}

export interface DemoComponentMeta {
  id: string
  title: string
  description: string
  order: number
  category: string
  exports: {
    name: string
    coreProps: { name: string; type: string; default?: unknown; description?: string }[]
    features: {
      id: string
      title: string
      description: string
      props: { name: string; type: string; default?: unknown; description?: string }[]
    }[]
    methods: string[]
  }[]
}

interface DemoMeta {
  base: string
  version: string
  categories: string[]
  components: DemoComponentMeta[]
  packages: DemoPackage[]
}

const META = metaJson as unknown as DemoMeta

const INSTALLED_PACKAGES: DemoPackage[] = META.packages

const INSTALLED_IDS = new Set(INSTALLED_PACKAGES.map((item) => item.id))

export const PACKAGES = shallowRef<DemoPackage[]>([...INSTALLED_PACKAGES])

export function mergeRuntimePackages(list: DemoPackage[]): void {
  // 运行时条目带 styleUrl/moduleUrl，meta.json 里的静态条目没有：同 id 必须用运行时数据覆盖，否则新主题拿不到样式地址
  const runtimeById = new Map(list.map((item) => [item.id, item]))
  const merged = INSTALLED_PACKAGES.map((item) => runtimeById.get(item.id) ?? item)
  const known = new Set(merged.map((item) => item.id))
  for (const item of list) {
    if (!known.has(item.id)) {
      merged.push(item)
    }
  }
  const signature = (items: DemoPackage[]): string => {
    return items.map((item) => `${item.id}:${item.sizes.total}:${item.features.length}`).join('|')
  }
  if (signature(merged) !== signature(PACKAGES.value)) {
    PACKAGES.value = merged
  }
}

export const COMPONENTS: DemoComponentMeta[] = META.components

export const DEFAULT_PACKAGE_ID = 'full'

export const CATEGORY_ORDER: string[] = META.categories ?? []

export function packageById(id: string): DemoPackage {
  const list = PACKAGES.value
  return list.find((item) => item.id === id) ?? list.find((item) => item.id === DEFAULT_PACKAGE_ID) ?? list[0]
}

export function componentById(id: string): DemoComponentMeta | undefined {
  return COMPONENTS.find((item) => item.id === id)
}

export function componentFeaturesOf(target: DemoPackage, componentId: string): string[] {
  return target.componentFeatures[componentId] ?? []
}

export function featureAvailable(target: DemoPackage, componentId: string, featureId: string): boolean {
  return featureId === 'core' || componentFeaturesOf(target, componentId).includes(featureId)
}

export function groupedComponents(keyword: string): { category: string; items: DemoComponentMeta[] }[] {
  const query = keyword.trim().toLowerCase()
  const groups: { category: string; items: DemoComponentMeta[] }[] = []
  for (const category of CATEGORY_ORDER) {
    const items = COMPONENTS.filter((item) => {
      if (item.category !== category) {
        return false
      }
      if (!query) {
        return true
      }
      const names = [item.id, item.title, ...item.exports.map((entry) => entry.name)]
      return names.some((name) => name.toLowerCase().includes(query))
    })
    if (items.length) {
      groups.push({ category, items })
    }
  }
  return groups
}

export function featureMatrix(): {
  rows: { id: string; title: string; counts: Record<string, number> }[]
} {
  const rows = COMPONENTS.map((component) => {
    const counts: Record<string, number> = {}
    for (const target of PACKAGES.value) {
      counts[target.id] = componentFeaturesOf(target, component.id).length
    }
    return { id: component.id, title: component.title, counts }
  }).filter((row) => Object.values(row.counts).some((count) => count > 0))
  return { rows }
}

export function formatKb(bytes: number): string {
  return `${(bytes / 1000).toFixed(1)} kB`
}

export function formatDelta(bytes: number, baseBytes: number): string {
  const delta = bytes - baseBytes
  if (delta === 0) {
    return '基准'
  }
  return `${delta > 0 ? '+' : ''}${(delta / 1000).toFixed(1)} kB`
}

export function gzipShare(bytes: number): number {
  const max = Math.max(...PACKAGES.value.map((item) => item.sizes.gzip), 1)
  return Math.round((bytes / max) * 100)
}

export const COMPONENT_COUNT = META.components.length

export const EXPORT_COUNT = META.components.reduce((total, component) => total + component.exports.length, 0)

export const ALL_FEATURE_COUNT = computed(() => new Set(PACKAGES.value.flatMap((item) => item.features)).size)

export function configuratorUrl(): string {
  return `${window.location.origin}/configurator/`
}
