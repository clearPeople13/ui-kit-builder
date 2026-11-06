import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FocusTrap } from '@ui-kit-full'

// happy-dom 里所有元素 offsetWidth/offsetHeight 为 0，FocusTrap 的可见性过滤
// （isVisible）会把焦点项全部判死；这里给原型打尺寸补丁模拟可见元素，
// 只用于驱动焦点逻辑，不断言任何几何数值
const mounted: Array<ReturnType<typeof mount>> = []
const widthDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
const heightDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')

function patchVisible() {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 16 })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 16 })
}

function restoreVisible() {
  if (widthDesc) {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', widthDesc)
  } else {
    delete (HTMLElement.prototype as Record<string, any>).offsetWidth
  }
  if (heightDesc) {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', heightDesc)
  } else {
    delete (HTMLElement.prototype as Record<string, any>).offsetHeight
  }
}

function mountTrap(props: Record<string, any> = {}) {
  const wrapper = mount(FocusTrap, {
    props,
    slots: {
      default: () => [h('button', { class: 'ft-first' }, '一'), h('button', { class: 'ft-last' }, '二')]
    },
    attachTo: document.body
  })
  mounted.push(wrapper)
  return wrapper
}

function pressTab(el: HTMLElement, shift = false) {
  const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true })
  el.dispatchEvent(event)
  return event
}

async function flush() {
  await nextTick()
  await nextTick()
}

beforeEach(() => {
  document.body.innerHTML = ''
  patchVisible()
})

afterEach(() => {
  while (mounted.length) {
    mounted.pop()?.unmount()
  }
  document.body.innerHTML = ''
  restoreVisible()
})

describe('FocusTrap', () => {
  it('默认渲染可聚焦容器且未激活拦截', async () => {
    const wrapper = mount(FocusTrap, {
      slots: { default: () => h('button', { class: 'b' }, 'x') },
      attachTo: document.body
    })
    mounted.push(wrapper)
    await flush()
    expect(wrapper.classes()).toContain('ui-focus-trap')
    expect(wrapper.classes()).not.toContain('is-trapped')
    expect(wrapper.element.getAttribute('tabindex')).toBe('-1')
  })

  it('trapped 挂载即聚焦第一项并加 is-trapped 类', async () => {
    const wrapper = mountTrap({ trapped: true })
    await flush()
    expect(wrapper.classes()).toContain('is-trapped')
    expect(document.activeElement?.className).toBe('ft-first')
  })

  it('loop=false 时末项 Tab 被阻止但不回卷', async () => {
    const wrapper = mountTrap({ trapped: true })
    await flush()
    const last = wrapper.element.querySelector('.ft-last') as HTMLElement
    last.focus()
    const event = pressTab(last)
    await flush()
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement?.className).toBe('ft-last')
  })

  it('loop=true 时末项 Tab 回卷到首项', async () => {
    const wrapper = mountTrap({ trapped: true, loop: true })
    await flush()
    const last = wrapper.element.querySelector('.ft-last') as HTMLElement
    last.focus()
    const event = pressTab(last)
    await flush()
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement?.className).toBe('ft-first')
  })

  it('loop=true 时首项 Shift+Tab 回卷到末项', async () => {
    const wrapper = mountTrap({ trapped: true, loop: true })
    await flush()
    const first = wrapper.element.querySelector('.ft-first') as HTMLElement
    const event = pressTab(first, true)
    await flush()
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement?.className).toBe('ft-last')
  })

  it('焦点在容器外时 Tab 强制拉回首项（不受 loop 影响）', async () => {
    const wrapper = mountTrap({ trapped: true })
    await flush()
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    outside.focus()
    const event = pressTab(outside)
    await flush()
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement?.className).toBe('ft-first')
    outside.remove()
    expect(wrapper.element.contains(document.activeElement)).toBe(true)
  })

  it('空内容时 Tab 阻止默认并把焦点落在容器上', async () => {
    const wrapper = mount(FocusTrap, { props: { trapped: true }, attachTo: document.body })
    mounted.push(wrapper)
    await flush()
    const event = pressTab(wrapper.element as HTMLElement)
    await flush()
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(wrapper.element)
  })

  it('焦点移出容器时抛出 focusout 并自动拉回', async () => {
    const wrapper = mountTrap({ trapped: true })
    await flush()
    const first = wrapper.element.querySelector('.ft-first') as HTMLElement
    first.focus()
    first.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }))
    await flush()
    expect(wrapper.emitted('focusout')).toHaveLength(1)
    expect(document.activeElement?.className).toBe('ft-first')
  })

  it('focusStartEl=last 时初始聚焦末项', async () => {
    const wrapper = mountTrap({ trapped: true, focusStartEl: 'last' })
    await flush()
    expect(document.activeElement?.className).toBe('ft-last')
  })

  it('focusStartEl=container 与元素实例两种起点', async () => {
    const wrapper = mountTrap({ trapped: true, focusStartEl: 'container' })
    await flush()
    expect(document.activeElement).toBe(wrapper.element)
    await wrapper.setProps({ focusStartEl: wrapper.element.querySelector('.ft-last') as HTMLElement })
    ;(wrapper.vm as unknown as { focusStart: () => void }).focusStart()
    await flush()
    expect(document.activeElement?.className).toBe('ft-last')
  })

  it('focusTrapEl 指向外部容器时在外部容器内循环', async () => {
    const outside = document.createElement('div')
    outside.tabIndex = 0
    outside.className = 'ext-box'
    const inner = document.createElement('button')
    inner.className = 'ext-btn'
    outside.appendChild(inner)
    document.body.appendChild(outside)
    const wrapper = mount(FocusTrap, {
      props: { trapped: true, focusTrapEl: outside },
      attachTo: document.body
    })
    mounted.push(wrapper)
    await flush()
    expect(wrapper.classes()).toContain('is-trapped')
    expect(document.activeElement?.className).toBe('ext-btn')
    const event = pressTab(inner)
    await flush()
    expect(event.defaultPrevented).toBe(true)
    wrapper.unmount()
    outside.remove()
  })

  it('trapped 由 false 切到 true 时补挂监听并聚焦', async () => {
    const wrapper = mountTrap({ trapped: false })
    await flush()
    const spyAdd = vi.spyOn(window, 'addEventListener')
    await wrapper.setProps({ trapped: true })
    await flush()
    const added = spyAdd.mock.calls.map((call) => call[0])
    expect(added).toContain('keydown')
    expect(added).toContain('focusout')
    expect(document.activeElement?.className).toBe('ft-first')
    spyAdd.mockRestore()
  })

  it('暴露 focusStart 方法', async () => {
    const wrapper = mountTrap({ trapped: true })
    await flush()
    expect(typeof (wrapper.vm as unknown as { focusStart: unknown }).focusStart).toBe('function')
  })

  it('卸载移除全部窗口监听', async () => {
    const wrapper = mountTrap({ trapped: true })
    await flush()
    const spyRemove = vi.spyOn(window, 'removeEventListener')
    wrapper.unmount()
    const removed = spyRemove.mock.calls.map((call) => call[0])
    expect(removed).toContain('keydown')
    expect(removed).toContain('focusout')
    spyRemove.mockRestore()
    expect(document.querySelector('.ui-focus-trap')).toBeNull()
  })
})
