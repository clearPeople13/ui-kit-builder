import { describe, expect, it } from 'vitest'
import { expectSilent, openScene } from './_session'

/** 左右箭头是纯图标控件，浏览器层守住可访问名与按钮语义 */
describe('浏览器层 · carousel 键盘可达', () => {
  it('左右箭头具备可访问名与 button 语义', async () => {
    const session = await openScene('gallery')
    try {
      const arrows = session.page.locator('.ui-carousel').first().locator('.ui-carousel__arrow')
      expect(await arrows.count()).toBe(2)
      expect(await arrows.nth(0).getAttribute('aria-label')).toBe('Previous slide')
      expect(await arrows.nth(1).getAttribute('aria-label')).toBe('Next slide')
      expect(await arrows.nth(0).getAttribute('type')).toBe('button')
      expectSilent(session.messages, 'carousel')
    } finally {
      await session.close()
    }
  })
})
