import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const srcDir = path.join(rootDir, 'packages/ui-kit/src')

// 只认「组件根类上的声明」：主题覆盖最后会写成 .ui-<组件>{--ui-<组件>-*}，
// 复合选择器（.ui-button.is-primary 等）写进去也不会命中，列出来只会误导
const RULE_RE = /([^{}]+)\{([^{}]*)\}/g
const DECL_RE = /(--ui-[a-z0-9-]+)\s*:\s*([^;]+)/g
const CLASS_RE = /^\.ui-([a-z0-9-]+)$/
// 组件每帧都会用 props 覆写的变量：主题里配了也会被内联样式盖掉，不能当主题开关列出来
const RUNTIME_OWNED = new Set([
  '--ui-popper-arrow-offset',
  '--ui-divider-border-style',
  '--ui-form-label-width',
  // 点击水波：动画/JS 每帧驱动，主题里配了也会被盖掉
  '--ui-button-wave-r',
  '--ui-button-wave-origin-x',
  '--ui-button-wave-origin-y'
])
const COLOR_RE = /^(#[0-9a-f]{3,8}|(rgb|hsl)a?\()/i
const VAR_REF_RE = /var\(\s*(--ui-[a-z0-9-]+)/g
const IMPORT_RE = /@import\s+['"]([^'"]+)['"]/g

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

function walkCssFiles(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkCssFiles(target))
    } else if (entry.name.endsWith('.css')) {
      files.push(target)
    }
  }
  return files
}

function cssFiles() {
  const files = []
  const sharedDir = path.join(srcDir, 'shared')
  for (const entry of fs.readdirSync(sharedDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.css')) {
      files.push({ file: path.join(sharedDir, entry.name), owner: 'shared' })
    }
  }
  const componentsDir = path.join(srcDir, 'components')
  for (const entry of fs.readdirSync(componentsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }
    const dir = path.join(componentsDir, entry.name)
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith('.css')) {
        files.push({ file: path.join(dir, file), owner: entry.name })
      }
    }
  }
  return files
}

// var(--x, fallback) 的 fallback 可能自带括号（嵌套 var），按括号配对取完
function fallbackUsages(css) {
  const usages = []
  let index = css.indexOf('var(--ui-')
  while (index >= 0) {
    const start = index + 4
    let depth = 1
    let cursor = start
    while (cursor < css.length && depth > 0) {
      if (css[cursor] === '(') {
        depth += 1
      }
      else if (css[cursor] === ')') {
        depth -= 1
      }
      cursor += 1
    }
    const body = css.slice(start, cursor - 1)
    const comma = body.indexOf(',')
    if (comma > 0) {
      usages.push({ name: body.slice(0, comma).trim(), value: body.slice(comma + 1).trim() })
    }
    index = css.indexOf('var(--ui-', cursor)
  }
  return usages
}

function kindOf(value) {
  return COLOR_RE.test(value) ? 'color' : 'value'
}

