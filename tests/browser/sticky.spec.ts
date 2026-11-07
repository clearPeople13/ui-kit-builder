import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { classListOf, expectSilent, openScene, rect, scrollTop, setScrollTop, type Session } from './_session'

/**
 * 固钉 / 回顶 / 引导这三类组件的行为完全由真实滚动位置与元素矩形决定：
 * happy-dom 里 getBoundingClientRect 恒为 0、scrollTop 恒为 0，
 * 吸附阈值、容器内贴边、平滑滚动、面板贴靠全部测不出来，只能放到 Chromium 里。
 */
describe('浏览器层 · 固钉 / 回顶 / 引导', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('sticky')
    await session.page.waitForTimeout(300)
  })

  afterAll(async () => {
    await session?.close()
  })

  it('未越过 offset 时不吸附，根节点与内层都不写定位样式', async () => {
    expect(await classListOf(session.page, '#probe-affix')).not.toContain('is-fixed')
    const styles = await session.page.evaluate(() => ({
      root: (document.querySelector<HTMLElement>('#probe-affix')?.style.cssText ?? '').trim(),
      inner: (document.querySelector<HTMLElement>('#affix-content')?.parentElement?.style.cssText ?? '').trim()
    }))
    expect(styles.root).toBe('')
    expect(styles.inner).toBe('')
  })

  it('滚动越过 offset 后追加 is-fixed 并按吸附前尺寸占位', async () => {
    await setScrollTop(session.page, 400)
    await session.page.waitForTimeout(250)

    expect(await classListOf(session.page, '#probe-affix')).toContain('is-fixed')
    const root = await rect(session.page, '#probe-affix')
    expect(root.width).toBeCloseTo(300, 0)
    expect(root.height).toBeCloseTo(48, 0)
  })

  it('吸附后内层用固定定位与 offset / zIndex 贴住视口顶部', async () => {
    const inner = await session.page.evaluate(
      () => document.querySelector<HTMLElement>('#affix-content')?.parentElement?.style.cssText ?? ''
    )
    expect(inner).toContain('position: fixed')
    expect(inner).toContain('top: 24px')
    expect(inner).toContain('z-index: 1200')

    const innerRect = await rect(session.page, '#affix-content')
    expect(innerRect.top).toBeCloseTo(24, 0)
    expect(innerRect.width).toBeCloseTo(300, 0)
  })

  it('容器内回顶按钮用 calc 贴住容器可视区右下角', async () => {
    // 先把窗口滚到容器所在位置，容器整体进入视口后「右下角」才有意义
    await setScrollTop(session.page, 900)
    await session.page.evaluate(() => {
      const box = document.querySelector<HTMLElement>('#backtop-box')
      if (box) {
        box.scrollTop = 240
      }
    })
    await session.page.waitForTimeout(250)

    expect(await classListOf(session.page, '#probe-backtop-box')).toContain('is-visible')
    const style = await session.page.evaluate(
      () => document.querySelector<HTMLElement>('#probe-backtop-box')?.style.cssText ?? ''
    )
    // 浏览器会把 calc(662px + 20px) 序列化成 calc(682px)，只要两个方向都出现 calc 就说明容器偏移已参与计算
    expect(style).toContain('right: calc(')
    expect(style).toContain('bottom: calc(')

    const box = await rect(session.page, '#backtop-box')
    const button = await rect(session.page, '#probe-backtop-box .ui-backtop__button')
    expect(button.right).toBeCloseTo(box.right - 20, 0)
    expect(button.bottom).toBeCloseTo(box.bottom - 20, 0)
  })

  it('窗口回顶按 scrollY 显示，点击后真实平滑滚回顶部并收起', async () => {
    await setScrollTop(session.page, 900)
    await session.page.waitForTimeout(250)

    expect(await classListOf(session.page, '#probe-backtop-window')).toContain('is-visible')
    expect(await scrollTop(session.page)).toBeGreaterThan(800)

    await session.page.click('#probe-backtop-window .ui-backtop__button')
    await session.page.waitForFunction(() => window.scrollY < 20, undefined, { timeout: 15_000 })

    expect(await scrollTop(session.page)).toBeLessThan(20)
    expect(await classListOf(session.page, '#probe-backtop-window')).toContain('is-hidden')
  })

  it('引导面板按 placement / offset 贴靠在目标右侧', async () => {
    const target = await rect(session.page, '#tour-target')
    const panel = await rect(session.page, '.ui-tour__panel')
    expect(await classListOf(session.page, '.ui-tour__panel')).toContain('is-placement-right')
    expect(panel.left).toBeCloseTo(target.right + 16, 0)
    expect(panel.top + panel.height / 2).toBeCloseTo(target.top + target.height / 2, 0)
  })

  it('切换到下一步时面板翻到目标下方并保持水平居中', async () => {
    await session.page.click('.ui-tour__action.is-primary')
    await session.page.waitForTimeout(250)

    const target = await rect(session.page, '#tour-target')
    const panel = await rect(session.page, '.ui-tour__panel')
    expect(await classListOf(session.page, '.ui-tour__panel')).toContain('is-placement-bottom')
    expect(panel.top).toBeCloseTo(target.bottom + 16, 0)
    expect(panel.left + panel.width / 2).toBeCloseTo(target.left + target.width / 2, 0)
  })

  it('高亮框按目标尺寸叠加 gap 的 padding 与 offset 精确包裹', async () => {
    const target = await rect(session.page, '#tour-target')
    const highlight = await rect(session.page, '.ui-tour__highlight')
    // padding 8 + offset 4：上下左右各外扩 12
    expect(highlight.left).toBeCloseTo(target.left - 12, 0)
    expect(highlight.top).toBeCloseTo(target.top - 12, 0)
    expect(highlight.width).toBeCloseTo(target.width + 24, 0)
    expect(highlight.height).toBeCloseTo(target.height + 24, 0)
    expect(
      await session.page.evaluate(
        () => document.querySelector<HTMLElement>('.ui-tour__highlight')?.style.borderRadius ?? ''
      )
    ).toBe('6px')
  })

  it('全流程控制台无告警', () => {
    expectSilent(session.messages, 'sticky 场景')
  })
})
