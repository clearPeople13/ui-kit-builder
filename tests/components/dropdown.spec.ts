import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Dropdown, DropdownItem, DropdownMenu } from '@ui-kit-full'

const mounted: ReturnType<typeof mount>[] = []

function items() {
  return h(DropdownMenu, null, {
    default: () => [
      h(DropdownItem, { class: 'first' }, () => '编辑条目'),
      h(DropdownItem, { class: 'second', divided: true }, () => '复制条目'),
      h(DropdownItem, { class: 'third', disabled: true }, () => '删除条目'),
      h(DropdownItem, { class: 'iconic', icon: 'check' }, () => '带图标项')
    ]
  })
}

function mountDropdown(props: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}) {
  const wrapper = mount(Dropdown, {
    props: { trigger: 'click', ...props },
    slots: { default: () => h('button', { class: 'probe-trigger' }, '更多操作'), dropdown: items, ...slots },
    attachTo: document.body
  })
  mounted.push(wrapper)
  return wrapper
}

function panel() {
  return document.querySelector('.ui-dropdown__panel') as HTMLElement | null
}

function panelContent() {
  return document.querySelector('.ui-dropdown__content') as HTMLElement | null
}

function panelItems() {
  return Array.from(document.querySelectorAll('.ui-dropdown-item')) as HTMLElement[]
}

function isOpen() {
  const current = panel()
  return Boolean(current && current.getAttribute('aria-hidden') !== 'true' && current.style.display !== 'none')
}

// 面板挂在 body 上，拿到的是原生元素，只能用 className / getAttribute
function itemClick(index: number) {
  panelItems()[index]?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  return nextTick()
}

