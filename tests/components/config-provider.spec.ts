import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { ConfigProvider, Segmented, Space, Tag, Text } from '@ui-kit-full'

function mountProvider(props: Record<string, any> = {}, child: any) {
  return mount(ConfigProvider, {
    props,
    slots: { default: () => child },
    attachTo: document.body
  })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('ConfigProvider', () => {
  it('渲染根节点并透传默认插槽内容', () => {
    const wrapper = mountProvider({}, h('span', { class: 'child' }, '内容'))
    expect(wrapper.classes()).toContain('ui-config-provider')
    expect(wrapper.find('.child').text()).toBe('内容')
  })

  it('size 落到根节点尺寸类名', () => {
    expect(mountProvider({ size: 'small' }, h('span', 'x')).classes()).toContain('ui-config-provider--size-small')
    expect(mountProvider({ size: 'large' }, h('span', 'x')).classes()).toContain('ui-config-provider--size-large')
  })

  it('未设置 size 时根节点不带尺寸类名', () => {
    expect(mountProvider({}, h('span', 'x')).classes()).not.toContain('ui-config-provider--size-small')
  })

  it('size 空字符串等价于未设置，不向下传递', () => {
    const wrapper = mountProvider({ size: '' }, h(Segmented, { options: ['a'], modelValue: 'a' }))
    expect(wrapper.find('.ui-segmented').classes()).not.toEqual(expect.arrayContaining(['is-size-small']))
  })

  it('size 向下传递给未显式设置 size 的子组件', () => {
    const wrapper = mountProvider({ size: 'large' }, h(Segmented, { options: ['a', 'b'], modelValue: 'a' }))
    expect(wrapper.find('.ui-segmented').classes()).toContain('is-size-large')
  })

  it('子组件显式 size 优先于全局 size', () => {
    const wrapper = mountProvider({ size: 'large' }, h(Segmented, { options: ['a'], modelValue: 'a', size: 'small' }))
    expect(wrapper.find('.ui-segmented').classes()).toContain('is-size-small')
    expect(wrapper.find('.ui-segmented').classes()).not.toContain('is-size-large')
  })

  it('size 向下传递给 Tag', () => {
    const wrapper = mountProvider(
      { size: 'large' },
      h(Tag, {}, () => '标签')
    )
    expect(wrapper.find('.ui-tag').classes()).toContain('ui-tag--size-large')
  })

  it('size 向下传递给 Text（默认空串视为未设置）', () => {
    const wrapper = mountProvider(
      { size: 'small' },
      h(Text, {}, () => '文本')
    )
    expect(wrapper.find('.ui-text').classes()).toContain('ui-text--size-small')
  })

  it('size 不传递给 Space（size 类型含 Number，不接受全局尺寸）', async () => {
    const wrapper = mountProvider(
      { size: 'large' },
      h(Space, {}, () => h('span', 'A'))
    )
    await nextTick()
    // Space 仍走自身缺省 8px，而不是被 provider 改成 'large'
    expect(wrapper.find('.ui-space').attributes('style')).toContain('gap: 8px')
  })

  it('无 provider 时子组件保持自身缺省尺寸', () => {
    const wrapper = mount(Segmented, { props: { options: ['a'], modelValue: 'a' }, attachTo: document.body })
    expect(wrapper.classes()).not.toEqual(expect.arrayContaining(['is-size-large', 'is-size-small']))
  })

  it('内层 ConfigProvider 的 size 覆盖外层，作用于其子树', () => {
    const wrapper = mountProvider(
      { size: 'large' },
      h(ConfigProvider, { size: 'small' }, { default: () => h(Tag, {}, () => '内层') })
    )
    expect(wrapper.find('.ui-tag').classes()).toContain('ui-tag--size-small')
    expect(wrapper.find('.ui-tag').classes()).not.toContain('ui-tag--size-large')
  })

  it('内层 ConfigProvider 未设 size 时会屏蔽外层的全局尺寸', () => {
    const wrapper = mountProvider({ size: 'large' }, h(ConfigProvider, {}, { default: () => h(Tag, {}, () => '内层') }))
    // 内层 provider 重新 provide 了空配置，子组件不再继承外层
    expect(wrapper.find('.ui-tag').classes()).not.toContain('ui-tag--size-large')
  })

  it('根节点仅包裹内容不额外渲染滚动/遮罩结构', () => {
    const wrapper = mountProvider({ size: 'large' }, h('div', { class: 'only' }))
    expect(wrapper.findAll('.ui-config-provider')).toHaveLength(1)
    expect(wrapper.element.tagName).toBe('DIV')
  })

  it('class 透传与基类名共存', () => {
    const wrapper = mountProvider({ class: 'my-provider' }, h('span', 'x'))
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-config-provider', 'my-provider']))
  })

  it('字符串 style 原样落到根节点', () => {
    const wrapper = mount(ConfigProvider, {
      props: { style: 'width: 220px' },
      slots: { default: () => h('span', 'x') }
    })
    expect(wrapper.attributes('style') ?? '').toContain('width: 220px')
  })
})
