import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  classListOf,
  countOf,
  expectSilent,
  moveToCenter,
  openScene,
  rect,
  setScrollTop,
  scrollTop,
  viewport,
  type Session
} from './_session'

/**
 * 浮层定位只能靠真浏览器证明：happy-dom 里 getBoundingClientRect 恒为 0，
 * 翻转/夹取/限高的分支全部走不到，贴边缺陷（历史上 F-01、F-05 那一类）单测一律放行。
 *
 * 视口固定 1280×720，面板用 popperClass 精确选中实例（所有面板都 teleport 到 body 下）。
 */
describe('浏览器层 · 浮层定位', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('floating')
  })

  afterAll(async () => {
    await session?.close()
  })

  it('贴下沿的 Tooltip 从 bottom 翻到 top，且压在触发器上方', async () => {
    const { page } = session
    await moveToCenter(page, '#tip-bottom')
    const trigger = await rect(page, '#tip-bottom')
    const panel = await rect(page, '.panel-tip-bottom')
    expect(await classListOf(page, '.panel-tip-bottom')).toContain('is-top')
    expect(panel.bottom).toBeLessThanOrEqual(trigger.top)
    expect(panel.top).toBeGreaterThanOrEqual(0)
    expect(panel.height).toBeGreaterThan(0)
  })

  it('常规位置的 Tooltip 保持 bottom，不无故翻转', async () => {
    const { page } = session
    await moveToCenter(page, '#tip-bottom', 0, -300)
    await moveToCenter(page, '#tip-flow')
    const panel = await rect(page, '.panel-tip-bottom')
    expect(panel.height).toBe(0)
    const flowClasses = await page.evaluate(() => {
      const panels = [...document.querySelectorAll('.ui-tooltip__popper')]
      const open = panels.find((el) => el.getBoundingClientRect().height > 0)
      return open ? open.className : ''
    })
    expect(flowClasses).toContain('is-bottom')
  })

  it('右贴边的宽 Popover 翻到左侧，整体留在视口内', async () => {
    const { page } = session
    await page.click('#pop-right')
    await page.waitForTimeout(250)
    const trigger = await rect(page, '#pop-right')
    const panel = await rect(page, '.panel-pop-right')
    const view = await viewport(page)
    expect(await classListOf(page, '.panel-pop-right')).toContain('is-left')
    expect(panel.right).toBeLessThanOrEqual(trigger.left)
    expect(panel.left).toBeGreaterThanOrEqual(0)
    expect(panel.right).toBeLessThanOrEqual(view.width)
  })

  it('右贴边的 Dropdown 菜单被夹在视口内，不溢出右沿', async () => {
    const { page } = session
    await page.click('#drop-right')
    await page.waitForTimeout(250)
    const panel = await rect(page, '.panel-drop-right')
    const view = await viewport(page)
    expect(panel.height).toBeGreaterThan(0)
    expect(panel.right).toBeLessThanOrEqual(view.width)
    expect(panel.left).toBeGreaterThanOrEqual(0)
    expect(await countOf(page, '.panel-drop-right .ui-dropdown-item')).toBe(2)
  })

  it('Select 面板与触发器等宽，40 个选项全部可见于面板内', async () => {
    const { page } = session
    await page.click('#select-flow')
    await page.waitForTimeout(250)
    const trigger = await rect(page, '#select-flow')
    const panel = await rect(page, '.panel-select-flow')
    expect(panel.width).toBeCloseTo(trigger.width, 0)
    expect(await countOf(page, '.panel-select-flow .ui-select__option')).toBe(40)
  })

  it('右贴边的 Select 面板等宽且不越界', async () => {
    const { page } = session
    await page.click('#select-flow')
    await page.waitForTimeout(200)
    await page.click('#select-right')
    await page.waitForTimeout(250)
    const trigger = await rect(page, '#select-right')
    const panel = await rect(page, '.panel-select-right')
    const view = await viewport(page)
    expect(panel.width).toBeCloseTo(trigger.width, 0)
    expect(panel.right).toBeLessThanOrEqual(view.width)
  })

  it('滚动时面板随文档一起移动，与触发器的相对位移不变', async () => {
    const { page } = session
    await page.click('#select-right')
    await page.waitForTimeout(200)
    await page.click('#pop-scroll')
    await page.waitForTimeout(250)

    const before = {
      panel: await rect(page, '.panel-scroll'),
      trigger: await rect(page, '#pop-scroll'),
      scroll: await scrollTop(page)
    }
    const gapBefore = before.panel.top - before.trigger.top

    await setScrollTop(page, before.scroll + 240)

    const after = {
      panel: await rect(page, '.panel-scroll'),
      trigger: await rect(page, '#pop-scroll'),
      scroll: await scrollTop(page)
    }
    expect(after.scroll).toBeCloseTo(before.scroll + 240, 0)
    expect(after.panel.top).toBeCloseTo(before.panel.top - 240, 0)
    expect(after.panel.top - after.trigger.top).toBeCloseTo(gapBefore, 0)
  })

  it('整个过程控制台一声不响', () => {
    expectSilent(session.messages, 'floating 场景')
  })
})
