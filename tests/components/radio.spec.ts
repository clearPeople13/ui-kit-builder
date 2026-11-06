import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import { Radio, RadioButton, RadioGroup } from '@ui-kit-full'

describe('Radio', () => {
  it('渲染单选控件与文本', () => {
    const wrapper = mount(Radio, { props: { modelValue: 'a', value: 'a', label: '甲' } })
    expect(wrapper.element.tagName).toBe('LABEL')
    expect(wrapper.classes()).toContain('ui-radio')
    expect(wrapper.find('input').attributes('type')).toBe('radio')
    expect(wrapper.find('.ui-radio__label').text()).toBe('甲')
  })

  it('modelValue 与自身值相等时选中', () => {
    expect(mount(Radio, { props: { modelValue: 'a', value: 'a' } }).find('input').element.checked).toBe(true)
    expect(mount(Radio, { props: { modelValue: 'b', value: 'a' } }).find('input').element.checked).toBe(false)
  })

  it('选中时抛出 update:modelValue 与 change', async () => {
    const wrapper = mount(Radio, { props: { modelValue: 'b', value: 'a' } })
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['a'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['a'])
  })

  it('value 优先于 label 作为选项值', async () => {
    const wrapper = mount(Radio, { props: { modelValue: 2, value: 1, label: '一' } })
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1])
  })

  // 原缺陷 F-4：value 的类型联合含 Boolean，缺省的键被归一化为 false，
  // 挡住了 ownValue() 的 value ?? label 回退，只写 label 的单选框永远选不中
  it('只写 label 时 label 即选项值', async () => {
    const wrapper = mount(Radio, { props: { modelValue: 'a', label: 'a' } })
    expect(wrapper.find('input').element.checked).toBe(true)
    expect(wrapper.find('.ui-radio__label').text()).toBe('a')
    const other = mount(Radio, { props: { modelValue: 'b', label: 'a' } })
    expect(other.find('input').element.checked).toBe(false)
    await other.find('input').setValue(true)
    expect(other.emitted('update:modelValue')?.[0]).toEqual(['a'])
  })

  it('value 与 label 都不传时不会误判为选中', () => {
    expect(mount(Radio, { props: { modelValue: false } }).find('input').element.checked).toBe(false)
  })

  it('disabled 阻断交互', async () => {
    const wrapper = mount(Radio, { props: { modelValue: 'b', label: 'a', disabled: true } })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('border 特性与 size 类名', () => {
    const wrapper = mount(Radio, { props: { border: true, size: 'large' } })
    expect(wrapper.classes()).toContain('ui-radio--border')
    expect(wrapper.classes()).toContain('ui-radio--size-large')
  })
})

describe('RadioGroup', () => {
  const options = [
    { label: 'A', value: 'a' },
    { label: 'B', value: 'b' },
    { label: 'C', value: 'c', disabled: true }
  ]

  it('渲染 radiogroup 并标记选中项', () => {
    const wrapper = mount(RadioGroup, { props: { modelValue: 'a', options } })
    expect(wrapper.attributes('role')).toBe('radiogroup')
    const items = wrapper.findAll('.ui-radio')
    expect(items).toHaveLength(3)
    expect(items[0].classes()).toContain('is-checked')
    expect(items[2].classes()).toContain('is-disabled')
  })

  it('切换选项抛出新值', async () => {
    const wrapper = mount(RadioGroup, { props: { modelValue: 'a', options } })
    await wrapper.findAll('input')[1].setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['b'])
  })

  it('子项 name 继承组内 name', () => {
    const wrapper = mount(RadioGroup, { props: { modelValue: 'a', options, name: 'level' } })
    wrapper.findAll('input').forEach((input) => expect(input.attributes('name')).toBe('level'))
  })

  it('组级 disabled 禁用全部子项', () => {
    const wrapper = mount(RadioGroup, { props: { modelValue: 'a', options, disabled: true } })
    wrapper.findAll('input').forEach((input) => expect(input.attributes('disabled')).toBeDefined())
  })

  it('默认插槽配合 Radio 子项共享选中态', async () => {
    const wrapper = mount(RadioGroup, {
      props: { modelValue: 'a' },
      slots: { default: () => [h(Radio, { value: 'a', label: '甲' }), h(Radio, { value: 'b', label: '乙' })] }
    })
    expect(wrapper.findAll('.ui-radio')[0].find('input').element.checked).toBe(true)
    await wrapper.findAll('.ui-radio')[1].find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
  })

  it('type=button 渲染按钮组并写入 fill / textColor 变量', () => {
    const wrapper = mount(RadioGroup, {
      props: { modelValue: 'a', options, type: 'button', fill: '#f00', textColor: '#fff' }
    })
    expect(wrapper.classes()).toContain('ui-radio-group--button')
    expect(wrapper.findAll('.ui-radio-button')).toHaveLength(3)
    expect(wrapper.attributes('style')).toContain('--ui-radio-fill: #f00')
    expect(wrapper.attributes('style')).toContain('--ui-radio-text-color: #fff')
  })

  it('props 映射支持自定义字段名', () => {
    const wrapper = mount(RadioGroup, {
      props: { modelValue: 1, options: [{ id: 1, text: '甲' }], props: { label: 'text', value: 'id' } }
    })
    expect(wrapper.find('.ui-radio__label').text()).toBe('甲')
  })
})

describe('RadioButton', () => {
  it('作为独立控件渲染', async () => {
    const wrapper = mount(RadioButton, { props: { modelValue: 'b', value: 'a', label: '甲' } })
    expect(wrapper.classes()).toContain('ui-radio-button')
    expect(wrapper.find('.ui-radio-button__label').text()).toBe('甲')
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['a'])
  })
})
