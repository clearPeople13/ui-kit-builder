import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { mount } from '@vue/test-utils'

export type Profile = {
  name: string
  /** 该产物里所有类名/令牌的前缀，core 与 full 是 ui，主题包各自成品牌 */
  prefix: string
  /** 组件目录名 → 选中的特性 id 列表 */
  components: Record<string, string[]>
  module: Record<string, any>
  css: string
}

const distDir = `${resolve(process.cwd(), 'dist')}/`

const cache = new Map<string, Promise<Profile>>()

export function profileNames(): string[] {
  return readdirSync(distDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(`${distDir}${entry.name}/ui-kit.js`))
    .map((entry) => entry.name)
    .sort()
}

export function loadProfile(name: string): Promise<Profile> {
  const hit = cache.get(name)
  if (hit) {
    return hit
  }
  const task = (async () => {
    const pkg = JSON.parse(readFileSync(`${distDir}${name}/package.json`, 'utf8')) as {
      uiKit?: { prefix: string; components: Record<string, string[]> }
    }
    const module = (await import(/* @vite-ignore */ pathToFileURL(`${distDir}${name}/ui-kit.js`).href)) as Record<
      string,
      any
    >
    return {
      name,
      prefix: pkg.uiKit?.prefix ?? 'ui',
      components: pkg.uiKit?.components ?? {},
      module,
      css: readFileSync(`${distDir}${name}/ui-kit.css`, 'utf8')
    } satisfies Profile
  })()
  cache.set(name, task)
  return task
}

/** 组件导出判定：函数式组件或有 render/setup 的对象，其余（工具函数、常量、符号）不参与挂载 */
export function componentExports(profile: Profile): Array<[string, any]> {
  return Object.entries(profile.module).filter(([, value]) => {
    if (typeof value === 'function') {
      return true
    }
    return (
      Boolean(value) && typeof value === 'object' && ('render' in value || 'setup' in value || '__vccOpts' in value)
    )
  })
}

/**
 * 空属性挂载时 Vue 必然要抱怨"缺 required prop"，这类抱怨与裁剪无关，
 * 单独归一桶；剩下的告警才是"这份产物装不上/跑不起来"的证据。
 */
const EXPECTED_WITH_EMPTY_PROPS = [
  'Missing required prop',
  'Invalid prop:',
  'Failed to resolve component',
  'Slot "default" invoked outside',
  'Extraneous non-emits event listeners',
  'Non-function value encountered for default slot',
  'Runtime directive used on component'
]

export type MountSweep = {
  /** 挂载成功且渲染出真实节点的导出名 */
  mounted: string[]
  /** 挂载成功但只渲染注释占位（浮层未展开、抽象节点）的导出名 */
  empty: string[]
  /** 抛异常的导出名 → 错误信息 */
  failed: Record<string, string>
  /** 不能归入"预期抱怨"的控制台输出 */
  noise: string[]
  /** 抛了 required prop 之类预期告警的导出名，供人工核对阈值 */
  expectedWarnings: string[]
  html: Record<string, string>
}

/** 按导出名给一份能挂起来的空属性，减少纯噪声 */
function propsFor(name: string): Record<string, unknown> {
  if (
    /^(Table|TableColumn|Tree|TreeV2|Cascader|CascaderPanel|Transfer|Select|SelectV2|VirtualList|Timeline)$/.test(name)
  ) {
    return { data: [] }
  }
  if (/^(TableColumn|TreeV2)/.test(name)) {
    return { data: [] }
  }
  if (/Input|Select|Checkbox|Radio|Switch|Slider|Rate|Upload|TimePicker|DatePicker|ColorPicker/.test(name)) {
    return { modelValue: '' }
  }
  return {}
}

export function sweepMount(profile: Profile): MountSweep {
  const sweep: MountSweep = {
    mounted: [],
    empty: [],
    failed: {},
    noise: [],
    expectedWarnings: [],
    html: {}
  }
  const warnings: string[] = []
  const warn = console.warn
  const error = console.error
  console.warn = (...args: unknown[]) => void warnings.push(`[warn] ${args.map(String).join(' ')}`)
  console.error = (...args: unknown[]) => void warnings.push(`[error] ${args.map(String).join(' ')}`)

  for (const [name, component] of componentExports(profile)) {
    let wrapper: Awaited<ReturnType<typeof mount>> | null = null
    try {
      wrapper = mount(component, { props: propsFor(name) })
      const html = wrapper.html()
      sweep.html[name] = html
      // 未展开的浮层与纯抽象节点渲染成注释占位，属于正常结果，不是没挂上
      if (html.includes(`<${profile.prefix}-`) || html.includes('<ui-') || /<[a-z]+[^>]*class="/.test(html)) {
        sweep.mounted.push(name)
      } else {
        sweep.empty.push(name)
      }
    } catch (caught) {
      sweep.failed[name] = caught instanceof Error ? `${caught.name}: ${caught.message}` : String(caught)
    } finally {
      try {
        wrapper?.unmount()
      } catch {
        // 卸载阶段的异常由上面的挂载结果承担，这里不再二次抛出掩盖首因
      }
    }
  }

  console.warn = warn
  console.error = error

  for (const line of warnings) {
    if (EXPECTED_WITH_EMPTY_PROPS.some((pattern) => line.includes(pattern))) {
      const hit = componentExports(profile).find(([name]) => line.includes(name))
      if (hit) {
        sweep.expectedWarnings.push(hit[0])
      }
      continue
    }
    sweep.noise.push(line)
  }
  sweep.expectedWarnings = [...new Set(sweep.expectedWarnings)]
  return sweep
}

/** 把品牌前缀统一换成 ui，用于跨 profile 比对同一份结构 */
export function normalizePrefix(input: string, prefix: string): string {
  return prefix === 'ui' ? input : input.split(`${prefix}-`).join('ui-')
}

/** 只保留标签名与类名序列的骨架：属性值、文本内容一律丢弃，比对的是结构不是内容 */
export function skeleton(html: string, prefix: string): string {
  const tags = [...html.matchAll(/<([a-zA-Z][\w-]*)([^>]*)>/g)].map((match) => {
    const classes = /class="([^"]*)"/.exec(match[2])?.[1] ?? ''
    // 先换前缀再排序：否则 antd-switch 与 ui-switch 会因首字母不同排到不同位置，
    // 比出来的"结构漂移"其实只是类名顺序
    const tokens = classes
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => normalizePrefix(token, prefix))
      .sort()
      .join('.')
    return `<${match[1]}${tokens ? `.${tokens}` : ''}>`
  })
  return tags.join('')
}

/**
 * 从骨架里取出全部类名 token（原样，不带前缀归一），用于校验样式没有被裁掉。
 * 前缀归一必须由调用方显式决定，否则品牌产物里的 antd-switch 会被洗成 ui-switch，
 * "前缀隔离"这条断言就永远查不出问题。
 */
export function classTokens(html: string): string[] {
  const found = new Set<string>()
  for (const match of html.matchAll(/class="([^"]*)"/g)) {
    for (const token of match[1].split(/\s+/)) {
      if (token) {
        found.add(token)
      }
    }
  }
  return [...found].sort()
}
