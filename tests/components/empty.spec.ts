import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import { ConfigProvider, Empty } from '@ui-kit-full'

function mountEmpty(props: Record<string, any> = {}, slots: Record<string, () => unknown> = {}) {
  return mount(Empty, { props, slots })
}

describe('Empty 空状态', () => {
  it('默认渲染内置图标与「暂无数据」描述，没有底部插槽区', () => {
    const wrapper = mountEmpty()
    expect(wrapper.classes()).toEqual(['ui-empty'])
    const inner = wrapper.find('.ui-empty__inner')
    expect(inner.exists()).toBe(true)
    expect(inner.find('img').exists()).toBe(false)
    expect(inner.find('.ui-empty__icon svg').exists()).toBe(true)
    expect(inner.find('.ui-empty__description').text()).toBe('暂无数据')
    expect(inner.find('.ui-empty__footer').exists()).toBe(false)
  })

  it('image 传入后以内置 img 替代图标', () => {
    const wrapper = mountEmpty({ image: '/empty.png' })
    const image = wrapper.find('.ui-empty__image')
    expect(image.attributes('src')).toBe('/empty.png')
    expect(wrapper.find('.ui-empty__icon').exists()).toBe(false)
    // 未指定 imageSize 时不写宽度
    expect(image.attributes('style')).toBeUndefined()
  })

  it('imageSize 作用于 img 宽度', () => {
    const wrapper = mountEmpty({ image: '/empty.png', imageSize: 120 })
    expect(wrapper.find('.ui-empty__image').attributes('style')).toContain('width: 120px')
  })

  it('imageSize 在图标形态换算宽高与字号（size*26/64）', () => {
    const wrapper = mountEmpty({ imageSize: 128 })
    const style = wrapper.find('.ui-empty__icon').attributes('style') ?? ''
    expect(style).toContain('width: 128px')
    expect(style).toContain('height: 128px')
    // 128 * 26 / 64 = 52
    expect(style).toContain('font-size: 52px')
  })

  it('description 覆盖默认文案', () => {
    const wrapper = mountEmpty({ description: '这里还什么都没有' })
    expect(wrapper.find('.ui-empty__description').text()).toBe('这里还什么都没有')
  })

  it('description 为空字符串时回退「暂无数据」', () => {
    const wrapper = mountEmpty({ description: '' })
    expect(wrapper.find('.ui-empty__description').text()).toBe('暂无数据')
  })

  it('描述文案来自 ConfigProvider 注入的 locale', () => {
    const wrapper = mount(ConfigProvider, {
      props: { locale: { empty: { description: 'No data' } } },
      slots: { default: () => h(Empty) }
    })
    expect(wrapper.find('.ui-empty__description').text()).toBe('No data')
  })

  it('默认插槽渲染进底部操作区', () => {
    const wrapper = mountEmpty({}, { default: () => h('button', { class: 'probe-btn' }, '去创建') })
    const footer = wrapper.find('.ui-empty__footer')
    expect(footer.exists()).toBe(true)
    expect(footer.find('button.probe-btn').text()).toBe('去创建')
    // 图标与描述仍在
    expect(wrapper.find('.ui-empty__icon').exists()).toBe(true)
  })

  it('slot 契约：default 渲染底部操作区，缺省不渲染页脚', () => {
    const slotted = mountEmpty({}, { default: () => h('a', { class: 'empty-action' }, '刷新') })
    expect(slotted.find('.ui-empty__footer .empty-action').text()).toBe('刷新')
    expect(mountEmpty().find('.ui-empty__footer').exists()).toBe(false)
  })
})
