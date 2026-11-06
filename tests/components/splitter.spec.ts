import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Splitter, SplitterPanel } from '@ui-kit-full'

function mountSplitter(props: Record<string, any> = {}, panels: any = [h(SplitterPanel, {}, () => 'A'), h(SplitterPanel, {}, () => 'B')]) {
  return mount(Splitter, { props, slots: { default: () => panels }, attachTo: document.body })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Splitter / SplitterPanel', () => {
  it('默认水平布局并挂 is-horizontal', () => {
    const wrapper = mountSplitter()
    expect(wrapper.classes()).toContain('ui-splitter')
    expect(wrapper.classes()).toContain('is-horizontal')
  })

  it('layout vertical 切换 is-vertical', () => {
    expect(mountSplitter({ layout: 'vertical' }).classes()).toContain('is-vertical')
  })

  it('两块面板之间插入可聚焦的分隔条', () => {
    const wrapper = mountSplitter()
    const bar = wrapper.find('.ui-splitter__bar')
    expect(bar.exists()).toBe(true)
    expect(bar.attributes('role')).toBe('separator')
    expect(bar.attributes('tabindex')).toBe('0')
  })

  it('水平布局的分隔条 aria-orientation 为 vertical，垂直布局为 horizontal', () => {
    expect(mountSplitter().find('.ui-splitter__bar').attributes('aria-orientation')).toBe('vertical')
    expect(mountSplitter({ layout: 'vertical' }).find('.ui-splitter__bar').attributes('aria-orientation')).toBe('horizontal')
  })

  it('两块面板只有一个分隔条，单块面板没有', () => {
    expect(mountSplitter().findAll('.ui-splitter__bar')).toHaveLength(1)
    const single = mountSplitter({}, [h(SplitterPanel, {}, () => '仅一块')])
    expect(single.findAll('.ui-splitter__bar')).toHaveLength(0)
  })

  it('panel size 落成固定 flex-basis', () => {
    const panel = mountSplitter({}, [h(SplitterPanel, { size: 100 }, () => 'A'), h(SplitterPanel, {}, () => 'B')]).find('.ui-splitter-panel')
    expect(panel.attributes('style') ?? '').toContain('flex-basis: 100px')
  })

  it('panel 字符串百分比 size 原样写入 flex', () => {
    const panel = mountSplitter({}, [h(SplitterPanel, { size: '30%' }, () => 'A'), h(SplitterPanel, {}, () => 'B')]).find('.ui-splitter-panel')
    expect(panel.attributes('style') ?? '').toContain('30%')
  })

  it('无 size 的面板默认等分（flex-grow 1）', () => {
    const panel = mountSplitter().find('.ui-splitter-panel')
    expect(panel.attributes('style') ?? '').toContain('flex-grow: 1')
  })

  it('resizable 默认为真，面板挂 draggable 类名', () => {
    expect(mountSplitter().find('.ui-splitter-panel').classes()).toContain('ui-splitter-panel--draggable')
  })

  it('resizable 为假时移除 draggable 类名', () => {
    const wrapper = mountSplitter({}, [h(SplitterPanel, { resizable: false }, () => 'A'), h(SplitterPanel, {}, () => 'B')])
    expect(wrapper.findAll('.ui-splitter-panel')[0].classes()).not.toContain('ui-splitter-panel--draggable')
  })

  it('lazy 跟随 prop 挂 ui-splitter--lazy', () => {
    expect(mountSplitter({ lazy: true }).classes()).toContain('ui-splitter--lazy')
    expect(mountSplitter().classes()).not.toContain('ui-splitter--lazy')
  })

  it('无面板时内容区渲染为空', () => {
    const wrapper = mountSplitter({}, [])
    expect(wrapper.findAll('.ui-splitter-panel')).toHaveLength(0)
    expect(wrapper.findAll('.ui-splitter__bar')).toHaveLength(0)
  })

  it('面板内容通过默认插槽渲染', () => {
    const wrapper = mountSplitter({}, [h(SplitterPanel, {}, () => h('b', { class: 'in-a' }, '甲')), h(SplitterPanel, {}, () => '乙')])
    expect(wrapper.find('.in-a').text()).toBe('甲')
  })

  it('class 透传与基类名共存', () => {
    expect(mountSplitter({ class: 'my-split' }).classes()).toEqual(expect.arrayContaining(['ui-splitter', 'my-split']))
  })
})
