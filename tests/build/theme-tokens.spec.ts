import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  allBundles,
  bundleOf,
  effectiveRootTokens,
  localize,
  parseTokens,
  profileNames,
  readText,
  repoRoot
} from './_helpers'

/**
 * 主题令牌契约：
 * 1. profile 里声明的每个令牌，都以自己的前缀原样出现在产物 CSS 里（不被静默丢弃）
 * 2. 皮肤只改写 core 认识的令牌，不发明新令牌
 * 3. 令牌名语法统一，未选中组件的私有令牌会被 pruning 掉
 * 4. 20 份 profile 的生效令牌表各有一份指纹，改值必须显式更新快照
 */

const coreTable = effectiveRootTokens(parseTokens(bundleOf('core')), 'ui')

/** 与 scripts/build-lib.mjs 的 toThemeToken / toThemeValue 保持一致 */
function toToken(key: string) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function toValue(raw: unknown) {
  if (typeof raw === 'number') {
    return String(raw)
  }
  if (typeof raw !== 'string') {
    return ''
  }
  const trimmed = raw.trim()
  return /[;{}]/.test(trimmed) ? '' : trimmed
}

function hasDeclaration(css: string, name: string, value: string) {
  const needle = `${name}:${value}`
  let from = css.indexOf(needle)
  while (from >= 0) {
    const next = css[from + needle.length]
    if (next === ';' || next === '}') {
      return true
    }
    from = css.indexOf(needle, from + 1)
  }
  return false
}

function themeGroups(config: Record<string, any>) {
  const theme = config.theme ?? {}
  const groups: Array<{ scope: string; componentId?: string; tokens: Record<string, unknown> }> = [
    { scope: 'global', tokens: theme.global ?? theme.tokens ?? {} }
  ]
  for (const [componentId, tokens] of Object.entries(theme.components ?? {})) {
    groups.push({ scope: componentId, componentId, tokens: tokens as Record<string, unknown> })
  }
  return groups
}

describe('令牌落盘', () => {
  it('profile 声明的每个令牌都出现在 CSS 里，且没有任何声明会被构建器丢弃', () => {
    let checked = 0
    for (const bundle of allBundles()) {
      for (const group of themeGroups(bundle.config)) {
        for (const [key, raw] of Object.entries(group.tokens)) {
          const value = toValue(raw)
          expect(value, `${bundle.profile}.${group.scope}.${key} 的值会被构建器静默丢弃`).not.toBe('')
          const name = `--${bundle.prefix}-${group.componentId ? `${toToken(group.componentId)}-` : ''}${toToken(key)}`
          // 值整串也过一遍 rewritePrefix，profile 里写 ui-button-wave-spread，产物里是 antd-button-wave-spread
          expect(
            hasDeclaration(bundle.css, name, localize(value, bundle.prefix)),
            `${bundle.profile} 缺 ${name}（值 ${value}）`
          ).toBe(true)
          checked += 1
        }
      }
    }
    expect(checked).toBeGreaterThan(1500)
  })

  it('驼峰令牌键会被转成短横线变量名', () => {
    const antd = bundleOf('antd')
    const colorPrimary = (antd.config.theme.global as Record<string, unknown>).colorPrimary
    expect(hasDeclaration(antd.css, '--antd-color-primary', String(colorPrimary))).toBe(true)
    expect(antd.css.includes('--antd-colorPrimary')).toBe(false)
  })

  it('皮肤只改写 core 认识的 :root 令牌，不发明新令牌', () => {
    for (const bundle of allBundles()) {
      if (bundle.prefix === 'ui') {
        continue
      }
      for (const [key] of Object.entries(themeGroups(bundle.config)[0].tokens)) {
        expect(coreTable.has(`--*:${toToken(key)}`), `${bundle.profile} 的 ${key} 在 core 里不存在`).toBe(true)
      }
    }
  })

  it('每份主题至少改写 150 个 core 令牌的取值', () => {
    for (const name of profileNames.filter((value) => value !== 'core' && value !== 'full')) {
      const bundle = bundleOf(name)
      const table = effectiveRootTokens(parseTokens(bundle), bundle.prefix)
      let changed = 0
      for (const [key, value] of table) {
        if (coreTable.has(key) && coreTable.get(key) !== value) {
          changed += 1
        }
      }
      expect(changed, `${name} 只改了 ${changed} 个令牌`).toBeGreaterThanOrEqual(150)
    }
  })

  it('core 与 full 的令牌表完全相同（同前缀且无皮肤）', () => {
    const full = effectiveRootTokens(parseTokens(bundleOf('full')), 'ui')
    expect([...full.entries()].sort()).toEqual([...coreTable.entries()].sort())
  })
})

