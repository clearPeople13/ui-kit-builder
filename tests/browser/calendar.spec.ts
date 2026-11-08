import { describe, expect, it } from 'vitest'
import { expectSilent, openScene } from './_session'

/** 翻月按钮是纯图标控件，浏览器层守住可访问名与按钮语义 */
describe('浏览器层 · calendar 键盘可达', () => {
  it('翻月按钮具备可访问名与 button 语义', async () => {
    const session = await openScene('gallery')
    try {
      const navs = session.page.locator('.ui-calendar').first().locator('.ui-calendar__nav')
      expect(await navs.count()).toBe(2)
      expect(await navs.nth(0).getAttribute('aria-label')).toBe('Previous month')
      expect(await navs.nth(1).getAttribute('aria-label')).toBe('Next month')
      expect(await navs.nth(0).getAttribute('type')).toBe('button')
      expectSilent(session.messages, 'calendar')
    } finally {
      await session.close()
    }
  })
})
