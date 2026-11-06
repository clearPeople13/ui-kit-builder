import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tooltip } from '@ui-kit-full'

const mounted: ReturnType<typeof mount>[] = []

function mountTooltip(props: Record<string, any> = {}, slots: Record<string, () => unknown> = {}) {
  const wrapper = mount(Tooltip, {
    props: { content: '这是一条提示', ...props },
    slots: { default: () => h('span', { class: 'probe-trigger' }, '悬停我'), ...slots },
    attachTo: document.body
  })
  mounted.push(wrapper)
  return wrapper
}

function popper() {
  return document.querySelector('.ui-tooltip__popper') as HTMLElement | null
}

function isOpen() {
  const current = popper()
  return Boolean(current && current.style.display !== 'none')
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()!.unmount()
  }
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('Tooltip 文字提示', () => {
  it('根节点只有触发区，浮层默认常驻 body 但保持收起', async () => {
    const wrapper = mountTooltip()
    await nextTick()
    expect(wrapper.classes()).toEqual(['ui-tooltip'])
    expect(wrapper.find('.ui-tooltip__trigger').text()).toBe('悬停我')
    expect(popper()).not.toBeNull()
    expect(popper()!.style.display).toBe('none')
    expect(popper()!.getAttribute('role')).toBe('tooltip')
  })

  it('悬停立即展开并抛 show 与 update:visible', async () => {
    const wrapper = mountTooltip()
    await wrapper.trigger('mouseenter')
    await nextTick()
    expect(isOpen()).toBe(true)
    expect(popper()!.querySelector('.ui-tooltip__content')!.textContent).toBe('这是一条提示')
    expect(wrapper.emitted('show')).toEqual([[]])
    expect(wrapper.emitted('update:visible')).toEqual([[true]])
  })

  it('移出按 hideAfter 延时收起，hideAfter 为 0 时立即收起', async () => {
    vi.useFakeTimers()
    const wrapper = mountTooltip()
    await wrapper.trigger('mouseenter')
    await nextTick()
    await wrapper.trigger('mouseleave')
    vi.advanceTimersByTime(199)
    await nextTick()
    expect(isOpen()).toBe(true)
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(isOpen()).toBe(false)
    expect(wrapper.emitted('update:visible')).toEqual([[true], [false]])

    wrapper.unmount()
    document.body.innerHTML = ''
    const instant = mountTooltip({ hideAfter: 0 })
    await instant.trigger('mouseenter')
    await instant.trigger('mouseleave')
    await nextTick()
    expect(isOpen()).toBe(false)
  })

  it('showAfter 延迟展开，展开期间移出不再生效', async () => {
    vi.useFakeTimers()
    const wrapper = mountTooltip({ showAfter: 400, hideAfter: 0 })
    await wrapper.trigger('mouseenter')
    vi.advanceTimersByTime(399)
    await nextTick()
    expect(isOpen()).toBe(false)
    await wrapper.trigger('mouseleave')
    vi.advanceTimersByTime(1)
    await nextTick()
    // clearTimers 已在 mouseleave 中清掉展开计时
    expect(isOpen()).toBe(false)
    await wrapper.trigger('mouseenter')
    vi.advanceTimersByTime(400)
    await nextTick()
    expect(isOpen()).toBe(true)
  })

  it('autoClose 在展开后自动收起', async () => {
    vi.useFakeTimers()
    const wrapper = mountTooltip({ autoClose: 300, hideAfter: 0 })
    await wrapper.trigger('mouseenter')
    await nextTick()
    expect(isOpen()).toBe(true)
    vi.advanceTimersByTime(300)
    await nextTick()
    expect(isOpen()).toBe(false)
    expect(wrapper.emitted('hide')).toEqual([[]])
  })

  it('移入浮层会取消收起计时，移出浮层再收起', async () => {
    vi.useFakeTimers()
    const wrapper = mountTooltip()
    await wrapper.trigger('mouseenter')
    await nextTick()
    await wrapper.trigger('mouseleave')
    popper()!.dispatchEvent(new Event('mouseenter'))
    vi.advanceTimersByTime(500)
    await nextTick()
    expect(isOpen()).toBe(true)
    popper()!.dispatchEvent(new Event('mouseleave'))
    vi.advanceTimersByTime(500)
    await nextTick()
    expect(isOpen()).toBe(false)
  })

  it('enterable 为 false 时浮层不再接管悬停', async () => {
    vi.useFakeTimers()
    const wrapper = mountTooltip({ enterable: false })
    await wrapper.trigger('mouseenter')
    await nextTick()
    await wrapper.trigger('mouseleave')
    popper()!.dispatchEvent(new Event('mouseenter'))
    vi.advanceTimersByTime(500)
    await nextTick()
    expect(isOpen()).toBe(false)
  })

  it('Escape 键立即收起展开中的提示', async () => {
    const wrapper = mountTooltip()
    await wrapper.trigger('mouseenter')
    await nextTick()
    await wrapper.trigger('keydown', { key: 'Escape' })
    expect(isOpen()).toBe(false)
    expect(wrapper.emitted('update:visible')).toEqual([[true], [false]])
    // 未展开时按 Escape 不产生额外事件
    await wrapper.trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('hide')).toHaveLength(1)
  })

  it('trigger 为 click 时点击切换，数组写法同时保留两种触发', async () => {
    const clickMode = mountTooltip({ trigger: 'click' })
    await clickMode.trigger('click')
    await nextTick()
    expect(isOpen()).toBe(true)
    await clickMode.trigger('click')
    await nextTick()
    expect(isOpen()).toBe(true) // hideAfter 默认 200，收起仍在计时中
    await clickMode.trigger('mouseenter')
    await nextTick()
    expect(isOpen()).toBe(true) // click 模式不响应悬停
    clickMode.unmount()
    document.body.innerHTML = ''

    const both = mountTooltip({ trigger: ['click', 'hover'], hideAfter: 0 })
    await both.trigger('click')
    await nextTick()
    expect(isOpen()).toBe(true)
    await both.trigger('mouseleave')
    await nextTick()
    expect(isOpen()).toBe(false)
    await both.trigger('mouseenter')
    await nextTick()
    expect(isOpen()).toBe(true)
  })

  it('trigger 为 contextmenu 时阻止默认菜单', async () => {
    const wrapper = mountTooltip({ trigger: 'contextmenu' })
    const event = new Event('contextmenu', { bubbles: true, cancelable: true })
    wrapper.element.dispatchEvent(event)
    await nextTick()
    expect(event.defaultPrevented).toBe(true)
    expect(isOpen()).toBe(true)
  })

  it('effect 决定浮层配色类名，未知值回退 dark', async () => {
    const wrapper = mountTooltip({ effect: 'light' })
    await nextTick()
    expect(popper()!.className).toContain('is-light')
    wrapper.unmount()
    document.body.innerHTML = ''
    const plain = mountTooltip({ effect: '' })
    await nextTick()
    expect(plain.html()).toBeTruthy()
    expect(popper()!.className).toContain('is-dark')
  })

  it('rawContent 为真时按 HTML 渲染，默认转义为文本', async () => {
    mountTooltip({ content: '<b>加粗提示</b>', rawContent: true })
    await nextTick()
    expect(popper()!.querySelector('.ui-tooltip__content b')).not.toBeNull()

    document.body.innerHTML = ''
    mountTooltip({ content: '<b>加粗提示</b>' })
    await nextTick()
    expect(popper()!.querySelector('.ui-tooltip__content b')).toBeNull()
    expect(popper()!.querySelector('.ui-tooltip__content')!.textContent).toBe('<b>加粗提示</b>')
  })

  it('disabled 阻断展开', async () => {
    const wrapper = mountTooltip({ disabled: true })
    await wrapper.trigger('mouseenter')
    await wrapper.trigger('click')
    await nextTick()
    expect(isOpen()).toBe(false)
    expect(wrapper.emitted()).not.toHaveProperty('show')
  })

  it('visible 受控展开与收起，缺省回到内部状态', async () => {
    const wrapper = mountTooltip({ visible: true })
    await nextTick()
    expect(isOpen()).toBe(true)
    expect(wrapper.emitted('show')).toBeUndefined()
    await wrapper.setProps({ visible: false })
    expect(isOpen()).toBe(false)
    await wrapper.setProps({ visible: undefined })
    await wrapper.trigger('mouseenter')
    await nextTick()
    expect(isOpen()).toBe(true)
  })

  it('persistent 为 false 时收起后移除浮层 DOM', async () => {
    vi.useFakeTimers()
    const wrapper = mountTooltip({ persistent: false })
    await nextTick()
    expect(popper()).toBeNull()
    await wrapper.trigger('mouseenter')
    await nextTick()
    expect(popper()).not.toBeNull()
    await wrapper.trigger('mouseleave')
    vi.advanceTimersByTime(400)
    await nextTick()
    expect(popper()).toBeNull()
  })

  it('teleported 决定浮层挂在 body 还是留在组件内', async () => {
    const inline = mountTooltip({ teleported: false })
    await inline.trigger('mouseenter')
    await nextTick()
    expect(inline.find('.ui-tooltip__popper').exists()).toBe(true)
    expect(inline.element.contains(popper())).toBe(true)
    inline.unmount()
    document.body.innerHTML = ''

    const teleported = mountTooltip()
    await teleported.trigger('mouseenter')
    await nextTick()
    expect(teleported.element.contains(popper())).toBe(false)
    expect(popper()!.parentElement).toBe(document.body)
  })

  it('offset 决定浮层与触发区的间距', async () => {
    const wrapper = mountTooltip()
    await wrapper.trigger('mouseenter')
    await nextTick()
    expect(popper()!.style.top).toBe('12px')
    wrapper.unmount()
    document.body.innerHTML = ''
    const farther = mountTooltip({ offset: 30 })
    await farther.trigger('mouseenter')
    await nextTick()
    expect(popper()!.style.top).toBe('30px')
  })

  it('popperClass 与 popperStyle 附加到浮层，showArrow 控制箭头', async () => {
    const wrapper = mountTooltip({ popperClass: 'mine', popperStyle: { color: 'red' }, showArrow: false })
    await wrapper.trigger('mouseenter')
    await nextTick()
    expect(popper()!.className).toContain('mine')
    expect(popper()!.getAttribute('style')).toContain('color: red')
    expect(popper()!.querySelector('.ui-floating-arrow')).toBeNull()
    await wrapper.setProps({ showArrow: true })
    expect(popper()!.querySelector('.ui-floating-arrow')).not.toBeNull()
  })

  it('内容为空时提示文本为空字符串', async () => {
    const wrapper = mountTooltip({ content: '' })
    await wrapper.trigger('mouseenter')
    await nextTick()
    expect(popper()!.querySelector('.ui-tooltip__content')!.textContent).toBe('')
  })
})