describe('令牌结构', () => {
  it('令牌名一律是 --前缀-小写短横线，值里不含花括号', () => {
    for (const bundle of allBundles()) {
      const table = parseTokens(bundle)
      expect(table.root.length, `${bundle.profile} :root 令牌数`).toBeGreaterThan(400)
      for (const [name, value] of table.root) {
        expect(name, `${bundle.profile} 令牌名 ${name}`).toMatch(new RegExp(`^--${bundle.prefix}-[a-z0-9][a-z0-9-]*$`))
        expect(value).not.toMatch(/[{}]/)
      }
    }
  })

  it('组件级皮肤块真的落到 .前缀-组件{} 上，且令牌名带组件段', () => {
    for (const bundle of allBundles()) {
      for (const group of themeGroups(bundle.config)) {
        if (!group.componentId) {
          continue
        }
        const selector = `.${bundle.prefix}-${toToken(group.componentId)}{`
        expect(bundle.css.includes(selector), `${bundle.profile} 缺 ${selector}`).toBe(true)
        const block = [
          ...bundle.css.matchAll(new RegExp(`\\.${bundle.prefix}-${toToken(group.componentId)}\\{([^{}]*)\\}`, 'g'))
        ]
        const tokens: string[] = []
        for (const match of block) {
          for (const part of match[1].split(';')) {
            const name = part.split(':')[0].trim()
            if (name.startsWith('--')) {
              tokens.push(name)
            }
          }
        }
        expect(tokens.length, `${bundle.profile} ${selector} 内没有令牌`).toBeGreaterThan(0)
        for (const name of tokens) {
          expect(name).toMatch(new RegExp(`^--${bundle.prefix}-${toToken(group.componentId)}-`))
        }
      }
    }
  })
})

describe('未选中组件的令牌裁剪', () => {
  const probeDir = '.tmp/prune-probe'
  let css = ''

  beforeAll(async () => {
    const { buildProfile } = (await import('../../scripts/build-lib.mjs')) as {
      buildProfile: (config: any) => Promise<any>
    }
    await buildProfile({
      name: 'prune-probe',
      prefix: 'ui',
      components: { button: [], input: [] },
      outDir: probeDir,
      logLevel: 'silent'
    })
    css = fs.readFileSync(path.join(repoRoot, probeDir, 'ui-kit.css'), 'utf8')
  })

  afterAll(() => {
    fs.rmSync(path.join(repoRoot, probeDir), { recursive: true, force: true })
    fs.rmSync(path.join(repoRoot, '.build', 'prune-probe'), { recursive: true, force: true })
  })

  it('只有 button/input 用到的令牌留在包里', () => {
    expect(css).not.toBe('')
    expect(css.includes('--ui-button-height')).toBe(true)
    expect(css.includes('.ui-button')).toBe(true)
    expect(css.includes('.ui-input')).toBe(true)
  })

  it('dialog 的私有令牌与样式被裁掉', () => {
    // dialog 组件 CSS 里消费的令牌；没进包时这些消费点也一起消失，声明就成了孤儿
    const own = readText('packages/ui-kit/src/components/dialog/core.css')
    const names = [...new Set([...own.matchAll(/var\(\s*(--ui-dialog-[a-z0-9-]+)/g)].map((match) => match[1]))]
    expect(names.length).toBeGreaterThan(0)

    // 只有"唯一消费者是 dialog"的才算裁剪证据：选中组件与共享样式若也引用，就得留在包里
    const stillReferenced = [
      readText('packages/ui-kit/src/components/button/core.css'),
      readText('packages/ui-kit/src/components/input/core.css'),
      ...fs
        .readdirSync(path.join(repoRoot, 'packages/ui-kit/src/shared'))
        .filter((file) => file.endsWith('.css'))
        .map((file) => readText(`packages/ui-kit/src/shared/${file}`))
    ]
      .join('\n')
      .replace(/\s/g, '')
    const prunable = names.filter((name) => !stillReferenced.includes(`var(${name}`))
    expect(prunable.length, '没有可供裁剪验证的 dialog 私有令牌，用例失去意义').toBeGreaterThan(0)

    // dialog 的组件 CSS 没进包，其私有令牌也没有别的消费者，pruning 必须把它们删掉
    for (const name of prunable) {
      expect(css.includes(name), `产物里仍有 ${name}`).toBe(false)
    }
    expect(css.includes('.ui-dialog__')).toBe(false)
  })
})

describe('令牌指纹', () => {
  it('20 份 profile 的生效令牌表指纹（core 与 full 同指纹）', () => {
    const fingerprints: Record<string, string> = {}
    for (const bundle of allBundles()) {
      const table = [...effectiveRootTokens(parseTokens(bundle), bundle.prefix).entries()].sort()
      const digest = crypto.createHash('sha1').update(JSON.stringify(table)).digest('hex').slice(0, 12)
      fingerprints[bundle.profile] = `${digest} ×${table.length}`
    }
    expect(fingerprints).toMatchSnapshot()
    expect(new Set(Object.values(fingerprints)).size).toBe(profileNames.length - 1)
  })
})
