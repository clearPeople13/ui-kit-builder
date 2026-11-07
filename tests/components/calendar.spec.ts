import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Calendar } from '@ui-kit-full'

// 日历依赖系统时钟判定"今天"，统一冻结在 2026-11-07
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 7, 12, 0, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

function mountCalendar(props: Record<string, any> = {}) {
  return mount(Calendar, { props })
}

function cellOf(wrapper: VueWrapper, day: number) {
  return wrapper.findAll('.ui-calendar__cell').find((item) => item.text() === String(day))!
}

function navButtons(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-calendar__nav')
}

describe('Calendar 日历', () => {
  it('渲染标题、星期表头与网格', () => {
    const wrapper = mountCalendar({ modelValue: new Date(2026, 10, 7) })
    expect(wrapper.classes()).toContain('ui-calendar')
    expect(wrapper.classes()).toContain('is-controller-button')
    expect(wrapper.find('.ui-calendar__title').text()).toBe('2026 年 11 月')
    expect(wrapper.findAll('.ui-calendar__weekday')).toHaveLength(7)
    expect(wrapper.findAll('.ui-calendar__weekday')[0].text()).toBe('一')
  })

  it('导航渲染两个翻页按钮且默认不挂 is-range', () => {
    const wrapper = mountCalendar({ modelValue: new Date(2026, 10, 7) })
    expect(navButtons(wrapper)).toHaveLength(2)
    expect(navButtons(wrapper)[0].find('svg').classes()).toContain('lucide-chevron-left')
    expect(wrapper.classes()).not.toContain('is-range')
  })

  it('网格按整周补齐并标记空格', () => {
    const wrapper = mountCalendar({ modelValue: new Date(2026, 10, 7) })
    const cells = wrapper.findAll('.ui-calendar__cell')
    expect(cells.length % 7).toBe(0)
    expect(cells.some((item) => item.classes().includes('is-empty'))).toBe(true)
    expect(cells.filter((item) => item.classes().includes('is-empty')).every((item) => item.text() === '')).toBe(true)
  })

  it('当月某天标记为今天并选中', () => {
    const wrapper = mountCalendar({ modelValue: new Date(2026, 10, 7) })
    const day7 = cellOf(wrapper, 7)
    expect(day7.classes()).toContain('is-today')
    expect(day7.classes()).toContain('is-selected')
  })

  it('点击日期抛出去时间等于该日', async () => {
    const wrapper = mountCalendar({ modelValue: new Date(2026, 10, 7) })
    await cellOf(wrapper, 15).trigger('click')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('change')).toHaveLength(1)
    const value = wrapper.emitted('update:modelValue')![0][0] as Date
    expect(value.getFullYear()).toBe(2026)
    expect(value.getMonth()).toBe(10)
    expect(value.getDate()).toBe(15)
  })

  it('翻页按钮切换月份标题', async () => {
    const wrapper = mountCalendar({ modelValue: new Date(2026, 10, 7) })
    await navButtons(wrapper)[1].trigger('click')
    expect(wrapper.find('.ui-calendar__title').text()).toBe('2026 年 12 月')
    await navButtons(wrapper)[0].trigger('click')
    await navButtons(wrapper)[0].trigger('click')
    expect(wrapper.find('.ui-calendar__title').text()).toBe('2026 年 10 月')
  })

  it('字符串 modelValue 可解析并选中', () => {
    const wrapper = mountCalendar({ modelValue: '2026-11-20T00:00:00' })
    expect(wrapper.find('.ui-calendar__title').text()).toBe('2026 年 11 月')
    expect(cellOf(wrapper, 20).classes()).toContain('is-selected')
  })

  it('非法 modelValue 回退到当月', () => {
    const wrapper = mountCalendar({ modelValue: '不是日期' })
    expect(wrapper.find('.ui-calendar__title').text()).toBe('2026 年 11 月')
    expect(cellOf(wrapper, 7).classes()).toContain('is-today')
  })

  it('controllerType 只切换类名仍渲染按钮控制', () => {
    const wrapper = mountCalendar({ controllerType: 'select' })
    expect(wrapper.classes()).toContain('is-controller-select')
    expect(navButtons(wrapper)).toHaveLength(2)
    expect(wrapper.find('select').exists()).toBe(false)
  })

  it('range 数组渲染区间提示与类名并标记区间', () => {
    const wrapper = mountCalendar({ range: [new Date(2026, 10, 10), new Date(2026, 10, 15)] })
    expect(wrapper.classes()).toContain('is-range')
    expect(wrapper.classes()).toContain('ui-calendar--range')
    expect(wrapper.find('.ui-calendar__range-tip').text()).toBe('2026-11-10 至 2026-11-15')
    expect(cellOf(wrapper, 10).classes()).toContain('is-range-start')
    expect(cellOf(wrapper, 15).classes()).toContain('is-range-end')
    expect(cellOf(wrapper, 12).classes()).toContain('is-in-range')
  })

  it('空 range 数组仍按区间态提示但未挂特性类名', () => {
    const wrapper = mountCalendar({ range: [] })
    expect(wrapper.classes()).toContain('is-range')
    expect(wrapper.classes()).not.toContain('ui-calendar--range')
    expect(wrapper.find('.ui-calendar__range-tip').text()).toBe('点击日期选择范围')
  })

  it('区间模式下两次点击才提交并回显起止', async () => {
    const wrapper = mountCalendar({ range: [] })
    await cellOf(wrapper, 12).trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.find('.ui-calendar__range-tip').text()).toContain('请选择结束日期')
    await cellOf(wrapper, 15).trigger('click')
    const value = wrapper.emitted('update:modelValue')![0][0] as Date[]
    expect(Array.isArray(value)).toBe(true)
    expect(value[0].getDate()).toBe(12)
    expect(value[1].getDate()).toBe(15)
    expect(cellOf(wrapper, 12).classes()).toContain('is-range-start')
    expect(cellOf(wrapper, 15).classes()).toContain('is-range-end')
  })

  it('区间倒序选择会自动纠正起止', async () => {
    const wrapper = mountCalendar({ range: [] })
    await cellOf(wrapper, 20).trigger('click')
    await cellOf(wrapper, 11).trigger('click')
    const value = wrapper.emitted('update:modelValue')![0][0] as Date[]
    expect(value[0].getDate()).toBe(11)
    expect(value[1].getDate()).toBe(20)
  })

  it('无 modelValue 时以今天为初始视图', () => {
    const wrapper = mountCalendar({})
    expect(wrapper.find('.ui-calendar__title').text()).toBe('2026 年 11 月')
    const day7 = cellOf(wrapper, 7)
    expect(day7.classes()).toContain('is-today')
    // 未受控时今天同时充当选中态（toDate 对空值回退到当前日期）
    expect(day7.classes()).toContain('is-selected')
  })
})
