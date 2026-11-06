import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Dropdown, DropdownItem, DropdownMenu, Popover, Tooltip } from '@ui-kit-full'

const mounted: ReturnType<typeof mount>[] = []

function keep<T>(wrapper: T): T {
  mounted.push(wrapper as unknown as ReturnType<typeof mount>)
  return wrapper
}

function mountDropdown(props: Record<string, any> = {}, triggerTag = 'span') {
  const wrapper = mount(Dropdown, {
    props: { trigger: 'click', ...props },
    slots: {
      default: () => h(triggerTag, { class: 'probe-trigger' }, '更多操作'),
      dropdown: () => h(DropdownMenu, null, { default: () => h(DropdownItem, { class: 'probe-item' }, () => '编辑') })
    },
    attachTo: document.body
  })
  keep(wrapper)
  return wrapper
}

function mountTooltip(props: Record<string, any> = {}) {
  const wrapper = mount(Tooltip, {
    props: { content: '一条提示', ...props },
    slots: { default: () => h('span', { class: 'probe-tip-trigger' }, '悬停我') },
    attachTo: document.body
  })
  keep(wrapper)
  return wrapper
}

function dropdownPanel() {
  return document.querySelector('.ui-dropdown__panel') as HTMLElement | null
}

function dropdownTrigger() {
  return document.querySelector('.ui-dropdown__trigger') as HTMLElement | null
}

function tooltipPopper() {
  return document.querySelector('.ui-tooltip__popper') as HTMLElement | null
}

function open(node: HTMLElement | null) {
  return Boolean(node && node.getAttribute('aria-hidden') !== 'true' && node.style.display !== 'none')
}

function keydown(target: Element, keyName: string) {
  const event = new KeyboardEvent('keydown', { key: keyName, bubbles: true, cancelable: true })
  target.dispatchEvent(event)
  return nextTick().then(() => event)
}

function pressEscape() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  return nextTick()
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()!.unmount()
  }
  document.body.innerHTML = ''
})

/**
 * 浮层的键盘通路（缺陷 F-32 / F-33）。
 *
 * happy-dom 不做布局，触发器是 div/span 还是 button 在单测里看不出差别，
 * 键盘用户按 Enter 打不开面板这类问题只有真浏览器会暴露；
 * 这里把根因（keydown 分支与 Escape 登记栈）锚在单元层，
 * 浏览器层再用 a11y.spec 复核真实焦点序列。
 */
describe('浮层键盘通路', () => {
  it('纯 span 触发器：Enter 展开、Space 收起、Escape 关闭', async () => {
    const wrapper = mountDropdown()
    await nextTick()
    const trigger = wrapper.find('.probe-trigger').element
    expect(open(dropdownPanel())).toBe(false)
    expect(dropdownTrigger()?.getAttribute('aria-expanded')).toBe('false')

    await keydown(trigger, 'Enter')
    expect(open(dropdownPanel())).toBe(true)
    expect(dropdownTrigger()?.getAttribute('aria-expanded')).toBe('true')

    await keydown(trigger, ' ')
    expect(open(dropdownPanel())).toBe(false)
    expect(dropdownTrigger()?.getAttribute('aria-expanded')).toBe('false')

    await keydown(trigger, 'Enter')
    await pressEscape()
    expect(open(dropdownPanel())).toBe(false)
  })

  it('触发器接管 Enter 时阻止默认行为，避免按键顺手滚页', async () => {
    const wrapper = mountDropdown()
    await nextTick()
    const event = await keydown(wrapper.find('.probe-trigger').element, 'Enter')
    expect(event.defaultPrevented).toBe(true)
  })

  it('触发器里的原生按钮不被接管：交给它自己的 click，防止一次按键切两下', async () => {
    const wrapper = mountDropdown({}, 'button')
    await nextTick()
    const button = wrapper.find('.probe-trigger').element
    await keydown(button, 'Enter')
    expect(open(dropdownPanel())).toBe(false)

    await keydown(button, ' ')
    expect(open(dropdownPanel())).toBe(false)
  })

  it('Popover 同样支持 Enter 打开、Escape 收起', async () => {
    const wrapper = mount(Popover, {
      props: { trigger: 'click', content: '浮层内容' },
      slots: { default: () => h('span', { class: 'probe-pop-trigger' }, '点开') },
      attachTo: document.body
    })
    keep(wrapper)
    await nextTick()
    const trigger = wrapper.find('.probe-pop-trigger').element

    await keydown(trigger, 'Enter')
    const panel = document.querySelector('.ui-popover__panel') as HTMLElement | null
    expect(open(panel)).toBe(true)

    await pressEscape()
    expect(open(panel)).toBe(false)
  })

  it('两层浮层同屏时，一次 Escape 只收起最后打开的那层', async () => {
    const bubble = mount(Popover, {
      props: { trigger: 'click', content: '外层气泡' },
      slots: { default: () => h('span', { class: 'probe-pop-trigger' }, '点开外层') },
      attachTo: document.body
    })
    keep(bubble)
    await bubble.find('.probe-pop-trigger').trigger('click')
    await nextTick()
    expect(open(document.querySelector('.ui-popover__panel'))).toBe(true)

    const menu = mountDropdown()
    await menu.find('.probe-trigger').trigger('click')
    await nextTick()
    expect(open(dropdownPanel())).toBe(true)

    await pressEscape()
    expect(open(dropdownPanel())).toBe(false)
    expect(open(document.querySelector('.ui-popover__panel'))).toBe(true)

    await pressEscape()
    expect(open(document.querySelector('.ui-popover__panel'))).toBe(false)
  })

  it('Tooltip 保留自身的元素级 Escape 通路，卸载后不误伤其他浮层', async () => {
    const tip = mountTooltip()
    await tip.trigger('mouseenter')
    await nextTick()
    expect(open(tooltipPopper())).toBe(true)

    const menu = mountDropdown()
    await menu.find('.probe-trigger').trigger('click')
    await nextTick()

    // 栈顶是后打开的下拉：Tooltip 用的是触发器上的 keydown，不参与全局登记栈
    await pressEscape()
    expect(open(dropdownPanel())).toBe(false)
    expect(open(tooltipPopper())).toBe(true)

    await tip.trigger('keydown', { key: 'Escape' })
    expect(open(tooltipPopper())).toBe(false)
  })

  it('全部卸载后 Escape 不再触达组件，也不留悬挂监听', async () => {
    const wrapper = mountDropdown()
    await wrapper.find('.probe-trigger').trigger('click')
    await nextTick()
    expect(open(dropdownPanel())).toBe(true)

    wrapper.unmount()
    document.body.innerHTML = ''
    await expect(pressEscape()).resolves.toBeUndefined()
    expect(mounted.pop()).toBe(wrapper)
  })
})
