import type { CDPSession, Page } from 'playwright'
import { describe, expect, it } from 'vitest'
import { expectSilent, openScene, rect } from './_session'

/**
 * _session.openScene 建的 context 没开 hasTouch（session 模式不许动），
 * page.touchscreen.tap 因此被 Playwright 拦下；它底层就是 CDP 的 Input.dispatchTouchEvent，
 * 直接走 CDP 会话发送，语义与 touchscreen.tap 完全一致。
 */
async function touchTap(page: Page, x: number, y: number): Promise<void> {
  const client: CDPSession = await page.context().newCDPSession(page)
  try {
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] })
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } finally {
    await client.detach()
  }
}

/**
 * 触摸路径补盲（A16）：浏览器层此前全部由 mouse / keyboard 驱动，
 * 移动端最基本的 touchscreen.tap 与 TouchEvent 派发没有人走过。
 *
 * a11y 场景里恰好有两类典型：Tabs 是纯点击驱动的受控组件，tap 之后状态变化可直接观测；
 * Slider 的拖拽由原生 range 输入框承载，触摸序列走 native 通路，
 * 校验目标是"触摸进来不抛错、控件保持可用"。
 */
describe('浏览器层 · 触摸路径', () => {
  it('touchscreen.tap 点选标签页，活动页正确切换', async () => {
    const session = await openScene('a11y', { viewport: { width: 375, height: 812 } })
    try {
      const tabCount = await session.page.locator('.ui-tabs__nav-item').count()
      expect(tabCount, 'a11y 场景应有两个标签页').toBe(2)

      const readState = () =>
        session.page.evaluate(() => ({
          activeTabs: [...document.querySelectorAll('.ui-tabs__nav-item')].map((item) =>
            item.classList.contains('is-active')
          ),
          visiblePanes: [...document.querySelectorAll('.ui-tab-pane__content')].map(
            (pane) => (pane as HTMLElement).style.display !== 'none'
          )
        }))

      const before = await readState()
      expect(before.activeTabs).toEqual([true, false])
      expect(before.visiblePanes).toEqual([true, false])

      const target = await rect(session.page, '.ui-tabs__nav-item:nth-child(2)')
      await touchTap(session.page, target.left + target.width / 2, target.top + target.height / 2)
      await session.page.waitForTimeout(250)

      const after = await readState()
      expect(after.activeTabs, 'tap 后第二个标签页应激活').toEqual([false, true])
      expect(after.visiblePanes, 'tap 后第二个页签内容应可见').toEqual([false, true])
      expectSilent(session.messages, '触摸 tap 标签页')
    } finally {
      await session.close()
    }
  })

  it('touchscreen.tap 与 TouchEvent 序列落在滑杆上均不抛错，控件保持可用', async () => {
    const session = await openScene('a11y', { viewport: { width: 375, height: 812 } })
    try {
      const runway = await rect(session.page, '.ui-slider__runway')
      const centerY = runway.top + runway.height / 2

      // 先走 CDP 的 touchStart/touchEnd（即 touchscreen.tap 的本体）：
      // 落点在跑道右段，原生 range 会收到触摸
      await touchTap(session.page, runway.left + runway.width * 0.8, centerY)
      await session.page.waitForTimeout(200)

      // 再走手动派发的 touchstart/move/end 全序列，覆盖合成事件之外的裸 TouchEvent 通路
      // （JS 派发的事件不可信，原生 range 不会因此移动，断言目标是整条路径不抛错）
      await session.page.evaluate(
        ([fromX, toX, y]) => {
          const target = document.elementFromPoint(fromX, y) ?? document.querySelector('.ui-slider')
          if (!target) {
            throw new Error('找不到触摸目标')
          }
          const makeTouch = (clientX: number) => new Touch({ identifier: 7, target, clientX, clientY: y })
          const fire = (type: string, touches: Touch[]) =>
            target.dispatchEvent(
              new TouchEvent(type, {
                bubbles: true,
                cancelable: true,
                touches,
                targetTouches: touches,
                changedTouches: touches.length ? [touches[touches.length - 1]] : []
              })
            )
          fire('touchstart', [makeTouch(fromX)])
          fire('touchmove', [makeTouch((fromX + toX) / 2)])
          fire('touchmove', [makeTouch(toX)])
          fire('touchend', [])
        },
        [runway.left + runway.width * 0.2, runway.left + runway.width * 0.6, centerY]
      )
      await session.page.waitForTimeout(200)

      // 跑道右段 80% 处 touch 一次：range 输入框是整幅透明覆盖层，触摸应被原生通路接住，
      // 经 input 事件进入组件的 commit 链（组件由 modelValue=30 受控，页内没有回写监听）
      const valueNow = await session.page.evaluate(
        () => document.querySelector<HTMLInputElement>('.ui-slider__input')?.value
      )
      expect(
        Number(valueNow),
        'tap 应经原生 range 通路落到组件的 input 处理上，数值到达跑道右段附近'
      ).toBeGreaterThanOrEqual(70)
      expect(Number(valueNow)).toBeLessThanOrEqual(90)
      expectSilent(session.messages, '滑杆触摸序列')
    } finally {
      await session.close()
    }
  })
})
