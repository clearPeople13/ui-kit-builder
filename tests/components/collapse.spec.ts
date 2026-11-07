import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { Collapse, CollapseItem } from '@ui-kit-full'

const panels = [
  { name: '1', title: '面板一', text: '内容一' },
  { name: '2', title: '面板二', text: '内容二' },
  { name: '3', title: '面板三', text: '内容三', disabled: true }
]

async function mountCollapse(props: Record<string, any> = {}, list: Array<Record<string, any>> = panels) {
  const wrapper = mount(Collapse, {
    props,
    slots: { default: () => list.map((item) => h(CollapseItem, item, () => item.text)) }
  })
  await nextTick()
  return wrapper
}

function headers(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-collapse-item__header')
}

function items(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-collapse-item')
}

describe('Collapse 折叠面板', () => {
  it('渲染列表与条目并标记激活项', async () => {
    const wrapper = await mountCollapse({ modelValue: ['1'] })
    expect(wrapper.classes()).toContain('ui-collapse')
    expect(wrapper.find('.ui-collapse__list').exists()).toBe(true)
    expect(items(wrapper)).toHaveLength(3)
    expect(items(wrapper)[0].classes()).toContain('is-active')
    expect(items(wrapper)[1].classes()).not.toContain('is-active')
  })

  it('展开条目渲染内容而收起条目不渲染', async () => {
    const wrapper = await mountCollapse({ modelValue: ['1'] })
    const contents = wrapper.findAll('.ui-collapse-item__content')
    expect(contents).toHaveLength(1)
    expect(contents[0].find('.ui-collapse-item__body').text()).toBe('内容一')
  })

  it('标题落在 __title 节点', async () => {
    const wrapper = await mountCollapse({})
    expect(items(wrapper)[0].find('.ui-collapse-item__title').text()).toBe('面板一')
  })

  it('expandIconPosition 映射图标类名，缺省右置', async () => {
    expect((await mountCollapse({})).classes()).toContain('is-icon-right')
    expect((await mountCollapse({ expandIconPosition: 'left' })).classes()).toContain('is-icon-left')
  })

  it('默认缺省 modelValue 收起全部', async () => {
    const wrapper = await mountCollapse({})
    expect(items(wrapper).every((item) => !item.classes().includes('is-active'))).toBe(true)
    expect(wrapper.findAll('.ui-collapse-item__content')).toHaveLength(0)
  })

  it('点击收起项展开并抛出数组载荷', async () => {
    const wrapper = await mountCollapse({ modelValue: [] })
    await headers(wrapper)[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['1']])
    expect(wrapper.emitted('change')?.[0]).toEqual([['1']])
    await nextTick()
    expect(items(wrapper)[0].classes()).toContain('is-active')
  })

  it('点击展开项收起', async () => {
    const wrapper = await mountCollapse({ modelValue: ['1', '2'] })
    await headers(wrapper)[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['2']])
  })

  it('accordion 同时只展开一项并抛出标量', async () => {
    const wrapper = await mountCollapse({ accordion: true, modelValue: '1' })
    await headers(wrapper)[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2'])
    await nextTick()
    expect(items(wrapper)[0].classes()).not.toContain('is-active')
    expect(items(wrapper)[1].classes()).toContain('is-active')
  })

  it('accordion 收起当前项时回吐空串', async () => {
    const wrapper = await mountCollapse({ accordion: true, modelValue: '1' })
    await headers(wrapper)[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
  })

  it('disabled 条目不可展开也不抛事件', async () => {
    const wrapper = await mountCollapse({})
    expect(items(wrapper)[2].classes()).toContain('is-disabled')
    expect(headers(wrapper)[2].attributes('disabled')).toBeDefined()
    await headers(wrapper)[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('beforeCollapse 返回 false 时阻止展开', async () => {
    const beforeCollapse = vi.fn(() => false)
    const wrapper = await mountCollapse({ modelValue: [], beforeCollapse })
    await headers(wrapper)[0].trigger('click')
    expect(beforeCollapse).toHaveBeenCalledWith('1')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(items(wrapper)[0].classes()).not.toContain('is-active')
  })

  it('beforeCollapse 放行时正常切换', async () => {
    const wrapper = await mountCollapse({ modelValue: [], beforeCollapse: () => true })
    await headers(wrapper)[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['1']])
  })

  it('icon 属性替换箭头并挂图标特性类名', async () => {
    const wrapper = await mountCollapse({}, [{ name: '1', title: '带图标', icon: 'search', text: 'x' }])
    expect(items(wrapper)[0].classes()).toContain('ui-collapse-item--icons')
    expect(items(wrapper)[0].find('.ui-collapse-item__arrow svg').classes()).toContain('lucide-search')
  })

  it('外部改写 modelValue 受控同步展开态', async () => {
    const wrapper = await mountCollapse({ modelValue: [] })
    await wrapper.setProps({ modelValue: ['2'] })
    await nextTick()
    expect(items(wrapper)[0].classes()).not.toContain('is-active')
    expect(items(wrapper)[1].classes()).toContain('is-active')
  })

  it('无 name 时仍可切换并回吐生成的标识', async () => {
    const wrapper = await mountCollapse({ modelValue: [] }, [
      { title: '自动命名一', text: 'a' },
      { title: '自动命名二', text: 'b' }
    ])
    await headers(wrapper)[0].trigger('click')
    const payload = wrapper.emitted('update:modelValue')?.[0]?.[0] as Array<string | number>
    expect(Array.isArray(payload)).toBe(true)
    expect(payload).toHaveLength(1)
    await nextTick()
    expect(items(wrapper)[0].classes()).toContain('is-active')
  })
})
