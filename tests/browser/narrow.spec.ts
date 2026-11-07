import { describe, expect, it } from 'vitest'
import { expectSilent, moveToCenter, openScene, rect, viewport } from './_session'

/**
 * 窄屏布局（B3b-B3）：375×812 是一台竖屏手机的可用宽度。
 * 断言只有两条——页面不许出现横向滚动，贴边浮层不许跑出视口。
 */

describe('浏览器层 · 375×812 窄屏', () => {
  it('浮层场景在窄屏下不产生横向溢出，面板被夹在视口内', async () => {
    const session = await openScene('floating', { viewport: { width: 375, height: 812 } })
    try {
      const size = await viewport(session.page)
      expect(size.width).toBe(375)
      const overflow = await session.page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }))
      expect(overflow.scrollWidth, '窄屏出现横向滚动').toBeLessThanOrEqual(overflow.clientWidth + 1)

      await moveToCenter(session.page, '#tip-bottom')
      const panel = await rect(session.page, '.panel-tip-bottom')
      expect(panel.left).toBeGreaterThanOrEqual(-1)
      expect(panel.right).toBeLessThanOrEqual(376)
      expectSilent(session.messages, '窄屏布局')
    } finally {
      await session.close()
    }
  })
})
