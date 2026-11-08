import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { openScene, type Session } from './_session'

/**
 * locale 迁移波次的浏览器层契约：popconfirm 的文案与按钮在真实 DOM 里渲染，
 * 面板 teleported 到 body、几何落在触发器下方——happy-dom 没有布局，坐标与
 * 真实点击链路都证不了。
 */
describe('浏览器层 · popconfirm 面板与文案', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('floating')
  })

  afterAll(async () => {
    await session?.close()
  })

  it('点击展开 teleported 面板并落在触发器下方，取消按钮收起', async () => {
    const detail = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      host.className = 'pc-host'
      host.style.position = 'absolute'
      host.style.top = '40px'
      host.style.left = '40px'
      document.body.appendChild(host)
      const app = createApp({
        render() {
          return h(
            kit.Popconfirm,
            { title: '删除该行数据？' },
            { default: () => h('button', { class: 'pc-trigger' }, '删除') }
          )
        }
      })
      app.mount(host)
      await new Promise((resolve) => setTimeout(resolve, 10))
      const trigger = host.querySelector('.ui-popconfirm__trigger') as HTMLElement
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 100))

      const panel = document.querySelector('.ui-popconfirm__panel') as HTMLElement
      const panelBox = panel.getBoundingClientRect()
      const triggerBox = trigger.getBoundingClientRect()
      const result = {
        expanded: trigger.getAttribute('aria-expanded'),
        teleported: !host.contains(panel) && document.body.contains(panel),
        panelHeight: panelBox.height,
        panelWidth: panelBox.width,
        belowTrigger: panelBox.top >= triggerBox.bottom - 1,
        title: document.querySelector('.ui-popconfirm__title span:last-child')?.textContent,
        buttons: Array.from(document.querySelectorAll('.ui-popconfirm__button')).map((node) => node.textContent),
        expandedAfterCancel: null as string | null,
        panelAfterCancel: false
      }

      document
        .querySelector<HTMLElement>('.ui-popconfirm__button.is-cancel')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 100))
      result.expandedAfterCancel = trigger.getAttribute('aria-expanded')
      result.panelAfterCancel = document.querySelector('.ui-popconfirm__panel') === null
      app.unmount()
      host.remove()
      return result
    })

    expect(detail.expanded).toBe('true')
    expect(detail.teleported).toBe(true)
    expect(detail.panelHeight).toBeGreaterThan(0)
    expect(detail.panelWidth).toBeCloseTo(150, 0)
    expect(detail.belowTrigger).toBe(true)
    expect(detail.title).toBe('删除该行数据？')
    expect(detail.buttons).toEqual(['取消', '确定'])
    expect(detail.expandedAfterCancel).toBe('false')
    expect(detail.panelAfterCancel).toBe(true)
  })

  it('ConfigProvider 注入 locale 生效，未注入键回退中文，Escape 收起', async () => {
    const detail = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const mountCase = async (locale: Record<string, any>) => {
        const host = document.createElement('div')
        document.body.appendChild(host)
        const app = createApp({
          render() {
            return h(
              kit.ConfigProvider,
              { locale },
              {
                default: () => h(kit.Popconfirm, {}, { default: () => h('button', { class: 'pc-trigger' }, '删除') })
              }
            )
          }
        })
        app.mount(host)
        await new Promise((resolve) => setTimeout(resolve, 10))
        const trigger = host.querySelector('.ui-popconfirm__trigger') as HTMLElement
        trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        await new Promise((resolve) => setTimeout(resolve, 100))
        const result = {
          title: document.querySelector('.ui-popconfirm__title span:last-child')?.textContent,
          buttons: Array.from(document.querySelectorAll('.ui-popconfirm__button')).map((node) => node.textContent),
          panelAfterEscape: false
        }
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        await new Promise((resolve) => setTimeout(resolve, 100))
        result.panelAfterEscape = document.querySelector('.ui-popconfirm__panel') === null
        app.unmount()
        host.remove()
        return result
      }

      const localized = await mountCase({
        popconfirm: { title: 'Delete this row?', confirm: 'OK', cancel: 'No' }
      })
      const partial = await mountCase({ popconfirm: { confirm: 'OK' } })
      return { localized, partial }
    })

    expect(detail.localized.title).toBe('Delete this row?')
    expect(detail.localized.buttons).toEqual(['No', 'OK'])
    expect(detail.localized.panelAfterEscape).toBe(true)
    expect(detail.partial.title).toBe('确定执行此操作吗？')
    expect(detail.partial.buttons).toEqual(['取消', 'OK'])
  })
})
