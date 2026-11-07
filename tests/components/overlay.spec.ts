import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Overlay } from '@ui-kit-full'

// Overlay 是纯容器：wrapperConfig 只提供类名合并与 zIndex 样式落地，
// 没有遮罩、传送或键盘链路，断言集中在结构、attrs 透传与样式落点
const mounted: Array<ReturnType<typeof mount>> = []

function mountOverlay(
  props: Record<string, any> = {},
  attrs: Record<string, any> = {},
  slots: Record<string, any> = {}
) {
  const wrapper = mount(Overlay, { props, attrs, slots, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  while (mounted.length) {
    mounted.pop()?.unmount()
  }
  document.body.innerHTML = ''
})

describe('Overlay', () => {
  it('渲染基础容器类与插槽内容', async () => {
    const wrapper = mountOverlay({}, {}, { default: () => h('p', { class: 'kid' }, '浮层里') })
    await nextTick()
    expect(wrapper.classes()).toContain('ui-overlay')
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.element.querySelector('.kid')?.textContent).toBe('浮层里')
  })

  it('数字 zIndex 落行内样式', async () => {
    const wrapper = mountOverlay({ zIndex: 2100 })
    await nextTick()
    expect(wrapper.element.getAttribute('style') ?? '').toContain('z-index: 2100')
  })

  it('字符串 zIndex 同样落行内样式', async () => {
    const wrapper = mountOverlay({ zIndex: '500' })
    await nextTick()
    expect(wrapper.element.getAttribute('style') ?? '').toContain('z-index: 500')
  })

  it('缺省不写 zIndex 样式', async () => {
    const wrapper = mountOverlay()
    await nextTick()
    expect(wrapper.element.getAttribute('style')).toBeNull()
  })

  it('zIndex 动态更新与撤回', async () => {
    const wrapper = mountOverlay({ zIndex: 10 })
    await nextTick()
    expect(wrapper.element.getAttribute('style') ?? '').toContain('z-index: 10')
    await wrapper.setProps({ zIndex: 99 })
    expect(wrapper.element.getAttribute('style') ?? '').toContain('z-index: 99')
    await wrapper.setProps({ zIndex: undefined })
    expect(wrapper.element.getAttribute('style')).toBeNull()
  })

  it('attrs 透传到容器（dialog 语义由调用方声明）', async () => {
    const wrapper = mountOverlay({}, { role: 'dialog', 'aria-modal': 'true', id: 'ov-id' })
    await nextTick()
    expect(wrapper.element.getAttribute('role')).toBe('dialog')
    expect(wrapper.element.getAttribute('aria-modal')).toBe('true')
    expect(wrapper.element.getAttribute('id')).toBe('ov-id')
  })

  it('外部 class 与基础类合并共存', async () => {
    const wrapper = mountOverlay({}, { class: 'mine' })
    await nextTick()
    expect(wrapper.classes()).toContain('mine')
    expect(wrapper.classes()).toContain('ui-overlay')
  })

  it('空插槽时容器保留但无子节点', async () => {
    const wrapper = mount(Overlay, { attachTo: document.body })
    mounted.push(wrapper)
    await nextTick()
    expect(wrapper.element.children.length).toBe(0)
    expect(wrapper.element.className).toBe('ui-overlay')
  })

  it('卸载后 DOM 干净无残留', async () => {
    const wrapper = mountOverlay({ zIndex: 5 }, {}, { default: () => h('span', 'x') })
    await nextTick()
    wrapper.unmount()
    expect(document.querySelector('.ui-overlay')).toBeNull()
  })
})
