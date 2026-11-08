import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Statistic } from '@ui-kit-full'

function mountStatistic(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  return mount(Statistic, { props, slots, attachTo: document.body })
}

function valueText(wrapper: ReturnType<typeof mountStatistic>) {
  return wrapper.find('.ui-statistic__value').text()
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Statistic', () => {
  it('渲染根节点与内容区', () => {
    const wrapper = mountStatistic({ value: 100 })
    expect(wrapper.classes()).toContain('ui-statistic')
    expect(wrapper.find('.ui-statistic__content').exists()).toBe(true)
    expect(valueText(wrapper)).toBe('100')
  })

  it('默认 value 为 0', () => {
    expect(valueText(mountStatistic())).toBe('0')
  })

  it('千分位分组默认逗号', () => {
    expect(valueText(mountStatistic({ value: 1234567 }))).toBe('1,234,567')
  })

  it('groupSeparator 自定义分隔符', () => {
    expect(valueText(mountStatistic({ value: 1234567, groupSeparator: ' ' }))).toBe('1 234 567')
  })

  it('precision 控制小数位并用 decimalSeparator 连接', () => {
    expect(valueText(mountStatistic({ value: 12.3456, precision: 2 }))).toBe('12.35')
    expect(valueText(mountStatistic({ value: 12.3456, precision: 2, decimalSeparator: ',' }))).toBe('12,35')
  })

  it('precision 为 0 时不输出小数部分', () => {
    expect(valueText(mountStatistic({ value: 9.9, precision: 0 }))).toBe('10')
  })

  it('prefix / suffix / title 条件渲染', () => {
    const wrapper = mountStatistic({ value: 1, prefix: '¥', suffix: '元', title: '今日收入' })
    expect(wrapper.find('.ui-statistic__title').text()).toBe('今日收入')
    expect(wrapper.find('.ui-statistic__prefix').text()).toBe('¥')
    expect(wrapper.find('.ui-statistic__suffix').text()).toBe('元')
  })

  it('未设置 prefix/suffix/title 时对应节点不渲染', () => {
    const wrapper = mountStatistic({ value: 1 })
    expect(wrapper.find('.ui-statistic__title').exists()).toBe(false)
    expect(wrapper.find('.ui-statistic__prefix').exists()).toBe(false)
    expect(wrapper.find('.ui-statistic__suffix').exists()).toBe(false)
  })

  it('formatter 覆盖默认数字格式化', () => {
    expect(valueText(mountStatistic({ value: 5, formatter: (v: number) => `#${v}#` }))).toBe('#5#')
  })

  it('valueStyle 对象落到内容区样式', () => {
    const wrapper = mountStatistic({ value: 1, valueStyle: { color: 'red' } })
    expect(wrapper.find('.ui-statistic__content').attributes('style') ?? '').toContain('color: red')
  })

  it('valueStyle 字符串同样落到内容区', () => {
    const wrapper = mount({ render: () => h(Statistic, { value: 1, valueStyle: 'font-weight: 700' }) })
    expect(wrapper.find('.ui-statistic__content').attributes('style') ?? '').toContain('font-weight: 700')
  })

  it('默认插槽渲染到 footer 区', () => {
    const wrapper = mountStatistic({ value: 1 }, { default: () => h('em', '备注') })
    expect(wrapper.find('.ui-statistic__footer').text()).toBe('备注')
    expect(mountStatistic({ value: 1 }).find('.ui-statistic__footer').exists()).toBe(false)
  })

  it('非数字 value 原样转字符串展示', () => {
    expect(valueText(mountStatistic({ value: 'N/A' }))).toBe('N/A')
  })

  it('对象 value 无法转数值时回退字符串', () => {
    expect(valueText(mountStatistic({ value: { amount: 1 } }))).toBe('[object Object]')
  })

  it('负数保留负号并参与分组', () => {
    expect(valueText(mountStatistic({ value: -1234567 }))).toBe('-1,234,567')
  })

  it('slot 契约：default 插槽渲染到 footer 区', () => {
    const wrapper = mountStatistic({ value: 1 }, { default: () => h('span', { class: 'slot-extra' }, '自定义补充') })
    expect(wrapper.find('.ui-statistic__footer .slot-extra').text()).toBe('自定义补充')
    expect(mountStatistic({ value: 1 }).find('.ui-statistic__footer').exists()).toBe(false)
  })
})
