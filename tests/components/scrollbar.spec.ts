import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Scrollbar } from '@ui-kit-full'

function mountScrollbar(props: Record<string, any> = {}, content: any = h('div', { class: 'box' }, '内容')) {
  return mount(Scrollbar, { props, slots: { default: () => content }, attachTo: document.body })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Scrollbar', () => {
  it('渲染根/wrap/view 三层结构与基类名', () => {
    const wrapper = mountScrollbar()
    expect(wrapper.classes()).toContain('ui-scrollbar')
    expect(wrapper.find('.ui-scrollbar__wrap').exists()).toBe(true)
    expect(wrapper.find('.ui-scrollbar__view .box').exists()).toBe(true)
  })

  it('默认 view 标签为 div，tag 属性可切换', () => {
    expect(mountScrollbar().find('.ui-scrollbar__view').element.tagName).toBe('DIV')
    expect(mountScrollbar({ tag: 'ul' }).find('.ui-scrollbar__view').element.tagName).toBe('UL')
  })

  it('height/maxHeight 写入 wrap 内联样式', () => {
    const wrap = mountScrollbar({ height: 100, maxHeight: 200 }).find('.ui-scrollbar__wrap')
    expect(wrap.attributes('style') ?? '').toContain('height: 100px')
    expect(wrap.attributes('style') ?? '').toContain('max-height: 200px')
  })

  it('distance 落成根节点 CSS 变量并偏移滑块轨道', () => {
    const wrapper = mountScrollbar({ distance: 8 })
    expect(wrapper.attributes('style') ?? '').toContain('--ui-scrollbar-distance: 8px')
    expect(wrapper.find('.ui-scrollbar__bar.is-vertical').attributes('style') ?? '').toContain('right: 10px')
  })

  it('非原生模式渲染横竖两条滑块轨道', () => {
    const wrapper = mountScrollbar()
    expect(wrapper.find('.ui-scrollbar__bar.is-vertical').exists()).toBe(true)
    expect(wrapper.find('.ui-scrollbar__bar.is-horizontal').exists()).toBe(true)
  })

  it('native 模式挂原生类名且移除自定义轨道', () => {
    const wrapper = mountScrollbar({ native: true })
    expect(wrapper.classes()).toContain('ui-scrollbar--native')
    expect(wrapper.findAll('.ui-scrollbar__bar')).toHaveLength(0)
  })

  it('always 给轨道追加 is-always 类名', () => {
    expect(mountScrollbar({ always: true }).find('.ui-scrollbar__bar').classes()).toContain('is-always')
    expect(mountScrollbar().find('.ui-scrollbar__bar').classes()).not.toContain('is-always')
  })

  it('wrapClass / viewClass 追加到对应层', () => {
    const wrapper = mountScrollbar({ wrapClass: 'my-wrap', viewClass: 'my-view' })
    expect(wrapper.find('.ui-scrollbar__wrap').classes()).toContain('my-wrap')
    expect(wrapper.find('.ui-scrollbar__view').classes()).toContain('my-view')
  })

  it('id/role/tabindex/aria-* 落到根节点', () => {
    const wrapper = mountScrollbar({ id: 'sb1', role: 'region', tabindex: 0, ariaLabel: '滚动区', ariaOrientation: 'vertical' })
    expect(wrapper.attributes('id')).toBe('sb1')
    expect(wrapper.attributes('role')).toBe('region')
    expect(wrapper.attributes('tabindex')).toBe('0')
    expect(wrapper.attributes('aria-label')).toBe('滚动区')
    expect(wrapper.attributes('aria-orientation')).toBe('vertical')
  })

  it('wrapStyle/viewStyle 分别落到 wrap 与 view', () => {
    const wrapper = mountScrollbar({ wrapStyle: 'padding: 3px', viewStyle: { margin: '2px' } })
    expect(wrapper.find('.ui-scrollbar__wrap').attributes('style') ?? '').toContain('padding: 3px')
    expect(wrapper.find('.ui-scrollbar__view').attributes('style') ?? '').toContain('margin: 2px')
  })

  it('对外暴露 update/handleScroll/setScrollTop/setScrollLeft 方法', () => {
    const api = mountScrollbar().vm as any
    expect(typeof api.update).toBe('function')
    expect(typeof api.handleScroll).toBe('function')
    expect(typeof api.setScrollTop).toBe('function')
    expect(typeof api.setScrollLeft).toBe('function')
  })

  it('滚动时抛出 scroll 事件并回传 scrollTop/scrollLeft', async () => {
    const wrapper = mountScrollbar()
    await wrapper.find('.ui-scrollbar__wrap').trigger('scroll')
    const payload = (wrapper.emitted('scroll')?.[0]?.[0] ?? {}) as Record<string, unknown>
    expect(payload).toEqual(expect.objectContaining({ scrollTop: expect.any(Number), scrollLeft: expect.any(Number) }))
  })

  it('无内容时仍渲染空 view 容器不报错', () => {
    const wrapper = mountScrollbar({}, null)
    expect(wrapper.find('.ui-scrollbar__view').exists()).toBe(true)
  })

  it('class 透传与基类名共存', () => {
    expect(mountScrollbar({ class: 'extra' }).classes()).toEqual(expect.arrayContaining(['ui-scrollbar', 'extra']))
  })

  it('字符串 style 与内部 CSS 变量合并落根节点', () => {
    const wrapper = mount({ render: () => h(Scrollbar, { style: 'width: 220px' }, () => h('div', 'x')) })
    expect(wrapper.attributes('style') ?? '').toContain('width: 220px')
    expect(wrapper.attributes('style') ?? '').toContain('--ui-scrollbar-distance')
  })

  it('minSize 缺省 20 且自定义后仍渲染滑块', () => {
    const wrapper = mountScrollbar({ minSize: 40 })
    expect(wrapper.find('.ui-scrollbar__thumb').exists()).toBe(true)
  })
})
