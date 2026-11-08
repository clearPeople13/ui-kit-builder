import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { openScene, type Session } from './_session'

/**
 * a11y GAP 批次的浏览器层契约：color-picker 的键盘可操作性（Enter 打开移焦 /
 * SV·色相·透明度滑杆 role=slider 方向键步进 / Escape 收起归还触发器）
 * 只有真实 Chromium 能证——happy-dom 没有焦点链与真实矩形，滑杆步进和焦点归还在那里测不到。
 */
describe('浏览器层 · color-picker 键盘可操作性', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('floating')
  })

  afterAll(async () => {
    await session?.close()
  })

  it('Enter 打开面板并把焦点移入 SV 滑杆，ARIA 口径对齐 slider 规范', async () => {
    const detail = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        data: () => ({ color: '#e64b4b' }),
        render(this: { color: string }) {
          return h(kit.ColorPicker, {
            modelValue: this.color,
            showAlpha: true,
            popperClass: 'panel-kbd-color',
            'onUpdate:modelValue': (value: string) => {
              this.color = value
            }
          })
        }
      })
      app.mount(host)
      await new Promise((resolve) => setTimeout(resolve, 10))
      const trigger = document.querySelector('.ui-color-picker__trigger') as HTMLElement
      trigger.focus()
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      const panel = document.querySelector('.panel-kbd-color') as HTMLElement
      const sv = document.querySelector('.panel-kbd-color .ui-color-picker__sv') as HTMLElement
      const hue = document.querySelector('.panel-kbd-color .ui-color-picker__hue') as HTMLElement
      const alpha = document.querySelector('.panel-kbd-color .ui-color-picker__alpha') as HTMLElement
      const result = {
        expanded: trigger.getAttribute('aria-expanded'),
        panelHeight: panel.getBoundingClientRect().height,
        activeIsSv: document.activeElement === sv,
        svRole: sv.getAttribute('role'),
        svTabindex: sv.getAttribute('tabindex'),
        svValueMin: sv.getAttribute('aria-valuemin'),
        svValueMax: sv.getAttribute('aria-valuemax'),
        svValueNow: sv.getAttribute('aria-valuenow'),
        svValueText: sv.getAttribute('aria-valuetext'),
        hueRole: hue.getAttribute('role'),
        hueTabindex: hue.getAttribute('tabindex'),
        hueValueMax: hue.getAttribute('aria-valuemax'),
        alphaRole: alpha.getAttribute('role'),
        alphaValueNow: alpha.getAttribute('aria-valuenow')
      }
      ;(document.activeElement as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      )
      await new Promise((resolve) => setTimeout(resolve, 50))
      app.unmount()
      host.remove()
      return result
    })

    expect(detail.expanded).toBe('true')
    expect(detail.panelHeight).toBeGreaterThan(0)
    expect(detail.activeIsSv).toBe(true)
    expect(detail.svRole).toBe('slider')
    expect(detail.svTabindex).toBe('0')
    expect(detail.svValueMin).toBe('0')
    expect(detail.svValueMax).toBe('100')
    expect(detail.svValueNow).not.toBeNull()
    expect(detail.svValueText).toContain('饱和度')
    expect(detail.hueRole).toBe('slider')
    expect(detail.hueTabindex).toBe('0')
    expect(detail.hueValueMax).toBe('360')
    expect(detail.alphaRole).toBe('slider')
    expect(detail.alphaValueNow).toBe('100')
  })

  it('SV 滑杆方向键步进饱和度与明度并写回色值', async () => {
    const detail = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        data: () => ({ color: '#e64b4b' }),
        render(this: { color: string }) {
          return h(kit.ColorPicker, {
            modelValue: this.color,
            popperClass: 'panel-kbd-color',
            'onUpdate:modelValue': (value: string) => {
              this.color = value
            }
          })
        }
      })
      const vm = app.mount(host) as unknown as { color: string }
      await new Promise((resolve) => setTimeout(resolve, 10))
      const trigger = document.querySelector('.ui-color-picker__trigger') as HTMLElement
      trigger.focus()
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      const sv = document.querySelector('.panel-kbd-color .ui-color-picker__sv') as HTMLElement
      const nowBefore = Number(sv.getAttribute('aria-valuenow'))
      const textBefore = sv.getAttribute('aria-valuetext')
      sv.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 20))
      const nowAfterRight = Number(sv.getAttribute('aria-valuenow'))
      const textAfterRight = sv.getAttribute('aria-valuetext')
      sv.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 20))
      const textAfterUp = sv.getAttribute('aria-valuetext')
      const hexInput = document.querySelector('.panel-kbd-color .ui-color-picker__hex') as HTMLInputElement
      const result = {
        nowBefore,
        nowAfterRight,
        textBefore,
        textAfterRight,
        textAfterUp,
        color: vm.color,
        hexInputValue: hexInput.value
      }
      ;(document.activeElement as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      )
      await new Promise((resolve) => setTimeout(resolve, 50))
      app.unmount()
      host.remove()
      return result
    })

    expect(detail.nowAfterRight).toBe(detail.nowBefore + 1)
    expect(detail.textAfterRight).not.toBe(detail.textBefore)
    expect(detail.textAfterUp).not.toBe(detail.textAfterRight)
    expect(detail.color).toMatch(/^#[0-9a-f]{6}$/)
    expect(detail.color).not.toBe('#e64b4b')
    expect(detail.hexInputValue).toBe(detail.color)
  })

  it('色相与透明度滑杆方向键步进并同步 ARIA 值', async () => {
    const detail = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        data: () => ({ color: '#e64b4b' }),
        render(this: { color: string }) {
          return h(kit.ColorPicker, {
            modelValue: this.color,
            showAlpha: true,
            popperClass: 'panel-kbd-color',
            'onUpdate:modelValue': (value: string) => {
              this.color = value
            }
          })
        }
      })
      app.mount(host)
      await new Promise((resolve) => setTimeout(resolve, 10))
      const trigger = document.querySelector('.ui-color-picker__trigger') as HTMLElement
      trigger.focus()
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      const hue = document.querySelector('.panel-kbd-color .ui-color-picker__hue') as HTMLElement
      const alpha = document.querySelector('.panel-kbd-color .ui-color-picker__alpha') as HTMLElement
      const hueBefore = Number(hue.getAttribute('aria-valuenow'))
      hue.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 20))
      const hueAfter = Number(hue.getAttribute('aria-valuenow'))
      const alphaBefore = Number(alpha.getAttribute('aria-valuenow'))
      alpha.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 20))
      const alphaAfter = Number(alpha.getAttribute('aria-valuenow'))
      const result = { hueBefore, hueAfter, alphaBefore, alphaAfter }
      ;(document.activeElement as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      )
      await new Promise((resolve) => setTimeout(resolve, 50))
      app.unmount()
      host.remove()
      return result
    })

    expect(detail.hueAfter).toBe(detail.hueBefore + 1)
    expect(detail.alphaAfter).toBe(detail.alphaBefore - 1)
  })

  it('Escape 收起面板并把焦点归还触发器', async () => {
    const detail = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        data: () => ({ color: '#e64b4b' }),
        render(this: { color: string }) {
          return h(kit.ColorPicker, {
            modelValue: this.color,
            popperClass: 'panel-kbd-color',
            'onUpdate:modelValue': (value: string) => {
              this.color = value
            }
          })
        }
      })
      app.mount(host)
      await new Promise((resolve) => setTimeout(resolve, 10))
      const trigger = document.querySelector('.ui-color-picker__trigger') as HTMLElement
      trigger.focus()
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      const openedElsewhere = document.activeElement !== trigger
      ;(document.activeElement as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      )
      await new Promise((resolve) => setTimeout(resolve, 50))
      const panel = document.querySelector('.panel-kbd-color') as HTMLElement
      const result = {
        openedElsewhere,
        closed: panel.style.display === 'none' || panel.getBoundingClientRect().height === 0,
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
})
