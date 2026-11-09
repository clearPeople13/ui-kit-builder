import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PNG } from 'pngjs'
import { expectSilent, openScene, probeValue, rect, type Session } from './_session'

/** 取一小块像素的平均亮度：阴影只覆盖几个像素，单点采样会被抗锯齿抖动带偏 */
function avgLuma(png: PNG, x: number, y: number, width = 3) {
  let sum = 0
  let count = 0
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = 0; dx < width; dx += 1) {
      const px = Math.round(x) + dx
      const py = Math.round(y) + dy
      if (px < 0 || py < 0 || px >= png.width || py >= png.height) {
        continue
      }
      const index = (png.width * py + px) << 2
      sum += 0.299 * png.data[index] + 0.587 * png.data[index + 1] + 0.114 * png.data[index + 2]
      count += 1
    }
  }
  return count ? sum / count : 0
}

/**
 * 表格的滚动、冻结列、列宽拖拽只在真浏览器里可证：
 * happy-dom 没有布局引擎，scrollLeft 赋值不会改变 getBoundingClientRect，
 * 冻结列是否真的"钉住"、表头是否与表体同步，单测里全是恒真。
 */
describe('浏览器层 · 表格', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('table')
  })

  afterAll(async () => {
    await session?.close()
  })

  it('200 行数据全部落到 tbody', async () => {
    const count = await session.page.evaluate(() => document.querySelectorAll('.ui-table__wrapper tbody tr').length)
    expect(count).toBe(200)
  })

  it('纵向滚动只动表体：表头与合计行留在原位', async () => {
    const { page } = session
    const headerBefore = await rect(page, '.ui-table__header-view table')
    const summaryBefore = await rect(page, '.ui-table__summary-row')

    await page.evaluate(() => {
      document.querySelector('.ui-table__wrapper')!.scrollTop = 600
    })
    await page.waitForTimeout(200)

    const bodyTop = (await rect(page, '.ui-table__wrapper table')).top
    const headerAfter = await rect(page, '.ui-table__header-view table')
    const summaryAfter = await rect(page, '.ui-table__summary-row')
    const table = await rect(page, '#probe-table')

    // 表体被裁掉：首行已经滚到容器上沿之外
    expect(bodyTop).toBeLessThan(table.top)
    // 表头 / 合计行原地不动
    expect(headerAfter.top).toBeCloseTo(headerBefore.top, 0)
    expect(summaryAfter.top).toBeCloseTo(summaryBefore.top, 0)
    expect(summaryAfter.bottom).toBeLessThanOrEqual(Math.round(table.bottom) + 1)
  })

  it('横向滚动将表头与表体同步，冻结列钉在原处', async () => {
    const { page } = session
    await page.evaluate(() => {
      document.querySelector('.ui-table__wrapper')!.scrollLeft = 60
    })
    await page.waitForTimeout(200)

    const scroll = await page.evaluate(() => {
      const wrapper = document.querySelector('.ui-table__wrapper')!
      return { body: wrapper.scrollLeft, header: document.querySelector('.ui-table__header-view')!.scrollLeft }
    })
    expect(scroll.body).toBeGreaterThan(0)
    expect(scroll.header).toBe(scroll.body)

    const bodyTable = await rect(page, '.ui-table__wrapper table')
    const headerTable = await rect(page, '.ui-table__header-view table')
    expect(bodyTable.left).toBeCloseTo(headerTable.left, 0)

    const fixed = await rect(page, '.ui-table__wrapper td.is-fixed-left')
    const plain = await rect(page, '.ui-table__wrapper tbody tr td:nth-child(3)')
    const wrapper = await rect(page, '.ui-table__wrapper')
    // 冻结列贴着可视左沿，普通列按滚动量平移
    expect(Math.abs(fixed.left - wrapper.left)).toBeLessThanOrEqual(1)
    const columnWidths = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.ui-table__wrapper colgroup col')]
        .slice(0, 2)
        .map((col) => parseFloat(col.style.width))
    )
    const expectedPlainLeft = wrapper.left + columnWidths[0] + columnWidths[1] - scroll.body
    expect(Math.abs(plain.left - expectedPlainLeft)).toBeLessThanOrEqual(1)
    expect(plain.left).toBeGreaterThan(fixed.left)
  })

  it('拖动列宽手柄改变列宽并广播 resize-change', async () => {
    const { page } = session
    const handle = await rect(page, '.ui-table__header th .ui-table__resizer')
    const before = await rect(page, '.ui-table__header th')

    const x = handle.left + handle.width / 2
    const y = handle.top + handle.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + 70, y, { steps: 10 })
    await page.mouse.up()
    await page.waitForTimeout(300)

    const after = await rect(page, '.ui-table__header th')
    expect(after.width - before.width).toBeCloseTo(70, -1)

    const widths = await page.evaluate(() => ({
      body: document.querySelector<HTMLElement>('.ui-table__wrapper colgroup col')?.style.width,
      footer: document.querySelector<HTMLElement>('.ui-table__footer-view colgroup col')?.style.width
    }))
    expect(widths.body).toBe(`${Math.round(after.width)}px`)
    expect(widths.footer).toBe(`${Math.round(after.width)}px`)

    const emitted = await probeValue<{ key: string; width: number }>(page, 'resize')
    expect(emitted?.width).toBe(Math.round(after.width))
    expect(emitted?.key).toBeTruthy()
  })

  it('合计行带真实汇总值', async () => {
    const text = await session.page.evaluate(
      () => document.querySelector('.ui-table__summary-row')?.textContent?.trim() ?? ''
    )
    expect(text).toContain('合计')
    // 200 行 amount 累加：137 * (1+…+200) = 2733700，逐列写进合计行
    expect(text).toContain(String((137 * 200 * 201) / 2))
  })

  it('冻结列阴影是一条贯穿表头/表体/合计的连续渐变态 overlay', async () => {
    const { page } = session
    await page.evaluate(() => {
      const wrapper = document.querySelector('.ui-table__wrapper')
      if (wrapper) {
        wrapper.scrollLeft = 60
      }
    })
    await page.waitForTimeout(200)
    const data = await page.evaluate(() => {
      const root = document.querySelector('#probe-table')
      if (!(root instanceof HTMLElement)) {
        throw new Error('找不到表格根节点')
      }
      const after = getComputedStyle(root, '::after')
      const before = getComputedStyle(root, '::before')
      return {
        hasLeft: root.classList.contains('is-scrolled-left'),
        edge: getComputedStyle(root).getPropertyValue('--ui-table-fixed-left').trim(),
        rightEdge: getComputedStyle(root).getPropertyValue('--ui-table-fixed-right').trim(),
        content: after.content,
        top: after.top,
        bottom: after.bottom,
        left: after.left,
        width: after.width,
        background: after.backgroundImage,
        rightContent: before.content,
        right: before.right,
        rightBackground: before.backgroundImage
      }
    })
    expect(data.hasLeft).toBe(true)
    expect(data.edge).not.toBe('')
    expect(data.content).not.toBe('none')
    expect(data.left).toBe(data.edge)
    expect(data.top).toBe('0px')
    expect(data.bottom).toBe('0px')
    // F-122：1px 宽 + 负 spread 的 box-shadow 会把阴影矩形收缩成 0，看起来像"阴影被删了"
    expect(parseFloat(data.width)).toBeGreaterThanOrEqual(8)
    expect(data.background).toContain('linear-gradient')
    expect(data.rightContent).not.toBe('none')
    expect(data.right).toBe(data.rightEdge)
    expect(data.rightBackground).toContain('linear-gradient')
  })

  it('阴影在表头/表体/合计三段同样可见（F-122）', async () => {
    const { page } = session
    await page.evaluate(() => {
      document.querySelector('.ui-table__wrapper')!.scrollLeft = 60
    })
    await page.waitForTimeout(200)
    const geometry = await page.evaluate(() => {
      const root = document.querySelector<HTMLElement>('#probe-table')
      if (!root) {
        throw new Error('找不到表格根节点')
      }
      const rootRect = root.getBoundingClientRect()
      const header = root.querySelector('.ui-table__header')!.getBoundingClientRect()
      const wrapper = root.querySelector('.ui-table__wrapper')!.getBoundingClientRect()
      const summary = root.querySelector('.ui-table__summary-row')!.getBoundingClientRect()
      const border = parseFloat(getComputedStyle(root).borderLeftWidth) || 0
      const edge = parseFloat(getComputedStyle(root).getPropertyValue('--ui-table-fixed-left')) || 0
      return {
        x: border + edge + 2,
        bands: [header.top + header.height / 2, wrapper.top + 24, summary.top + summary.height / 2].map(
          (y) => y - rootRect.top
        )
      }
    })
    const table = page.locator('#probe-table')
    const withShadow = PNG.sync.read(await table.screenshot())
    await page.evaluate(() => document.querySelector('#probe-table')!.classList.remove('is-scrolled-left'))
    await page.waitForTimeout(50)
    const withoutShadow = PNG.sync.read(await table.screenshot())
    await page.evaluate(() => document.querySelector('#probe-table')!.classList.add('is-scrolled-left'))

    const deltas = geometry.bands.map((y) => avgLuma(withoutShadow, geometry.x, y) - avgLuma(withShadow, geometry.x, y))
    for (const delta of deltas) {
      expect(delta).toBeGreaterThan(6)
    }
    // 三段落在同一条竖带上：强度一致才算"连贯"，否则又会退化成三段各自为政
    expect(Math.max(...deltas) - Math.min(...deltas)).toBeLessThanOrEqual(3)
  })

  it('全流程控制台无告警', () => {
    expectSilent(session.messages, 'table 场景')
  })
})

