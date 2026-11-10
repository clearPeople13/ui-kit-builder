import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { countOf, expectSilent, hasElement, moveToCenter, openScene, rect, type Session } from './_session'

const TABLE = '#probe-table-overflow'
const PANEL = '.ui-table__overflow-panel'
const cell = (row: number, column: number) =>
  `${TABLE} .ui-table__wrapper tbody tr:nth-child(${row}) td:nth-child(${column})`

/**
 * 溢出提示是纯布局行为：省略是否真的发生、多行钳制是不是只显示 N 行、浮层是否挂在
 * 溢出格下方，happy-dom 里全是 0 宽 0 高，只有真浏览器能证。
 */
describe('浏览器层 · 表格溢出提示', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('table-overflow')
  })

  afterAll(async () => {
    await session?.close()
  })

  it('表格级多行、列级单行、列级关闭各自落到测量盒上', async () => {
    // 10 行 × (编号/编码/描述) + 3 个表头；tag 列关了开关，单元格与表头都不包
    expect(await countOf(session.page, `${TABLE} .ui-table__cell-text`)).toBe(33)
    // 编号与描述两列继承表格级两行，编码列显式单行
    expect(await countOf(session.page, `${TABLE} .is-clamped`)).toBe(20)
    const clamp = await session.page.evaluate(
      (selector) => (document.querySelector(selector) as HTMLElement).style.getPropertyValue('--ui-table-line-clamp'),
      `${TABLE} tbody .is-clamped`
    )
    expect(clamp).toBe('2')
  })

  it('多行钳制只显示两行，被裁掉的行仍算溢出', async () => {
    const metrics = await session.page.evaluate((selector) => {
      const rows = Array.from(document.querySelectorAll(`${selector} tbody tr`))
      const textOf = (row: number) =>
        rows[row].querySelectorAll('td')[2].querySelector('.ui-table__cell-text') as HTMLElement
      const short = textOf(0)
      const clamped = textOf(1)
      const clampedHeight = clamped.clientHeight
      clamped.style.setProperty('-webkit-line-clamp', 'unset')
      const fullHeight = clamped.clientHeight
      clamped.style.removeProperty('-webkit-line-clamp')
      return { shortHeight: short.clientHeight, clampedHeight, fullHeight }
    }, TABLE)
    expect(metrics.clampedHeight).toBeGreaterThanOrEqual(metrics.shortHeight * 1.8)
    expect(metrics.fullHeight).toBeGreaterThan(metrics.clampedHeight)
  })

  it('长表头用同一个盒子省略', async () => {
    const header = await session.page.evaluate((selector) => {
      const box = document
        .querySelectorAll(`${selector} .ui-table__header th`)[2]
        .querySelector('.ui-table__cell-text') as HTMLElement
      return { text: box.textContent, clipped: box.scrollWidth > box.clientWidth + 1 }
    }, TABLE)
    expect(header.text).toBe('这是一段很长很长很长的表头标题')
    expect(header.clipped).toBe(true)
  })

  it('悬停溢出格弹出浮层，位置贴着单元格下方', async () => {
    const { page } = session
    await moveToCenter(page, cell(1, 2))
    const panel = await page.evaluate((selector) => {
      const element = document.querySelector(selector) as HTMLElement | null
      if (!element) {
        return null
      }
      const box = element.getBoundingClientRect()
      return { text: element.textContent, top: box.top, left: box.left }
    }, PANEL)
    const target = await rect(page, cell(1, 2))
    expect(panel).toBeTruthy()
    expect(panel!.text).toContain('CODE-0001')
    expect(panel!.top).toBeGreaterThanOrEqual(target.bottom + 7)
    expect(panel!.top).toBeLessThanOrEqual(target.bottom + 9)
    expect(panel!.left).toBeGreaterThanOrEqual(8)
  })

  it('多行单元格悬停给出未截断的全文', async () => {
    await moveToCenter(session.page, cell(2, 3))
    const text = await session.page.evaluate((selector) => document.querySelector(selector)?.textContent ?? '', PANEL)
    expect(text).toBe('这是一段很长的单元格文本用来验证省略与悬停浮层')
  })

  it('不溢出或列级关闭的单元格不弹浮层', async () => {
    await moveToCenter(session.page, cell(1, 3))
    expect(await hasElement(session.page, PANEL)).toBe(false)
    await moveToCenter(session.page, cell(2, 4))
    expect(await hasElement(session.page, PANEL)).toBe(false)
  })

  it('长表头也走同一个浮层', async () => {
    await moveToCenter(session.page, `${TABLE} .ui-table__header th:nth-child(3)`)
    const text = await session.page.evaluate((selector) => document.querySelector(selector)?.textContent ?? '', PANEL)
    expect(text).toBe('这是一段很长很长很长的表头标题')
  })

  it('移开鼠标或滚动表体都会收起浮层', async () => {
    const { page } = session
    await moveToCenter(page, cell(1, 2))
    expect(await hasElement(page, PANEL)).toBe(true)

    await page.mouse.move(2, 2)
    await page.waitForTimeout(150)
    expect(await hasElement(page, PANEL)).toBe(false)

    await moveToCenter(page, cell(1, 2))
    await page.evaluate((selector) => {
      ;(document.querySelector(`${selector} .ui-table__wrapper`) as HTMLElement).scrollTop = 60
    }, TABLE)
    await page.waitForTimeout(200)
    expect(await hasElement(page, PANEL)).toBe(false)
  })

  it('全程无控制台告警', () => {
    expectSilent(session.messages, '表格溢出提示')
  })
})
