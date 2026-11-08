import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { openScene, type Session } from './_session'

/**
 * F-114 回归的浏览器层契约：dropdown 内层 .ui-dropdown__content 自带 maxHeight + 滚动，
 * 外层面板必须是被动盒子（overflow visible、不参与统一限高）——外层一旦是滚动容器，
 * 箭头/悬停桥探出底边的溢出会被计成可滚动区域，向上弹出冒出假滚动条，与内层滚动条叠加成双滚动条。
 */
describe('浏览器层 · dropdown 面板假滚动条守卫', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('floating')
  })

  afterAll(async () => {
    await session?.close()
  })

  it('大尺寸菜单向上弹开：外层不是滚动容器，内层超限滚动保留', async () => {
    const detail = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      document.body.appendChild(host)
      const labels = ['个人中心', '我的订单', '账户充值', '消息通知', '账号设置', '安全中心', '操作日志', '退出登录']
      const app = createApp({
        render() {
          return h(
            kit.Dropdown,
            { trigger: 'click', placement: 'top', size: 'large', popperClass: 'panel-f114-drop' },
            {
              default: () => h('button', {}, '账户中心'),
              dropdown: () =>
                h(
                  kit.DropdownMenu,
                  {},
                  { default: () => labels.map((label) => h(kit.DropdownItem, {}, { default: () => label })) }
                )
            }
          )
        }
      })
      app.mount(host)
      await new Promise((resolve) => setTimeout(resolve, 10))
      const trigger = host.querySelector('.ui-dropdown__trigger') as HTMLElement
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 250))
      const panel = document.querySelector('.panel-f114-drop') as HTMLElement
      const content = panel?.querySelector('.ui-dropdown__content') as HTMLElement
      const panelStyle = getComputedStyle(panel)
      const result = {
        side: panel.classList.contains('is-top'),
        panelOverflowY: panelStyle.overflowY,
        panelMaxHeight: panelStyle.maxHeight,
        contentClient: content.clientHeight,
        contentScroll: content.scrollHeight
      }
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      app.unmount()
      host.remove()
      return result
    })

    expect(detail.side).toBe(true)
    expect(detail.panelOverflowY).toBe('visible')
    expect(detail.panelMaxHeight).toBe('none')
    expect(detail.contentScroll).toBeGreaterThan(detail.contentClient)
  })
})
