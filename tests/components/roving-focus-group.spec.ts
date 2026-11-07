import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { RovingFocusGroup, RovingFocusItem } from '@ui-kit-full'

function mountGroup(props: Record<string, any> = {}, ids: string[] = ['a', 'b'], itemProps: Record<string, any> = {}) {
  return mount(RovingFocusGroup, {
    props,
    slots: { default: () => ids.map((id) => h(RovingFocusItem, { tabStopId: id, ...itemProps }, () => id.toUpperCase())) },
    attachTo: document.body
  })
}

function itemNodes(wrapper: ReturnType<typeof mountGroup>) {
  return wrapper.findAll('.ui-roving-focus-item')
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('RovingFocusGroup / RovingFocusItem', () => {
  it('组渲染容器基类名，项渲染 data 标识', () => {
    const wrapper = mountGroup()
    expect(wrapper.classes()).toContain('ui-roving-focus-group')
    expect(itemNodes(wrapper)).toHaveLength(2)
    expect(itemNodes(wrapper)[0].attributes('data-roving-focus-item')).toBe('a')
  })

  it('首个可聚焦项默认拿到 tab stop（tabindex 0 + is-active）', async () => {
    const wrapper = mountGroup()
    await nextTick()
    expect(itemNodes(wrapper)[0].attributes('tabindex')).toBe('0')
    expect(itemNodes(wrapper)[0].classes()).toContain('is-active')
  })

  it('其余可聚焦项 tabindex 为 -1 且带 is-focusable', () => {
    const wrapper = mountGroup({}, ['a', 'b', 'c'])
    expect(itemNodes(wrapper)[1].attributes('tabindex')).toBe('-1')
    expect(itemNodes(wrapper)[1].classes()).toContain('is-focusable')
  })

  it('focusable=false 的项没有 tabindex 也不带 is-focusable', () => {
    const wrapper = mountGroup({}, ['a', 'b'], { focusable: false })
    expect(itemNodes(wrapper)[1].attributes('tabindex')).toBeUndefined()
    expect(itemNodes(wrapper)[1].classes()).not.toContain('is-focusable')
  })

  it('未声明 tabStopId 时自动生成标识', () => {
    const wrapper = mount(RovingFocusGroup, { slots: { default: () => h(RovingFocusItem, {}, () => 'x') }, attachTo: document.body })
    expect(itemNodes(wrapper)[0].attributes('data-roving-focus-item')).toMatch(/^ui-roving-focus-item-\d+$/)
  })

  it('active 属性强制该项为当前停靠点', () => {
    const wrapper = mount(RovingFocusGroup, {
      slots: { default: () => [h(RovingFocusItem, { tabStopId: 'a' }, () => 'A'), h(RovingFocusItem, { tabStopId: 'b', active: true }, () => 'B')] },
      attachTo: document.body
    })
    expect(itemNodes(wrapper)[1].attributes('tabindex')).toBe('0')
    expect(itemNodes(wrapper)[1].classes()).toContain('is-active')
    expect(itemNodes(wrapper)[0].attributes('tabindex')).toBe('-1')
  })

  it('currentTabStopId 受控属性指定初始停靠点', () => {
    const wrapper = mountGroup({ currentTabStopId: 'b' }, ['a', 'b'])
    expect(itemNodes(wrapper)[1].attributes('tabindex')).toBe('0')
    expect(itemNodes(wrapper)[0].attributes('tabindex')).toBe('-1')
  })

  it('聚焦某项时抛出 update:currentTabStopId 与 itemFocus', async () => {
    const wrapper = mountGroup({}, ['a', 'b'])
    await itemNodes(wrapper)[1].trigger('focusin')
    expect(wrapper.emitted('update:currentTabStopId')?.at(-1)).toEqual(['b'])
    expect(wrapper.emitted('itemFocus')).toBeTruthy()
  })

  it('方向键在可聚焦项之间移动停靠点', async () => {
    const wrapper = mountGroup({}, ['a', 'b', 'c'])
    const items = itemNodes(wrapper)
    items[0].element.focus()
    await nextTick()
    await wrapper.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:currentTabStopId')?.at(-1)).toEqual(['b'])
    expect(itemNodes(wrapper)[1].attributes('tabindex')).toBe('0')
  })

  it('loop 开启时末端向右回绕到首项', async () => {
    const wrapper = mountGroup({ loop: true }, ['a', 'b', 'c'])
    itemNodes(wrapper)[2].element.focus()
    await nextTick()
    await wrapper.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:currentTabStopId')?.at(-1)).toEqual(['a'])
  })

  it('Home/End 直接跳到首尾', async () => {
    const wrapper = mountGroup({}, ['a', 'b', 'c'])
    itemNodes(wrapper)[0].element.focus()
    await nextTick()
    await wrapper.trigger('keydown', { key: 'End' })
    expect(wrapper.emitted('update:currentTabStopId')?.at(-1)).toEqual(['c'])
    await wrapper.trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('update:currentTabStopId')?.at(-1)).toEqual(['a'])
  })

  it('vertical 方向改用上下键', async () => {
    const wrapper = mountGroup({ orientation: 'vertical' }, ['a', 'b'])
    itemNodes(wrapper)[0].element.focus()
    await nextTick()
    await wrapper.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.emitted('update:currentTabStopId')?.at(-1)).toEqual(['b'])
  })

  it('rtl 方向左右键语义互换', async () => {
    const wrapper = mountGroup({ dir: 'rtl' }, ['a', 'b'])
    itemNodes(wrapper)[0].element.focus()
    await nextTick()
    await wrapper.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('update:currentTabStopId')?.at(-1)).toEqual(['b'])
  })

  it('失焦时抛出 itemBlur', async () => {
    const wrapper = mountGroup({}, ['a', 'b'])
    await itemNodes(wrapper)[0].trigger('blur')
    expect(wrapper.emitted('itemBlur')).toBeTruthy()
  })

  it('组 class 透传共存且不影响项结构', () => {
    const wrapper = mountGroup({ class: 'grp' })
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-roving-focus-group', 'grp']))
  })
})
