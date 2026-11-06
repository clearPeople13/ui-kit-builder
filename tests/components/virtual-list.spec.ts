import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { VirtualList } from '@ui-kit-full'

function rows(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('.ui-virtual-list__item')
}

afterEach(() => {
  document.body.innerHTML = ''
})

const big = Array.from({ length: 1000 }, (_, index) => ({ id: index, label: `L${index}` }))

describe('VirtualList', () => {
  it('渲染容器与占位层，容器高度来自 height', () => {
    const wrapper = mount(VirtualList, { props: { data: big, height: 120, itemSize: 30 }, attachTo: document.body })
    expect(wrapper.classes()).toContain('ui-virtual-list')
    expect(wrapper.find('.ui-virtual-list__spacer').exists()).toBe(true)
    expect(wrapper.attributes('style') ?? '').toContain('height: 120px')
  })

  it('只渲染可视窗口 + 缓冲内的行，而非全部数据', () => {
    const wrapper = mount(VirtualList, { props: { data: big, height: 120, itemSize: 30, cache: 1 }, slots: { default: ({ item }: any) => h('span', item.label) }, attachTo: document.body })
    // 120/30=4 行 + 上下各 1 缓冲 → 5 行
    expect(rows(wrapper)).toHaveLength(5)
    expect(wrapper.findAll('.ui-virtual-list__item span').map((node) => node.text())).toEqual(['L0', 'L1', 'L2', 'L3', 'L4'])
  })

  it('cache 增大窗口行数', () => {
    const wrapper = mount(VirtualList, { props: { data: big, height: 100, itemSize: 20, cache: 2 }, slots: { default: ({ item }: any) => h('span', item.label) }, attachTo: document.body })
    // ceil(100/20)=5 + 2 缓冲 = 7
    expect(rows(wrapper)).toHaveLength(7)
  })

  it('缺省 height 200 / itemSize 30 / cache 2', () => {
    const wrapper = mount(VirtualList, { props: { data: big }, slots: { default: ({ item }: any) => h('span', item.label) }, attachTo: document.body })
    // ceil(200/30)=7 + 2 = 9
    expect(rows(wrapper)).toHaveLength(9)
    expect(wrapper.attributes('style') ?? '').toContain('height: 200px')
  })

  it('每行按 index*itemSize 绝对定位', () => {
    const wrapper = mount(VirtualList, { props: { data: big, height: 120, itemSize: 30, cache: 0 }, slots: { default: ({ item }: any) => h('span', item.label) }, attachTo: document.body })
    expect(rows(wrapper)[1].attributes('style') ?? '').toContain('top: 30px')
    expect(rows(wrapper)[1].attributes('style') ?? '').toContain('height: 30px')
  })

  it('占位层总高等于 总行数*行高', () => {
    const wrapper = mount(VirtualList, { props: { data: big, height: 120, itemSize: 30 }, attachTo: document.body })
    expect(wrapper.find('.ui-virtual-list__spacer').attributes('style') ?? '').toContain('height: 30000px')
  })

  it('itemKey 命中数据字段作为渲染键', () => {
    const wrapper = mount(VirtualList, { props: { data: big, height: 100, itemSize: 20, itemKey: 'id', cache: 0 }, slots: { default: ({ item }: any) => h('span', item.label) }, attachTo: document.body })
    expect(rows(wrapper).length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('L0')
  })

  it('无默认插槽时对象项按 label 渲染', () => {
    const wrapper = mount(VirtualList, { props: { data: [{ label: '甲' }, { label: '乙' }], height: 100, itemSize: 30, cache: 0 }, attachTo: document.body })
    expect(wrapper.text()).toContain('甲')
    expect(wrapper.text()).toContain('乙')
  })

  it('无默认插槽时原始值项按字符串渲染', () => {
    const wrapper = mount(VirtualList, { props: { data: ['A', 'B'], height: 100, itemSize: 30, cache: 0 }, attachTo: document.body })
    expect(wrapper.text()).toContain('A')
  })

  it('total 超过 data 长度且无插槽时渲染加载占位行', () => {
    const wrapper = mount(VirtualList, { props: { data: [], total: 50, height: 100, itemSize: 20, cache: 2 }, attachTo: document.body })
    expect(rows(wrapper)).toHaveLength(7)
    expect(wrapper.findAll('.is-placeholder')).toHaveLength(7)
    expect(wrapper.text()).toContain('加载中…')
  })

  it('空数据且 total 为 0 时渲染空占位层', () => {
    const wrapper = mount(VirtualList, { props: { data: [] }, attachTo: document.body })
    expect(rows(wrapper)).toHaveLength(0)
    expect(wrapper.find('.ui-virtual-list__spacer').exists()).toBe(true)
  })

  it('itemSize 为 0 时回退 estimatedItemSize', () => {
    const wrapper = mount(VirtualList, { props: { data: big, height: 80, itemSize: 0, estimatedItemSize: 40, cache: 0 }, slots: { default: ({ item }: any) => h('span', item.label) }, attachTo: document.body })
    expect(rows(wrapper)).toHaveLength(2)
    expect(rows(wrapper)[1].attributes('style') ?? '').toContain('height: 40px')
  })

  it('itemSize 为 0 且无估算时回退 30', () => {
    const wrapper = mount(VirtualList, { props: { data: big, height: 60, itemSize: 0, estimatedItemSize: 0, cache: 0 }, slots: { default: ({ item }: any) => h('span', item.label) }, attachTo: document.body })
    expect(rows(wrapper)).toHaveLength(2)
  })

  it('超长文本项在插槽内原样渲染', () => {
    const data = [{ id: 1, label: '数'.repeat(400) }]
    const wrapper = mount(VirtualList, { props: { data, height: 100, itemSize: 30, cache: 0 }, slots: { default: ({ item }: any) => h('span', item.label) }, attachTo: document.body })
    expect(wrapper.text()).toContain('数'.repeat(400))
  })

  it('class 与字符串 style 合并到根节点', () => {
    const wrapper = mount({ render: () => h(VirtualList, { class: 'my-list', style: 'width: 220px', data: big, height: 100 }, { default: ({ item }: any) => h('span', item.label) }) })
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-virtual-list', 'my-list']))
    expect(wrapper.attributes('style') ?? '').toContain('width: 220px')
  })

  it('插槽同时收到 item 与 index', () => {
    const wrapper = mount(VirtualList, { props: { data: big, height: 100, itemSize: 30, cache: 0 }, slots: { default: ({ item, index }: any) => h('span', `${index}:${item.label}`) }, attachTo: document.body })
    expect(wrapper.findAll('.ui-virtual-list__item span')[0].text()).toBe('0:L0')
  })
})
