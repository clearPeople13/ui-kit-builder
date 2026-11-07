import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { expectSilent, openScene, probeValue, type Session } from './_session'

/**
 * 第八批 · TimePicker 场景契约（浏览器层）。
 *
 * 组件层 39 条用例全绿却拦不住 F-55…F-63，根因是它们断言的是"抛了什么事件"，
 * 而缺陷发生在真实焦点链 / 合成指针 / teleport 之后。这一层专门锁定用户操作序列。
 * 每条用例 reload 一次页面：既关掉残留浮层，也清空 probe 里的写回序列。
 */
describe('浏览器层 · TimePicker 场景契约', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('time-picker', { fixedTime: new Date('2026-11-06T09:08:07') })
  })

  afterAll(async () => {
    await session?.close()
  })

  beforeEach(async () => {
    const { page } = session
    await page.reload({ waitUntil: 'load' })
    await page.waitForFunction(() => (window as unknown as { __probe?: { ready?: boolean } }).__probe?.ready === true)
  })

  it('点输入框只打开面板，已开时再点不收起（F-55）', async () => {
    const { page } = session
    await page.click('#scene-time-picker')
    expect(await page.locator('.scene-tp-panel').count()).toBe(1)
    await page.click('#scene-time-picker')
    expect(await page.locator('.scene-tp-panel').count()).toBe(1)
    expect(await page.locator('.ui-time-picker__trigger').first().getAttribute('aria-expanded')).toBe('true')
  })

  it('浮层 teleport 到 body，外部指针按下才收起', async () => {
    const { page } = session
    await page.click('#scene-time-picker')
    expect(await page.locator('.scene-tp-panel').evaluate((node) => node.parentElement?.tagName)).toBe('BODY')
    await page.click('#scene-time-picker-outside')
    expect(await page.locator('.scene-tp-panel').count()).toBe(0)
  })

  it('键入草稿后点列项只写回一次，且保留草稿的分秒（F-56）', async () => {
    const { page } = session
    await page.click('#scene-time-picker')
    await page.fill('#scene-time-picker', '11:22:33')
    const hours = page.locator('.scene-tp-panel .ui-time-picker__column').first().locator('.ui-time-picker__time-item')
    await hours.nth(3).click()
    expect(await probeValue<string[]>(page, 'tpEmits')).toEqual(['03:22:33'])
    expect(await page.locator('#scene-time-picker').inputValue()).toBe('03:22:33')
  })

  it('夹带垃圾的文本不提交，输入框回退原值（F-57）', async () => {
    const { page } = session
    await page.fill('#scene-time-picker', 'abc1:2xyz')
    await page.press('#scene-time-picker', 'Enter')
    expect(await probeValue(page, 'tpEmits')).toBeUndefined()
    expect(await page.locator('#scene-time-picker').inputValue()).toBe('09:24:36')
  })

  it('照着显示格式键入可以提交（F-58）', async () => {
    const { page } = session
    expect(await page.locator('#scene-time-picker-formatted').inputValue()).toBe('09 点 24 分')
    await page.fill('#scene-time-picker-formatted', '10 点 30 分')
    await page.press('#scene-time-picker-formatted', 'Enter')
    expect(await probeValue<string>(page, 'fmtValue')).toBe('10 点 30 分')
    expect(await page.locator('#scene-time-picker-formatted').inputValue()).toBe('10 点 30 分')
  })

  it('区间写回的两端使用同一格式（F-60）', async () => {
    const { page } = session
    await page.click('#scene-time-picker-range-end')
    const hours = page
      .locator('.scene-tp-panel-range .ui-time-picker__column')
      .first()
      .locator('.ui-time-picker__time-item')
    await hours.nth(11).click()
    expect(await probeValue<string[]>(page, 'rangeValue')).toEqual(['09:00:00', '11:00:00'])
  })

  it('控制台无告警', () => {
    expectSilent(session.messages, 'time-picker 场景')
  })
})