function outsidePointerDown() {
  document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
  return nextTick()
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()!.unmount()
  }
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('Dropdown 下拉菜单', () => {
  it('默认 hover 触发，面板常驻 DOM 但保持收起', async () => {
    const wrapper = mountDropdown({ trigger: 'hover' })
    await nextTick()
    expect(wrapper.classes()).toEqual([
      'ui-dropdown',
      'ui-dropdown--light',
      'ui-dropdown--bottom',
      'ui-dropdown--popper'
    ])
    expect(wrapper.find('.ui-dropdown__trigger').attributes('aria-expanded')).toBe('false')
    expect(panel()).not.toBeNull()
    expect(panel()!.getAttribute('aria-hidden')).toBe('true')
    expect(panel()!.style.display).toBe('none')
  })

  it('dropdown 插槽的内容渲染成列表，各项带回退类名', async () => {
    mountDropdown()
    await nextTick()
    expect((document.querySelector('.ui-dropdown-menu') as HTMLElement).className).toBe('ui-dropdown-menu')
    expect(panelItems().map((item) => item.textContent)).toEqual(['编辑条目', '复制条目', '删除条目', '带图标项'])
    expect(panelItems()[2].className).toContain('is-disabled')
    expect(panelItems()[1].className).toContain('is-divided')
    expect(panelItems()[3].querySelector('.ui-dropdown-item__icon')).not.toBeNull()
  })

  it('点击触发按钮展开面板并抛 show，再点收起并抛 hide', async () => {
    const wrapper = mountDropdown()
    await wrapper.trigger('click')
    await nextTick()
    expect(wrapper.find('.ui-dropdown__trigger').attributes('aria-expanded')).toBe('true')
    expect(isOpen()).toBe(true)
    expect(panel()!.getAttribute('role')).toBe('menu')
    expect(wrapper.emitted('show')).toEqual([[]])
    await wrapper.trigger('click')
    await nextTick()
    expect(isOpen()).toBe(false)
    expect(wrapper.emitted('hide')).toEqual([[]])
  })

  it('悬停按 showTimeout / hideTimeout 延时展开与收起', async () => {
    vi.useFakeTimers()
    const wrapper = mountDropdown({ trigger: 'hover' })
    await wrapper.trigger('mouseenter')
    vi.advanceTimersByTime(149)
    await nextTick()
    expect(isOpen()).toBe(false)
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(isOpen()).toBe(true)
    await wrapper.trigger('mouseleave')
    vi.advanceTimersByTime(150)
    await nextTick()
    expect(isOpen()).toBe(false)
    expect(wrapper.emitted('show')).toHaveLength(1)
    expect(wrapper.emitted('hide')).toHaveLength(1)
  })

  it('鼠标移入面板会取消收起计时', async () => {
    vi.useFakeTimers()
    const wrapper = mountDropdown({ trigger: 'hover' })
    await wrapper.trigger('mouseenter')
    vi.advanceTimersByTime(150)
    await nextTick()
    await wrapper.trigger('mouseleave')
    panel()!.dispatchEvent(new Event('mouseenter'))
    vi.advanceTimersByTime(300)
    await nextTick()
    expect(isOpen()).toBe(true)
    expect(wrapper.emitted('hide')).toBeUndefined()
  })

  it('右键触发 contextmenu 时阻止默认菜单并切换', async () => {
    const wrapper = mountDropdown({ trigger: 'contextmenu' })
    const event = new Event('contextmenu', { bubbles: true, cancelable: true })
    wrapper.element.dispatchEvent(event)
    await nextTick()
    expect(event.defaultPrevented).toBe(true)
    expect(isOpen()).toBe(true)
    await wrapper.trigger('contextmenu')
    expect(isOpen()).toBe(false)
  })

  it('trigger 数组取首项，未知值回退到 hover', async () => {
    vi.useFakeTimers()
    const arrayTrigger = mountDropdown({ trigger: ['click'] })
    await arrayTrigger.trigger('click')
    await nextTick()
    expect(isOpen()).toBe(true)
    arrayTrigger.unmount()
    document.body.innerHTML = ''
    const fallback = mountDropdown({ trigger: 'focus' })
    await fallback.trigger('click')
    await nextTick()
    expect(isOpen()).toBe(false)
    await fallback.trigger('mouseenter')
    vi.advanceTimersByTime(200)
    await nextTick()
    expect(isOpen()).toBe(true)
  })

  it('默认点击菜单项后收起，hideOnClick 为 false 时保持展开', async () => {
    const wrapper = mountDropdown()
    await itemClickOpen(wrapper)
    await itemClick(0)
    expect(isOpen()).toBe(false)
    expect(wrapper.emitted('hide')).toEqual([[]])

    wrapper.unmount()
    document.body.innerHTML = ''
    const kept = mountDropdown({ hideOnClick: false })
    await kept.trigger('click')
    await nextTick()
    await itemClick(0)
    expect(isOpen()).toBe(true)
    expect(kept.emitted('hide')).toBeUndefined()
  })

  it('点击菜单项不会再次触发根节点的切换逻辑', async () => {
    const wrapper = mountDropdown()
    await itemClickOpen(wrapper)
    panel()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    // 面板自身 click 被 stopPropagation，收起只由 closeOnPanelClick 分支触发一次
    expect(wrapper.emitted('show')).toHaveLength(1)
    expect(isOpen()).toBe(false)
  })

  it('外部按下只在 click / contextmenu 模式下收起，hover 模式不受影响', async () => {
    const clickMode = mountDropdown()
    await itemClickOpen(clickMode)
    await outsidePointerDown()
    expect(isOpen()).toBe(false)
    clickMode.unmount()
    document.body.innerHTML = ''

    const hoverMode = mountDropdown({ trigger: 'hover', showTimeout: 0 })
    await hoverMode.trigger('mouseenter')
    await nextTick()
    expect(isOpen()).toBe(true)
    await outsidePointerDown()
    expect(isOpen()).toBe(true)
  })

  it('disabled 阻断点击与悬停展开', async () => {
    const wrapper = mountDropdown({ disabled: true })
    await wrapper.trigger('click')
    await wrapper.trigger('mouseenter')
    await nextTick()
    expect(isOpen()).toBe(false)
    expect(wrapper.find('.ui-dropdown__trigger').attributes('aria-expanded')).toBe('false')
    expect(wrapper.emitted()).not.toHaveProperty('show')
  })

  it('visible 受控展开与收起', async () => {
    const wrapper = mountDropdown({ visible: true })
    await nextTick()
    expect(isOpen()).toBe(true)
    await wrapper.setProps({ visible: false })
    expect(isOpen()).toBe(false)
    expect(wrapper.emitted('show')).toBeUndefined()
    expect(wrapper.emitted('hide')).toEqual([[]])
    // 受控值缺省时回到内部状态
    await wrapper.setProps({ visible: undefined })
    await wrapper.trigger('click')
    await nextTick()
    expect(isOpen()).toBe(true)
  })

  it('visible=false 强制收起，交互不能把它重新打开', async () => {
    // F-13 回归：受控为假时点击 / 悬停 / 计时器都不改写展开态
    const wrapper = mountDropdown({ visible: false })
    await nextTick()
    expect(isOpen()).toBe(false)
    await wrapper.find('.ui-dropdown__trigger').trigger('click')
    await wrapper.find('.ui-dropdown__trigger').trigger('mouseenter')
    await nextTick()
    expect(isOpen()).toBe(false)
    expect(wrapper.emitted('show')).toBeUndefined()
  })

  it('size / effect 映射到面板类名', async () => {
    mountDropdown({ size: 'large', effect: 'dark' })
    await nextTick()
    expect(panel()!.className).toContain('ui-dropdown__panel--size-large')
    expect(panel()!.className).toContain('is-dark')
  })

  it('maxHeight 写入内容容器，缺省为 240px', async () => {
    const wrapper = mountDropdown()
    await nextTick()
    expect(panelContent()!.style.maxHeight).toBe('240px')
    expect(panelContent()!.style.overflowY).toBe('auto')
    await wrapper.setProps({ maxHeight: 480 })
    expect(panelContent()!.style.maxHeight).toBe('480px')
  })

  it('teleported 决定面板挂在 body 还是留在组件内', async () => {
    const inline = mountDropdown({ teleported: false })
    await inline.trigger('click')
    await nextTick()
    expect(inline.find('.ui-dropdown__panel').exists()).toBe(true)
    expect(inline.element.contains(panel())).toBe(true)
    inline.unmount()
    document.body.innerHTML = ''

    const teleported = mountDropdown()
    await teleported.trigger('click')
    await nextTick()
    expect(teleported.find('.ui-dropdown__panel').exists()).toBe(false)
    expect(teleported.element.contains(panel())).toBe(false)
    expect(panel()!.parentElement).toBe(document.body)
  })

  it('persistent 为 false 时收起后移除面板 DOM', async () => {
    const wrapper = mountDropdown({ persistent: false })
    await nextTick()
    expect(panel()).toBeNull()
    await wrapper.trigger('click')
    await nextTick()
    expect(panel()).not.toBeNull()
    await wrapper.trigger('click')
    await nextTick()
    expect(panel()).toBeNull()
  })

  it('popperClass / popperStyle / showArrow 作用于面板', async () => {
    const wrapper = mountDropdown({ popperClass: 'mine', popperStyle: { '--x': '1px' }, showArrow: false })
    await wrapper.trigger('click')
    await nextTick()
    expect(panel()!.className).toContain('mine')
    expect(panel()!.getAttribute('style')).toContain('--x: 1px')
    expect(document.querySelector('.ui-floating-arrow')).toBeNull()
    await wrapper.setProps({ showArrow: true })
    expect(document.querySelector('.ui-floating-arrow')).not.toBeNull()
  })

  it('id 与 tabindex 落在触发元素上', async () => {
    const wrapper = mountDropdown({ id: 'dd-more', tabindex: -1 })
    await nextTick()
    const trigger = wrapper.find('.ui-dropdown__trigger')
    expect(trigger.attributes('id')).toBe('dd-more')
    expect(trigger.attributes('tabindex')).toBe('-1')
  })

  it('role 决定面板的可访问角色', async () => {
    mountDropdown({ role: 'navigation' })
    await nextTick()
    expect(panel()!.getAttribute('role')).toBe('navigation')
  })
})

async function itemClickOpen(wrapper: ReturnType<typeof mountDropdown>) {
  await wrapper.trigger('click')
  await nextTick()
  expect(isOpen()).toBe(true)
}
