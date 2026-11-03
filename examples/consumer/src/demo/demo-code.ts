import type { PlaygroundControl, PlaygroundEntry } from './playground'
import type { SceneView } from './scenes'

export function kebabCase(name: string): string {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

const RESERVED_IDENTIFIERS = new Set(['ref'])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toJsLiteral(value: unknown): string {
  if (value === undefined) {
    return 'undefined'
  }
  const json = JSON.stringify(value, null, 2)
  if (json === undefined) {
    return 'undefined'
  }
  const ident = /^[A-Za-z_$\u4e00-\u9fff][\w$\u4e00-\u9fff]*$/
  return json
    .replace(/"([^"\\]+)":/g, (_match, key: string) => {
      return ident.test(key) ? `${key}:` : _match
    })
    .replace(/"((?:[^"\\]|\\.)*)"/g, (_match, inner: string) => {
      const unescaped = inner.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      return `'${unescaped.replace(/'/g, "\\'")}'`
    })
}

function formatPrimitiveAttr(name: string, value: unknown, control: PlaygroundControl | undefined): string {
  if (value === undefined || value === null) {
    return ''
  }
  const kebab = kebabCase(name)
  if (typeof value === 'boolean') {
    if (!value) {
      return control && control.defaultValue === true ? `:${kebab}="false"` : ''
    }
    return kebab
  }
  if (typeof value === 'number') {
    return `:${kebab}="${value}"`
  }
  if (typeof value === 'string') {
    return value.includes('"') ? `:${kebab}='${value}'` : `${kebab}="${value}"`
  }
  return ''
}

function uniqueName(base: string, taken: Set<string>): string {
  let name = base
  let index = 2
  while (taken.has(name)) {
    name = `${base}${index}`
    index += 1
  }
  taken.add(name)
  return name
}

export function sceneSourceCode(entry: PlaygroundEntry, scene: SceneView | undefined): string {
  const values = scene?.values ?? {}
  const controlByName = new Map(entry.controls.map((control) => [control.name, control]))

  const hoisted: string[] = []
  const attrs: string[] = []
  const taken = new Set<string>(RESERVED_IDENTIFIERS)
  taken.add(entry.name)

  const names = Object.keys(values).sort((a, b) => {
    if (a === 'modelValue') {
      return -1
    }
    if (b === 'modelValue') {
      return 1
    }
    return 0
  })

  for (const name of names) {
    const value = values[name]
    const control = controlByName.get(name)
    if (name === 'modelValue') {
      if (value === undefined || value === null) {
        continue
      }
      const refName = uniqueName('modelValue', taken)
      hoisted.push(`const ${refName} = ref(${toJsLiteral(value)})`)
      attrs.push(`v-model="${refName}"`)
      continue
    }
    if (Array.isArray(value) || isPlainObject(value)) {
      if (!/^[A-Za-z_$\u4e00-\u9fff][\w$\u4e00-\u9fff]*$/.test(name)) {
        continue
      }
      const refName = uniqueName(name, taken)
      hoisted.push(`const ${refName} = ref(${toJsLiteral(value)})`)
      attrs.push(`:${kebabCase(name)}="${refName}"`)
      continue
    }
    const attr = formatPrimitiveAttr(name, value, control)
    if (attr) {
      attrs.push(attr)
    }
  }

  const single = `<${entry.name}${attrs.length ? ` ${attrs.join(' ')}` : ''} />`
  let usage: string
  if (!attrs.length) {
    usage = single
  } else if (single.length <= 88) {
    usage = single
  } else {
    usage = `<${entry.name}\n${attrs.map((attr) => `  ${attr}`).join('\n')}\n/>`
  }

  const script: string[] = []
  if (hoisted.length) {
    script.push("import { ref } from 'vue'")
  }
  script.push(`import { ${entry.name} } from '@demo/ui-kit'`)
  if (hoisted.length) {
    script.push('')
    script.push(...hoisted)
  }

  return [
    '<script setup>',
    ...script,
    '</' + 'script>',
    '',
    '<template>',
    `  ${usage.replaceAll('\n', '\n  ')}`,
    '</template>',
    ''
  ].join('\n')
}
