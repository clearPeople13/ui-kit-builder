import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import { Aside, Container, Footer, Header, Main } from '@ui-kit-full'

describe('Container 布局容器', () => {
  it('缺省渲染 section 并按内容判定纵向', () => {
    const wrapper = mount(Container, { slots: { default: () => h(Main, {}, () => '主体') } })
    expect(wrapper.element.tagName).toBe('SECTION')
    expect(wrapper.classes()).toContain('ui-container')
    expect(wrapper.classes()).toContain('ui-container--vertical')
  })

  it('tag 替换根元素', () => {
    expect(mount(Container, { props: { tag: 'div' } }).element.tagName).toBe('DIV')
  })

  it('含直接子 Aside 时自动横向且不挂纵向类名', () => {
    const wrapper = mount(Container, {
      slots: { default: () => [h(Aside, {}, () => '侧栏'), h(Main, {}, () => '主体')] }
    })
    expect(wrapper.classes()).toContain('ui-container')
    expect(wrapper.classes()).not.toContain('ui-container--vertical')
  })

  it('direction 显式覆盖自动判定', () => {
    const forcedVertical = mount(Container, {
      props: { direction: 'vertical' },
      slots: { default: () => [h(Aside, {}, () => 's'), h(Main, {}, () => 'm')] }
    })
    expect(forcedVertical.classes()).toContain('ui-container--vertical')
    const forcedHorizontal = mount(Container, { props: { direction: 'horizontal' } })
    expect(forcedHorizontal.classes()).not.toContain('ui-container--vertical')
  })

  it('Aside 渲染 aside 并带缺省宽度', () => {
    const wrapper = mount(Aside, { slots: { default: () => '侧' } })
    expect(wrapper.element.tagName).toBe('ASIDE')
    expect(wrapper.classes()).toContain('ui-aside')
    expect(wrapper.attributes('style')).toContain('width: 300px')
  })

  it('Aside width 数字按 px、纯数字字符串转 px、其它字符串原样', () => {
    expect(mount(Aside, { props: { width: 200 } }).attributes('style')).toContain('width: 200px')
    expect(mount(Aside, { props: { width: '250' } }).attributes('style')).toContain('width: 250px')
    expect(mount(Aside, { props: { width: '28%' } }).attributes('style')).toContain('width: 28%')
    expect(mount(Aside, { props: { width: '20rem' } }).attributes('style')).toContain('width: 20rem')
  })

  it('Header 渲染 header 与缺省高度', () => {
    const wrapper = mount(Header, { slots: { default: () => '顶部' } })
    expect(wrapper.element.tagName).toBe('HEADER')
    expect(wrapper.classes()).toContain('ui-header')
    expect(wrapper.attributes('style')).toContain('height: 60px')
    expect(wrapper.text()).toBe('顶部')
  })

  it('Header height 支持字符串覆盖', () => {
    expect(mount(Header, { props: { height: '72px' } }).attributes('style')).toContain('height: 72px')
    expect(mount(Header, { props: { height: 48 } }).attributes('style')).toContain('height: 48px')
  })

  it('Footer 渲染 footer 与缺省高度', () => {
    const wrapper = mount(Footer, { slots: { default: () => '底部' } })
    expect(wrapper.element.tagName).toBe('FOOTER')
    expect(wrapper.classes()).toContain('ui-footer')
    expect(wrapper.attributes('style')).toContain('height: 60px')
  })

  it('Footer height 可覆盖', () => {
    expect(mount(Footer, { props: { height: '4rem' } }).attributes('style')).toContain('height: 4rem')
  })

  it('Main 渲染 main 且缺省无内联 padding', () => {
    const wrapper = mount(Main, { slots: { default: () => '内容' } })
    expect(wrapper.element.tagName).toBe('MAIN')
    expect(wrapper.classes()).toContain('ui-main')
    expect(wrapper.attributes('style') ?? '').not.toContain('padding')
  })

  it('Main padding 数字转 px、简写原样', () => {
    expect(mount(Main, { props: { padding: 12 } }).attributes('style')).toContain('padding: 12px')
    expect(mount(Main, { props: { padding: '8px 16px' } }).attributes('style')).toContain('padding: 8px 16px')
  })

  it('组合四段结构完整渲染', () => {
    const wrapper = mount(Container, {
      slots: {
        default: () => [
          h(Header, {}, () => '顶'),
          h(Aside, {}, () => '侧'),
          h(Main, {}, () => '主'),
          h(Footer, {}, () => '脚')
        ]
      }
    })
    expect(wrapper.findAll('.ui-header')).toHaveLength(1)
    expect(wrapper.findAll('.ui-aside')).toHaveLength(1)
    expect(wrapper.findAll('.ui-main')).toHaveLength(1)
    expect(wrapper.findAll('.ui-footer')).toHaveLength(1)
    expect(wrapper.classes()).not.toContain('ui-container--vertical')
  })

  it('空容器只渲染根', () => {
    const wrapper = mount(Container, { slots: { default: () => [] } })
    expect(wrapper.classes()).toContain('ui-container')
    expect(wrapper.text()).toBe('')
  })
})
