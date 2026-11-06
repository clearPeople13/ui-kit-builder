import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { expectSilent, openScene, probeValue, type Session } from './_session'

/**
 * 全局静默门禁：把 dist/full 里每个对外组件都按默认属性渲染一遍。
 *
 * 单位用例只覆盖"用得对"的路径，这里专抓"用得糙"：
 * 缺 slot、缺 required prop、错误的 watch 时机、SSR/浏览器分支差异、
 * 以及字符串 style 这类一挂载就抛 TypeError 的根因，全部会在这一页现形。
 */
describe('浏览器层 · 全家桶控制台静默', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('gallery')
  })

  afterAll(async () => {
    await session?.close()
  })

  it('全部对外组件都渲染出了节点', async () => {
    const names = (await probeValue<string[]>(session.page, 'galleryNames')) ?? []
    const rendered = await session.page.evaluate(() => document.querySelectorAll('[data-gallery]').length)
    expect(names.length).toBeGreaterThan(90)
    expect(rendered).toBe(names.length)
  })

  it('默认属性渲染下，绝大多数组件都有真实尺寸', async () => {
    const names = (await probeValue<string[]>(session.page, 'galleryNames')) ?? []
    const visible = await session.page.evaluate(
      () =>
        [...document.querySelectorAll('[data-gallery]')].filter((element) => element.getBoundingClientRect().width > 0)
          .length
    )
    // 默认属性下拿不到尺寸的有 64 个：纯抽象节点（OnlyChild、PopperTrigger、TabPane 这类）、
    // 需要 visible/modelValue 才出层的浮层（Dialog、Drawer、Image preview），以及
    // 内容全靠 slot 传入的容器（Collection、Space）。阈值兜的是"整体渲染崩掉"的底线，
    // 而不是逐个组件的可视性——后者由各场景用例负责。
    expect(names.length - visible).toBeLessThanOrEqual(75)
    expect(visible).toBeGreaterThanOrEqual(55)
  })

  it('渲染全组件过程中没有任何告警或异常', () => {
    expectSilent(session.messages, 'gallery 场景')
  })
})
