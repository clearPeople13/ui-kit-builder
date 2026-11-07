import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import { Card } from '@ui-kit-full'

function mountCard(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  return mount(Card, { props, slots })
}

function body(wrapper: VueWrapper) {
  return wrapper.find('.ui-card__body')
}

describe('Card 卡片', () => {
  it('缺省只渲染主体且不产出头尾封面', () => {
    const wrapper = mountCard({}, { default: () => '卡片内容' })
    expect(wrapper.classes()).toContain('ui-card')
    expect(wrapper.element.tagName).toBe('DIV')
    expect(body(wrapper).exists()).toBe(true)
    expect(body(wrapper).text()).toBe('卡片内容')
    expect(wrapper.find('.ui-card__header').exists()).toBe(false)
    expect(wrapper.find('.ui-card__footer').exists()).toBe(false)
    expect(wrapper.find('.ui-card__cover-wrap').exists()).toBe(false)
  })

  it('header 与 footer 属性渲染头尾', () => {
    const wrapper = mountCard({ header: '标题区', footer: '底部区' })
    expect(wrapper.find('.ui-card__header').text()).toBe('标题区')
    expect(wrapper.find('.ui-card__footer').text()).toBe('底部区')
  })

  it('header 插槽优先于 header 属性', () => {
    const wrapper = mountCard({ header: '属性头' }, { header: () => '插槽头' })
    expect(wrapper.find('.ui-card__header').text()).toBe('插槽头')
  })

  it('cover 属性渲染封面图', () => {
    const wrapper = mountCard({ cover: '/bg.png' })
    const wrap = wrapper.find('.ui-card__cover-wrap')
    expect(wrap.exists()).toBe(true)
    const img = wrapper.find('img.ui-card__cover')
    expect(img.attributes('src')).toBe('/bg.png')
    expect(img.attributes('alt')).toBe('')
    expect(wrap.element.contains(img.element)).toBe(true)
  })

  it('cover 插槽覆盖默认封面图', () => {
    const wrapper = mountCard({ cover: '/bg.png' }, { cover: () => h('video', { class: 'my-video' }) })
    expect(wrapper.find('.ui-card__cover-wrap').exists()).toBe(true)
    expect(wrapper.find('img.ui-card__cover').exists()).toBe(false)
    expect(wrapper.find('.my-video').exists()).toBe(true)
  })

  it('bodyStyle 对象写入内联样式', () => {
    expect(body(mountCard({ bodyStyle: { color: 'red', padding: '10px' } })).attributes('style')).toContain(
      'color: red'
    )
  })

  it('bodyStyle 字符串同样落到内联样式', () => {
    expect(body(mountCard({ bodyStyle: 'background: rgb(1, 2, 3)' })).attributes('style')).toContain('background')
  })

  it('headerClass/bodyClass/footerClass 追加自定义类名', () => {
    const wrapper = mountCard({
      header: 'h',
      footer: 'f',
      headerClass: 'my-header',
      bodyClass: 'my-body',
      footerClass: ['my-footer', 'extra']
    })
    expect(wrapper.find('.ui-card__header').classes()).toContain('my-header')
    expect(body(wrapper).classes()).toContain('my-body')
    expect(wrapper.find('.ui-card__footer').classes()).toContain('my-footer')
    expect(wrapper.find('.ui-card__footer').classes()).toContain('extra')
  })

  it('shadow always 与 hover 映射阴影类名', () => {
    expect(mountCard({ shadow: 'always' }).classes()).toContain('is-always-shadow')
    expect(mountCard({ shadow: 'hover' }).classes()).toContain('is-hover-shadow')
  })

  it('shadow 缺省或不识别时不挂阴影类名', () => {
    expect(mountCard({}).classes().filter((c: string) => c.endsWith('-shadow'))).toEqual([])
    expect(mountCard({ shadow: 'never' }).classes().filter((c: string) => c.endsWith('-shadow'))).toEqual([])
  })

  it('四段结构按规定顺序排列', () => {
    const wrapper = mountCard({ header: 'h', footer: 'f', cover: '/c.png' }, { default: () => 'b' })
    const order = Array.from(wrapper.element.children).map((child: Element) => child.className.split(' ')[0])
    expect(order).toEqual(['ui-card__cover-wrap', 'ui-card__header', 'ui-card__body', 'ui-card__footer'])
  })

  it('空字符串 header 不渲染头', () => {
    const wrapper = mountCard({ header: '', footer: '' })
    expect(wrapper.find('.ui-card__header').exists()).toBe(false)
    expect(wrapper.find('.ui-card__footer').exists()).toBe(false)
  })

  it('无默认插槽时主体为空节点', () => {
    const wrapper = mountCard({})
    expect(body(wrapper).exists()).toBe(true)
    expect(body(wrapper).text()).toBe('')
  })

  it('超长正文完整保留', () => {
    const long = '内容'.repeat(50)
    expect(body(mountCard({}, { default: () => long })).text()).toBe(long)
  })
})
