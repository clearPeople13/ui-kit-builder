import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import {
  allComponentsSelection,
  fullSelection,
  loadRegistry,
  resolveSelection,
  selectionFromFeatures
} from '../registry.mjs'

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const rootPackage = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))
const iconSourcePath = 'packages/ui-kit/src/shared/icons.ts'
const iconGatewayExports = [
  'registerIcon',
  'unregisterIcon',
  'resolveIcon',
  'UI_ICONS',
  'DEFAULT_ICON_SIZE',
  'DEFAULT_ICON_STROKE_WIDTH'
]

export function readIconRegistryNames() {
  const source = fs.readFileSync(path.join(rootDir, iconSourcePath), 'utf8')
  const block = source.match(/UI_ICONS\s*=\s*\{([\s\S]*?)\}\s*as const/)
  if (!block) {
    return []
  }
  return [...block[1].matchAll(/([A-Za-z_$][\w$]*)\s*:/g)].map((match) => match[1])
}

export function sanitizeName(name) {
  const value = String(name ?? 'custom')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return value || 'custom'
}

export function sanitizePrefix(prefix) {
  const value = String(prefix ?? 'ui')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (!value) {
    const error = new Error('prefix 不能为空')
    error.status = 400
    throw error
  }
  return value
}

export function rewritePrefix(content, prefix) {
  if (prefix === 'ui') {
    return content
  }
  return content.replace(/--ui-/g, `--${prefix}-`).replace(/(?<![\w@/-])ui-/g, `${prefix}-`)
}

function toThemeToken(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function toThemeValue(value) {
  if (typeof value === 'number') {
    return String(value)
  }
  if (typeof value !== 'string') {
    return ''
  }
  const trimmed = value.trim()
  if (!trimmed || /[;{}]/.test(trimmed)) {
    return ''
  }
  return trimmed
}

function themeDeclarations(tokens, scope, declarations) {
  if (!tokens || typeof tokens !== 'object') {
    return
  }
  for (const [key, rawValue] of Object.entries(tokens)) {
    const token = toThemeToken(key)
    const value = toThemeValue(rawValue)
    if (!token || !value) {
      continue
    }
    declarations.push(`--${scope}-${token}:${value}`)
  }
}

const CSS_VAR_REF_RE = /var\(\s*(--[a-z0-9-]+)/gi
const ROOT_BLOCK_RE = /:root\{([^{}]*)\}/g

function collectVarRefs(text, target) {
  for (const match of text.matchAll(CSS_VAR_REF_RE)) {
    target.add(match[1])
  }
}

function walkCssFiles(dir, visit) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkCssFiles(target, visit)
    } else if (entry.name.endsWith('.css')) {
      visit(target)
    }
  }
}

function collectUnselectedTokenRefs(registry, selection, prefix) {
  const refs = new Set()
  const srcDir = path.join(rootDir, 'packages/ui-kit/src')
  const componentsDir = path.join(srcDir, 'components')
  for (const id of registry.order) {
    if (id in selection) {
      continue
    }
    const dir = path.join(componentsDir, id)
    if (!fs.existsSync(dir)) {
      continue
    }
    walkCssFiles(dir, (file) => collectVarRefs(fs.readFileSync(file, 'utf8'), refs))
  }
  // 共享 CSS 按 @import 跟着组件进包：没被包内 CSS 引用时，这些令牌同样没有消费者
  walkCssFiles(path.join(srcDir, 'shared'), (file) => collectVarRefs(fs.readFileSync(file, 'utf8'), refs))
  if (prefix === 'ui') {
    return refs
  }
  return new Set([...refs].map((name) => name.replace(/^--ui-/, `--${prefix}-`)))
}

