import { describe, expect, it } from 'vitest'
import { expectSilent, moveToCenter, openScene, rect, viewport } from './_session'

/**
 * 裁剪产物的浏览器冒烟（B3b-B2）。
 *
 * 此前只有 full 进过真浏览器；core / antd / chinese 各自代表"零特性 + 前缀改写 + 中文皮肤"，
 * 挂 3 个代表组件与一个贴底浮层，确认产物本身可挂载、前缀完全隔离、浮层会翻到上方、控制台静默。
 */

const profiles = [
  { id: 'core', prefix: 'ui' },
  { id: 'antd', prefix: 'antd' },
  { id: 'chinese', prefix: 'chinese' }
]

describe.each(profiles)('浏览器层 · 裁剪产物冒烟 $id', ({ id, prefix }) => {
  it('3 个代表组件 + 浮层定位 + 控制台静默', async () => {
    const session = await openScene('profile', { query: { profile: id } })
    try {
      // 组件挂载：三个代表组件都有内容，且类名用的是该 profile 自己的前缀
      for (const [selector, expected] of [
        ['#profile-button', 'Probe'],
        ['#profile-tag', '标签'],
        ['#profile-input', '探针文本']
      ] as const) {
        const element = await session.page.locator(selector)
        expect(await element.count(), `${id} 缺 ${selector}`).toBe(1)
        const text = await session.page.evaluate(
          (target) => document.querySelector(target)?.textContent ?? '',
          selector
        )
        if (selector === '#profile-input') {
          expect(
            await session.page.evaluate(
              (target) => (document.querySelector(target) as HTMLInputElement)?.value,
              selector
            )
          ).toBe(expected)
        } else {
          expect(text).toContain(expected)
        }
      }

      const buttonClass = await session.page.evaluate(() => document.querySelector('#profile-button')?.className ?? '')
      expect(buttonClass).toContain(`${prefix}-button`)
      if (prefix !== 'ui') {
        expect(buttonClass, `${id} 残留 ui- 前缀`).not.toContain('ui-button')
      }

      // 浮层：贴视口下沿，bottom 方位放不下必须翻到触发器上方
      await session.page.mouse.move(0, 0)
      await moveToCenter(session.page, '#profile-tip')
      // popperClass 本身是 tooltip.popper 特性，core 里被裁掉；用 role 选面板才能三份产物通用
      await session.page.waitForSelector('[role="tooltip"]', { state: 'visible', timeout: 10_000 })
      const panel = await rect(session.page, '[role="tooltip"]')
      const panelClass = await session.page.evaluate(() => document.querySelector('[role="tooltip"]')?.className ?? '')
      expect(panelClass).toContain(`${prefix}-tooltip`)
      const trigger = await rect(session.page, '#profile-tip')
      const size = await viewport(session.page)
      expect(panel.bottom, `${id} 浮层没有翻到上方`).toBeLessThanOrEqual(trigger.top + 1)
      expect(panel.top, `${id} 浮层跑出视口`).toBeGreaterThanOrEqual(0)
      expect(panel.right).toBeLessThanOrEqual(size.width + 1)

      expectSilent(session.messages, `${id} 冒烟`)
    } finally {
      await session.close()
    }
  })
})
