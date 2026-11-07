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

  it('表格场景在窄屏下出现横向滚动容器，列宽保持配置不被挤压', async () => {
    const session = await openScene('table', { viewport: { width: 375, height: 812 } })
    try {
      // 场景容器 720px、六列配置宽合计 840px（minWidth 也计入），窄屏装不下：
      // 溢出应由表格自身的滚动容器承接，列不许被压到配置宽之下
      const layout = await session.page.evaluate(() => {
        const wrapper = document.querySelector('.ui-table__wrapper') as HTMLElement | null
        const headerCells = [...document.querySelectorAll('.ui-table__header-view th')].map(
          (cell) => (cell as HTMLElement).getBoundingClientRect().width
        )
        return {
          clientWidth: wrapper?.clientWidth ?? 0,
          scrollWidth: wrapper?.scrollWidth ?? 0,
          headerCells
        }
      })
      expect(layout.clientWidth).toBeGreaterThan(0)
      expect(layout.scrollWidth, '窄屏下表格应出现横向滚动').toBeGreaterThan(layout.clientWidth + 50)
      expect(layout.headerCells, '表头应仍是六个列').toHaveLength(6)

      // 配置宽：编号 90 / 负责人 120 / 金额 120 / 右冻结 110；minWidth：名称 160 / 备注 240
      const [idColumn, nameColumn, ownerColumn, amountColumn, noteColumn, fixedColumn] = layout.headerCells
      expect(idColumn, '编号列保持 width=90').toBeGreaterThanOrEqual(89)
      expect(nameColumn, '名称列不得压到 minWidth=160 之下').toBeGreaterThanOrEqual(159)
      expect(ownerColumn, '负责人列保持 width=120').toBeGreaterThanOrEqual(119)
      expect(amountColumn, '金额列保持 width=120').toBeGreaterThanOrEqual(119)
      expect(noteColumn, '备注列不得压到 minWidth=240 之下').toBeGreaterThanOrEqual(239)
      expect(fixedColumn, '右冻结列保持 width=110').toBeGreaterThanOrEqual(109)
      expectSilent(session.messages, '窄屏表格')
    } finally {
      await session.close()
    }
  })
})
