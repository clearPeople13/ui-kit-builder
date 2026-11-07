import { describe, expect, it } from 'vitest'
import { expectSilent, moveToCenter, openScene, rect, viewport } from './_session'

/**
 * 跨引擎子集（B3b-B3）：Chromium 之外的布局 / 定位 / 键盘只各挑一条最有代表性的断言。
 * Firefox 的排版与事件时序差异（尤其是浮层测量和焦点环）是浏览器层最容易被单一内核掩盖的部分。
 */

describe('浏览器层 · Firefox 子集', () => {
  it('布局：组件画廊在 Firefox 下不产生横向溢出', async () => {
    const session = await openScene('gallery', { engine: 'firefox' })
    try {
      const size = await viewport(session.page)
      const overflow = await session.page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }))
      expect(overflow.scrollWidth, `Firefox 出现横向滚动（视口 ${size.width}）`).toBeLessThanOrEqual(
        overflow.clientWidth + 1
      )
      expectSilent(session.messages, 'Firefox 画廊')
    } finally {
      await session.close()
    }
  })

  it('定位：贴底 Tooltip 在 Firefox 下同样翻到上方', async () => {
    const session = await openScene('floating', { engine: 'firefox' })
    try {
      await moveToCenter(session.page, '#tip-bottom')
      const trigger = await rect(session.page, '#tip-bottom')
      const panel = await rect(session.page, '.panel-tip-bottom')
      expect(panel.bottom).toBeLessThanOrEqual(trigger.top)
      expect(panel.top).toBeGreaterThanOrEqual(0)
      expectSilent(session.messages, 'Firefox 浮层')
    } finally {
      await session.close()
    }
  })

  it('键盘：Firefox 下 Tab 首站仍落进真实输入框', async () => {
    const session = await openScene('a11y', { engine: 'firefox' })
    try {
      await session.page.keyboard.press('Tab')
      const first = await session.page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null
        return { tag: element?.tagName ?? '', id: element?.id ?? '' }
      })
      expect(first.tag).toBe('INPUT')
      expect(first.id).toBe('a11y-input')
      expectSilent(session.messages, 'Firefox 键盘')
    } finally {
      await session.close()
    }
  })
})