export function loadThemeTokens() {
  const global = []
  const components = {}
  const seen = new Set()

  function push(list, token) {
    if (seen.has(token.var) || RUNTIME_OWNED.has(token.var)) {
      return
    }
    seen.add(token.var)
    list.push(token)
  }

  const files = cssFiles()
  const contents = new Map()
  function readCss(file) {
    if (!contents.has(file)) {
      contents.set(file, stripComments(fs.readFileSync(file, 'utf8')))
    }
    return contents.get(file)
  }

  // 记录每个全局令牌被哪些组件消费：面板只展示「已选组件会用到的」变量。
  // 共享 CSS 按 @import 归属到引入它的组件；theme.css 由 component.ts 直接引入，任何包都会带上，不归属单一组件。
  const sharedDir = path.join(srcDir, 'shared')
  const sharedFiles = new Set(files.filter((item) => item.owner === 'shared').map((item) => item.file))
  const componentFiles = []
  const componentsDir = path.join(srcDir, 'components')
  for (const entry of fs.readdirSync(componentsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }
    for (const file of walkCssFiles(path.join(componentsDir, entry.name))) {
      componentFiles.push({ file, owner: entry.name })
    }
  }
  const sharedImporters = new Map()
  for (const { file, owner } of componentFiles) {
    for (const match of readCss(file).matchAll(IMPORT_RE)) {
      const target = path.resolve(path.dirname(file), match[1])
      if (!sharedFiles.has(target)) {
        continue
      }
      const set = sharedImporters.get(target) ?? new Set()
      set.add(owner)
      sharedImporters.set(target, set)
    }
  }
  // theme.css 由 component.ts 直接引入，任何包都会带上；非 :root 规则里用到的变量始终有效
  const alwaysRefs = new Set()
  const themeCss = stripComments(fs.readFileSync(path.join(sharedDir, 'theme.css'), 'utf8'))
  for (const match of themeCss.replace(/:root\s*\{[^{}]*\}/g, '').matchAll(VAR_REF_RE)) {
    alwaysRefs.add(match[1])
  }
  const tokenOwners = new Map()
  function recordOwners(css, owners) {
    if (!owners.size) {
      return
    }
    for (const match of css.matchAll(VAR_REF_RE)) {
      const set = tokenOwners.get(match[1]) ?? new Set()
      for (const id of owners) {
        set.add(id)
      }
      tokenOwners.set(match[1], set)
    }
  }
  for (const { file, owner } of componentFiles) {
    recordOwners(readCss(file), new Set([owner]))
  }
  for (const { file } of files) {
    if (sharedFiles.has(file)) {
      recordOwners(readCss(file), sharedImporters.get(file) ?? new Set())
    }
  }

  for (const { file, owner } of files) {
    const css = readCss(file)
    RULE_RE.lastIndex = 0
    let rule
    while ((rule = RULE_RE.exec(css))) {
      const selectors = rule[1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      const declarations = [...rule[2].matchAll(DECL_RE)]
      if (!declarations.length) {
        continue
      }
      for (const rawSelector of selectors) {
        if (rawSelector === ':root') {
          for (const [, name, rawValue] of declarations) {
            const value = rawValue.trim()
            push(global, {
              var: name,
              token: name.slice('--ui-'.length),
              value,
              kind: kindOf(value),
              source: 'declared'
            })
          }
          continue
        }
        const classMatch = CLASS_RE.exec(rawSelector)
        if (!classMatch) {
          continue
        }
        const scope = classMatch[1]
        const scopePrefix = `--ui-${scope}-`
        const bucket = (components[scope] ??= [])
        for (const [, name, rawValue] of declarations) {
          if (!name.startsWith(scopePrefix)) {
            continue
          }
          const value = rawValue.trim()
          push(bucket, {
            var: name,
            token: name.slice(scopePrefix.length),
            value,
            kind: kindOf(value),
            source: 'declared'
          })
        }
        if (!bucket.length) {
          delete components[scope]
        }
      }
    }

    if (owner === 'shared') {
      continue
    }
    // 组件根类上没声明、但组件 CSS 里带 fallback 读取的变量：设在组件根上能靠继承生效，同样算可配置项
    const prefix = `--ui-${owner}-`
    for (const usage of fallbackUsages(css)) {
      if (!usage.name.startsWith(prefix)) {
        continue
      }
      const bucket = (components[owner] ??= [])
      push(bucket, {
        var: usage.name,
        token: usage.name.slice(prefix.length),
        value: usage.value,
        kind: kindOf(usage.value),
        source: 'fallback'
      })
    }
    if (!components[owner]?.length) {
      delete components[owner]
    }
  }

  for (const token of global) {
    token.owners = [...(tokenOwners.get(token.var) ?? [])].sort()
    token.always = alwaysRefs.has(token.var)
  }
  global.sort((left, right) => left.var.localeCompare(right.var))
  const sortedComponents = {}
  for (const key of Object.keys(components).sort()) {
    sortedComponents[key] = components[key].sort((left, right) => left.var.localeCompare(right.var))
  }
  return { global, components: sortedComponents }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const tokens = loadThemeTokens()
  console.log(`global: ${tokens.global.length}`)
  let total = 0
  for (const [scope, list] of Object.entries(tokens.components)) {
    total += list.length
    console.log(`${scope}: ${list.length} → ${list.map((item) => `${item.token}${item.source === 'fallback' ? '*' : ''}`).join(', ')}`)
  }
  console.log(`component total: ${total}`)
}
