import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { expectSilent, openScene, probeValue, type Session } from './_session'

/**
 * 浏览器层 · cascader / cascader-panel 键盘可操作性场景契约：
 * trigger 纯 div 只有 Escape 时对键盘是死的，面板节点无 tabindex/roving，
 * 这套用例在真实 Chromium 里回查 Enter 开合、方向键漫游（含跳过禁用）、
 * Enter 选中、Escape 关闭归还焦点，与 menu/tree 的键盘口径对齐。
 */
describe('浏览器层 · cascader 键盘可操作性', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('floating')
  })

  afterAll(async () => {
    await session?.close()
  })

  it('trigger 上 Enter 打开面板，焦点移入首个节点', async () => {
    const result = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const options = [
        { value: 'zj', label: '浙江', children: [{ value: 'hz', label: '杭州' }] },
        { value: 'js', label: '江苏', children: [{ value: 'nj', label: '南京' }] }
      ]
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        data: () => ({ value: '' }),
        render(this: { value: string }) {
          return h(kit.Cascader, {
            options,
            modelValue: this.value,
            'onUpdate:modelValue': (next: string) => {
              this.value = next
            },
            popperClass: 'kb-cascader-panel'
          })
        }
      })
      app.mount(host)
      await new Promise((resolve) => setTimeout(resolve, 20))
      const trigger = host.querySelector('.ui-cascader__trigger') as HTMLElement
      trigger.focus()
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      const active = document.activeElement as HTMLElement | null
      const detail = {
        expanded: trigger.getAttribute('aria-expanded'),
        activeIsNode: active?.classList.contains('ui-cascader__node') ?? false,
        activeText: active?.textContent ?? ''
      }
      app.unmount()
      host.remove()
      return detail
    })

    expect(result.expanded).toBe('true')
    expect(result.activeIsNode).toBe(true)
    expect(result.activeText).toBe('浙江')
  })

  it('方向键漫游：↓ 跳过禁用，→ 进入子列首项，← 收起子列或回父级', async () => {
    const result = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const options = [
        { value: 'zj', label: '浙江', children: [{ value: 'hz', label: '杭州' }] },
        { value: 'ah', label: '安徽', disabled: true },
        { value: 'js', label: '江苏', children: [{ value: 'nj', label: '南京' }] }
      ]
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        data: () => ({ value: '' }),
        render(this: { value: string }) {
          return h(kit.Cascader, {
            options,
            modelValue: this.value,
            'onUpdate:modelValue': (next: string) => {
              this.value = next
            },
            popperClass: 'kb-cascader-roam'
          })
        }
      })
      app.mount(host)
      await new Promise((resolve) => setTimeout(resolve, 20))
      const trigger = host.querySelector('.ui-cascader__trigger') as HTMLElement
      trigger.focus()
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      const key = async (value: string) => {
        document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true }))
        await new Promise((resolve) => setTimeout(resolve, 50))
        return (document.activeElement as HTMLElement | null)?.textContent ?? ''
      }
      const panel = document.querySelector('.kb-cascader-roam') as HTMLElement
      const down = await key('ArrowDown')
      const right = await key('ArrowRight')
      const columnsAfterRight = panel.querySelectorAll('.ui-cascader__column').length
      const left = await key('ArrowLeft')
      const columnsAfterLeft = panel.querySelectorAll('.ui-cascader__column').length
      const leftAgain = await key('ArrowLeft')
      const columnsAfterCollapse = panel.querySelectorAll('.ui-cascader__column').length
      const detail = { down, right, columnsAfterRight, left, columnsAfterLeft, leftAgain, columnsAfterCollapse }
      app.unmount()
      host.remove()
      return detail
    })

    expect(result.down).toBe('江苏')
    expect(result.right).toBe('南京')
    expect(result.columnsAfterRight).toBe(2)
    expect(result.left).toBe('江苏')
    expect(result.columnsAfterLeft).toBe(2)
    expect(result.columnsAfterCollapse).toBe(1)
  })

  it('节点上 Enter 选中叶子：抛出路径、关闭面板并归还焦点给 trigger', async () => {
    const result = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const options = [
        { value: 'zj', label: '浙江', children: [{ value: 'hz', label: '杭州' }] },
        { value: 'js', label: '江苏', children: [{ value: 'nj', label: '南京' }] }
      ]
      const emitted: unknown[] = []
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        data: () => ({ value: '' }),
        render(this: { value: string }) {
          return h(kit.Cascader, {
            options,
            modelValue: this.value,
            'onUpdate:modelValue': (next: unknown) => {
              emitted.push(next)
              this.value = next as string
            },
            popperClass: 'kb-cascader-select'
          })
        }
      })
      app.mount(host)
      await new Promise((resolve) => setTimeout(resolve, 20))
      const trigger = host.querySelector('.ui-cascader__trigger') as HTMLElement
      trigger.focus()
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      const detail = {
        emitted,
        expanded: trigger.getAttribute('aria-expanded'),
        focusBackOnTrigger: document.activeElement === trigger
      }
      app.unmount()
      host.remove()
      return detail
    })

    expect(result.emitted).toEqual([['zj', 'hz']])
    expect(result.expanded).toBe('false')
    expect(result.focusBackOnTrigger).toBe(true)
  })

  it('节点上 Escape 关闭面板并归还焦点给 trigger', async () => {
    const result = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const options = [{ value: 'zj', label: '浙江' }]
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        data: () => ({ value: '' }),
        render(this: { value: string }) {
          return h(kit.Cascader, {
            options,
            modelValue: this.value,
            'onUpdate:modelValue': (next: string) => {
              this.value = next
            },
            popperClass: 'kb-cascader-escape'
          })
        }
      })
      app.mount(host)
      await new Promise((resolve) => setTimeout(resolve, 20))
      const trigger = host.querySelector('.ui-cascader__trigger') as HTMLElement
      trigger.focus()
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      const focusInsidePanel = document.activeElement?.classList.contains('ui-cascader__node') ?? false
      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      const detail = {
        focusInsidePanel,
        expanded: trigger.getAttribute('aria-expanded'),
        focusBackOnTrigger: document.activeElement === trigger
      }
      app.unmount()
      host.remove()
      return detail
    })

    expect(result.focusInsidePanel).toBe(true)
    expect(result.expanded).toBe('false')
    expect(result.focusBackOnTrigger).toBe(true)
  })

  it('filterable 输入框 Enter 选中首个搜索结果', async () => {
    const result = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const options = [
        { value: 'zj', label: '浙江', children: [{ value: 'hz', label: '杭州' }] },
        { value: 'js', label: '江苏', children: [{ value: 'nj', label: '南京' }] }
      ]
      const emitted: unknown[] = []
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        data: () => ({ value: '' }),
        render(this: { value: string }) {
          return h(kit.Cascader, {
            options,
            filterable: true,
            modelValue: this.value,
            'onUpdate:modelValue': (next: unknown) => {
              emitted.push(next)
              this.value = next as string
            },
            popperClass: 'kb-cascader-filter'
          })
        }
      })
      app.mount(host)
      await new Promise((resolve) => setTimeout(resolve, 20))
      const input = host.querySelector('.ui-cascader__input') as HTMLInputElement
      input.focus()
      input.value = '南京'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      // filterable 特性默认 debounce 300，必须等过 debounce 再断言命中列表
      await new Promise((resolve) => setTimeout(resolve, 400))
      const hitCount = document.querySelectorAll('.kb-cascader-filter .ui-cascader__node').length
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      const detail = { hitCount, emitted }
      app.unmount()
      host.remove()
      return detail
    })

    expect(result.hitCount).toBe(1)
    expect(result.emitted).toEqual([['js', 'nj']])
  })

  it('cascader-panel 节点可聚焦：roving 单 Tab 停靠，方向键漫游并 Enter 选中', async () => {
    const result = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const options = [
        { value: 'zj', label: '浙江', children: [{ value: 'hz', label: '杭州' }] },
        { value: 'ah', label: '安徽', disabled: true },
        { value: 'js', label: '江苏', children: [{ value: 'nj', label: '南京' }] }
      ]
      const emitted: unknown[] = []
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        data: () => ({ value: '' }),
        render(this: { value: string }) {
          return h(kit.CascaderPanel, {
            options,
            modelValue: this.value,
            'onUpdate:modelValue': (next: unknown) => {
              emitted.push(next)
              this.value = next as string
            }
          })
        }
      })
      app.mount(host)
      await new Promise((resolve) => setTimeout(resolve, 20))
      const nodes = Array.from(host.querySelectorAll<HTMLElement>('.ui-cascader-panel__node'))
      const tabStops = nodes.map((node) => node.getAttribute('tabindex'))
      const listbox = host.querySelector('.ui-cascader-panel__column')?.getAttribute('role')
      nodes[0].focus()
      const key = async (value: string) => {
        document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true }))
        await new Promise((resolve) => setTimeout(resolve, 50))
        return (document.activeElement as HTMLElement | null)?.textContent ?? ''
      }
      const down = await key('ArrowDown')
      const right = await key('ArrowRight')
      const enter = await key('Enter')
      const detail = { tabStops, listbox, down, right, enter, emitted }
      app.unmount()
      host.remove()
      return detail
    })

    // 与 tree 口径一致：禁用节点整体退出 Tab 序（tabindex 不渲染）
    expect(result.tabStops).toEqual(['0', null, '-1'])
    expect(result.listbox).toBe('listbox')
    expect(result.down).toBe('江苏')
    expect(result.right).toBe('南京')
    expect(result.enter).toBe('南京')
    expect(result.emitted).toEqual([['js', 'nj']])
  })

  it('clear 与 tag-close 是原生 button，键盘 Enter 可清空与删标签', async () => {
    await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const options = [
        { value: 'zj', label: '浙江', children: [{ value: 'hz', label: '杭州' }] },
        { value: 'js', label: '江苏', children: [{ value: 'nj', label: '南京' }] }
      ]
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        data: () => ({
          value: [
            ['zj', 'hz'],
            ['js', 'nj']
          ]
        }),
        render(this: { value: string[][] }) {
          return h(kit.Cascader, {
            options,
            multiple: true,
            clearable: true,
            modelValue: this.value,
            'onUpdate:modelValue': (next: string[][]) => {
              this.value = next
              window.__probe!.cascaderKbValue = next
            }
          })
        }
      })
      app.mount(host)
      const store = window as unknown as Record<string, unknown>
      store.__cascaderKbHost = host
      store.__cascaderKbApp = app
      await new Promise((resolve) => setTimeout(resolve, 20))
      const tagClose = host.querySelector('.ui-cascader__tag-close')
      const clear = host.querySelector('.ui-cascader__clear')
      window.__probe!.cascaderButtonTags = [tagClose?.tagName, clear?.tagName]
      ;(tagClose as HTMLElement).focus()
    })

    await session.page.keyboard.press('Enter')
    await session.page.waitForTimeout(50)
    expect(await probeValue(session.page, 'cascaderKbValue')).toEqual([['js', 'nj']])

    await session.page.evaluate(() => {
      ;(document.querySelector('.ui-cascader__clear') as HTMLElement).focus()
    })
    await session.page.keyboard.press('Enter')
    await session.page.waitForTimeout(50)
    expect(await probeValue(session.page, 'cascaderKbValue')).toEqual([])
    expect(await probeValue(session.page, 'cascaderButtonTags')).toEqual(['BUTTON', 'BUTTON'])

    await session.page.evaluate(() => {
      const store = window as unknown as Record<string, any>
      store.__cascaderKbApp.unmount()
      store.__cascaderKbHost.remove()
    })
  })

  it('全流程控制台无告警', () => {
    expectSilent(session.messages, 'cascader 键盘场景')
  })
})