describe('浏览器层 · 表格铺满余量', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('table-fit')
  })

  afterAll(async () => {
    await session?.close()
  })

  it('铺满时留 1px 余量，缩放的小数像素不会露出横向滚动条', async () => {
    const data = await session.page.evaluate(() => {
      const wrapper = document.querySelector<HTMLElement>('#probe-table-fit .ui-table__wrapper')
      const table = wrapper?.querySelector('table')
      if (!wrapper || !table) {
        throw new Error('找不到铺满场景表格')
      }
      return {
        clientWidth: wrapper.clientWidth,
        scrollWidth: wrapper.scrollWidth,
        tableWidth: table.getBoundingClientRect().width
      }
    })
    expect(data.scrollWidth).toBeLessThanOrEqual(data.clientWidth)
    expect(data.tableWidth).toBeLessThanOrEqual(data.clientWidth - 1)
  })

  it('表体预留纵向滚动条槽，经典滚动条出现时不会挤窄表体', async () => {
    const gutter = await session.page.evaluate(() => {
      const wrapper = document.querySelector<HTMLElement>('#probe-table-fit .ui-table__wrapper')
      return wrapper ? getComputedStyle(wrapper).scrollbarGutter : ''
    })
    expect(gutter).toBe('stable')
  })
})

describe('浏览器层 · 表格虚拟滚动锚定', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('table-virtual-variable')
  })

  afterAll(async () => {
    await session?.close()
  })

  it('异步实测行高后视口顶部仍是同一行，相对位置不跳', async () => {
    const data = await session.page.evaluate(async () => {
      const wrapper = document.querySelector<HTMLElement>('#probe-table-virtual .ui-table__wrapper')
      if (!wrapper) {
        throw new Error('找不到虚拟滚动表格')
      }
      const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
      const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
      const readAnchor = () => {
        const top = wrapper.getBoundingClientRect().top
        const rows = Array.from(wrapper.querySelectorAll<HTMLElement>('tr[data-row-index]')).map((tr) => {
          const rect = tr.getBoundingClientRect()
          return { index: Number(tr.getAttribute('data-row-index')), top: rect.top, bottom: rect.bottom }
        })
        const first = rows.filter((row) => row.bottom > top + 0.5).sort((left, right) => left.top - right.top)[0]
        return first ? { index: first.index, offset: first.top - top } : null
      }

      // 先让顶部窗口实测完，回退行高稳定在 64px，再滚进未测区域
      await wait(1200)
      wrapper.scrollTop = 63946
      await nextFrame()
      await wait(150)
      const before = readAnchor()
      // 停在中途时不再提交实测，等待超过提交窗口也不能改变视口内容
      await wait(1200)
      const after = readAnchor()
      return { before, after }
    })

    expect(data.before).not.toBeNull()
    expect(data.after).not.toBeNull()
    expect(data.after?.index).toBe(data.before?.index)
    expect(Math.abs((data.after?.offset ?? 0) - (data.before?.offset ?? 0))).toBeLessThanOrEqual(1.5)
  })

  it('滚动帧不再重复测量表头列宽', async () => {
    const count = await session.page.evaluate(async () => {
      const wrapper = document.querySelector<HTMLElement>('#probe-table-virtual .ui-table__wrapper')
      if (!wrapper) {
        throw new Error('找不到虚拟滚动表格')
      }
      const original = Element.prototype.getBoundingClientRect
      let thCount = 0
      Element.prototype.getBoundingClientRect = function (this: Element) {
        if (this instanceof HTMLElement && this.tagName === 'TH') {
          thCount += 1
        }
        return original.call(this)
      }
      const frame = () =>
        new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))))
      try {
        wrapper.scrollTop = 0
        await frame()
        thCount = 0
        for (let step = 0; step < 10; step += 1) {
          wrapper.scrollTop += 120
          await frame()
        }
        await frame()
        return thCount
      } finally {
        Element.prototype.getBoundingClientRect = original
      }
    })
    expect(count).toBeLessThanOrEqual(6)
  })
})
