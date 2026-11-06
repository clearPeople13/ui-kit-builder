import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { expectSilent, openScene, probeValue, rect, type Session } from './_session'

/**
 * 取色器的 SV 区与色相条靠指针坐标反算颜色，
 * 只有在真实布局里（有面积、有滚动条、有合成事件）这条链路才可测；
 * happy-dom 的矩形恒为 0，反算结果永远是左上角，等于什么都没测。
 */
describe('浏览器层 · 取色器拖拽', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('color')
    await session.page.click('.ui-color-picker__trigger')
    await session.page.waitForTimeout(300)
  })

  afterAll(async () => {
    await session?.close()
  })

  it('面板展开且 SV 区、色相条都有实际面积', async () => {
    const sv = await rect(session.page, '.ui-color-picker__sv')
    const hue = await rect(session.page, '.ui-color-picker__hue')
    expect(sv.width).toBeGreaterThan(100)
    expect(sv.height).toBeGreaterThan(80)
    expect(hue.height).toBeGreaterThan(0)
    expect(hue.width).toBeCloseTo(sv.width, 0)
  })

  it('点击 SV 区按坐标反算出颜色并同步游标', async () => {
    const sv = await rect(session.page, '.ui-color-picker__sv')
    await session.page.mouse.click(sv.left + sv.width * 0.25, sv.top + sv.height * 0.75)
    await session.page.waitForTimeout(200)

    const color = await probeValue<string>(session.page, 'color')
    expect(color).toBe('#403030')
    const cursor = await session.page.evaluate(
      () => document.querySelector<HTMLElement>('.ui-color-picker__sv-cursor')?.style.cssText ?? ''
    )
    expect(cursor).toContain('25%')
    expect(cursor).toContain('75%')
  })

  it('拖动色相条改变色相', async () => {
    const hue = await rect(session.page, '.ui-color-picker__hue')
    await session.page.mouse.click(hue.left + hue.width * 0.8, hue.top + hue.height / 2)
    await session.page.waitForTimeout(200)

    const color = await probeValue<string>(session.page, 'color')
    expect(color).toMatch(/^#[0-9a-f]{6}$/)
    expect(color).not.toBe('#403030')

    const hexInput = await session.page.evaluate(
      () => (document.querySelector('.ui-color-picker__hex') as HTMLInputElement | null)?.value
    )
    expect(hexInput).toBe(color)
  })

  it('在 SV 区内按住拖动持续更新颜色', async () => {
    const sv = await rect(session.page, '.ui-color-picker__sv')
    const before = await probeValue<string>(session.page, 'color')

    await session.page.mouse.move(sv.left + sv.width * 0.5, sv.top + sv.height * 0.5)
    await session.page.mouse.down()
    await session.page.mouse.move(sv.left + sv.width * 0.9, sv.top + sv.height * 0.1, { steps: 6 })
    await session.page.mouse.up()
    await session.page.waitForTimeout(200)

    const after = await probeValue<string>(session.page, 'color')
    expect(after).toBe('#bc17e6')
    expect(after).not.toBe(before)
  })

  it('全流程控制台无告警', () => {
    expectSilent(session.messages, 'color 场景')
  })
})
