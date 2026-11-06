import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 第三批（构建器侧契约）用例的公共夹具。
 *
 * 断言对象是 `scripts/build-all.mjs` 产出的 20 份真实产物（dist/<profile>/），
 * 所以这批用例必须先有一次完整构建：`npm run test:build` 的 pre 钩子负责，
 * 单独调试时用 `npm run build:all && npx vitest run --config vitest.build.config.ts`。
 */

export const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))

export type Registry = {
  name: string
  version: string
  order: string[]
  components: Record<
    string,
    {
      id: string
      exports: Array<{
        name: string
        createExport: string
        module: string
        coreProps: Array<{ name: string; type: string }>
        features?: Record<string, FeatureSpec>
      }>
    }
  >
}

export type FeatureSpec = {
  title: string
  exportName: string
  module: string
  props?: Array<{ name: string; type: string }>
  methods?: Array<{ name: string; signature: string; description?: string }>
  requires?: string[]
}

export type ProfileMeta = {
  name: string
  dir: string
  prefix: string
  components: string[]
  selection: Record<string, string[]>
  features: string[]
  files: Array<{ file: string; bytes: number; gzipBytes: number }>
  jsBytes: number
  cssBytes: number
  totalBytes: number
  gzipBytes: number
}

export type Bundle = {
  profile: string
  prefix: string
  meta: ProfileMeta
  css: string
  js: string
  entry: string
  types: string
  packageJson: Record<string, any>
  config: Record<string, any>
}

export function readText(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

export function readJson<T = any>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T
}

export function exists(relativePath: string) {
  return fs.existsSync(path.join(repoRoot, relativePath))
}

