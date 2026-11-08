import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { openScene, type Session } from './_session'

/**
 * time-picker 键盘可操作性契约（真实 Chromium）：Enter/ArrowDown 打开面板、
 * 列项 ArrowUp/Down 漫游（跳过禁用项）、Enter 确认、Escape 关闭并归还触发字段。
 * happy-dom 没有真实焦点链，焦点进出 teleport 面板只有真浏览器能证。
 */
describe('浏览器层 · time-picker 键盘可操作性', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('floating')
  })

  afterAll(async () => {
    await session?.close()
  })

  async function mountPicker(kind: 'plain' | 'disabled-hour' = 'plain') {
    await session.page.evaluate(async (variant) => {
      const previous = (window as unknown as { __tpCleanup?: () => void }).__tpCleanup
      previous?.()
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      host.id = 'tp-key-host'
      document.body.appendChild(host)
      const extra = variant === 'disabled-hour' ? { disabledHours: () => [10] } : {}
      const app = createApp({
        data: () => ({ value: '09:24:36' }),
        render(this: { value: string }) {
          return h(kit.TimePicker, {
            modelValue: this.value,
            'onUpdate:modelValue': (next: string) => {
              this.value = next
              ;(window as unknown as { __tpValue?: string }).__tpValue = next
            },
            popperClass: 'panel-tp-key',
            ...extra
          })
        }
      })
      app.mount(host)
      ;(window as unknown as { __tpCleanup?: () => void }).__tpCleanup = () => {
        app.unmount()
        host.remove()
      }
      await new Promise((resolve) => setTimeout(resolve, 10))
    }, kind)
  }

  async function activeDetail() {
    return session.page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null
      return {
        panelExists: Boolean(document.querySelector('.panel-tp-key')),
        activeIsItem: Boolean(active?.classList.contains('ui-time-picker__time-item')),
        activeText: active?.textContent ?? ''
      }
    })
  }

  it('trigger 上 Enter 打开面板，焦点落在首列选中项', async () => {
    await mountPicker()
    await session.page.evaluate(() => {
      ;(document.querySelector('.ui-time-picker__trigger') as HTMLElement).focus()
    })
    await session.page.keyboard.press('Enter')
    await session.page.waitForTimeout(50)
    const detail = await activeDetail()
    expect(detail.panelExists).toBe(true)
    expect(detail.activeIsItem).toBe(true)
    expect(detail.activeText).toBe('09')
  })

  it('trigger 上 ArrowDown 打开面板', async () => {
    await mountPicker()
    await session.page.evaluate(() => {
      ;(document.querySelector('.ui-time-picker__trigger') as HTMLElement).focus()
    })
    await session.page.keyboard.press('ArrowDown')
    await session.page.waitForTimeout(50)
    const detail = await activeDetail()
    expect(detail.panelExists).toBe(true)
    expect(detail.activeIsItem).toBe(true)
  })

  it('ArrowUp/Down 在列项间漫游并跳过禁用项', async () => {
    await mountPicker('disabled-hour')
    await session.page.evaluate(() => {
      ;(document.querySelector('.ui-time-picker__trigger') as HTMLElement).focus()
    })
    await session.page.keyboard.press('Enter')
    await session.page.waitForTimeout(50)
    expect((await activeDetail()).activeText).toBe('09')
    await session.page.keyboard.press('ArrowDown')
    expect((await activeDetail()).activeText).toBe('11')
    await session.page.keyboard.press('ArrowUp')
    expect((await activeDetail()).activeText).toBe('09')
  })

  it('Enter 确认聚焦列项并写回', async () => {
    await mountPicker()
    await session.page.evaluate(() => {
      ;(document.querySelector('.ui-time-picker__trigger') as HTMLElement).focus()
    })
    await session.page.keyboard.press('Enter')
    await session.page.waitForTimeout(50)
    await session.page.keyboard.press('ArrowDown')
    await session.page.keyboard.press('Enter')
    await session.page.waitForTimeout(50)
    const detail = await session.page.evaluate(() => ({
      emitted: (window as unknown as { __tpValue?: string }).__tpValue ?? '',
      inputValue: (document.querySelector('#tp-key-host input') as HTMLInputElement | null)?.value ?? ''
    }))
    expect(detail.emitted).toBe('10:24:36')
    expect(detail.inputValue).toBe('10:24:36')
  })

  it('Escape 关闭面板并归还焦点到触发字段', async () => {
    await mountPicker()
    await session.page.evaluate(() => {
      ;(document.querySelector('.ui-time-picker__trigger') as HTMLElement).focus()
    })
    await session.page.keyboard.press('Enter')
    await session.page.waitForTimeout(50)
    expect((await activeDetail()).panelExists).toBe(true)
    await session.page.keyboard.press('Escape')
    await session.page.waitForTimeout(50)
    const detail = await session.page.evaluate(() => ({
      panelExists: Boolean(document.querySelector('.panel-tp-key')),
      returnedToTrigger: document.activeElement === document.querySelector('.ui-time-picker__trigger')
    }))
    expect(detail.panelExists).toBe(false)
    expect(detail.returnedToTrigger).toBe(true)
  })
})
