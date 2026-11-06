import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import type { Component } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Aside, Button, Card, Input, Popover, Scrollbar, Select, Table, VirtualList } from '@ui-kit-full'

const mounted: ReturnType<typeof mount>[] = []

function keep<T>(wrapper: T): T {
  mounted.push(wrapper as unknown as ReturnType<typeof mount>)
  return wrapper
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()!.unmount()
  }
  document.body.innerHTML = ''
})

/**
 * style 合并的单元锚点（缺陷 F-30）。
 *
 * 组件内部把用户传入的 style 与特性样式合并时，早先用的是对象展开：
 * style="width: 220px" 这类字符串会被摊成 { 0:'w', 1:'i', … }，
 * 真浏览器里 Vue 落样式直接抛 TypeError，happy-dom 却默默吞掉——
 * 所以这里必须显式覆盖字符串写法，把根因钉在单测层，浏览器层做全量扫描。
 */
describe('style 属性合并', () => {
  const components: { name: string; component: Component; slots?: Record<string, () => unknown> }[] = [
    { name: 'Button', component: Button },
    { name: 'Card', component: Card },
    { name: 'Input', component: Input },
    { name: 'Select', component: Select, slots: { default: () => h('span', {}, '选项') } },
    { name: 'Table', component: Table, slots: { default: () => h('span', {}, '列') } },
    { name: 'Scrollbar', component: Scrollbar, slots: { default: () => h('div', {}, '内容') } },
    { name: 'VirtualList', component: VirtualList }
  ]

  it.each(components)('$name 接受字符串 style 并原样落到根节点', ({ name, component, slots }) => {
    const wrapper = mount(component, { props: { style: 'width: 220px' }, slots, attachTo: document.body })
    keep(wrapper)
    expect(wrapper.element instanceof HTMLElement, `${name} 未渲染元素`).toBe(true)
    expect((wrapper.element as HTMLElement).style.width).toBe('220px')
    expect(wrapper.attributes('style') ?? '').toContain('width: 220px')
  })

  it('字符串 + 数组 + 对象混写时逐条落盘，不产生数字键', () => {
    const wrapper = mount(Button, {
      props: { style: ['width: 220px', { height: '44px' }, 'border-radius: 9px'] },
      slots: { default: () => h('span', {}, '提交') },
      attachTo: document.body
    })
    keep(wrapper)
    const element = wrapper.element as HTMLElement
    expect(element.style.width).toBe('220px')
    expect(element.style.height).toBe('44px')
    expect(element.style.borderRadius).toBe('9px')
  })

  it('空值与 false 的 style 不写进 DOM', () => {
    const wrapper = mount(Button, { props: { style: false }, slots: { default: () => h('span', {}, '提交') } })
    keep(wrapper)
    expect(wrapper.attributes('style') ?? '').toBe('')
  })

  // 属性优先是既有契约：这类组件的尺寸由专用 prop 决定，用户 style 只补空白
  it('Aside 的宽度由 width 属性决定，Popover 的样式路由到面板', async () => {
    const aside = mount(Aside, { props: { style: 'width: 220px' }, slots: { default: () => h('div', {}, '侧栏') } })
    keep(aside)
    expect((aside.element as HTMLElement).style.width).toBe('300px')

    const bubble = mount(Popover, {
      props: { trigger: 'click', style: 'padding: 11px', content: '面板内容' },
      slots: { default: () => h('span', { class: 'probe-trigger' }, '点开') },
      attachTo: document.body
    })
    keep(bubble)
    await bubble.find('.probe-trigger').trigger('click')
    await nextTick()
    const panel = document.querySelector('.ui-popover__panel') as HTMLElement | null
    expect(panel, '面板未渲染').toBeTruthy()
    expect(panel!.style.padding).toBe('11px')
    expect(bubble.attributes('style') ?? '').not.toContain('padding: 11px')
  })
})
