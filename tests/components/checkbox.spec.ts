import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import { Checkbox, CheckboxButton, CheckboxGroup } from '@ui-kit-full'

describe('Checkbox', () => {
  it('渲染 label + input + 文本', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false, label: '同意条款' } })
    expect(wrapper.element.tagName).toBe('LABEL')
    expect(wrapper.classes()).toContain('ui-checkbox')
    const inner = wrapper.find('input.ui-checkbox__inner')
    expect(inner.attributes('type')).toBe('checkbox')
    expect(wrapper.find('.ui-checkbox__label').text()).toBe('同意条款')
  })

  it('modelValue 决定初始勾选态', () => {
    expect(mount(Checkbox, { props: { modelValue: true } }).find('input').element.checked).toBe(true)
    expect(mount(Checkbox, { props: { modelValue: false } }).find('input').element.checked).toBe(false)
  })

  it('checked 提供非受控初始态', () => {
    expect(mount(Checkbox, { props: { checked: true } }).find('input').element.checked).toBe(true)
  })

  it('勾选与取消分别抛出 update:modelValue / update:checked / change', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(wrapper.emitted('update:checked')?.[0]).toEqual([true])
    expect(wrapper.emitted('change')?.[0]).toEqual([true])

    const checkedWrapper = mount(Checkbox, { props: { modelValue: true } })
    await checkedWrapper.find('input').setValue(false)
    expect(checkedWrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('trueValue / falseValue 自定义开关值', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: 'no', trueValue: 'yes', falseValue: 'no' } })
    expect(wrapper.find('input').element.checked).toBe(false)
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['yes'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['yes'])
  })

  it('trueLabel / falseLabel 与 trueValue 等价', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: 0, trueLabel: 1, falseLabel: 0 } })
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1])
  })

  it('value 参与布尔 modelValue 之外的匹配', () => {
    const checked = mount(Checkbox, { props: { modelValue: 'a', value: 'a', label: 'A' } })
    expect(checked.find('input').element.checked).toBe(true)
    const other = mount(Checkbox, { props: { modelValue: 'b', value: 'a', label: 'A' } })
    expect(other.find('input').element.checked).toBe(false)
  })

  // 原缺陷 F-4：value 的类型联合含 Boolean，缺省的键被归一化为 false，
  // 挡住了 resolveCheckedValue 的 value ?? label 回退，只写 label 时数组匹配不上
  it('只写 label 时 label 即选项值', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: ['甲'], label: '甲' } })
    expect(wrapper.find('input').element.checked).toBe(true)
    expect(mount(Checkbox, { props: { modelValue: ['乙'], label: '甲' } }).find('input').element.checked).toBe(false)

    const group = mount(CheckboxGroup, {
      props: { modelValue: ['甲'] },
      slots: { default: () => [h(Checkbox, { label: '甲' }), h(Checkbox, { label: '乙' })] }
    })
    expect(group.findAll('.ui-checkbox')[0].find('input').element.checked).toBe(true)
    await group.findAll('input')[1].setValue(true)
    expect(group.emitted('update:modelValue')?.[0]).toEqual([['甲', '乙']])
  })

  it('indeterminate 写到 DOM 属性上', () => {
    const input = mount(Checkbox, { props: { modelValue: false, indeterminate: true } }).find('input')
      .element as HTMLInputElement
    expect(input.indeterminate).toBe(true)
    expect(
      (mount(Checkbox, { props: { modelValue: false } }).find('input').element as HTMLInputElement)
        .indeterminate as boolean
    ).toBe(false)
  })

  it('disabled 输出属性并加类名', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false, disabled: true } })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('border 特性与 size 类名', () => {
    const wrapper = mount(Checkbox, { props: { border: true, size: 'small' } })
    expect(wrapper.classes()).toContain('ui-checkbox--border')
    expect(wrapper.classes()).toContain('ui-checkbox--size-small')
  })

  it('默认插槽优先于 label 文本', () => {
    const wrapper = mount(Checkbox, { props: { label: 'A' }, slots: { default: () => '插槽文案' } })
    expect(wrapper.find('.ui-checkbox__label').text()).toBe('插槽文案')
  })

  it('id / name / tabindex / aria 属性透传', () => {
    const wrapper = mount(Checkbox, { props: { id: 'cb', name: 'agree', tabindex: 2, ariaLabel: '同意' } })
    const inner = wrapper.find('input')
    expect(inner.attributes('id')).toBe('cb')
    expect(inner.attributes('name')).toBe('agree')
    expect(inner.attributes('tabindex')).toBe('2')
    expect(inner.attributes('aria-label')).toBe('同意')
  })
})