function splitDeclarations(body) {
  const parts = []
  let current = ''
  let quote = ''
  let depth = 0
  for (const char of body) {
    if (quote) {
      current += char
      if (char === quote) {
        quote = ''
      }
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
    } else if (char === '(') {
      depth += 1
    } else if (char === ')') {
      depth = Math.max(0, depth - 1)
    } else if (char === ';' && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += char
  }
  if (current.trim()) {
    parts.push(current)
  }
  return parts
}

function parseRootDeclarations(body) {
  return splitDeclarations(body)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((raw) => {
      const colon = raw.indexOf(':')
      if (colon <= 0) {
        return { name: '', value: '', raw }
      }
      return { name: raw.slice(0, colon).trim(), value: raw.slice(colon + 1), raw }
    })
}

// 组件级令牌只服务于组件自身 CSS：组件没进包时声明也没有消费者。
// 只裁「包内无任何 var() 引用、且被未选中组件引用」的 :root 声明，通用令牌保持原样。
function pruneUnusedThemeVars(css, unselectedRefs) {
  if (!unselectedRefs.size) {
    return css
  }
  const blocks = [...css.matchAll(ROOT_BLOCK_RE)]
  if (!blocks.length) {
    return css
  }
  const parsed = blocks.map((block) => parseRootDeclarations(block[1]))
  let outside = css
  for (const block of blocks) {
    outside = outside.replace(block[0], '')
  }
  const referenced = new Set()
  collectVarRefs(outside, referenced)

  const kept = new Set()
  for (const declarations of parsed) {
    for (const decl of declarations) {
      if (!decl.name || referenced.has(decl.name) || !unselectedRefs.has(decl.name)) {
        kept.add(decl.name)
      }
    }
  }
  let changed = true
  while (changed) {
    changed = false
    for (const declarations of parsed) {
      for (const decl of declarations) {
        if (!kept.has(decl.name)) {
          continue
        }
        const refs = new Set()
        collectVarRefs(decl.value, refs)
        for (const ref of refs) {
          if (!referenced.has(ref)) {
            referenced.add(ref)
            changed = true
          }
        }
      }
    }
    for (const declarations of parsed) {
      for (const decl of declarations) {
        if (!kept.has(decl.name) && referenced.has(decl.name)) {
          kept.add(decl.name)
          changed = true
        }
      }
    }
  }

  let index = 0
  return css.replace(ROOT_BLOCK_RE, (_full, _body) => {
    const survivors = parsed[index++].filter((decl) => kept.has(decl.name))
    return survivors.length ? `:root{${survivors.map((decl) => decl.raw).join(';')}}` : ''
  })
}

function buildThemeCss(theme, prefix, activeComponents) {
  if (!theme || typeof theme !== 'object') {
    return ''
  }
  const active = Array.isArray(activeComponents) ? new Set(activeComponents) : null
  const blocks = []
  const rootDeclarations = []
  themeDeclarations(theme.global ?? theme.tokens ?? {}, prefix, rootDeclarations)
  if (rootDeclarations.length) {
    blocks.push(`:root{${rootDeclarations.join(';')}}`)
  }

  for (const [componentId, tokens] of Object.entries(theme.components ?? {})) {
    if (active && !active.has(componentId)) {
      continue
    }
    const name = toThemeToken(componentId)
    if (!name) {
      continue
    }
    const declarations = []
    themeDeclarations(tokens, `${prefix}-${name}`, declarations)
    if (declarations.length) {
      blocks.push(`.${prefix}-${name}{${declarations.join(';')}}`)
    }
  }

  // theme.rawCss：皮肤自带的任意 CSS（自定义 @keyframes / 类等），构建时原样附加并统一做前缀改写，
  // 用 ui- 前缀编写即等价于包内源码，不需要二开库就能上任意动画
  const rawCss = typeof theme.rawCss === 'string' ? theme.rawCss.trim() : ''
  if (rawCss) {
    blocks.push(`\n/* ui-kit theme raw css */\n${rawCss}\n`)
  }

  return blocks.length ? `\n/* ui-kit theme overrides */\n${blocks.join('\n')}\n` : ''
}

function toImportPath(fromDir, target) {
  let relative = path.relative(fromDir, path.resolve(rootDir, target)).replace(/\\/g, '/')
  if (!relative.startsWith('.')) {
    relative = `./${relative}`
  }
  return relative
}

function toPascal(value) {
  return String(value)
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function resolveConfigSelection(registry, config) {
  const requested = {}
  const source = config?.components
  if (source === 'all') {
    Object.assign(requested, allComponentsSelection(registry))
  } else if (source === 'full') {
    Object.assign(requested, fullSelection(registry))
  } else if (source && typeof source === 'object') {
    for (const [componentId, featureIds] of Object.entries(source)) {
      if (!Array.isArray(featureIds)) {
        const error = new Error(`组件 ${componentId} 的 features 必须是字符串数组`)
        error.status = 400
        throw error
      }
      requested[componentId] = [...featureIds]
    }
  } else if (source !== undefined) {
    const error = new Error('components 必须是对象、"all" 或 "full"')
    error.status = 400
    throw error
  }

  const legacy = Array.isArray(config?.features) ? config.features : []
  if (legacy.length) {
    const extra = selectionFromFeatures(registry, legacy)
    for (const [componentId, featureIds] of Object.entries(extra)) {
      requested[componentId] ??= []
      requested[componentId].push(...featureIds)
    }
  }

  if (!source && !legacy.length) {
    Object.assign(requested, allComponentsSelection(registry))
  }

  return resolveSelection(registry, requested)
}

function selectedExports(registry, selection) {
  const items = []
  const exportNames = new Set()

  for (const componentId of registry.order) {
    if (!(componentId in selection)) {
      continue
    }
    const spec = registry.components[componentId]
    const selected = new Set(selection[componentId])
    const featureIds = Object.keys(Object.assign({}, ...spec.exports.map((item) => item.features ?? {}))).filter((id) =>
      selected.has(id)
    )

    for (const item of spec.exports) {
      if (exportNames.has(item.name)) {
        const error = new Error(`导出名重复: ${item.name}`)
        error.status = 500
        throw error
      }
      exportNames.add(item.name)
      items.push({
        componentId,
        spec,
        export: item,
        featureIds: featureIds.filter((id) => id in (item.features ?? {}))
      })
    }
  }

  return items
}

function generateEntry(entryFile, registry, selection) {
  const entryDir = path.dirname(entryFile)
  const items = selectedExports(registry, selection)
  const imports = []
  const statements = []
  const activeFeatures = []
  // 同一个特性可以被同组件的多个导出共享（如 table.selection 同时挂在 Table 与 TableColumn 上），
  // 这里按"导出名 + 模块"去重，避免生成重复的 import 语句与重复的特性 id；
  // createXxx 的参数表仍按各导出自己的 featureIds 传，不受影响
  const importedFeatures = new Set()

  for (const item of items) {
    const { export: entry } = item
    imports.push(`import { ${entry.createExport} } from '${toImportPath(entryDir, entry.module)}'`)
    for (const featureId of item.featureIds) {
      const feature = entry.features[featureId]
      const importKey = `${feature.exportName}@${feature.module}`
      if (!importedFeatures.has(importKey)) {
        importedFeatures.add(importKey)
        imports.push(`import { ${feature.exportName} } from '${toImportPath(entryDir, feature.module)}'`)
      }
      if (!activeFeatures.includes(featureId)) {
        activeFeatures.push(featureId)
      }
    }
    const args = item.featureIds.map((featureId) => entry.features[featureId].exportName)
    statements.push(`export const ${entry.name} = ${entry.createExport}([${args.join(', ')}])`)
  }

  const activeComponents = Object.keys(selection)
  const lines = [...imports]
  if ('icon' in selection) {
    lines.push(`export { ${iconGatewayExports.join(', ')} } from '${toImportPath(entryDir, iconSourcePath)}'`)
  }
  lines.push(
    '',
    `export const activeComponents = [${activeComponents.map((id) => JSON.stringify(id)).join(', ')}] as const`,
    `export const activeFeatures = [${activeFeatures.map((id) => JSON.stringify(id)).join(', ')}] as const`,
    '',
    ...statements.flatMap((statement) => [statement, ''])
  )

  fs.mkdirSync(entryDir, { recursive: true })
  fs.writeFileSync(entryFile, lines.join('\n'), 'utf8')
  return { items, activeFeatures, activeComponents }
}

function featureTypeName(exportName, featureId) {
  const suffix = featureId.split('.').slice(1).join('-')
  return `${exportName}${toPascal(suffix)}Props`
}

function entryMethodsOf(entry, featureId) {
  return entry.features?.[featureId]?.methods ?? []
}

function typePropName(name) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name)
}

