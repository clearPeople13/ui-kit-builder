import { mount } from '@vue/test-utils'
import { h, nextTick, ref, type Ref } from 'vue'
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

function mountDropdown(props: Record<string, any> = {}, slots: Record<string, () => unknown> = {}) {
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

function press(target: Element | null | undefined, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target?.dispatchEvent(event)
  return event
}

// 键盘打开后焦点移交走 setTimeout（跨 Vue 调度器），断言前必须跨过一次宏任务
async function flush() {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function triggerEl(wrapper: ReturnType<typeof mountDropdown>) {
  return wrapper.element.querySelector('.ui-dropdown__trigger') as HTMLElement
}

async function openByKeyboard(wrapper: ReturnType<typeof mountDropdown>) {
  const trigger = triggerEl(wrapper)
  trigger.focus()
  press(trigger, 'Enter')
  await flush()
  expect(isOpen()).toBe(true)
  return trigger
}

function mountCustomItems(showSecond: Ref<boolean>, firstDisabled = false) {
  const wrapper = mount(Dropdown, {
    props: { trigger: 'click' },
    slots: {
      default: () => h('button', { class: 'probe-trigger' }, '更多操作'),
      dropdown: () =>
        h(DropdownMenu, null, {
          default: () => [
            h(DropdownItem, { class: 'first', disabled: firstDisabled }, () => '首条'),
            showSecond.value ? h(DropdownItem, { class: 'second' }, () => '次条') : null
          ]
        })
    },
    attachTo: document.body
  })
  mounted.push(wrapper)
  return wrapper
}

describe('Dropdown 键盘菜单', () => {
  it('触发器暴露 aria-haspopup，取值跟随面板 role', async () => {
    const wrapper = mountDropdown()
    await nextTick()
    expect(triggerEl(wrapper).getAttribute('aria-haspopup')).toBe('menu')
    wrapper.unmount()
    document.body.innerHTML = ''

    const navigation = mountDropdown({ role: 'navigation' })
    await nextTick()
    expect(triggerEl(navigation).getAttribute('aria-haspopup')).toBe('navigation')
  })

  it('菜单项 role=menuitem，当前停靠项 tabindex=0，禁用项退出 Tab 序', async () => {
    mountDropdown()
    await nextTick()
    const list = panelItems()
    expect(list.map((item) => item.getAttribute('role'))).toEqual(['menuitem', 'menuitem', 'menuitem', 'menuitem'])
    expect(list.map((item) => item.getAttribute('tabindex'))).toEqual(['0', '-1', null, '-1'])
    expect(list[2].getAttribute('aria-disabled')).toBe('true')
    expect(list[0].hasAttribute('aria-disabled')).toBe(false)
  })

  it('键盘 Enter 打开后焦点移交首个可导航项', async () => {
    const wrapper = mountDropdown()
    const trigger = await openByKeyboard(wrapper)
    expect(document.activeElement).toBe(panelItems()[0])
    expect(document.activeElement).not.toBe(trigger)
  })

  it('键盘 Space 同样能打开并接管焦点', async () => {
    const wrapper = mountDropdown()
    const trigger = triggerEl(wrapper)
    trigger.focus()
    const event = press(trigger, ' ')
    await flush()
    expect(event.defaultPrevented).toBe(true)
    expect(isOpen()).toBe(true)
    expect(document.activeElement).toBe(panelItems()[0])
  })

  it('鼠标打开不抢焦点，焦点留在触发区', async () => {
    const wrapper = mountDropdown()
    const trigger = triggerEl(wrapper)
    trigger.focus()
    await wrapper.trigger('click')
    await flush()
    expect(isOpen()).toBe(true)
    expect(document.activeElement).toBe(trigger)
  })

  it('内层原生按钮上的 Enter 交给原生点击，不重复切换', async () => {
    const wrapper = mountDropdown()
    const inner = wrapper.element.querySelector('.probe-trigger') as HTMLElement
    inner.focus()
    const event = press(inner, 'Enter')
    await flush()
    expect(event.defaultPrevented).toBe(false)
    expect(isOpen()).toBe(false)
  })

  it('↑↓ 在可导航项间循环，禁用项被跳过', async () => {
    const wrapper = mountDropdown()
    await openByKeyboard(wrapper)
    const list = panelItems()
    press(list[0], 'ArrowDown')
    await nextTick()
    expect(document.activeElement).toBe(list[1])
    press(list[1], 'ArrowDown')
    await nextTick()
    expect(document.activeElement).toBe(list[3])
    press(list[3], 'ArrowDown')
    await nextTick()
    expect(document.activeElement).toBe(list[0])
    press(list[0], 'ArrowUp')
    await nextTick()
    expect(document.activeElement).toBe(list[3])
    // 焦点移动同步 roving 停靠点
    expect(list[3].getAttribute('tabindex')).toBe('0')
    expect(list[0].getAttribute('tabindex')).toBe('-1')
  })

  it('Home / End 跳到首末可用项', async () => {
    const wrapper = mountDropdown()
    await openByKeyboard(wrapper)
    const list = panelItems()
    const end = press(list[0], 'End')
    await nextTick()
    expect(end.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(list[3])
    press(list[3], 'Home')
    await nextTick()
    expect(document.activeElement).toBe(list[0])
  })

  it('禁用项与无关按键不移动焦点', async () => {
    const wrapper = mountDropdown()
    await openByKeyboard(wrapper)
    const list = panelItems()
    const onDisabled = press(list[2], 'ArrowDown')
    await nextTick()
    expect(onDisabled.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(list[0])
    const typing = press(list[0], 'a')
    await nextTick()
    expect(typing.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(list[0])
  })

  it('Enter 选中与点击同出口：触发项点击、收起并归还焦点', async () => {
    const wrapper = mountDropdown()
    const trigger = await openByKeyboard(wrapper)
    const first = panelItems()[0]
    const clicked = vi.fn()
    first.addEventListener('click', clicked)
    press(first, 'Enter')
    await flush()
    expect(clicked).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('hide')).toEqual([[]])
    expect(isOpen()).toBe(false)
    expect(document.activeElement).toBe(trigger)
    first.removeEventListener('click', clicked)
  })

  it('hideOnClick=false 时 Enter 选中不收起，焦点留在项上', async () => {
    const wrapper = mountDropdown({ hideOnClick: false })
    await openByKeyboard(wrapper)
    const first = panelItems()[0]
    press(first, 'Enter')
    await flush()
    expect(isOpen()).toBe(true)
    expect(document.activeElement).toBe(first)
  })

  it('Escape 在菜单项上收起，并把焦点还给触发器', async () => {
    const wrapper = mountDropdown()
    const trigger = await openByKeyboard(wrapper)
    press(panelItems()[1], 'Escape')
    await flush()
    expect(isOpen()).toBe(false)
    expect(document.activeElement).toBe(trigger)
  })

  it('Escape 从面板空白处触发只收起，不改写焦点', async () => {
    const wrapper = mountDropdown()
    await openByKeyboard(wrapper)
    press(panelContent(), 'Escape')
    await flush()
    expect(isOpen()).toBe(false)
    expect(document.activeElement).toBe(panelItems()[0])
  })

  it('鼠标点击条目同步键盘停靠点', async () => {
    const wrapper = mountDropdown()
    await itemClickOpen(wrapper)
    await itemClick(1)
    expect(panelItems()[1].getAttribute('tabindex')).toBe('0')
    expect(panelItems()[0].getAttribute('tabindex')).toBe('-1')
    await itemClickOpen(wrapper)
    press(panelItems()[1], 'ArrowDown')
    await nextTick()
    expect(document.activeElement).toBe(panelItems()[3])
  })

  it('点击禁用项不改写停靠点', async () => {
    const wrapper = mountDropdown()
    await itemClickOpen(wrapper)
    await itemClick(2)
    expect(panelItems()[0].getAttribute('tabindex')).toBe('0')
    expect(panelItems()[2].hasAttribute('tabindex')).toBe(false)
  })

  it('停靠项卸载后回退到首个可用项', async () => {
    const showSecond = ref(true)
    const wrapper = mountCustomItems(showSecond)
    await wrapper.trigger('click')
    await nextTick()
    await itemClick(1)
    expect(panelItems()[1].getAttribute('tabindex')).toBe('0')
    showSecond.value = false
    await nextTick()
    expect(panelItems().map((item) => item.textContent)).toEqual(['首条'])
    expect(panelItems()[0].getAttribute('tabindex')).toBe('0')
  })

  it('没有可导航项时停靠点清空，整组退出 Tab 序', async () => {
    const showSecond = ref(true)
    const wrapper = mountCustomItems(showSecond, true)
    await wrapper.trigger('click')
    await nextTick()
    await itemClick(1)
    showSecond.value = false
    await nextTick()
    expect(panelItems().map((item) => item.getAttribute('tabindex'))).toEqual([null])
  })

  it('content 插槽作为 dropdown 插槽的别名', async () => {
    const wrapper = mount(Dropdown, {
      props: { trigger: 'click' },
      slots: { default: () => h('button', { class: 'probe-trigger' }, '更多操作'), content: items },
      attachTo: document.body
    })
    mounted.push(wrapper)
    await nextTick()
    expect(panelItems()).toHaveLength(4)
  })

  it('禁用状态翻转后停靠点仍落在可用项上', async () => {
    const secondDisabled = ref(false)
    const wrapper = mount(Dropdown, {
      props: { trigger: 'click' },
      slots: {
        default: () => h('button', { class: 'probe-trigger' }, '更多操作'),
        dropdown: () =>
          h(DropdownMenu, null, {
            default: () => [
              h(DropdownItem, { class: 'first' }, () => '首条'),
              h(DropdownItem, { class: 'second', disabled: secondDisabled.value }, () => '次条')
            ]
          })
      },
      attachTo: document.body
    })
    mounted.push(wrapper)
    await wrapper.trigger('click')
    await nextTick()
    secondDisabled.value = true
    await nextTick()
    expect(panelItems()[0].getAttribute('tabindex')).toBe('0')
    expect(panelItems()[1].hasAttribute('tabindex')).toBe(false)
  })
})