describe('CheckboxButton', () => {
  it('以按钮样式渲染同样的勾选语义', async () => {
    const wrapper = mount(CheckboxButton, { props: { modelValue: true, label: '按钮' } })
    expect(wrapper.classes()).toContain('ui-checkbox-button')
    await wrapper.find('input').setValue(false)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })
})

describe('CheckboxGroup', () => {
  const options = [
    { label: 'A', value: 'a' },
    { label: 'B', value: 'b' },
    { label: 'C', value: 'c', disabled: true }
  ]

  it('options 渲染为多个复选框并标记选中态', () => {
    const wrapper = mount(CheckboxGroup, { props: { modelValue: ['a'], options } })
    expect(wrapper.classes()).toContain('ui-checkbox-group')
    expect(wrapper.attributes('role')).toBe('group')
    const items = wrapper.findAll('.ui-checkbox')
    expect(items).toHaveLength(3)
    expect(items[0].classes()).toContain('is-checked')
    expect(items[2].classes()).toContain('is-disabled')
  })

  it('勾选新项抛出完整数组', async () => {
    const wrapper = mount(CheckboxGroup, { props: { modelValue: ['a'], options } })
    await wrapper.findAll('input')[1].setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['a', 'b']])
    expect(wrapper.emitted('change')?.[0]).toEqual([['a', 'b']])
  })

  it('取消已有项从数组移除', async () => {
    const wrapper = mount(CheckboxGroup, { props: { modelValue: ['a', 'b'], options } })
    await wrapper.findAll('input')[0].setValue(false)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['b']])
  })

  it('max 限制不再新增，min 限制不再取消', async () => {
    const limited = mount(CheckboxGroup, { props: { modelValue: ['a'], options, max: 1 } })
    await limited.findAll('input')[1].setValue(true)
    expect(limited.emitted('update:modelValue')).toBeUndefined()

    const floored = mount(CheckboxGroup, { props: { modelValue: ['a', 'b'], options, min: 2 } })
    await floored.findAll('input')[0].setValue(false)
    expect(floored.emitted('update:modelValue')).toBeUndefined()
  })

  it('组内 disabled 继承到每个子项', () => {
    const wrapper = mount(CheckboxGroup, { props: { modelValue: [], options, disabled: true } })
    wrapper.findAll('input').forEach((input) => expect(input.attributes('disabled')).toBeDefined())
  })

  it('默认插槽配合 Checkbox 子项共享组内状态', async () => {
    const wrapper = mount(CheckboxGroup, {
      props: { modelValue: ['a'] },
      slots: {
        default: () => [h(Checkbox, { label: 'A', value: 'a' }), h(Checkbox, { label: 'B', value: 'b' })]
      }
    })
    // 插槽子项的选中态只体现在 input.checked 上（Checkbox 自身不加 is-checked 类，样式依赖 :checked）
    const inputs = wrapper.findAll('input')
    expect(inputs[0].element.checked).toBe(true)
    expect(inputs[1].element.checked).toBe(false)
    await inputs[1].setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['a', 'b']])
  })

  it('type=button 切换子项类名', () => {
    const wrapper = mount(CheckboxGroup, { props: { modelValue: [], options, type: 'button' } })
    expect(wrapper.findAll('.ui-checkbox-button')).toHaveLength(3)
  })

  it('非数组 modelValue 视为空选中', () => {
    const wrapper = mount(CheckboxGroup, { props: { modelValue: undefined, options } })
    expect(wrapper.findAll('.is-checked')).toHaveLength(0)
  })

  it('纯字符串数组选项自动归一化', () => {
    const wrapper = mount(CheckboxGroup, { props: { modelValue: ['x'], options: ['x', 'y'] } })
    expect(wrapper.findAll('.ui-checkbox__label').map((label) => label.text())).toEqual(['x', 'y'])
    expect(wrapper.findAll('.ui-checkbox')[0].classes()).toContain('is-checked')
  })
})