const OPEN_BRACKETS = '<[({'
const CLOSE_BRACKETS = '>])}'

export function normalizePropType(type) {
  const parts = []
  let current = ''
  let depth = 0
  let previous = ''

  for (const char of String(type)) {
    // `=>` 里的右尖括号不是闭合括号：把它算进 depth 会让计数穿到负数，
    // 箭头函数之后的顶层联合就被并进返回类型（见 REQUIREMENTS.md F-28）
    if (char === '>' && previous === '=') {
      previous = ''
      current += char
      continue
    }
    previous = char

    if (OPEN_BRACKETS.includes(char)) {
      depth += 1
    } else if (CLOSE_BRACKETS.includes(char)) {
      depth -= 1
    }
    if (char === '|' && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += char
  }
  parts.push(current)

  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (part.includes('=>') && !(part.startsWith('(') && part.endsWith(')')) ? `(${part})` : part))
    .join(' | ')
}

function generateTypes(registry, selection) {
  const items = selectedExports(registry, selection)
  const allTypes = []

  for (const item of items) {
    const { export: entry } = item
    allTypes.push(...entry.coreProps.map((prop) => prop.type))
    for (const featureId of item.featureIds) {
      allTypes.push(...(entry.features[featureId].props ?? []).map((prop) => prop.type))
    }
  }

  const usesComponent = allTypes.some((type) => /\bComponent\b/.test(type))
  const usesSlots = items.some((item) => (item.export.slots ?? []).length > 0)
  const iconSelected = 'icon' in selection
  const vueTypeImports = [
    'ComponentOptionsMixin',
    ...(usesComponent || iconSelected ? ['Component'] : []),
    'ComponentPublicInstance',
    'DefineComponent',
    ...(usesSlots ? ['VNode'] : [])
  ]
  const lines = [`import type { ${vueTypeImports.join(', ')} } from 'vue'`, '']

  // 与 generateEntry 同步：同组件多导出共享特性时只记一次，避免 d.ts 元组出现重复 id
  const activeFeatures = [...new Set(items.flatMap((item) => item.featureIds))]
  const activeComponents = Object.keys(selection)

  for (const item of items) {
    const { export: entry } = item
    const seen = new Set()

    lines.push(`export interface ${entry.name}CoreProps {`)
    for (const prop of entry.coreProps) {
      if (seen.has(prop.name)) {
        throw new Error(`属性重名: ${entry.name}.${prop.name}`)
      }
      seen.add(prop.name)
      lines.push(`  ${typePropName(prop.name)}?: ${normalizePropType(prop.type)}`)
    }
    lines.push('}')
    lines.push('')

    const intersections = [`${entry.name}CoreProps`]
    for (const featureId of item.featureIds) {
      const feature = entry.features[featureId]
      const typeName = featureTypeName(entry.name, featureId)
      intersections.push(typeName)
      lines.push(`/** ${feature.title}（${featureId}） */`)
      lines.push(`export interface ${typeName} {`)
      for (const prop of feature.props ?? []) {
        if (seen.has(prop.name)) {
          throw new Error(`属性重名: ${entry.name}.${prop.name}`)
        }
        seen.add(prop.name)
        lines.push(`  ${typePropName(prop.name)}?: ${normalizePropType(prop.type)}`)
      }
      lines.push('}')
      lines.push('')
    }

    lines.push(`export type ${entry.name}Props = ${intersections.join(' & ')}`)
    lines.push('')

    const slots = entry.slots ?? []
    if (slots.length) {
      // Vue slots 接口惯例：无作用域 `(): VNode[]`，有作用域带 props 形参；
      // scope 的键是作用域属性名、值是 TS 类型串（与 coreProps 的 type 同源）
      lines.push(`export interface ${entry.name}Slots {`)
      for (const slot of slots) {
        if (slot.description) {
          lines.push(`  /** ${slot.description} */`)
        }
        const scopeProps = Object.entries(slot.scope ?? {})
        const signature = scopeProps.length
          ? `(props: { ${scopeProps.map(([key, type]) => `${typePropName(key)}: ${normalizePropType(type)}`).join('; ')} }): VNode[]`
          : '(): VNode[]'
        lines.push(`  ${typePropName(slot.name)}${signature}`)
      }
      lines.push('}')
      lines.push('')
    }

    const methods = []
    const methodNames = new Set()
    for (const featureId of item.featureIds) {
      for (const method of entryMethodsOf(entry, featureId)) {
        if (methodNames.has(method.name)) {
          continue
        }
        methodNames.add(method.name)
        methods.push(method)
      }
    }

    if (methods.length) {
      lines.push(`export type ${entry.name}Methods = {`)
      for (const method of methods) {
        if (method.description) {
          lines.push(`  /** ${method.description} */`)
        }
        lines.push(`  ${typePropName(method.name)}: ${method.signature}`)
      }
      lines.push('}')
      lines.push('')
      lines.push(
        `export type ${entry.name}Instance = ComponentPublicInstance<${entry.name}Props, {}, {}, {}, ${entry.name}Methods>`
      )
      lines.push('')
      lines.push(
        `export declare const ${entry.name}: DefineComponent<${entry.name}Props, {}, {}, {}, ${entry.name}Methods, ComponentOptionsMixin, ComponentOptionsMixin, string[]> & { new (): ${entry.name}Instance }`
      )
    } else {
      lines.push(`export type ${entry.name}Instance = ComponentPublicInstance<${entry.name}Props>`)
      lines.push('')
      lines.push(
        `export declare const ${entry.name}: DefineComponent<${entry.name}Props, {}, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, string[]>`
      )
    }
    lines.push('')
  }

  lines.push(
    `export declare const activeComponents: readonly [${activeComponents.map((id) => JSON.stringify(id)).join(', ')}]`
  )
  lines.push(
    `export declare const activeFeatures: readonly [${activeFeatures.map((id) => JSON.stringify(id)).join(', ')}]`
  )
  lines.push('')

  if (iconSelected) {
    const iconNames = readIconRegistryNames()
    lines.push(
      `export type UiIconName = ${iconNames.length ? iconNames.map((name) => JSON.stringify(name)).join(' | ') : 'string'}`
    )
    lines.push('')
    lines.push('export declare const UI_ICONS: Record<UiIconName, Component>')
    lines.push('export declare function registerIcon(name: string, icon: Component): void')
    lines.push('export declare function unregisterIcon(name: string): void')
    lines.push(
      'export declare function resolveIcon(icon: Component | string | null | undefined): Component | undefined'
    )
    lines.push('export declare const DEFAULT_ICON_SIZE: string')
    lines.push('export declare const DEFAULT_ICON_STROKE_WIDTH: number')
    lines.push('')
  }

  return lines.join('\n')
}

