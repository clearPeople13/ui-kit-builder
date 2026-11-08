import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import { Result } from '@ui-kit-full'

function mountResult(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  return mount(Result, { props, slots })
}

describe('Result 结果', () => {
  it('缺省渲染 info 形态：状态类名、特性类名与占位标题节点', () => {
    const wrapper = mountResult()
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toEqual(['ui-result', 'is-info', 'ui-result--icons'])
    expect(wrapper.find('.ui-result__inner').exists()).toBe(true)
    expect(wrapper.find('.ui-result__icon').classes()).toContain('ui-icon')
    expect(wrapper.find('.ui-result__icon svg').classes()).toContain('lucide-info')
    // title 节点恒渲染（空文本），subtitle / extra 缺省不渲染
    expect(wrapper.find('.ui-result__title').exists()).toBe(true)
    expect(wrapper.find('.ui-result__title').text()).toBe('')
    expect(wrapper.find('.ui-result__subtitle').exists()).toBe(false)
    expect(wrapper.find('.ui-result__extra').exists()).toBe(false)
  })

  it('success / warning / error 各落状态类名并换用对应图标', () => {
    const success = mountResult({ icon: 'success' })
    expect(success.classes()).toContain('is-success')
    expect(success.find('.ui-result__icon svg').classes()).toContain('lucide-circle-check')
    const warning = mountResult({ icon: 'warning' })
    expect(warning.classes()).toContain('is-warning')
    expect(warning.find('.ui-result__icon svg').classes()).toContain('lucide-triangle-alert')
    const error = mountResult({ icon: 'error' })
    expect(error.classes()).toContain('is-error')
    expect(error.find('.ui-result__icon svg').classes()).toContain('lucide-circle-x')
  })

  it('未知 icon 回退 is-info 与 info 图标', () => {
    const wrapper = mountResult({ icon: 'nope' })
    expect(wrapper.classes()).toContain('is-info')
    expect(wrapper.classes()).not.toContain('is-success')
    expect(wrapper.find('.ui-result__icon svg').classes()).toContain('lucide-info')
  })

  it('icon 传空串去掉图标特性类，但状态仍回退 info', () => {
    const wrapper = mountResult({ icon: '' })
    expect(wrapper.classes()).not.toContain('ui-result--icons')
    expect(wrapper.classes()).toContain('is-info')
    expect(wrapper.find('.ui-result__icon').exists()).toBe(true)
  })

  it('title 与 subTitle 属性落对应节点，subTitle 为空不渲染', () => {
    const wrapper = mountResult({ title: '提交成功', subTitle: '请在三秒后查看' })
    expect(wrapper.find('.ui-result__title').text()).toBe('提交成功')
    expect(wrapper.find('.ui-result__subtitle').text()).toBe('请在三秒后查看')
    expect(mountResult({ title: '仅标题' }).find('.ui-result__subtitle').exists()).toBe(false)
  })

  it('默认插槽渲染 extra 操作区，不传则整节点缺席', () => {
    const wrapper = mountResult({}, { default: () => '返回首页' })
    expect(wrapper.find('.ui-result__extra').exists()).toBe(true)
    expect(wrapper.find('.ui-result__extra').text()).toBe('返回首页')
    expect(mountResult().find('.ui-result__extra').exists()).toBe(false)
  })

  it('icon 插槽整体替换内置图标节点', () => {
    const wrapper = mountResult({}, { icon: () => '<b>自定义徽标</b>' })
    expect(wrapper.find('.ui-result__icon').exists()).toBe(false)
    expect(wrapper.find('.ui-result__inner').text()).toContain('自定义徽标')
  })

  it('slot 契约：icon 插槽替换内置图标，default 渲染额外区', () => {
    const slotted = mountResult(
      { icon: 'success' },
      { icon: () => h('i', { class: 'rs-slot-icon' }, '徽标'), default: () => '自定义操作' }
    )
    expect(slotted.find('.rs-slot-icon').text()).toBe('徽标')
    expect(slotted.find('.ui-result__icon').exists()).toBe(false)
    expect(slotted.find('.ui-result__extra').text()).toBe('自定义操作')
    const fallback = mountResult({ icon: 'success' })
    expect(fallback.find('.ui-result__icon svg').classes()).toContain('lucide-circle-check')
  })

  it('无业务事件声明：点击各区域只漏出原生 click，不抛组件事件', async () => {
    const wrapper = mountResult({ icon: 'success', title: '完成' })
    await wrapper.find('.ui-result__icon').trigger('click')
    await wrapper.find('.ui-result__title').trigger('click')
    await wrapper.find('.ui-result__inner').trigger('click')
    // 根节点无 emits 声明，原生 click 经 attrs 透传被记进 emitted()；除此之外不应有任何业务事件
    expect(Object.keys(wrapper.emitted()).filter((name) => name !== 'click')).toEqual([])
  })

  it('超长标题与副标题完整保留', () => {
    const long = '结果页标题文案'.repeat(20)
    const wrapper = mountResult({ title: long, subTitle: long })
    expect(wrapper.find('.ui-result__title').text()).toBe(long)
    expect(wrapper.find('.ui-result__subtitle').text()).toBe(long)
  })

  it('tag 属性切换根节点标签且不漏成属性', () => {
    const wrapper = mountResult({ tag: 'section' })
    expect(wrapper.element.tagName).toBe('SECTION')
    expect(wrapper.attributes('tag')).toBeUndefined()
  })
})
