import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Dialog } from '@ui-kit-full'

// happy-dom 没有布局引擎，offsetWidth 恒为 0，可聚焦判定会全部落空；
// 与 focus-trap.spec.ts 同法：只在测试内让原型返回非零尺寸，断言对象仍是焦点落在哪个元素
const proto = window.HTMLElement.prototype
let originalDescriptor: PropertyDescriptor | undefined

function mountDialog(props: Record<string, any> = {}, slots: Record<string, (scope?: any) => unknown> = {}) {
  // 打开时整块 teleport 到 body，wrapper.html() 只剩传送门注释，断言需要直接查 body
  const wrapper = mount(Dialog, {
    props: { modelValue: true, title: '提示', ...props },
    slots,
    attachTo: document.body
  })
  mounted.push(wrapper)
  return wrapper
}

function panel() {
  return document.querySelector('.ui-dialog__panel') as HTMLElement | null
}

// 打开时整块内容 teleport 到 body，wrapper 根节点只剩传送门占位，
// 类名与样式都要从 body 上的容器元素读取
function container() {
  return document.querySelector('.ui-dialog') as HTMLElement | null
}

function containerClasses() {
  return Array.from(container()?.classList ?? [])
}

async function click(selector: string) {
  const el = document.querySelector(selector)
  if (!el) {
    throw new Error(`未找到 ${selector}`)
  }
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
}

const mounted: Array<ReturnType<typeof mount>> = []

beforeEach(() => {
  document.body.innerHTML = ''
  document.documentElement.style.overflow = ''
  originalDescriptor = Object.getOwnPropertyDescriptor(proto, 'offsetWidth')
  Object.defineProperty(proto, 'offsetWidth', { configurable: true, get: () => 100 })
})

afterEach(async () => {
  // 逐个卸载，避免残留实例继续占用 keydown 监听与滚动锁计数
  while (mounted.length) {
    const wrapper = mounted.pop()
    await wrapper?.unmount()
  }
  document.body.innerHTML = ''
  document.documentElement.style.overflow = ''
  if (originalDescriptor) {
    Object.defineProperty(proto, 'offsetWidth', originalDescriptor)
  }
})

