import { describe, expect, it } from 'vitest'
import { bundleOf } from './_helpers'

const buildLib = (await import('../../scripts/build-lib.mjs')) as unknown as {
  normalizePropType: (type: string) => string
  readIconRegistryNames: () => string[]
  rewritePrefix: (content: string, prefix: string) => string
  sanitizeName: (name: unknown) => string
  sanitizePrefix: (prefix: unknown) => string
}
const { normalizePropType, readIconRegistryNames, rewritePrefix, sanitizeName, sanitizePrefix } = buildLib

/**
 * 构建器纯函数的契约。
 * 这些函数同时被构建脚本和构建器界面（HTTP 层）使用，
 * 组件用例跑的是产物，碰不到这层逻辑，只能在这里直接盯住。
 */

describe('sanitizeName', () => {
  it('小写、去空格、非法字符换短横线、连续短横线折叠、首尾短横线剥掉', () => {
    expect(sanitizeName('My Theme')).toBe('my-theme')
    expect(sanitizeName('  A--B  ')).toBe('a-b')
    expect(sanitizeName('v2.0/final')).toBe('v2-0-final')
    // 全非 ASCII 时清不成合法目录名，回落到 custom
    expect(sanitizeName('中文名')).toBe('custom')
  })

  it('空值一律回落到 custom，构建器不会因为缺 name 就产出空目录名', () => {
    expect(sanitizeName('')).toBe('custom')
    expect(sanitizeName('!!!')).toBe('custom')
    expect(sanitizeName(undefined)).toBe('custom')
    expect(sanitizeName(null)).toBe('custom')
    expect(sanitizeName(42)).toBe('42')
  })
})

describe('sanitizePrefix', () => {
  it('合法前缀原样规范化，CSS 变量与类名都能直接拼', () => {
    expect(sanitizePrefix('ui')).toBe('ui')
    expect(sanitizePrefix('ACME')).toBe('acme')
    expect(sanitizePrefix('-x-')).toBe('x')
    expect(sanitizePrefix('my_brand')).toBe('my-brand')
  })

  it('空、纯符号、缺省以外的值会抛 400，不会静默退化成 ui', () => {
    for (const bad of ['', '   ', '###', '-']) {
      let error: any
      try {
        sanitizePrefix(bad)
      } catch (caught) {
        error = caught
      }
      expect(error, `sanitizePrefix(${JSON.stringify(bad)}) 应当抛错`).toBeInstanceOf(Error)
      expect(error.message).toBe('prefix 不能为空')
      expect(error.status).toBe(400)
    }
    // 缺省才是 ui
    expect(sanitizePrefix(undefined)).toBe('ui')
    expect(sanitizePrefix(null)).toBe('ui')
  })
})

describe('rewritePrefix', () => {
  it('前缀为 ui 时是恒等变换', () => {
    const css = '.ui-button{--ui-button-height:32px}'
    expect(rewritePrefix(css, 'ui')).toBe(css)
  })

  it('变量名与类名前缀都换掉', () => {
    expect(rewritePrefix('.ui-button{--ui-button-height:32px}', 'acme')).toBe('.acme-button{--acme-button-height:32px}')
    expect(rewritePrefix('animation: ui-button-wave-spread 0.4s ease', 'acme')).toBe(
      'animation: acme-button-wave-spread 0.4s ease'
    )
  })

  it('ui- 出现在词中间或带前缀符号时不动，避免误伤', () => {
    expect(rewritePrefix('data-ui-button:1', 'acme')).toBe('data-ui-button:1')
    expect(rewritePrefix('xui-button', 'acme')).toBe('xui-button')
    expect(rewritePrefix('@ui-button', 'acme')).toBe('@ui-button')
    expect(rewritePrefix('/ui-button', 'acme')).toBe('/ui-button')
    expect(rewritePrefix('-ui-button', 'acme')).toBe('-ui-button')
  })

  it('BEM 修饰段里的 ui- 会跟着换（--ui-x--mod 的变量部分先命中）', () => {
    expect(rewritePrefix('.ui-button--gradient{--ui-button-gradient:1}', 'acme')).toBe(
      '.acme-button--gradient{--acme-button-gradient:1}'
    )
  })

  it('20 份产物的前缀改写与 meta.prefix 一致：产物里不再有裸 ui- 类名或变量', () => {
    for (const name of ['core', 'full', 'antd', 'chinese']) {
      const bundle = bundleOf(name)
      if (bundle.prefix === 'ui') {
        expect(bundle.css).toContain('.ui-button')
        continue
      }
      expect(bundle.css).not.toMatch(/(^|[^a-zA-Z0-9_-])ui-[a-z]/)
      expect(bundle.css).toContain(`.${bundle.prefix}-button`)
    }
  })
})

