import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Drawer } from '@ui-kit-full'
import {
  drawerResizeSign,
  enableDrawerResize,
  isHorizontalDirection,
  maxDrawerSize,
  resolveDrawerSize
} from '../../packages/ui-kit/src/components/drawer/features/draggable/resize'

const mounted: ReturnType<typeof mount>[] = []

function mountDrawer(props: Record<string, any> = {}, slots: Record<string, (scope?: any) => unknown> = {}) {
  // 打开时整块容器 teleport 到 body，wrapper 根节点只剩传送门占位，类名与结构都要从 body 读
  const wrapper = mount(Drawer, {
    props: { modelValue: true, title: '抽屉标题', ...props },
    slots,
    attachTo: document.body
  })
  mounted.push(wrapper)
  return wrapper
}

function container() {
  return document.querySelector('.ui-drawer') as HTMLElement | null
}

function containerClasses() {
  return Array.from(container()?.classList ?? [])
}

function panel() {
  return document.querySelector('.ui-drawer__panel') as HTMLElement | null
}

async function click(selector: string) {
  const el = document.querySelector(selector)
  if (!el) {
    throw new Error(`未找到 ${selector}`)
  }
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
}

beforeEach(() => {
  document.body.innerHTML = ''
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
})

afterEach(async () => {
  // 逐个卸载，避免残留实例继续占用 keydown 监听与滚动锁计数
  while (mounted.length) {
    const wrapper = mounted.pop()
    await wrapper?.unmount()
  }
  document.body.innerHTML = ''
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
})

