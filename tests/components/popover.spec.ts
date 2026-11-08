import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Popover } from '@ui-kit-full'

const mounted: ReturnType<typeof mount>[] = []

function mountPopover(props: Record<string, any> = {}, slots: Record<string, () => unknown> = {}) {
  const wrapper = mount(Popover, {
    props: { trigger: 'click', content: '浮层内容', ...props },
    slots: { default: () => h('button', { class: 'probe-trigger' }, '点开看看'), ...slots },
    attachTo: document.body
  })
  mounted.push(wrapper)
  return wrapper
}

function panel() {
  return document.querySelector('.ui-popover__panel') as HTMLElement | null
}

function isOpen() {
  const current = panel()
  return Boolean(current && current.getAttribute('aria-hidden') !== 'true' && current.style.display !== 'none')
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()!.unmount()
  }
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('Popover 浮层气泡', () => {
  it('默认插槽是触发区，面板收起时保留 DOM 并标记 aria-hidden', async () => {
    const wrapper = mountPopover()
    await nextTick()
    expect(wrapper.classes()).toEqual(['ui-popover', 'ui-popover--light', 'ui-popover--bottom', 'ui-popover--popper'])
    expect(wrapper.find('.ui-popover__trigger').text()).toBe('点开看看')
    expect(wrapper.find('.ui-popover__trigger').attributes('tabindex')).toBe('0')
    expect(wrapper.find('.ui-popover__trigger').attributes('aria-expanded')).toBe('false')
    expect(panel()!.getAttribute('aria-hidden')).toBe('true')
    expect(panel()!.style.display).toBe('none')
  })

  it('点击展开后渲染标题与内容并抛 visible-change', async () => {
    const wrapper = mountPopover({ title: '浮层标题' })
    await wrapper.trigger('click')
    await nextTick()
    expect(wrapper.find('.ui-popover__trigger').attributes('aria-expanded')).toBe('true')
    expect(isOpen()).toBe(true)
    expect(panel()!.querySelector('.ui-popover__title')!.textContent).toBe('浮层标题')
    expect(panel()!.querySelector('.ui-popover__content')!.textContent).toBe('浮层内容')
    expect(wrapper.emitted('visible-change')).toEqual([[true]])
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    await wrapper.trigger('click')
    await nextTick()
    expect(isOpen()).toBe(false)
    expect(wrapper.emitted('visible-change')).toEqual([[true], [false]])
    expect(wrapper.emitted('update:modelValue')).toEqual([[true], [false]])
  })

  it('未传 title 时不渲染标题行', async () => {
    const wrapper = mountPopover()
    await wrapper.trigger('click')
    await nextTick()
    expect(panel()!.querySelector('.ui-popover__title')).toBeNull()
    expect(panel()!.querySelector('.ui-popover__content')!.textContent).toBe('浮层内容')
  })

  it('content 插槽优先于 content 属性', async () => {
    const wrapper = mountPopover({}, { content: () => h('p', { class: 'slot-body' }, '插槽内容') })
    await wrapper.trigger('click')
    await nextTick()
    expect(panel()!.querySelector('.ui-popover__content')!.textContent).toBe('插槽内容')
    expect(panel()!.querySelector('.slot-body')).not.toBeNull()
  })

  it('slot 契约：default 渲染触发区，content 缺省回退 content 属性', async () => {
    const slotted = mountPopover(
      {},
      {
        default: () => h('span', { class: 'po-slot-trigger' }, '自定义触发器'),
        content: () => h('p', { class: 'po-slot-body' }, '插槽正文')
      }
    )
    await nextTick()
    expect(slotted.find('.ui-popover__trigger .po-slot-trigger').text()).toBe('自定义触发器')
    await slotted.trigger('click')
    await nextTick()
    expect(panel()!.querySelector('.po-slot-body')!.textContent).toBe('插槽正文')
    slotted.unmount()
    document.body.innerHTML = ''
    const fallback = mountPopover({ content: '属性正文' })
    await fallback.trigger('click')
    await nextTick()
    expect(panel()!.querySelector('.ui-popover__content')!.textContent).toBe('属性正文')
  })

  it('width 默认 150px，可覆盖面板宽度', async () => {
    const wrapper = mountPopover()
    await nextTick()
    expect(panel()!.style.width).toBe('150px')
    await wrapper.setProps({ width: 320 })
    expect(panel()!.style.width).toBe('320px')
    await wrapper.setProps({ width: '50%' })
    expect(panel()!.style.width).toBe('50%')
  })

  it('style 对象合并进面板且 width 优先生效', async () => {
    const wrapper = mountPopover({ style: { color: 'red', width: '999px' }, width: 200 })
    await wrapper.trigger('click')
    await nextTick()
    expect(panel()!.getAttribute('style')).toContain('color: red')
    expect(panel()!.style.width).toBe('200px')
  })

  it('悬停模式按 showAfter 展开、hideAfter 收起', async () => {
    vi.useFakeTimers()
    const wrapper = mountPopover({ trigger: 'hover', showAfter: 100, hideAfter: 300 })
    await wrapper.trigger('mouseenter')
    vi.advanceTimersByTime(99)
    await nextTick()
    expect(isOpen()).toBe(false)
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(isOpen()).toBe(true)
    await wrapper.trigger('mouseleave')
    vi.advanceTimersByTime(299)
    await nextTick()
    expect(isOpen()).toBe(true)
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(isOpen()).toBe(false)
  })

  it('可进入面板时停留在面板会取消收起计时', async () => {
    vi.useFakeTimers()
    const wrapper = mountPopover({ trigger: 'hover', hideAfter: 200 })
    await wrapper.trigger('mouseenter')
    await nextTick()
    expect(isOpen()).toBe(true)
    await wrapper.trigger('mouseleave')
    panel()!.dispatchEvent(new Event('mouseenter'))
    vi.advanceTimersByTime(500)
    await nextTick()
    expect(isOpen()).toBe(true)
  })

  it('enterable 为 false 时移入面板不再阻止收起', async () => {
    vi.useFakeTimers()
    const wrapper = mountPopover({ trigger: 'hover', hideAfter: 200, enterable: false })
    await wrapper.trigger('mouseenter')
    await nextTick()
    await wrapper.trigger('mouseleave')
    panel()!.dispatchEvent(new Event('mouseenter'))
    vi.advanceTimersByTime(400)
    await nextTick()
    expect(isOpen()).toBe(false)
  })

  it('autoClose 在展开若干毫秒后自动收起', async () => {
    vi.useFakeTimers()
    const wrapper = mountPopover({ autoClose: 500 })
    await wrapper.trigger('click')
    await nextTick()
    expect(isOpen()).toBe(true)
    vi.advanceTimersByTime(499)
    await nextTick()
    expect(isOpen()).toBe(true)
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(isOpen()).toBe(false)
    expect(wrapper.emitted('visible-change')).toEqual([[true], [false]])
  })

  it('面板内部点击不收起浮层', async () => {
    const wrapper = mountPopover()
    await wrapper.trigger('click')
    await nextTick()
    panel()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(isOpen()).toBe(true)
    expect(wrapper.emitted('visible-change')).toEqual([[true]])
  })

  it('点击浮层外部区域收起', async () => {
    const wrapper = mountPopover()
    await wrapper.trigger('click')
    await nextTick()
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(isOpen()).toBe(false)
  })

  it('disabled 与缺省 modelValue 的受控展开', async () => {
    const blocked = mountPopover({ disabled: true })
    await blocked.trigger('click')
    await nextTick()
    expect(isOpen()).toBe(false)
    expect(blocked.emitted()).not.toHaveProperty('visible-change')
    blocked.unmount()
    document.body.innerHTML = ''

    const controlled = mountPopover({ modelValue: true })
    await nextTick()
    expect(isOpen()).toBe(true)
    await controlled.setProps({ modelValue: false })
    expect(isOpen()).toBe(false)
    expect(controlled.emitted('visible-change')).toEqual([[false]])
  })

  it('modelValue=false 强制收起，交互不能把它重新打开', async () => {
    // F-14 回归：与 Dropdown 同一套 triggerConfig，受控为假时点击 / 悬停都不改写展开态
    const wrapper = mountPopover({ modelValue: false })
    await nextTick()
    expect(isOpen()).toBe(false)
    await wrapper.find('.ui-popover__trigger').trigger('click')
    await wrapper.find('.ui-popover__trigger').trigger('mouseenter')
    await nextTick()
    expect(isOpen()).toBe(false)
    expect(wrapper.emitted('visible-change')).toBeUndefined()
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('v-model 受控：点击只回写 update:modelValue(false)，父级落地后才收起', async () => {
    const wrapper = mountPopover({ modelValue: true })
    await nextTick()
    expect(isOpen()).toBe(true)
    await wrapper.trigger('click')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    expect(wrapper.emitted('visible-change')).toBeUndefined()
    expect(isOpen()).toBe(true)
    await wrapper.setProps({ modelValue: false })
    await nextTick()
    expect(isOpen()).toBe(false)
    expect(wrapper.emitted('visible-change')).toEqual([[false]])
  })

  it('className 与 popperClass 一起附加到面板', async () => {
    mountPopover({ className: 'extra', popperClass: ['mine'] })
    await nextTick()
    expect(panel()!.className.split(' ')).toEqual(
      expect.arrayContaining(['ui-popover__panel', 'ui-floating-panel', 'extra', 'mine'])
    )
  })

  it('effect 为 dark 时面板加 is-dark 且箭头随 showArrow 显隐', async () => {
    const wrapper = mountPopover({ effect: 'dark', showArrow: false })
    await wrapper.trigger('click')
    await nextTick()
    expect(panel()!.className).toContain('is-dark')
    expect(document.querySelector('.ui-floating-arrow')).toBeNull()
    await wrapper.setProps({ showArrow: true })
    expect(document.querySelector('.ui-floating-arrow')).not.toBeNull()
  })

  it('teleported 决定面板挂在 body 还是留在组件内', async () => {
    const inline = mountPopover({ teleported: false })
    await inline.trigger('click')
    await nextTick()
    expect(inline.find('.ui-popover__panel').exists()).toBe(true)
    expect(inline.element.contains(panel())).toBe(true)
    inline.unmount()
    document.body.innerHTML = ''

    const teleported = mountPopover()
    await teleported.trigger('click')
    await nextTick()
    expect(teleported.element.contains(panel())).toBe(false)
    expect(panel()!.parentElement).toBe(document.body)
  })

  it('persistent 为 false 时收起后面板被移除', async () => {
    const wrapper = mountPopover({ persistent: false })
    await nextTick()
    expect(panel()).toBeNull()
    await wrapper.trigger('click')
    await nextTick()
    expect(panel()).not.toBeNull()
    await wrapper.trigger('click')
    await nextTick()
    expect(panel()).toBeNull()
  })

  it('trigger 为数组时取首项，右键触发同样可展开', async () => {
    const wrapper = mountPopover({ trigger: ['contextmenu'] })
    await wrapper.trigger('contextmenu')
    await nextTick()
    expect(isOpen()).toBe(true)
  })
})
