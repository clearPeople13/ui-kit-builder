import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FocusTrap } from '@ui-kit-full'

// happy-dom 没有布局引擎，offsetWidth/offsetHeight 恒为 0，
// FocusTrap 的可见性判定（isVisible）会把所有候选节点当成不可见。
// 这里只在测试内让原型返回非零尺寸，断言对象仍是"焦点落在哪个元素"，不是几何像素。
const proto = window.HTMLElement.prototype
let originalDescriptor: PropertyDescriptor | undefined

const mounted: ReturnType<typeof mount>[] = []

function mountTrap(props: Record<string, any> = {}, slots: Record<string, () => unknown> = {}) {
  const wrapper = mount(FocusTrap, {
    props,
    slots: {
      default: () => [h('button', { class: 'ft-first' }, '首'), h('button', { class: 'ft-last' }, '尾')],
      ...slots
    },
    attachTo: document.body
  })
  mounted.push(wrapper)
  return wrapper
}

function activeClass() {
  const el = document.activeElement
  return el ? (el as HTMLElement).className : ''
}

beforeEach(() => {
  document.body.innerHTML = ''
  originalDescriptor = Object.getOwnPropertyDescriptor(proto, 'offsetWidth')
  Object.defineProperty(proto, 'offsetWidth', { configurable: true, get: () => 100 })
})

afterEach(() => {
  while (mounted.length) {
    mounted.pop()!.unmount()
  }
  document.body.innerHTML = ''
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
  if (originalDescriptor) {
    Object.defineProperty(proto, 'offsetWidth', originalDescriptor)
  }
})

describe('FocusTrap 焦点陷阱', () => {
  it('默认渲染 tabindex=-1 的容器，未 trapped 时不挂 is-trapped', async () => {
    const wrapper = mountTrap()
    await nextTick()
    expect(wrapper.classes()).toContain('ui-focus-trap')
    expect(wrapper.classes()).not.toContain('is-trapped')
    expect(wrapper.attributes('tabindex')).toBe('-1')
    expect(wrapper.find('.ft-first').exists()).toBe(true)
    expect(activeClass()).not.toBe('ui-focus-trap')
  })

  it('trapped 挂载后自动聚焦第一个可聚焦元素', async () => {
    mountTrap({ trapped: true })
    await nextTick()
    expect(activeClass()).toBe('ft-first')
  })

  it('trapped 由 false 切 true 时同样启动聚焦', async () => {
    const wrapper = mountTrap({ trapped: false })
    await nextTick()
    await wrapper.setProps({ trapped: true })
    await nextTick()
    expect(wrapper.classes()).toContain('is-trapped')
    expect(activeClass()).toBe('ft-first')
  })

  it('focusStartEl=container 聚焦容器，=last 聚焦末位', async () => {
    mountTrap({ trapped: true, focusStartEl: 'container' })
    await nextTick()
    expect(activeClass()).toContain('ui-focus-trap')
    mounted.pop()?.unmount()
    document.body.innerHTML = ''

    mountTrap({ trapped: true, focusStartEl: 'last' })
    await nextTick()
    expect(activeClass()).toBe('ft-last')
  })

  it('末位按 Tab：loop=false 只阻止默认行为，loop=true 回卷到首位', async () => {
    const wrapper = mountTrap({ trapped: true })
    await nextTick()
    const last = wrapper.find('.ft-last').element as HTMLElement
    last.focus()

    const stop = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    last.dispatchEvent(stop)
    expect(stop.defaultPrevented).toBe(true)
    expect(activeClass()).toBe('ft-last')

    await wrapper.setProps({ loop: true })
    const looped = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    last.dispatchEvent(looped)
    expect(looped.defaultPrevented).toBe(true)
    expect(activeClass()).toBe('ft-first')
  })

  it('首位 Shift+Tab：loop=true 跳到末位', async () => {
    const wrapper = mountTrap({ trapped: true, loop: true })
    await nextTick()
    const first = wrapper.find('.ft-first').element as HTMLElement
    const shift = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })
    first.dispatchEvent(shift)
    expect(shift.defaultPrevented).toBe(true)
    expect(activeClass()).toBe('ft-last')
  })

  it('焦点移出容器时抛 focusout 并拉回起点，内部移动不抛', async () => {
    const wrapper = mountTrap({ trapped: true })
    await nextTick()
    const first = wrapper.find('.ft-first').element as HTMLElement
    const last = wrapper.find('.ft-last').element as HTMLElement

    const innerMove = new FocusEvent('focusout', { bubbles: true, relatedTarget: last })
    first.dispatchEvent(innerMove)
    await nextTick()
    expect(wrapper.emitted('focusout')).toBeUndefined()

    const outside = document.createElement('a')
    outside.href = '#'
    document.body.appendChild(outside)
    const leave = new FocusEvent('focusout', { bubbles: true, relatedTarget: outside })
    first.dispatchEvent(leave)
    await nextTick()
    await nextTick()
    expect(wrapper.emitted('focusout')).toHaveLength(1)
    expect(activeClass()).toBe('ft-first')
  })

  it('focusTrapEl 指向外部容器时以外部容器为陷阱范围', async () => {
    const host = document.createElement('div')
    const inside = document.createElement('button')
    inside.className = 'ext-inside'
    Object.defineProperty(inside, 'offsetWidth', { configurable: true, value: 20 })
    host.appendChild(inside)
    document.body.appendChild(host)

    const wrapper = mountTrap({ trapped: true, focusTrapEl: host })
    await nextTick()
    expect(activeClass()).toBe('ext-inside')
    // 焦点在外部容器内，focusout 到更外部才抛
    const outside = document.createElement('span')
    document.body.appendChild(outside)
    const leave = new FocusEvent('focusout', { bubbles: true, relatedTarget: outside })
    inside.dispatchEvent(leave)
    await nextTick()
    await nextTick()
    expect(wrapper.emitted('focusout')).toHaveLength(1)
    host.remove()
  })

  it('trapped=false 时 Tab 不被拦截、focusout 不抛', async () => {
    const wrapper = mountTrap({ trapped: true })
    await nextTick()
    await wrapper.setProps({ trapped: false })
    const first = wrapper.find('.ft-first').element as HTMLElement
    first.focus()

    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    first.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(false)

    const outside = document.createElement('span')
    document.body.appendChild(outside)
    const leave = new FocusEvent('focusout', { bubbles: true, relatedTarget: outside })
    first.dispatchEvent(leave)
    await nextTick()
    await nextTick()
    expect(wrapper.emitted('focusout')).toBeUndefined()
  })

  it('禁用按钮不进入可聚焦集合，容器兜底聚焦', async () => {
    const wrapper = mount(FocusTrap, {
      props: { trapped: true },
      slots: { default: () => h('button', { disabled: true, class: 'ft-disabled' }, '禁用') },
      attachTo: document.body
    })
    mounted.push(wrapper)
    await nextTick()
    expect(activeClass()).toContain('ui-focus-trap')
  })

  it('实例方法 focusStart 可主动回到起点', async () => {
    const wrapper = mountTrap({ trapped: true })
    await nextTick()
    const last = wrapper.find('.ft-last').element as HTMLElement
    last.focus()
    ;(wrapper.vm as unknown as Record<string, any>).focusStart()
    await nextTick()
    expect(activeClass()).toBe('ft-first')
  })
})
