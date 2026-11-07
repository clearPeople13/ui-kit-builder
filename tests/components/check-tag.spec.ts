import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { CheckTag } from '@ui-kit-full'

/**
 * CheckTag 可选标签：内部自持 checked，点击抛 change / update:checked。
 * type 只对 success / warning / danger / info 发修饰类名，primary 走基础规则。
 */
const mountCheckTag = (props: Record<string, any> = {}, slots: Record<string, string> = {}) =>
  mount(CheckTag, { props, slots: slots.default ? { default: () => slots.default } : {} })

describe('CheckTag', () => {
  it('默认渲染 div，未选中不带状态类', () => {
    const wrapper = mountCheckTag({}, { default: '标签' })
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toEqual(['ui-check-tag'])
    expect(wrapper.text()).toBe('标签')
  })

  it('checked 初始为真时带 is-checked', () => {
    const wrapper = mountCheckTag({ checked: true }, { default: '选' })
    expect(wrapper.classes()).toContain('is-checked')
    expect(wrapper.find('.ui-check-tag').exists()).toBe(true)
  })

  it('点击切换内部选中态并抛 change / update:checked', async () => {
    const wrapper = mountCheckTag({}, { default: '标签' })
    await wrapper.trigger('click')
    expect(wrapper.classes()).toContain('is-checked')
    expect(wrapper.emitted('change')?.[0]).toEqual([true])
    expect(wrapper.emitted('update:checked')?.[0]).toEqual([true])

    await wrapper.trigger('click')
    expect(wrapper.classes()).not.toContain('is-checked')
    expect(wrapper.emitted('change')).toHaveLength(2)
    expect(wrapper.emitted('change')?.at(-1)).toEqual([false])
    expect(wrapper.emitted('update:checked')?.at(-1)).toEqual([false])
  })

  it('disabled 时点击不生效且带 is-disabled', async () => {
    const wrapper = mountCheckTag({ disabled: true, checked: true }, { default: '禁用' })
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.classes()).toContain('is-checked')
    await wrapper.trigger('click')
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.classes()).toContain('is-checked')
  })

  it('外部 checked 变化会同步内部状态', async () => {
    const wrapper = mountCheckTag({ checked: true })
    expect(wrapper.classes()).toContain('is-checked')
    await wrapper.setProps({ checked: false })
    expect(wrapper.classes()).not.toContain('is-checked')
    await wrapper.setProps({ checked: true })
    expect(wrapper.classes()).toContain('is-checked')
    // 未声明 checked（undefined）等价 false，内部状态由 props 归一化
    const uncontrolled = mountCheckTag({})
    expect(uncontrolled.classes()).not.toContain('is-checked')
    await uncontrolled.trigger('click')
    expect(uncontrolled.classes()).toContain('is-checked')
  })

  it('无插槽时渲染空内容，不影响交互', async () => {
    const wrapper = mountCheckTag()
    expect(wrapper.text()).toBe('')
    expect(wrapper.element.childNodes.length).toBe(1)
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:checked')?.[0]).toEqual([true])
  })

  it('长文本与特殊字符内容原样渲染', () => {
    const long = mountCheckTag({}, { default: '很长的标签文本'.repeat(10) })
    expect(long.text().length).toBe(70)
    const symbol = mountCheckTag({}, { default: '<a>&"x</a>' })
    expect(symbol.text()).toContain('<a>')
    expect(symbol.text()).toContain('&')
  })

  it('type 落到 ui-check-tag--{type} 类名，primary 走基础规则', () => {
    expect(mountCheckTag({ type: 'danger' }).classes()).toContain('ui-check-tag--danger')
    expect(mountCheckTag({ type: 'success' }).classes()).toContain('ui-check-tag--success')
    expect(mountCheckTag({ type: 'info', checked: true }).classes()).toEqual([
      'ui-check-tag',
      'is-checked',
      'ui-check-tag--info'
    ])
    expect(mountCheckTag({ type: 'primary' }).classes()).toEqual(['ui-check-tag'])
  })

  it('点击只触发一次切换，重复选择器不叠加事件', async () => {
    const wrapper = mountCheckTag({}, { default: '标签' })
    await wrapper.find('.ui-check-tag').trigger('click')
    expect(wrapper.emitted('change')).toHaveLength(1)
    expect(wrapper.emitted('update:checked')).toHaveLength(1)
    expect(wrapper.emitted('change')?.[0]).toEqual([true])
  })

  it('连续点击四次后回到选中态', async () => {
    const wrapper = mountCheckTag({ checked: true })
    for (let index = 0; index < 4; index += 1) {
      await wrapper.trigger('click')
    }
    expect(wrapper.classes()).toContain('is-checked')
    expect(wrapper.emitted('change')).toHaveLength(4)
    expect(wrapper.emitted('change')?.at(-1)).toEqual([true])
  })
})