describe('normalizePropType', () => {
  it('只在顶层拆联合类型，尖括号、方括号、圆括号、花括号里的竖线保持原样', () => {
    expect(normalizePropType('string | number')).toBe('string | number')
    expect(normalizePropType('Record<"a" | "b", string>')).toBe('Record<"a" | "b", string>')
    expect(normalizePropType('Array<"x" | "y">')).toBe('Array<"x" | "y">')
    expect(normalizePropType('("a" | "b")[]')).toBe('("a" | "b")[]')
    expect(normalizePropType("{ type: 'a' | 'b' }")).toBe("{ type: 'a' | 'b' }")
  })

  it('去掉空片段并补齐换行带来的多余空白', () => {
    expect(normalizePropType('string |  | number ')).toBe('string | number')
    expect(normalizePropType(' | string')).toBe('string')
    expect(normalizePropType('')).toBe('')
  })

  it('箭头函数成员统一补外层圆括号，联合里不会歧义', () => {
    expect(normalizePropType('(val: string) => void')).toBe('((val: string) => void)')
    expect(normalizePropType('() => void | string')).toBe('(() => void) | string')
    expect(normalizePropType('string | ((val: number) => void)')).toBe('string | ((val: number) => void)')
  })

  it('F-28：=> 的右尖括号不计入括号深度，箭头函数之后的顶层联合不会被并进返回类型', () => {
    // 修复前 `>` 被当右括号，深度穿到负数，这里会把 any[] 吞进函数返回类型
    expect(normalizePropType('(...args: any[]) => any | any[]')).toBe('((...args: any[]) => any) | any[]')
    expect(normalizePropType('Record<string, any> | ((...args: any[]) => any)')).toBe(
      'Record<string, any> | ((...args: any[]) => any)'
    )
    // 返回类型自带的联合由 spec 自己加括号，规范化后原样保留
    expect(normalizePropType('(value: string) => (boolean | string | undefined)')).toBe(
      '(value: string) => (boolean | string | undefined)'
    )
  })

  it('d.ts 里每一行属性类型都已规范化且幂等', () => {
    const types: string[] = []
    for (const bundle of [bundleOf('core'), bundleOf('full'), bundleOf('antd')]) {
      for (const match of bundle.types.matchAll(/^[ ]{2}(?:"[^"]+"|[A-Za-z_$][\w$]*)\?: (.+)$/gm)) {
        types.push(match[1])
      }
    }
    expect(types.length).toBeGreaterThan(500)
    for (const type of types) {
      expect(normalizePropType(type), `d.ts 里的类型没有被规范化：${type}`).toBe(type)
    }
  })
})

describe('readIconRegistryNames', () => {
  it('从 shared/icons.ts 读出全部图标名，非空且不重复', () => {
    const names = readIconRegistryNames()
    expect(names.length).toBeGreaterThan(0)
    expect(new Set(names).size).toBe(names.length)
    for (const name of names) {
      expect(name).toMatch(/^[A-Za-z_$][\w$]*$/)
    }
  })

  it('d.ts 的 UiIconName 联合类型就是这份名单，逐字对齐', () => {
    const names = readIconRegistryNames()
    const union = bundleOf('full').types.match(/export type UiIconName = ([^\n]*)/)?.[1]
    expect(union, 'full 产物缺 UiIconName').toBeTruthy()
    expect(union!.split(' | ').map((item) => item.trim().replace(/^"|"$/g, ''))).toEqual(names)
  })

  it('运行时 UI_ICONS 的键与名单一致（改图标表不会漏改类型）', async () => {
    const module = (await import('../../dist/full/ui-kit.js')) as { UI_ICONS: Record<string, any> }
    expect(Object.keys(module.UI_ICONS)).toEqual(readIconRegistryNames())
  })
})
