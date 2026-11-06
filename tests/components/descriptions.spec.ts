import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import { Descriptions, DescriptionsItem } from '@ui-kit-full'

const rows = [
  { label: '姓名', span: 1, content: '张三' },
  { label: '备注', span: 2, content: '很长的备注内容' },
  { label: '年龄', span: 1, content: '20' }
]

function mountDescriptions(props: Record<string, any> = {}, list = rows) {
  return mount(Descriptions, {
    props,
    slots: { default: () => list.map((item) => h(DescriptionsItem, { label: item.label, span: item.span }, () => item.content)) }
  })
}

function itemWrappers(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-descriptions-item')
}

describe('Descriptions 描述列表', () => {
  it('根节点缺省三列栅格', () => {
    const wrapper = mountDescriptions()
    expect(wrapper.classes()).toContain('ui-descriptions')
    const style = wrapper.attributes('style') ?? ''
    expect(style).toContain('display: grid')
    expect(style).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))')
    expect(itemWrappers(wrapper)).toHaveLength(3)
  })

  it('column 改写列数', () => {
    expect(mountDescriptions({ column: 2 }).attributes('style')).toContain('repeat(2, minmax(0, 1fr))')
    expect(mountDescriptions({ column: 0 }).attributes('style')).toContain('repeat(3, minmax(0, 1fr))')
  })

  it('size 落尺寸类名', () => {
    expect(mountDescriptions({ size: 'small' }).classes()).toContain('ui-descriptions--size-small')
    expect(mountDescriptions({}).classes().filter((c: string) => c.startsWith('ui-descriptions--size'))).toEqual([])
  })

  it('border 追加 is-bordered', () => {
    expect(mountDescriptions({ border: true }).classes()).toContain('is-bordered')
    expect(mountDescriptions({}).classes()).not.toContain('is-bordered')
  })

  it('title 与 extra 渲染标题栏', () => {
    const wrapper = mountDescriptions({ title: '用户信息', extra: '编辑' })
    expect(wrapper.find('.ui-descriptions__header').exists()).toBe(true)
    expect(wrapper.find('.ui-descriptions__title').text()).toBe('用户信息')
    expect(wrapper.find('.ui-descriptions__extra').text()).toBe('编辑')
  })

  it('仅有 title 时不渲染 extra 节点', () => {
    const wrapper = mountDescriptions({ title: '标题' })
    expect(wrapper.find('.ui-descriptions__title').exists()).toBe(true)
    expect(wrapper.find('.ui-descriptions__extra').exists()).toBe(false)
  })

  it('无 title 与 extra 时不渲染标题栏', () => {
    expect(mountDescriptions({}).find('.ui-descriptions__header').exists()).toBe(false)
  })

  it('条目标签与内容分列两个 span', () => {
    const first = itemWrappers(mountDescriptions())[0]
    expect(first.find('.ui-descriptions-item__label').text()).toBe('姓名')
    expect(first.find('.ui-descriptions-item__content').text()).toBe('张三')
  })

  it('span>1 写 grid-column 合并列', () => {
    const second = itemWrappers(mountDescriptions())[1]
    expect(second.attributes('style')).toContain('grid-column: span 2')
    const first = itemWrappers(mountDescriptions())[0]
    expect(first.attributes('style') ?? '').not.toContain('grid-column')
  })

  it('条目缺省对齐类名 left / label right', () => {
    const first = itemWrappers(mountDescriptions())[0]
    expect(first.classes()).toContain('is-align-left')
    expect(first.classes()).toContain('is-label-align-right')
  })

  it('条目 align 与 labelAlign 覆盖类名', () => {
    const wrapper = mount(Descriptions, {
      slots: { default: () => h(DescriptionsItem, { label: 'L', align: 'center', labelAlign: 'left' }, () => 'c') }
    })
    const item = wrapper.findAll('.ui-descriptions-item')[0]
    expect(item.classes()).toContain('is-align-center')
    expect(item.classes()).toContain('is-label-align-left')
  })

  it('条目 width/minWidth 数字转 px、字符串原样', () => {
    const wrapper = mount(Descriptions, {
      slots: {
        default: () => [h(DescriptionsItem, { label: 'A', width: 100 }, () => 'a'), h(DescriptionsItem, { label: 'B', minWidth: '12rem' }, () => 'b')]
      }
    })
    const items = wrapper.findAll('.ui-descriptions-item')
    expect(items[0].attributes('style')).toContain('width: 100px')
    expect(items[1].attributes('style')).toContain('min-width: 12rem')
  })

  it('labelWidth 落到标签 span 宽度', () => {
    const wrapper = mount(Descriptions, { slots: { default: () => h(DescriptionsItem, { label: 'L', labelWidth: 80 }, () => 'c') } })
    expect(wrapper.find('.ui-descriptions-item__label').attributes('style')).toContain('width: 80px')
  })

  it('className 与 labelClassName 追加自定义类名', () => {
    const wrapper = mount(Descriptions, {
      slots: { default: () => h(DescriptionsItem, { label: 'L', className: 'row-x', labelClassName: 'label-x' }, () => 'c') }
    })
    expect(wrapper.find('.ui-descriptions-item').classes()).toContain('row-x')
    expect(wrapper.find('.ui-descriptions-item__label').classes()).toContain('label-x')
  })

  it('无条目时只渲染根容器', () => {
    const wrapper = mount(Descriptions, { props: { title: '空表' }, slots: { default: () => [] } })
    expect(wrapper.find('.ui-descriptions__title').text()).toBe('空表')
    expect(itemWrappers(wrapper)).toHaveLength(0)
  })

  it('超长内容完整保留', () => {
    const long = '描述'.repeat(40)
    const wrapper = mount(Descriptions, { slots: { default: () => h(DescriptionsItem, { label: 'L' }, () => long) } })
    expect(wrapper.find('.ui-descriptions-item__content').text()).toBe(long)
  })
})
