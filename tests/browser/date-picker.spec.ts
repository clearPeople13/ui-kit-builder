import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { openScene, type Session } from './_session'

/**
 * date-picker 键盘可操作性契约（真实 Chromium）：Enter/ArrowDown 打开面板、
 * 日格方向键漫游（跳过禁用日）、Enter 选中、Escape 关闭并归还触发元素。
 * happy-dom 没有真实焦点链，焦点进出 teleport 面板只有真浏览器能证。
 */
describe('浏览器层 · date-picker 键盘可操作性', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('floating')
  })

  afterAll(async () => {
    await session?.close()
  })

  async function mountPicker(kind: 'plain' | 'disabled-day' = 'plain') {
    await session.page.evaluate(async (variant) => {
      const previous = (window as unknown as { __dpCleanup?: () => void }).__dpCleanup
      previous?.()
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      host.id = 'dp-key-host'
      document.body.appendChild(host)
      const extra = variant === 'disabled-day' ? { disabledDate: (date: Date) => date.getDate() === 7 } : {}
      const app = createApp({
        data: () => ({ value: '2026-11-06' }),
        render(this: { value: string }) {
          return h(kit.DatePicker, {
            modelValue: this.value,
            'onUpdate:modelValue': (next: string) => {
              this.value = next
              ;(window as unknown as { __dpValue?: string }).__dpValue = next
            },
            popperClass: 'panel-dp-key',
            ...extra
          })
        }
      })
      app.mount(host)
      ;(window as unknown as { __dpCleanup?: () => void }).__dpCleanup = () => {
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
        panelExists: Boolean(document.querySelector('.panel-dp-key')),
        activeIsCell: Boolean(active?.classList.contains('ui-date-picker__cell')),
        activeText: active?.textContent ?? ''
      }
    })
  }

  it('trigger 上 Enter 打开面板，焦点落入已选日格', async () => {
    await mountPicker()
    await session.page.evaluate(() => {
      ;(document.querySelector('.ui-date-picker__trigger') as HTMLElement).focus()
    })
    await session.page.keyboard.press('Enter')
    await session.page.waitForTimeout(50)
    const detail = await activeDetail()
    expect(detail.panelExists).toBe(true)
    expect(detail.activeIsCell).toBe(true)
    expect(detail.activeText).toBe('6')
  })

  it('trigger 上 ArrowDown 打开面板', async () => {
    await mountPicker()
    await session.page.evaluate(() => {
      ;(document.querySelector('.ui-date-picker__trigger') as HTMLElement).focus()
    })
    await session.page.keyboard.press('ArrowDown')
    await session.page.waitForTimeout(50)
    const detail = await activeDetail()
    expect(detail.panelExists).toBe(true)
    expect(detail.activeIsCell).toBe(true)
  })

  it('方向键在日格间漫游并跳过禁用日', async () => {
    await mountPicker('disabled-day')
    await session.page.evaluate(() => {
      ;(document.querySelector('.ui-date-picker__trigger') as HTMLElement).focus()
    })
    await session.page.keyboard.press('Enter')
    await session.page.waitForTimeout(50)
    expect((await activeDetail()).activeText).toBe('6')
    await session.page.keyboard.press('ArrowRight')
    expect((await activeDetail()).activeText).toBe('8')
    await session.page.keyboard.press('ArrowDown')
    expect((await activeDetail()).activeText).toBe('15')
    await session.page.keyboard.press('ArrowUp')
    expect((await activeDetail()).activeText).toBe('8')
    await session.page.keyboard.press('ArrowLeft')
    expect((await activeDetail()).activeText).toBe('6')
  })

  it('Enter 选中聚焦日格并关闭面板', async () => {
    await mountPicker()
    await session.page.evaluate(() => {
      ;(document.querySelector('.ui-date-picker__trigger') as HTMLElement).focus()
    })
    await session.page.keyboard.press('Enter')
    await session.page.waitForTimeout(50)
    await session.page.keyboard.press('ArrowRight')
    await session.page.keyboard.press('Enter')
    await session.page.waitForTimeout(50)
    const detail = await session.page.evaluate(() => ({
      panelExists: Boolean(document.querySelector('.panel-dp-key')),
      emitted: (window as unknown as { __dpValue?: string }).__dpValue ?? ''
    }))
    expect(detail.panelExists).toBe(false)
    expect(detail.emitted).toBe('2026-11-07')
  })

  it('Escape 关闭面板并归还焦点到触发元素', async () => {
    await mountPicker()
    await session.page.evaluate(() => {
      ;(document.querySelector('.ui-date-picker__trigger') as HTMLElement).focus()
    })
    await session.page.keyboard.press('Enter')
    await session.page.waitForTimeout(50)
    expect((await activeDetail()).panelExists).toBe(true)
    await session.page.keyboard.press('Escape')
    await session.page.waitForTimeout(50)
    const detail = await session.page.evaluate(() => ({
      panelExists: Boolean(document.querySelector('.panel-dp-key')),
      returnedToTrigger: document.activeElement === document.querySelector('.ui-date-picker__trigger')
    }))
    expect(detail.panelExists).toBe(false)
    expect(detail.returnedToTrigger).toBe(true)
  })
})