/** profiles/ 目录即 profile 清单的唯一来源，顺序固定便于用例输出可比对 */
export const profileNames = fs
  .readdirSync(path.join(repoRoot, 'profiles'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace(/\.json$/, ''))
  .sort()

export async function loadTestRegistry(): Promise<Registry> {
  const module = (await import('../../registry.mjs')) as { loadRegistry: () => Promise<Registry> }
  return module.loadRegistry()
}

const registryModule = (await import('../../registry.mjs')) as {
  resolveSelection: (registry: Registry, requested?: Record<string, string[]>) => Record<string, string[]>
  fullSelection: (registry: Registry) => Record<string, string[]>
  allComponentsSelection: (registry: Registry) => Record<string, string[]>
}

export const { resolveSelection, fullSelection, allComponentsSelection } = registryModule

export function featureEntries(registry: Registry) {
  const entries: Array<{ componentId: string; id: string; spec: FeatureSpec }> = []
  for (const componentId of registry.order) {
    const spec = registry.components[componentId]
    const features: Record<string, FeatureSpec> = Object.assign({}, ...spec.exports.map((item) => item.features ?? {}))
    for (const [id, feature] of Object.entries(features)) {
      entries.push({ componentId, id, spec: feature })
    }
  }
  return entries
}

const bundleCache = new Map<string, Bundle>()

export function bundleOf(profile: string): Bundle {
  const cached = bundleCache.get(profile)
  if (cached) {
    return cached
  }
  const meta = readJson<ProfileMeta>(`dist/${profile}/meta.json`)
  const bundle: Bundle = {
    profile,
    prefix: meta.prefix,
    meta,
    css: readText(`dist/${profile}/ui-kit.css`),
    js: readText(`dist/${profile}/ui-kit.js`),
    entry: readText(`.build/${profile}/entry.ts`),
    types: readText(`dist/${profile}/index.d.ts`),
    packageJson: readJson(`dist/${profile}/package.json`),
    config: readJson(`profiles/${profile}.json`)
  }
  bundleCache.set(profile, bundle)
  return bundle
}

export const allBundles = () => profileNames.map(bundleOf)

/** 与 scripts/build-lib.mjs 的 rewritePrefix 同规则：产物里的 ui- 都已换成 profile 前缀 */
export function localize(marker: string, prefix: string) {
  if (prefix === 'ui') {
    return marker
  }
  return marker.replace(/--ui-/g, `--${prefix}-`).replace(/(^|[^a-z0-9-])ui-/gi, `$1${prefix}-`)
}

export type FeatureMarker = { id: string; marker: string; kind: 'css' | 'js' }

/**
 * 给每个特性求一个"只在被裁剪进来时才会出现在产物里"的字面量。
 *
 * 取值顺序：特性自带 style.css 里独有的类名 → 特性 index.ts 里独有的字符串字面量。
 * 两者都取不到时（多半是只挂 hooks 的行为复用型特性）交给 entry import 断言覆盖，
 * 并由 MARKERLESS_FEATURES 白名单显式记录，新增这类特性时必须当面确认。
 */
export function resolveFeatureMarkers(registry: Registry) {
  const marked: FeatureMarker[] = []
  const unmarked: string[] = []

  for (const { componentId, id } of featureEntries(registry)) {
    const base = `packages/ui-kit/src/components/${componentId}`
    const coreSource = `${readText(`${base}/core.ts`)}${exists(`${base}/core.css`) ? readText(`${base}/core.css`) : ''}`
    const slug = id.split('.').slice(1).join('-')
    const featureDir = `${base}/features/${slug}`
    const ts = exists(`${featureDir}/index.ts`) ? readText(`${featureDir}/index.ts`) : ''
    const css = exists(`${featureDir}/style.css`) ? readText(`${featureDir}/style.css`) : ''

    const selectors = [
      ...new Set([...css.matchAll(/\.(ui-[a-z0-9-]+|is-[a-z0-9-]+)/g)].map((match) => match[1]))
    ].filter((value) => !coreSource.includes(value))
    const cssMarker = selectors.find((value) => inBundle(value, 'full') && !inBundle(value, 'core'))

    if (cssMarker) {
      marked.push({ id, marker: cssMarker, kind: 'css' })
      continue
    }

    const literals = [...new Set([...ts.matchAll(/['"`]([A-Za-z_][\w-]{3,})['"`]/g)].map((match) => match[1]))].filter(
      (value) => value !== id && value !== slug && !value.includes('.') && !coreSource.includes(value)
    )
    const jsMarker = literals.find((value) => inBundle(value, 'full') && !inBundle(value, 'core'))

    if (jsMarker) {
      marked.push({ id, marker: jsMarker, kind: 'js' })
      continue
    }
    unmarked.push(id)
  }

  return { marked, unmarked }
}

/** 在指定 profile 的 js+css 里查找（按该 profile 的前缀改写标记） */
export function inBundle(marker: string, profile: string) {
  const bundle = bundleOf(profile)
  const needle = localize(marker, bundle.prefix)
  return bundle.css.includes(needle) || bundle.js.includes(needle)
}

/** 标记是否命中：先按源码原文查，再按该 profile 前缀改写后查 */
export function markerHits(marker: FeatureMarker, profile: string) {
  const bundle = bundleOf(profile)
  const raw = bundle.css.includes(marker.marker) || bundle.js.includes(marker.marker)
  const localized = inBundle(marker.marker, profile)
  return raw || localized
}

export type TokenTable = {
  root: Array<[string, string]>
  components: Array<{ selector: string; declarations: Array<[string, string]> }>
}

/**
 * 从产物 CSS 里读出令牌：`:root{...}` 与 `.前缀-组件{--...}` 两类块。
 * 产物 CSS 是压缩过的，声明之间用分号分隔且不含花括号嵌套，直接按块解析即可。
 */
export function parseTokens(bundle: Bundle): TokenTable {
  const root: Array<[string, string]> = []
  const components: TokenTable['components'] = []

  for (const block of bundle.css.matchAll(/:root\{([^{}]*)\}/g)) {
    root.push(...declarations(block[1]))
  }
  const classRe = new RegExp(`\\.(${bundle.prefix}-[a-z0-9-]+)\\{([^{}]*)\\}`, 'g')
  for (const block of bundle.css.matchAll(classRe)) {
    const declarationsInBlock = declarations(block[2])
    if (declarationsInBlock.some(([name]) => name.startsWith('--'))) {
      components.push({ selector: block[1], declarations: declarationsInBlock })
    }
  }
  return { root, components }
}

function declarations(body: string) {
  return body
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((raw) => {
      const colon = raw.indexOf(':')
      return [raw.slice(0, colon), raw.slice(colon + 1)] as [string, string]
    })
    .filter(([name, value]) => name.startsWith('--') && value.length > 0)
}

/** 去掉前缀的令牌名，用于跨 profile 比对 */ export function normalizeTokenName(name: string, prefix: string) {
  return name.replace(new RegExp(`^--${prefix}-`), '--*:')
}

export function effectiveRootTokens(table: TokenTable, prefix: string) {
  const map = new Map<string, string>()
  for (const [name, value] of table.root) {
    map.set(normalizeTokenName(name, prefix), value)
  }
  return map
}

let sharedCssCache: string | null = null

/** shared/*.css 会被 @import 跟着组件进包，其中的选择器不算某个组件私有 */
function sharedCssText() {
  if (sharedCssCache === null) {
    const dir = path.join(repoRoot, 'packages/ui-kit/src/shared')
    sharedCssCache = fs
      .readdirSync(dir)
      .filter((file) => file.endsWith('.css'))
      .map((file) => fs.readFileSync(path.join(dir, file), 'utf8'))
      .join('\n')
  }
  return sharedCssCache
}

/**
 * 取一个"只有该组件自己会用到"的 BEM 元素选择器，用于证明组件代码没被打进包。
 * 未选中组件的根类名仍可能出现在 shared（floating.css 的浮层白名单等）里，那是共享规则，不是组件代码。
 */
export function ownElementSelector(componentId: string) {
  const own = exists(`packages/ui-kit/src/components/${componentId}/core.css`)
    ? readText(`packages/ui-kit/src/components/${componentId}/core.css`)
    : ''
  const selectors = [...new Set([...own.matchAll(/\.(ui-[a-z0-9-]+__[a-z0-9-]+)/g)].map((match) => match[1]))]
  return selectors.find((value) => !sharedCssText().includes(value)) ?? null
}
