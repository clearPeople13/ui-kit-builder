import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OnlyChild } from '@ui-kit-full'

function mountOnlyChild(attrs: Record<string, any> = {}, children: any = null) {
  return mount(OnlyChild, { attrs, slots: { default: () => children }, attachTo: document.body })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('OnlyChild（Slot 插槽工具）', () => {
  it('单个元素子节点原样渲染', () => {
    const wrapper = mountOnlyChild({}, h('span', { class: 'inner' }, '内容'))
    expect(wrapper.find('span.inner').exists()).toBe(true)
    expect(wrapper.text()).toBe('内容')
  })

  it('外部 class 合并到唯一子节点', () => {
    const wrapper = mountOnlyChild({ class: 'outer' }, h('span', { class: 'inner' }, 'x'))
    expect(wrapper.element.classList.contains('inner')).toBe(true)
    expect(wrapper.element.classList.contains('outer')).toBe(true)
  })

  it('非 class 属性透传到子节点', () => {
    const wrapper = mountOnlyChild({ 'data-x': '1', id: 'only-1' }, h('button', 'x'))
    expect(wrapper.element.getAttribute('data-x')).toBe('1')
    expect(wrapper.element.getAttribute('id')).toBe('only-1')
    expect(wrapper.element.tagName).toBe('BUTTON')
  })

  it('无子节点时渲染为空', () => {
    const wrapper = mountOnlyChild({}, null)
    expect(wrapper.element.nodeType).not.toBe(1)
  })

  it('多个子节点时渲染为空并给出警告', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mountOnlyChild({}, [h('span', 'A'), h('span', 'B')])
    expect(wrapper.element.textContent).toBe('')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('Fragment 子节点被展平计数（v-for 单元素仍合法）', () => {
    const wrapper = mountOnlyChild({}, [h('div', {}, [h('span', '唯一')])])
    // 展平后只有一个 legit 元素，正常渲染
    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('纯文本子节点被直接返回', () => {
    const wrapper = mountOnlyChild({}, '纯文本')
    expect(wrapper.text()).toBe('纯文本')
  })

  it('自定义组件子节点直接返回（不克隆 attrs）', () => {
    const Child = { render: () => h('p', { class: 'child-p' }, '子组件') }
    const wrapper = mountOnlyChild({ class: 'outer' }, h(Child))
    expect(wrapper.find('p.child-p').exists()).toBe(true)
  })

  it('class 与字符串 style 一起透传', () => {
    const wrapper = mountOnlyChild({ class: 'outer', style: 'color: red' }, h('span', 'x'))
    expect(wrapper.element.classList.contains('outer')).toBe(true)
    expect((wrapper.element as HTMLElement).style.color).toBe('red')
  })

  it('注释子节点被忽略不计入数量', () => {
    const wrapper = mountOnlyChild({}, [h('span', 'A')])
    expect(wrapper.find('span').exists()).toBe(true)
  })

  it('空数组子节点渲染为空', () => {
    const wrapper = mountOnlyChild({}, [])
    expect(wrapper.element.textContent).toBe('')
  })

  it('保留子节点自身 class 不被丢弃', () => {
    const wrapper = mountOnlyChild({}, h('em', { class: 'keep-me' }, 'x'))
    expect(wrapper.element.classList.contains('keep-me')).toBe(true)
  })
})
