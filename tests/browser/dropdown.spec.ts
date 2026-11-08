import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { openScene, type Session } from './_session'

/**
 * a11y GAP 批次的浏览器层契约：dropdown 的键盘可操作性（打开移交焦点 / roving tabindex /
 * 方向键导航跳过禁用项 / Enter 选中 / Escape 归还触发器）只有真实 Chromium 能证——
 * happy-dom 没有焦点链，焦点移交与归还断言在那里恒为假阳性。
 */
describe('浏览器层 · dropdown 键盘可操作性', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('floating')
  })

  afterAll(async () => {
    await session?.close()
  })

  it('Enter 打开面板并把焦点移交首个菜单项，禁用项退出 Tab 序', async () => {
    const detail = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        render() {
          return h(
            kit.Dropdown,
            { trigger: 'click', popperClass: 'panel-kbd-drop' },
            {
              default: () => h('button', {}, '更多操作'),
              dropdown: () =>
                h(
                  kit.DropdownMenu,
                  {},
                  {
                    default: () => [
                      h(kit.DropdownItem, {}, { default: () => '编辑' }),
                      h(kit.DropdownItem, { disabled: true }, { default: () => '复制' }),
                      h(kit.DropdownItem, {}, { default: () => '删除' })
                    ]
                  }
                )
            }
          )
        }
      })
      app.mount(host)
      await new Promise((resolve) => setTimeout(resolve, 10))
      const trigger = host.querySelector('.ui-dropdown__trigger') as HTMLElement
      trigger.focus()
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      const items = Array.from(document.querySelectorAll('.panel-kbd-drop .ui-dropdown-item')) as HTMLElement[]
      const result = {
        expanded: trigger.getAttribute('aria-expanded'),
        haspopup: trigger.getAttribute('aria-haspopup'),
        panelHeight: (document.querySelector('.panel-kbd-drop') as HTMLElement).getBoundingClientRect().height,
        activeIsFirst: document.activeElement === items[0],
        activeRole: (document.activeElement as HTMLElement).getAttribute('role'),
        firstTabindex: items[0].getAttribute('tabindex'),
        disabledTabindex: items[1].getAttribute('tabindex'),
        lastTabindex: items[2].getAttribute('tabindex')
      }
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      app.unmount()
      host.remove()
      return result
    })

    expect(detail.expanded).toBe('true')
    expect(detail.haspopup).toBe('menu')
    expect(detail.panelHeight).toBeGreaterThan(0)
    expect(detail.activeIsFirst).toBe(true)
    expect(detail.activeRole).toBe('menuitem')
    expect(detail.firstTabindex).toBe('0')
    expect(detail.disabledTabindex).toBeNull()
    expect(detail.lastTabindex).toBe('-1')
  })

  it('方向键在可导航项间循环移动并跳过禁用项', async () => {
    const detail = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        render() {
          return h(
            kit.Dropdown,
            { trigger: 'click', popperClass: 'panel-kbd-drop' },
            {
              default: () => h('button', {}, '更多操作'),
              dropdown: () =>
                h(
                  kit.DropdownMenu,
                  {},
                  {
                    default: () => [
                      h(kit.DropdownItem, {}, { default: () => '编辑' }),
                      h(kit.DropdownItem, { disabled: true }, { default: () => '复制' }),
                      h(kit.DropdownItem, {}, { default: () => '删除' })
                    ]
                  }
                )
            }
          )
        }
      })
      app.mount(host)
      await new Promise((resolve) => setTimeout(resolve, 10))
      const trigger = host.querySelector('.ui-dropdown__trigger') as HTMLElement
      trigger.focus()
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      const items = Array.from(document.querySelectorAll('.panel-kbd-drop .ui-dropdown-item')) as HTMLElement[]
      const press = (key: string) =>
        (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
      press('ArrowDown')
      const skippedToLast = document.activeElement === items[2]
      press('ArrowDown')
      const wrappedToFirst = document.activeElement === items[0]
      press('ArrowUp')
      const backToLast = document.activeElement === items[2]
      const result = { skippedToLast, wrappedToFirst, backToLast }
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      app.unmount()
      host.remove()
      return result
    })

    expect(detail.skippedToLast).toBe(true)
    expect(detail.wrappedToFirst).toBe(true)
    expect(detail.backToLast).toBe(true)
  })

  it('Enter 选中当前项并收起面板，焦点归还触发器', async () => {
    const detail = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        data: () => ({ clicks: [] as string[] }),
        render(this: { clicks: string[] }) {
          return h(
            kit.Dropdown,
            { trigger: 'click', popperClass: 'panel-kbd-drop' },
            {
              default: () => h('button', {}, '更多操作'),
              dropdown: () =>
                h(
                  kit.DropdownMenu,
                  {},
                  {
                    default: () => [
                      h(kit.DropdownItem, { onClick: () => this.clicks.push('edit') }, { default: () => '编辑' }),
                      h(kit.DropdownItem, { onClick: () => this.clicks.push('delete') }, { default: () => '删除' })
                    ]
                  }
                )
            }
          )
        }
      })
      const vm = app.mount(host) as unknown as { clicks: string[] }
      await new Promise((resolve) => setTimeout(resolve, 10))
      const trigger = host.querySelector('.ui-dropdown__trigger') as HTMLElement
      trigger.focus()
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      ;(document.activeElement as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      )
      const focusedLast = (document.activeElement as HTMLElement).textContent
      ;(document.activeElement as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      )
      await new Promise((resolve) => setTimeout(resolve, 50))
      const panel = document.querySelector('.panel-kbd-drop') as HTMLElement
      const result = {
        focusedLast,
        clicks: [...vm.clicks],
        closed: panel.getBoundingClientRect().height === 0,
        activeIsTrigger: document.activeElement === trigger
      }
      app.unmount()
      host.remove()
      return result
    })

    expect(detail.focusedLast).toBe('删除')
    expect(detail.clicks).toEqual(['delete'])
    expect(detail.closed).toBe(true)
    expect(detail.activeIsTrigger).toBe(true)
  })

  it('Escape 收起面板并把焦点归还触发元素', async () => {
    const detail = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        render() {
          return h(
            kit.Dropdown,
            { trigger: 'click', popperClass: 'panel-kbd-drop' },
            {
              default: () => h('button', {}, '更多操作'),
              dropdown: () =>
                h(kit.DropdownMenu, {}, { default: () => [h(kit.DropdownItem, {}, { default: () => '编辑' })] })
            }
          )
        }
      })
      app.mount(host)
      await new Promise((resolve) => setTimeout(resolve, 10))
      const trigger = host.querySelector('.ui-dropdown__trigger') as HTMLElement
      trigger.focus()
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      const openedElsewhere = document.activeElement !== trigger
      ;(document.activeElement as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      )
      await new Promise((resolve) => setTimeout(resolve, 50))
      const panel = document.querySelector('.panel-kbd-drop') as HTMLElement
      const result = {
        openedElsewhere,
        closed: panel.getBoundingClientRect().height === 0,
        returnedToTrigger: document.activeElement === trigger
      }
      app.unmount()
      host.remove()
      return result
    })

    expect(detail.openedElsewhere).toBe(true)
    expect(detail.closed).toBe(true)
    expect(detail.returnedToTrigger).toBe(true)
  })

  it('鼠标点击打开不抢夺焦点', async () => {
    const detail = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        render() {
          return h(
            kit.Dropdown,
            { trigger: 'click', popperClass: 'panel-kbd-drop' },
            {
              default: () => h('button', {}, '更多操作'),
              dropdown: () =>
                h(kit.DropdownMenu, {}, { default: () => [h(kit.DropdownItem, {}, { default: () => '编辑' })] })
            }
          )
        }
      })
      app.mount(host)
      await new Promise((resolve) => setTimeout(resolve, 10))
      const trigger = host.querySelector('.ui-dropdown__trigger') as HTMLElement
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      const panel = document.querySelector('.panel-kbd-drop') as HTMLElement
      const result = {
        opened: panel.getBoundingClientRect().height > 0,
        focusKeptOutside: document.activeElement === document.body
      }
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      app.unmount()
      host.remove()
      return result
    })

    expect(detail.opened).toBe(true)
    expect(detail.focusKeptOutside).toBe(true)
  })
})