describe('Drawer 抽屉', () => {
  it('关闭时只留隐藏容器，不渲染面板与遮罩', () => {
    const wrapper = mount(Drawer, { props: { modelValue: false, title: '提示' } })
    expect(wrapper.classes()).toContain('ui-drawer')
    expect(wrapper.classes()).toContain('is-hidden')
    expect(panel()).toBeNull()
    expect(document.querySelector('.ui-drawer__mask')).toBeNull()
  })

  it('打开时遮罩与面板 teleport 到 body，标题正文落位', () => {
    mountDrawer({}, { default: () => '抽屉正文' })
    expect(container()?.parentElement).toBe(document.body)
    expect(panel()?.getAttribute('role')).toBe('dialog')
    expect(document.querySelector('.ui-drawer__mask')).not.toBeNull()
    expect(document.querySelector('.ui-drawer__panel__title')?.textContent).toBe('抽屉标题')
    expect(document.querySelector('.ui-drawer__panel__body')?.textContent).toContain('抽屉正文')
    expect(document.querySelector('.ui-drawer__panel__close')).not.toBeNull()
  })

  it('direction 落类名，默认 rtl', () => {
    mountDrawer()
    expect(containerClasses()).toContain('ui-drawer--rtl')
    mounted.pop()?.unmount()
    document.body.innerHTML = ''
    mountDrawer({ direction: 'ltr' })
    expect(containerClasses()).toContain('ui-drawer--ltr')
  })

  it('size 缺省 30% 写入面板宽度，width 优先于 size', () => {
    mountDrawer()
    expect(panel()?.getAttribute('style') ?? '').toContain('width: 30%')
    mounted.pop()?.unmount()
    document.body.innerHTML = ''
    mountDrawer({ size: 420, width: 520 })
    expect(panel()?.getAttribute('style') ?? '').toContain('width: 520px')
  })

  it('top 写入 marginTop 并改为顶部对齐', () => {
    mountDrawer({ top: '24px' })
    const style = panel()?.getAttribute('style') ?? ''
    expect(style).toContain('margin-top: 24px')
    expect(style).toContain('align-self: flex-start')
  })

  it('header 插槽覆盖标题，footer 插槽渲染页脚', () => {
    mountDrawer({}, { header: () => '自定义头', footer: () => '页脚操作' })
    expect(document.querySelector('.ui-drawer__panel__title')?.textContent).toBe('自定义头')
    expect(document.querySelector('.ui-drawer__panel__footer')?.textContent).toBe('页脚操作')
  })

  it('close 插槽替换关闭按钮内容，并通过作用域 close 回调关闭', async () => {
    let closeFromSlot: (() => void) | undefined
    const wrapper = mountDrawer(
      {},
      {
        close: (scope: { close: () => void }) => {
          closeFromSlot = scope.close
          return h('span', { class: 'my-close' }, '自定义关闭')
        }
      }
    )
    const button = document.querySelector('.ui-drawer__panel__close')
    expect(button?.querySelector('.my-close')?.textContent).toBe('自定义关闭')
    closeFromSlot?.()
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('提供 close 插槽时即使 showClose=false 也渲染关闭按钮', () => {
    mountDrawer({ showClose: false }, { close: () => 'X' })
    expect(document.querySelector('.ui-drawer__panel__close')?.textContent).toBe('X')
  })

  it('点击关闭按钮抛出 update:modelValue(false) 与 close', async () => {
    const wrapper = mountDrawer()
    await click('.ui-drawer__panel__close')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('点击遮罩关闭，closeOnClickModal=false 时不关闭', async () => {
    const wrapper = mountDrawer()
    await click('.ui-drawer__mask')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    mounted.pop()?.unmount()
    document.body.innerHTML = ''

    const guarded = mountDrawer({ closeOnClickModal: false })
    await click('.ui-drawer__mask')
    expect(guarded.emitted('update:modelValue')).toBeUndefined()
    expect(panel()).not.toBeNull()
  })

  it('Escape 关闭，closeOnPressEscape=false 时无效', async () => {
    const wrapper = mountDrawer()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    mounted.pop()?.unmount()
    document.body.innerHTML = ''

    const blocked = mountDrawer({ closeOnPressEscape: false })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(blocked.emitted('update:modelValue')).toBeUndefined()
    expect(blocked.emitted('close')).toBeUndefined()
  })

  it('beforeClose 不调 done 时拦截关闭', async () => {
    const beforeClose = vi.fn((_done: () => void) => undefined)
    const wrapper = mountDrawer({ beforeClose })
    await click('.ui-drawer__panel__close')
    expect(beforeClose).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(panel()).not.toBeNull()
  })

  it('beforeClose 的 done 触发关闭并抛 close', async () => {
    const doneCalls: Array<() => void> = []
    const wrapper = mountDrawer({
      beforeClose: (done: () => void) => {
        doneCalls.push(done)
        done()
      }
    })
    await click('.ui-drawer__panel__close')
    expect(doneCalls).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('showClose=false 去掉关闭按钮与 is-closable 类名', () => {
    mountDrawer({ showClose: false })
    expect(containerClasses()).not.toContain('is-closable')
    expect(document.querySelector('.ui-drawer__panel__close')).toBeNull()
    expect(document.querySelector('.ui-drawer__panel__title')?.textContent).toBe('抽屉标题')
  })

  it('closeIcon 自定义关闭图标并保留 closable 类名', () => {
    mountDrawer({ closeIcon: () => h('i', { class: 'probe-close-icon' }) })
    expect(containerClasses()).toContain('is-closable')
    expect(document.querySelector('.ui-drawer__panel__close i.probe-close-icon')).not.toBeNull()
  })

  it('modal=false 不渲染遮罩也不带 ui-drawer--modal 类名', () => {
    mountDrawer({ modal: false })
    expect(document.querySelector('.ui-drawer__mask')).toBeNull()
    expect(containerClasses()).not.toContain('ui-drawer--modal')
  })

  it('默认带遮罩时输出 ui-drawer--modal 类名', () => {
    mountDrawer()
    expect(containerClasses()).toContain('ui-drawer--modal')
  })

  it('lockScroll 打开期间锁定滚动并在关闭后恢复', async () => {
    const wrapper = mountDrawer()
    await nextTick()
    expect(document.documentElement.style.overflow).toBe('hidden')
    await wrapper.setProps({ modelValue: false })
    await nextTick()
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('lockScroll=false 时不锁滚动', async () => {
    mountDrawer({ lockScroll: false })
    await nextTick()
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('fullscreen 挂类名并让面板内联尺寸交给样式接管', () => {
    mountDrawer({ fullscreen: true, width: 500 })
    expect(containerClasses()).toContain('ui-drawer--fullscreen')
    expect(panel()?.getAttribute('style') ?? '').toBe('')
  })

  it('draggable / resizable 挂类名，全屏时抑制', () => {
    mountDrawer({ draggable: true, resizable: true })
    expect(containerClasses()).toContain('ui-drawer--draggable')
    expect(containerClasses()).toContain('ui-drawer--resizable')
    mounted.pop()?.unmount()
    document.body.innerHTML = ''
    mountDrawer({ draggable: true, fullscreen: true })
    expect(containerClasses()).not.toContain('ui-drawer--draggable')
  })

  it('resizable 把手节点由特性挂载到面板内', () => {
    mountDrawer({ resizable: true })
    expect(document.querySelector('.ui-drawer__panel .ui-drawer__resizer')).not.toBeNull()
  })

  it('appendTo 可指向自定义节点（浮层特性）', () => {
    const host = document.createElement('div')
    host.id = 'drawer-host'
    document.body.appendChild(host)
    mountDrawer({ appendTo: '#drawer-host' })
    expect(host.contains(container())).toBe(true)
  })

  it('ui-drawer--popper 结构性类名恒挂', () => {
    mountDrawer()
    expect(containerClasses()).toContain('ui-drawer--popper')
  })

  it('center / alignCenter / overflow 映射状态类名', () => {
    mountDrawer({ center: true, alignCenter: true, overflow: true })
    expect(containerClasses()).toContain('is-center')
    expect(containerClasses()).toContain('is-align-center')
    expect(containerClasses()).toContain('is-overflow')
  })

  it('zIndex 落到容器层叠样式', () => {
    mountDrawer({ zIndex: 3000 })
    expect(container()?.getAttribute('style') ?? '').toContain('z-index: 3000')
  })

  it('快速开合不残留重复面板', async () => {
    const wrapper = mountDrawer()
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    await nextTick()
    expect(document.querySelectorAll('.ui-drawer__panel')).toHaveLength(1)
    await wrapper.setProps({ modelValue: false })
    await nextTick()
    expect(panel()).toBeNull()
  })

  describe('拖拽与缩放', () => {
    function pointer(type: string, init: PointerEventInit = {}) {
      return new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, ...init })
    }

    function createPanel(width = '300px', height = '200px') {
      const element = document.createElement('div')
      element.style.width = width
      element.style.height = height
      document.body.appendChild(element)
      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        width: Number.parseFloat(width),
        height: Number.parseFloat(height),
        top: 0,
        bottom: Number.parseFloat(height),
        left: 0,
        right: Number.parseFloat(width),
        x: 0,
        y: 0,
        toJSON: () => ({})
      } as DOMRect)
      return element
    }

    afterEach(() => {
      vi.restoreAllMocks()
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    })

    it('方向归一：左右横向、rtl/btt 取反向符号', () => {
      expect(isHorizontalDirection('rtl')).toBe(true)
      expect(isHorizontalDirection('ltr')).toBe(true)
      expect(isHorizontalDirection('ttb')).toBe(false)
      expect(isHorizontalDirection('btt')).toBe(false)
      expect(drawerResizeSign('rtl')).toBe(-1)
      expect(drawerResizeSign('btt')).toBe(-1)
      expect(drawerResizeSign('ltr')).toBe(1)
      expect(drawerResizeSign('ttb')).toBe(1)
    })

    it('尺寸钳制：默认最小 200，最大为视口减两侧 8px', () => {
      expect(maxDrawerSize(1000)).toBe(984)
      expect(maxDrawerSize(100)).toBe(200)
      expect(resolveDrawerSize(300, 50, 'rtl', 1000)).toBe(250)
      expect(resolveDrawerSize(300, 50, 'ltr', 1000)).toBe(350)
      expect(resolveDrawerSize(300, 50, 'btt', 1000)).toBe(250)
      expect(resolveDrawerSize(300, 50, 'ttb', 1000)).toBe(350)
      expect(resolveDrawerSize(210, -100, 'ltr', 1000)).toBe(200)
      expect(resolveDrawerSize(900, 500, 'ltr', 1000)).toBe(984)
      expect(resolveDrawerSize(300, 0, 'rtl', 100)).toBe(200)
    })

    it('rtl 横向拖拽按反向增量写宽度，pointerup 后不再响应', () => {
      const element = createPanel()
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1000)
      const dispose = enableDrawerResize(element, { enabled: () => true, direction: () => 'rtl' })
      const handle = element.querySelector('.ui-drawer__resizer') as HTMLElement
      expect(handle).not.toBeNull()

      handle.dispatchEvent(pointer('pointerdown', { clientX: 500, clientY: 100 }))
      expect(document.body.style.cursor).toBe('col-resize')
      expect(document.body.style.userSelect).toBe('none')
      window.dispatchEvent(pointer('pointermove', { clientX: 450 }))
      expect(element.style.width).toBe('350px')
      window.dispatchEvent(pointer('pointerup'))
      expect(document.body.style.cursor).toBe('')
      expect(document.body.style.userSelect).toBe('')
      window.dispatchEvent(pointer('pointermove', { clientX: 600 }))
      expect(element.style.width).toBe('350px')
      dispose()
    })

    it('ttb 纵向拖拽写高度并在 pointercancel 后停止', () => {
      const element = createPanel()
      const dispose = enableDrawerResize(element, { enabled: () => true, direction: () => 'ttb' })
      const handle = element.querySelector('.ui-drawer__resizer') as HTMLElement
      handle.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 200 }))
      expect(document.body.style.cursor).toBe('row-resize')
      window.dispatchEvent(pointer('pointermove', { clientY: 250 }))
      expect(element.style.height).toBe('250px')
      window.dispatchEvent(pointer('pointercancel'))
      expect(document.body.style.cursor).toBe('')
      window.dispatchEvent(pointer('pointermove', { clientY: 400 }))
      expect(element.style.height).toBe('250px')
      dispose()
    })

    it('禁用态、非左键不启动手势', () => {
      const element = createPanel()
      let enabled = false
      const dispose = enableDrawerResize(element, { enabled: () => enabled, direction: () => 'ltr' })
      const handle = element.querySelector('.ui-drawer__resizer') as HTMLElement
      handle.dispatchEvent(pointer('pointerdown', { clientX: 100 }))
      expect(document.body.style.cursor).toBe('')
      window.dispatchEvent(pointer('pointermove', { clientX: 200 }))
      expect(element.style.width).toBe('300px')

      enabled = true
      handle.dispatchEvent(pointer('pointerdown', { button: 1, clientX: 100 }))
      expect(document.body.style.cursor).toBe('')
      dispose()
    })

    it('卸载清理：恢复初始尺寸、移除把手与进行中的手势', () => {
      const element = createPanel('320px', '240px')
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1000)
      const dispose = enableDrawerResize(element, { enabled: () => true, direction: () => 'ltr' })
      const handle = element.querySelector('.ui-drawer__resizer') as HTMLElement
      handle.dispatchEvent(pointer('pointerdown', { clientX: 100 }))
      window.dispatchEvent(pointer('pointermove', { clientX: 150 }))
      expect(element.style.width).toBe('370px')
      dispose()
      expect(element.querySelector('.ui-drawer__resizer')).toBeNull()
      expect(element.style.width).toBe('320px')
      expect(element.style.height).toBe('240px')
      expect(document.body.style.cursor).toBe('')
      expect(document.body.style.userSelect).toBe('')
      window.dispatchEvent(pointer('pointermove', { clientX: 300 }))
      expect(element.style.width).toBe('320px')
    })

    it('抽屉头部拖拽改变 translate 并被视口边界钳制，关闭按钮不触发', async () => {
      mountDrawer({ draggable: true })
      await nextTick()
      const header = document.querySelector('.ui-drawer__panel__header') as HTMLElement
      const panelEl = panel() as HTMLElement
      vi.spyOn(panelEl, 'getBoundingClientRect').mockReturnValue({
        left: 20,
        top: 20,
        right: 320,
        bottom: 520,
        width: 300,
        height: 500,
        x: 20,
        y: 20,
        toJSON: () => ({})
      } as DOMRect)

      header.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100 }))
      window.dispatchEvent(pointer('pointermove', { clientX: 150, clientY: 140 }))
      expect(panelEl.style.transform).toBe('translate3d(50px, 40px, 0)')

      window.dispatchEvent(pointer('pointermove', { clientX: -1000, clientY: -1000 }))
      expect(panelEl.style.transform).toBe('translate3d(-12px, -12px, 0)')
      window.dispatchEvent(pointer('pointerup'))
      expect(document.body.style.cursor).toBe('')

      const close = document.querySelector('.ui-drawer__panel__close') as HTMLElement
      close.dispatchEvent(pointer('pointerdown', { clientX: 500, clientY: 500 }))
      window.dispatchEvent(pointer('pointermove', { clientX: 600, clientY: 600 }))
      expect(panelEl.style.transform).toBe('translate3d(-12px, -12px, 0)')
      window.dispatchEvent(pointer('pointerup'))
      await mounted.pop()?.unmount()
      expect(panelEl.style.transform).toBe('')
    })

    it('未开启 draggable / 全屏时头部拖拽不改变位置', async () => {
      mountDrawer()
      await nextTick()
      const plainHeader = document.querySelector('.ui-drawer__panel__header') as HTMLElement
      plainHeader.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100 }))
      window.dispatchEvent(pointer('pointermove', { clientX: 200, clientY: 200 }))
      expect(panel()?.style.transform ?? '').toBe('')
      window.dispatchEvent(pointer('pointerup'))
      mounted.pop()?.unmount()
      document.body.innerHTML = ''

      mountDrawer({ draggable: true, fullscreen: true })
      await nextTick()
      const fullHeader = document.querySelector('.ui-drawer__panel__header') as HTMLElement
      fullHeader.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100 }))
      window.dispatchEvent(pointer('pointermove', { clientX: 200, clientY: 200 }))
      expect(panel()?.style.transform ?? '').toBe('')
      window.dispatchEvent(pointer('pointerup'))
      mounted.pop()?.unmount()
      document.body.innerHTML = ''
    })
  })
})
