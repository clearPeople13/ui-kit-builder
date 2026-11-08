import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { openScene, type Session } from './_session'

/**
 * G3 a11y 批次的浏览器层场景契约：dialog 接入 focus-trap 后，
 * 打开移焦 / Tab 圈禁 / 关闭归还触发元素必须经真实浏览器回查——
 * 单测在 happy-dom 里靠 mock offsetWidth 才能判定可聚焦，这里零 mock。
 */
describe('浏览器层 · dialog 焦点闭环（G3）', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('floating')
  })

  afterAll(async () => {
    await session?.close()
  })

  it('打开时焦点移入面板内第一个可交互元素', async () => {
    const result = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        data: () => ({ open: false }),
        render(this: { open: boolean }) {
          return [
            h('button', { id: 'dialog-trigger' }, '打开'),
            h(
              kit.Dialog,
              { modelValue: this.open, title: '提示' },
              { default: () => [h('button', { id: 'dialog-body-btn' }, '正文操作')] }
            )
          ]
        }
      })
      const vm = app.mount(host) as unknown as { open: boolean }
      vm.open = true
      await new Promise((resolve) => setTimeout(resolve, 10))
      const panel = document.querySelector('.ui-dialog__panel') as HTMLElement | null
      const active = document.activeElement as HTMLElement | null
      const detail = {
        panelExists: !!panel,
        activeInPanel: !!(panel && active && panel.contains(active)),
        activeClass: active?.className ?? active?.id ?? ''
      }
      vm.open = false
      await new Promise((resolve) => setTimeout(resolve, 10))
      app.unmount()
      host.remove()
      return detail
    })

    expect(result.panelExists).toBe(true)
    expect(result.activeInPanel).toBe(true)
  })

  it('Tab 在面板内圈禁：末尾可交互元素按 Tab 回卷到首个', async () => {
    const result = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        data: () => ({ open: true }),
        render(this: { open: boolean }) {
          return h(
            kit.Dialog,
            { modelValue: this.open, title: '提示' },
            { default: () => [h('button', { id: 'dialog-body-btn' }, '正文操作')] }
          )
        }
      })
      const vm = app.mount(host) as unknown as { open: boolean }
      await new Promise((resolve) => setTimeout(resolve, 10))
      const panel = document.querySelector('.ui-dialog__panel') as HTMLElement
      const focusables = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const last = focusables[focusables.length - 1]
      last.focus()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
      const wrapped = document.activeElement as HTMLElement | null
      const detail = {
        focusableCount: focusables.length,
        wrappedInPanel: !!(wrapped && panel.contains(wrapped)),
        wrappedIsFirst: wrapped === focusables[0]
      }
      vm.open = false
      await new Promise((resolve) => setTimeout(resolve, 10))
      app.unmount()
      host.remove()
      return detail
    })

    expect(result.focusableCount).toBeGreaterThan(1)
    expect(result.wrappedInPanel).toBe(true)
    expect(result.wrappedIsFirst).toBe(true)
  })

  it('关闭后焦点归还触发元素', async () => {
    const result = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        data: () => ({ open: false }),
        render(this: { open: boolean }) {
          return [
            h('button', { id: 'dialog-trigger' }, '打开'),
            h(kit.Dialog, { modelValue: this.open, title: '提示' }, { default: () => '正文' })
          ]
        }
      })
      const vm = app.mount(host) as unknown as { open: boolean }
      const trigger = document.getElementById('dialog-trigger') as HTMLElement
      trigger.focus()
      vm.open = true
      await new Promise((resolve) => setTimeout(resolve, 10))
      const openedElsewhere = document.activeElement !== trigger
      vm.open = false
      await new Promise((resolve) => setTimeout(resolve, 10))
      const detail = { openedElsewhere, returnedToTrigger: document.activeElement === trigger }
      app.unmount()
      host.remove()
      return detail
    })

    expect(result.openedElsewhere).toBe(true)
    expect(result.returnedToTrigger).toBe(true)
  })
})