describe('Dialog', () => {
  it('关闭时只留隐藏容器且不渲染面板', () => {
    const wrapper = mount(Dialog, { props: { modelValue: false, title: '提示' } })
    expect(wrapper.classes()).toContain('ui-dialog')
    expect(wrapper.classes()).toContain('is-hidden')
    expect(panel()).toBeNull()
  })

  it('打开时渲染遮罩、面板、标题与内容', () => {
    mountDialog({ slots: undefined } as Record<string, any>, { default: () => '正文内容' })
    expect(panel()?.getAttribute('role')).toBe('dialog')
    expect(document.querySelector('.ui-dialog__mask')).not.toBeNull()
    expect(document.querySelector('.ui-dialog__panel__title')?.textContent).toBe('提示')
    expect(document.querySelector('.ui-dialog__panel__body')?.textContent).toContain('正文内容')
    expect(document.querySelector('.ui-dialog__panel__close')).not.toBeNull()
  })

  it('footer 插槽渲染页脚', () => {
    mountDialog({}, { footer: () => '确认' })
    expect(document.querySelector('.ui-dialog__panel__footer')?.textContent).toBe('确认')
  })

  it('header 插槽覆盖标题文案', () => {
    mountDialog({}, { header: () => '自定义头' })
    expect(document.querySelector('.ui-dialog__panel__title')?.textContent).toBe('自定义头')
  })

  it('close 插槽替换关闭按钮内容，并通过作用域 close 回调关闭', async () => {
    let closeFromSlot: (() => void) | undefined
    const wrapper = mountDialog(
      {},
      {
        close: (scope: { close: () => void }) => {
          closeFromSlot = scope.close
          return h('span', { class: 'my-close' }, '自定义关闭')
        }
      }
    )
    const button = document.querySelector('.ui-dialog__panel__close')
    expect(button?.querySelector('.my-close')?.textContent).toBe('自定义关闭')
    closeFromSlot?.()
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('提供 close 插槽时即使 showClose=false 也渲染关闭按钮', () => {
    mountDialog({ showClose: false }, { close: () => 'X' })
    expect(document.querySelector('.ui-dialog__panel__close')?.textContent).toBe('X')
  })

  it('无插槽时正文为空', () => {
    mountDialog()
    expect(document.querySelector('.ui-dialog__panel__body')?.textContent).toBe('')
  })

  it('点击关闭按钮抛出 update:modelValue(false) 与 close', async () => {
    const wrapper = mountDialog()
    await click('.ui-dialog__panel__close')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('点击遮罩关闭', async () => {
    const wrapper = mountDialog()
    await click('.ui-dialog__mask')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('closeOnClickModal=false 时遮罩不关闭', async () => {
    const wrapper = mountDialog({ closeOnClickModal: false })
    await click('.ui-dialog__mask')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('Escape 关闭', async () => {
    const wrapper = mountDialog()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('closeOnPressEscape=false 时 Escape 无效', async () => {
    const wrapper = mountDialog({ closeOnPressEscape: false })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  // 原缺陷 F-7：beforeClose 只参与 is-closable 类名推导，
  // 关闭路径没走它，异步确认无处生效；现在关闭按钮 / 遮罩 / Escape 都交给 beforeClose(done)
  it('beforeClose 不调用 done 时保持打开', async () => {
    const beforeClose = vi.fn((_done: () => void) => undefined)
    const wrapper = mountDialog({ beforeClose })
    await click('.ui-dialog__panel__close')
    expect(beforeClose).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(panel()).not.toBeNull()
  })

  it('beforeClose 的 done 触发关闭并抛 close', async () => {
    const beforeClose = vi.fn((done: () => void) => done())
    const wrapper = mountDialog({ beforeClose })
    await click('.ui-dialog__panel__close')
    expect(beforeClose).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('beforeClose 同样拦截遮罩点击与 Escape', async () => {
    const wrapper = mountDialog({ beforeClose: () => undefined })
    await click('.ui-dialog__mask')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('showClose=false 隐藏关闭按钮但保留标题', () => {
    mountDialog({ showClose: false })
    expect(document.querySelector('.ui-dialog__panel__close')).toBeNull()
    expect(document.querySelector('.ui-dialog__panel__title')?.textContent).toBe('提示')
  })

  // 原缺陷 F-9：features/modal 的 className 是无条件常量，
  // 遮罩能按 modal 去掉，但类名恒定，挂在该类名上的主题样式会误命中
  it('modal=false 不渲染遮罩也不带 ui-dialog--modal 类名', () => {
    mountDialog({ modal: false })
    expect(document.querySelector('.ui-dialog__mask')).toBeNull()
    expect(containerClasses()).not.toContain('ui-dialog--modal')
  })

  it('默认带遮罩时输出 ui-dialog--modal 类名', () => {
    mountDialog()
    expect(containerClasses()).toContain('ui-dialog--modal')
  })

  it('width / top 写入面板样式', () => {
    mountDialog({ width: 520, top: '24px' })
    const style = panel()?.getAttribute('style') ?? ''
    expect(style).toContain('width: 520px')
    expect(style).toContain('margin-top: 24px')
    expect(style).toContain('align-self: flex-start')
  })

  it('未指定 top 时保持垂直居中', () => {
    mountDialog({ width: '60%' })
    const style = panel()?.getAttribute('style') ?? ''
    expect(style).toContain('width: 60%')
    expect(style).not.toContain('align-self')
  })

  it('center / alignCenter / overflow 映射类名', () => {
    mountDialog({ center: true, alignCenter: true, overflow: true })
    expect(containerClasses()).toContain('is-center')
    expect(containerClasses()).toContain('is-align-center')
    expect(containerClasses()).toContain('is-overflow')
  })

  it('fullscreen 切全屏并交由样式接管尺寸', () => {
    mountDialog({ fullscreen: true, width: 500 })
    expect(containerClasses()).toContain('ui-dialog--fullscreen')
    expect(panel()?.getAttribute('style') ?? '').toBe('')
  })

  it('zIndex 落到容器层叠样式', () => {
    mountDialog({ zIndex: 3000 })
    expect(container()?.getAttribute('style') ?? '').toContain('z-index: 3000')
  })

  it('lockScroll 打开期间锁定滚动并在关闭后恢复', async () => {
    const wrapper = mountDialog({ lockScroll: true })
    await nextTick()
    expect(document.documentElement.style.overflow).toBe('hidden')
    await wrapper.setProps({ modelValue: false })
    await nextTick()
    expect(document.documentElement.style.overflow).not.toBe('hidden')
  })

  it('draggable 标记可拖拽类名', () => {
    mountDialog({ draggable: true })
    expect(containerClasses()).toContain('ui-dialog--draggable')
    mounted.pop()?.unmount()
    document.body.innerHTML = ''
    mountDialog({ draggable: true, fullscreen: true })
    expect(containerClasses()).not.toContain('ui-dialog--draggable')
  })

  it('关闭后从 body 移除面板', async () => {
    const wrapper = mountDialog()
    expect(panel()).not.toBeNull()
    await wrapper.setProps({ modelValue: false })
    await nextTick()
    expect(panel()).toBeNull()
  })

  // A9：dialog 接入 focus-trap 的焦点闭环
  it('打开时焦点移入容器内第一个可交互元素', async () => {
    const trigger = document.createElement('button')
    trigger.className = 'dlg-trigger'
    document.body.appendChild(trigger)
    trigger.focus()
    mountDialog(
      {},
      { default: () => [h('button', { class: 'dlg-first' }, '一'), h('button', { class: 'dlg-last' }, '二')] }
    )
    await nextTick()
    // 完整特性下头部自带关闭按钮，它就是容器内第一个可交互元素
    expect((document.activeElement as HTMLElement).className).toContain('ui-dialog__panel__close')
  })

  it('Tab / Shift+Tab 在容器内循环', async () => {
    mountDialog(
      {},
      { default: () => [h('button', { class: 'dlg-first' }, '一'), h('button', { class: 'dlg-last' }, '二')] }
    )
    await nextTick()
    const first = document.querySelector('.ui-dialog__panel__close') as HTMLElement
    const last = document.querySelector('.dlg-last') as HTMLElement
    last.focus()

    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    last.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)

    const shift = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })
    first.dispatchEvent(shift)
    expect(shift.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(last)
  })

  it('关闭后焦点归还触发元素', async () => {
    const trigger = document.createElement('button')
    trigger.className = 'dlg-trigger'
    document.body.appendChild(trigger)
    trigger.focus()
    const wrapper = mountDialog({}, { default: () => [h('button', { class: 'dlg-first' }, '一')] })
    await nextTick()
    expect(document.activeElement).not.toBe(trigger)
    await wrapper.setProps({ modelValue: false })
    await nextTick()
    expect(document.activeElement).toBe(trigger)
  })
})
