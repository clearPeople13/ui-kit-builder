import { beforeAll, describe, expect, it } from 'vitest'
import {
  classTokens,
  componentExports,
  loadProfile,
  profileNames,
  skeleton,
  sweepMount,
  type MountSweep,
  type Profile
} from './_load'

/**
 * 结构比对样本：每份 profile 都带着、渲染只依赖自身属性的小组件。
 * 比对的是"标签 + 类名骨架"，属性值与文案不参与。
 */
const STRUCTURE_SAMPLES = ['Switch', 'Badge', 'Alert', 'Tag', 'Card']

const profiles = profileNames()
let full: Profile
let fullSweep: MountSweep

/**
 * 已知"发出类名但没有任何样式规则"的死类名。与裁剪无关（20 份产物表现一致），
 * 属于源码欠账，记在 REQUIREMENTS.md 的 F-35 / F-36；补上样式后把这份清单清空，
 * 别让用例退化成永远为真。
 */
const DEAD_CLASS_NAMES = ['-countdown__time', '-watermark__layer']

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

describe.each(profiles)('产物 %s 的运行时', (name) => {
  let profile: Profile
  let sweep: MountSweep

  beforeAll(async () => {
    profile = await loadProfile(name)
    full ??= await loadProfile('full')
    fullSweep ??= sweepMount(full)
    sweep = sweepMount(profile)
  })

  it('导出的组件全部挂得起来', () => {
    // 挂载数量本身也要断言：只挂起 3 个组件的"零异常"没有意义
    expect(componentExports(profile).length).toBeGreaterThan(0)
    expect(sweep.failed).toEqual({})
    expect(sweep.mounted.length).toBeGreaterThanOrEqual(Math.min(12, componentExports(profile).length))
  })

  it('挂载过程不产生与裁剪无关的控制台告警', () => {
    expect(sweep.noise.slice(0, 10)).toEqual([])
  })

  it('类名前缀完全隔离，不残留默认前缀', () => {
    const tokens = classTokens(Object.values(sweep.html).join(''))
    expect(tokens.length).toBeGreaterThan(0)
    if (profile.prefix === 'ui') {
      expect(tokens.some((token) => token.startsWith('ui-'))).toBe(true)
      return
    }
    expect(tokens.filter((token) => token.startsWith('ui-'))).toEqual([])
    expect(tokens.some((token) => token.startsWith(`${profile.prefix}-`))).toBe(true)
  })

  it('组件根类名与元素类名在自家 CSS 里有规则', () => {
    const tokens = classTokens(Object.values(sweep.html).join(''))
    // 只查 `前缀-组件` 与 `前缀-组件__元素` 这两类结构性类名：
    // 形如 `前缀-组件--修饰` 的状态修饰类允许没有独立规则（例如 Alert 的默认 effect=light
    // 就是基础规则本身），把它们算进来说明不了裁剪出了问题
    const structural = tokens.filter((token) =>
      new RegExp(`^${profile.prefix}-[a-z][a-z0-9]*(__[a-z0-9]+)?$`).test(token)
    )
    expect(structural.length).toBeGreaterThan(0)
    const missing = structural
      .filter((token) => !profile.css.includes(`.${token}`))
      .filter((token) => !DEAD_CLASS_NAMES.some((name) => token.endsWith(name)))
    expect(missing, `${name} 有 ${missing.length} 个类名没有对应样式，疑似 CSS 被裁丢`).toEqual([])
  })

  it('与 full 产物渲染出的结构一致（裁剪不改结构）', () => {
    const drift: string[] = []
    for (const sample of STRUCTURE_SAMPLES) {
      if (!(sample in sweep.html) || !(sample in fullSweep.html)) {
        continue
      }
      const id = kebab(sample)
      // 特性集不同就不该要求同构：关掉 popper 的 Badge 少一个类名是正确结果，
      // 这条用例要抓的是"特性集一样、DOM 却不一样"
      if (JSON.stringify(profile.components[id]) !== JSON.stringify(full.components[id])) {
        continue
      }
      const mine = skeleton(sweep.html[sample], profile.prefix)
      const reference = skeleton(fullSweep.html[sample], 'ui')
      if (mine !== reference) {
        drift.push(`${sample}\n    本产物: ${mine}\n    full   : ${reference}`)
      }
    }
    expect(drift, `${name} 有 ${drift.length} 个同特性集组件的结构与 full 不一致`).toEqual([])
  })
})

it('全部 profile 都纳入运行时校验', () => {
  expect(profiles.length).toBeGreaterThanOrEqual(20)
  expect(profiles).toContain('full')
  expect(profiles).toContain('core')
})