function readFileStats(dir, file) {
  const content = fs.readFileSync(path.join(dir, file))
  return {
    file,
    bytes: content.length,
    gzipBytes: zlib.gzipSync(content, { level: 9 }).length
  }
}

export async function buildProfile({
  selection: rawSelection,
  components,
  features = [],
  name = 'custom',
  prefix = 'ui',
  theme = {},
  minify = true,
  logLevel = 'error',
  outDir: customOutDir
} = {}) {
  const registry = await loadRegistry()
  const profileName = sanitizeName(name)
  const profilePrefix = sanitizePrefix(prefix)
  const selection = resolveConfigSelection(registry, {
    components: rawSelection ?? components,
    features
  })
  // 试算等临时构建写到自定义目录，避免被当成可安装的包列进 /api/packages
  const outDir = customOutDir ? path.resolve(rootDir, customOutDir) : path.join(rootDir, 'dist', profileName)
  const entryFile = path.join(rootDir, '.build', profileName, 'entry.ts')

  const { items, activeFeatures, activeComponents } = generateEntry(entryFile, registry, selection)

  // slot 契约随产物走（A21）：meta.json 带上选中导出的 slots 声明，
  // 下游 demo API 表与契约用例都以它对齐 dist，不回头读 spec.mjs
  const slotsMeta = {}
  for (const item of items) {
    const slots = item.export.slots ?? []
    if (!slots.length) {
      continue
    }
    slotsMeta[item.componentId] ??= {}
    slotsMeta[item.componentId][item.export.name] = slots
  }

  await build({
    configFile: false,
    root: rootDir,
    logLevel,
    build: {
      outDir,
      emptyOutDir: true,
      minify,
      lib: {
        entry: entryFile,
        formats: ['es'],
        fileName: () => 'ui-kit.js',
        cssFileName: 'ui-kit'
      },
      rollupOptions: {
        external: ['vue']
      }
    }
  })

  const outputFiles = fs
    .readdirSync(outDir)
    .filter((file) => file.endsWith('.js') || file.endsWith('.css'))
    .sort((left, right) => Number(right.endsWith('.js')) - Number(left.endsWith('.js')))

  for (const file of outputFiles) {
    const target = path.join(outDir, file)
    fs.writeFileSync(target, rewritePrefix(fs.readFileSync(target, 'utf8'), profilePrefix), 'utf8')
  }

  const cssFile = outputFiles.find((file) => file.endsWith('.css'))
  const themeCss = buildThemeCss(theme, profilePrefix, activeComponents)
  if (cssFile && themeCss) {
    fs.appendFileSync(path.join(outDir, cssFile), rewritePrefix(themeCss, profilePrefix), 'utf8')
  }
  if (cssFile) {
    const cssPath = path.join(outDir, cssFile)
    const unselectedRefs = collectUnselectedTokenRefs(registry, selection, profilePrefix)
    fs.writeFileSync(cssPath, pruneUnusedThemeVars(fs.readFileSync(cssPath, 'utf8'), unselectedRefs), 'utf8')
  }

  const files = outputFiles.map((file) => readFileStats(outDir, file))
  const jsBytes = files.filter((item) => item.file.endsWith('.js')).reduce((total, item) => total + item.bytes, 0)
  const cssBytes = files.filter((item) => item.file.endsWith('.css')).reduce((total, item) => total + item.bytes, 0)

  const allContent = Buffer.concat(outputFiles.map((file) => fs.readFileSync(path.join(outDir, file))))
  const totalBytes = allContent.length
  const gzipBytes = zlib.gzipSync(allContent, { level: 9 }).length

  fs.writeFileSync(path.join(outDir, 'index.d.ts'), generateTypes(registry, selection), 'utf8')

  const packageJson = {
    name: `${registry.name}-${profileName}`,
    version: registry.version,
    license: rootPackage.license,
    engines: rootPackage.engines,
    type: 'module',
    main: './ui-kit.js',
    module: './ui-kit.js',
    types: './index.d.ts',
    exports: {
      '.': {
        types: './index.d.ts',
        import: './ui-kit.js'
      },
      ...(cssFile ? { './style.css': `./${cssFile}` } : {})
    },
    peerDependencies: {
      vue: '^3.5.0'
    },
    sideEffects: ['*.css'],
    uiKit: {
      base: registry.name,
      profile: profileName,
      prefix: profilePrefix,
      components: selection,
      features: activeFeatures
    }
  }

  fs.writeFileSync(path.join(outDir, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8')

  const result = {
    name: profileName,
    dir: path.relative(rootDir, outDir).replace(/\\/g, '/'),
    prefix: profilePrefix,
    components: activeComponents,
    selection,
    features: activeFeatures,
    ...(Object.keys(slotsMeta).length ? { slots: slotsMeta } : {}),
    files,
    jsBytes,
    cssBytes,
    totalBytes,
    gzipBytes
  }

  fs.writeFileSync(path.join(outDir, 'meta.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8')
  return result
}

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith('--')) {
      continue
    }
    const key = token.slice(2)
    const next = argv[index + 1]
    if (next && !next.startsWith('--')) {
      args[key] = next
      index += 1
    } else {
      args[key] = true
    }
  }
  return args
}

function printResult(result) {
  console.log(`\n构建完成: ${result.dir}`)
  console.log(`前缀: ${result.prefix}`)
  console.log(`组件: ${result.components.join(', ') || '无'}`)
  console.log(`特性: ${result.features.length ? result.features.join(', ') : '仅 core'}`)
  for (const file of result.files) {
    console.log(`  ${file.file.padEnd(14)} ${String(file.bytes).padStart(7)} B`)
  }
  console.log(`  合计 ${result.totalBytes} B (gzip ${result.gzipBytes} B)`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  let config = {}
  let name = 'custom'

  if (args.config) {
    const configPath = path.resolve(rootDir, String(args.config))
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    name = config.name ?? name
  } else if (args.features) {
    config.features = String(args.features)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  }

  if (args.name) {
    name = String(args.name)
  }
  if (args.prefix) {
    config.prefix = String(args.prefix)
  }

  const result = await buildProfile({ ...config, name })
  printResult(result)
}

const entryUrl = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (entryUrl === import.meta.url) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
