import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Switch } from '@ui-kit-full'

describe('Switch', () => {
  it('渲染 role=switch 的复选框与轨道', () => {
    const wrapper = mount(Switch, { props: { modelValue: true } })
    expect(wrapper.element.tagName).toBe('LABEL')
    expect(wrapper.classes()).toContain('ui-switch')
    expect(wrapper.classes()).toContain('is-checked')
    expect(wrapper.find('.ui-switch__track').exists()).toBe(true)
    const inner = wrapper.find('input.ui-switch__inner')
    expect(inner.attributes('role')).toBe('switch')
    expect(inner.element.checked).toBe(true)
  })

  it('未选中时不带 is-checked', () => {
    expect(mount(Switch, { props: { modelValue: false } }).classes()).not.toContain('is-checked')
  })

  it('切换抛出 update:modelValue 与 change', async () => {
    const wrapper = mount(Switch, { props: { modelValue: false } })
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(wrapper.emitted('change')?.[0]).toEqual([true])

    const on = mount(Switch, { props: { modelValue: true } })
    await on.find('input').setValue(false)
    expect(on.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('activeValue / inactiveValue 支持字符串与数字', async () => {
    const wrapper = mount(Switch, { props: { modelValue: 'off', activeValue: 'on', inactiveValue: 'off' } })
    expect(wrapper.classes()).not.toContain('is-checked')
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['on'])

    const numeric = mount(Switch, { props: { modelValue: 1, activeValue: 1, inactiveValue: 0 } })
    expect(numeric.classes()).toContain('is-checked')
    await numeric.find('input').setValue(false)
    expect(numeric.emitted('change')?.[0]).toEqual([0])
  })

  it('disabled 时输入框禁用且不响应', async () => {
    const wrapper = mount(Switch, { props: { modelValue: false, disabled: true } })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('loading 加载状态并阻断交互', async () => {
    const wrapper = mount(Switch, { props: { modelValue: true, loading: true } })
    expect(wrapper.classes()).toContain('is-loading')
    expect(wrapper.find('.ui-switch__loading').exists()).toBe(true)
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    await wrapper.find('input').setValue(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('width 写入轨道宽度变量', () => {
    const numeric = mount(Switch, { props: { modelValue: false, width: 80 } })
    expect(numeric.find('.ui-switch__track').attributes('style')).toContain('--ui-switch-width: 80px')
    const text = mount(Switch, { props: { modelValue: false, width: '5rem' } })
    expect(text.find('.ui-switch__track').attributes('style')).toContain('--ui-switch-width: 5rem')
  })

  it('activeText / inactiveText 分别渲染在轨道左右两侧', () => {
    const wrapper = mount(Switch, { props: { modelValue: false, activeText: '开', inactiveText: '关' } })
    expect(wrapper.find('.ui-switch__label.is-left').text()).toBe('关')
    expect(wrapper.find('.ui-switch__label.is-right').text()).toBe('开')
    // 文案常驻，选中态由 is-checked 类与 CSS 决定显隐
    expect(
      mount(Switch, { props: { modelValue: true, activeText: '开' } })
        .find('.ui-switch__label.is-right')
        .text()
    ).toBe('开')
  })

  it('inlinePrompt 把文案放进轨道内', () => {
    const wrapper = mount(Switch, {
      props: { modelValue: false, activeText: '开', inactiveText: '关', inlinePrompt: true }
    })
    const inline = wrapper.find('.ui-switch__inline-text')
    expect(inline.text()).toBe('关')
    expect(wrapper.find('.ui-switch__label.is-left').exists()).toBe(false)
    const on = mount(Switch, { props: { modelValue: true, activeText: '开', inlinePrompt: true } })
    expect(on.find('.ui-switch__inline-text').text()).toBe('开')
    expect(on.find('.ui-switch__inline-text').classes()).toContain('is-active')
  })

  it('activeIcon / inactiveIcon 渲染在轨道内', () => {
    const wrapper = mount(Switch, { props: { modelValue: true, activeIcon: 'Check', inactiveIcon: 'Close' } })
    expect(wrapper.find('.ui-switch__icon').classes()).toContain('is-active')
    const off = mount(Switch, { props: { modelValue: false, activeIcon: 'Check', inactiveIcon: 'Close' } })
    expect(off.find('.ui-switch__icon').classes()).toContain('is-inactive')
  })

  it('size 类名与 name / id / tabindex / aria-label 透传', () => {
    const wrapper = mount(Switch, {
      props: { modelValue: false, size: 'large', name: 'notify', id: 'sw', tabindex: 4, ariaLabel: '通知开关' }
    })
    expect(wrapper.classes()).toContain('ui-switch--size-large')
    const inner = wrapper.find('input')
    expect(inner.attributes('name')).toBe('notify')
    expect(inner.attributes('id')).toBe('sw')
    expect(inner.attributes('tabindex')).toBe('4')
    expect(inner.attributes('aria-label')).toBe('通知开关')
  })
})
