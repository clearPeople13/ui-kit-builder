import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Notification } from '@ui-kit-full'

// Notification 走 overlayConfig(visibleKey: modelValue, defaultVisible: true)，
// modelValue 已声明为受控通道：传 false 时不渲染面板，关闭按钮抛 update:modelValue(false)。
const mounted: Array<ReturnType<typeof mount>> = []

function mountNotif(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  const wrapper = mount(Notification, {
    props: { title: '标题文字', message: '通知正文内容', ...props },
    slots,
    attachTo: document.body
  })
  mounted.push(wrapper)
  return wrapper
}

function panel() {
  return document.querySelector('.ui-notification__panel') as HTMLElement | null
}

async function click(selector: string, root: ParentNode = document) {
  const el = root.querySelector(selector)
  if (!el) {
    throw new Error(`未找到 ${selector}`)
  }
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
}

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(async () => {
  while (mounted.length) {
    const wrapper = mounted.pop()
    await wrapper?.unmount()
  }
  document.body.innerHTML = ''
})

describe('Notification', () => {
  it('默认渲染：右上位置、可关闭与常驻 popper 类', async () => {
    const wrapper = mountNotif()
    await nextTick()
    expect(wrapper.classes()).toContain('ui-notification')
    expect(wrapper.classes()).toContain('ui-notification--top-right')
    expect(wrapper.classes()).toContain('is-closable')
    expect(wrapper.classes()).toContain('ui-notification--popper')
    expect(panel()?.getAttribute('role')).toBe('dialog')
    expect(document.querySelector('.ui-notification__panel__title')?.textContent).toBe('标题文字')
    expect(document.querySelector('.ui-notification__panel__body')?.textContent).toContain('通知正文内容')
    expect(document.querySelector('.ui-notification__panel__close')).not.toBeNull()
    expect(document.querySelector('.ui-notification__mask')).toBeNull()
  })

  it('type 落类型类并渲染语义图标', async () => {
    const wrapper = mountNotif({ type: 'success' })
    await nextTick()
    expect(wrapper.classes()).toContain('ui-notification--success')
    expect(document.querySelector('.ui-notification__panel__header svg')).not.toBeNull()
  })

  it('position 变体落位置类', async () => {
    const wrapper = mountNotif({ position: 'bottom-left' })
    await nextTick()
    expect(wrapper.classes()).toContain('ui-notification--bottom-left')
  })

  it('id 显式落到根节点属性', async () => {
    const wrapper = mountNotif({ id: 'notify-1' })
    await nextTick()
    expect(wrapper.element.getAttribute('id')).toBe('notify-1')
  })

  it('zIndex 显式优先，缺省走自增层级', async () => {
    const explicit = mountNotif({ zIndex: 4500 })
    await nextTick()
    expect(explicit.element.getAttribute('style') ?? '').toContain('z-index: 4500')
    const auto = mountNotif()
    await nextTick()
    expect(auto.element.getAttribute('style') ?? '').toMatch(/z-index:\s*2\d{3}/)
  })

  it('offset 写入 --ui-notification-offset CSS 变量（缺省显式写 0px）', async () => {
    const offset = mountNotif({ offset: 20 })
    await nextTick()
    expect(offset.element.getAttribute('style') ?? '').toContain('--ui-notification-offset: 20px')
    const zero = mountNotif()
    await nextTick()
    expect(zero.element.getAttribute('style') ?? '').toContain('--ui-notification-offset: 0px')
  })

  it('message 支持 VNode 内容', async () => {
    const wrapper = mountNotif({ message: h('em', { class: 'mn' }, '富文本通知') })
    await nextTick()
    expect(wrapper.element.querySelector('.ui-notification__panel__body .mn')?.textContent).toBe('富文本通知')
  })

  it('slot 契约：header / default / footer 覆盖并回退 title / message', async () => {
    const slotted = mountNotif(
      { title: '属性标题', message: '属性正文' },
      { header: () => '插槽标题', default: () => '插槽正文', footer: () => '插槽页脚' }
    )
    await nextTick()
    expect(document.querySelector('.ui-notification__panel__title')?.textContent).toBe('插槽标题')
    expect(document.querySelector('.ui-notification__panel__body')?.textContent).toBe('插槽正文')
    expect(document.querySelector('.ui-notification__panel__footer')?.textContent).toBe('插槽页脚')
    slotted.unmount()
    document.body.innerHTML = ''
    mountNotif()
    await nextTick()
    expect(document.querySelector('.ui-notification__panel__title')?.textContent).toBe('标题文字')
    expect(document.querySelector('.ui-notification__panel__body')?.textContent).toBe('通知正文内容')
    expect(document.querySelector('.ui-notification__panel__footer')).toBeNull()
  })

  it('slot 契约：close 插槽替换关闭按钮内容，并通过作用域 close 回调关闭', async () => {
    let closeFromSlot: (() => void) | undefined
    const wrapper = mountNotif(
      {},
      {
        close: (scope: { close: () => void }) => {
          closeFromSlot = scope.close
          return h('span', { class: 'notification-close' }, '自定义关闭')
        }
      }
    )
    await nextTick()
    expect(document.querySelector('.ui-notification__panel__close .notification-close')?.textContent).toBe('自定义关闭')
    closeFromSlot?.()
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('onClick 回调收到点击事件', async () => {
    const onClick = vi.fn()
    mountNotif({ onClick })
    await nextTick()
    await click('.ui-notification__panel')
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent)
  })

  it('showClose=false 移除关闭按钮（closable 类因 closeIcon 默认值仍在）', async () => {
    const wrapper = mountNotif({ showClose: false })
    await nextTick()
    expect(document.querySelector('.ui-notification__panel__close')).toBeNull()
    expect(wrapper.element.querySelector('.ui-notification__panel__title')?.textContent).toBe('标题文字')
    // 特性类门控只看 closeIcon 默认值非空，与按钮渲染门控（showClose）不同步
    expect(wrapper.classes()).toContain('is-closable')
  })

  it('icon 特性覆盖类型图标', async () => {
    const wrapper = mountNotif({ icon: () => h('i', { class: 'my-icon' }) })
    await nextTick()
    expect(wrapper.element.querySelector('.ui-notification__panel__header .my-icon')).not.toBeNull()
  })

  it('点击关闭按钮抛出 update:modelValue(false) 与 close 事件', async () => {
    const wrapper = mountNotif()
    await nextTick()
    await click('.ui-notification__panel__close')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('受控值 false 时不渲染面板', async () => {
    mountNotif({ modelValue: false })
    await nextTick()
    expect(panel()).toBeNull()
  })

  it('空正文与空标题时结构节点仍存在', async () => {
    mountNotif({ title: '', message: '' })
    await nextTick()
    expect(document.querySelector('.ui-notification__panel__body')?.textContent).toBe('')
    expect(panel()).not.toBeNull()
  })

  it('卸载后 body 无残留', async () => {
    const wrapper = mountNotif()
    await nextTick()
    wrapper.unmount()
    expect(document.querySelector('.ui-notification')).toBeNull()
    expect(panel()).toBeNull()
  })
})
