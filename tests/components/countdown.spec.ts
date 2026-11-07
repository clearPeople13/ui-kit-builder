import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Countdown } from '@ui-kit-full'

/**
 * Countdown：value 是"秒数 / 目标时间戳 / Date / {days,hours,minutes,seconds}"四种口径，
 * format 在渲染时按 D/H/m/s 占位替换；剩余时间归零后挂 is-finished 并停止 1s 计时器。
 * 所有用例冻结系统时钟，再用 advanceTimersByTime 推进。
 */
const BASE_TIME = new Date('2026-01-01T00:00:00Z').getTime()

let wrappers: VueWrapper[] = []

function mountCountdown(props: Record<string, any> = {}) {
  const wrapper = mount(Countdown, { props, attachTo: document.body })
  wrappers.push(wrapper)
  return wrapper
}

function timeText(wrapper: ReturnType<typeof mountCountdown>) {
  return wrapper.find('.ui-countdown__time').text()
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(BASE_TIME)
  document.body.innerHTML = ''
})

afterEach(() => {
  wrappers.forEach((wrapper) => wrapper.unmount())
  wrappers = []
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('Countdown', () => {
  it('默认渲染根节点、value 区与 HH:mm:ss 文本', () => {
    const wrapper = mountCountdown({ value: 3661 })
    expect(wrapper.classes()).toContain('ui-countdown')
    expect(wrapper.find('.ui-countdown__title').exists()).toBe(false)
    expect(wrapper.find('.ui-countdown__value').exists()).toBe(true)
    expect(wrapper.find('.ui-countdown__prefix').exists()).toBe(false)
    expect(wrapper.find('.ui-countdown__suffix').exists()).toBe(false)
    expect(timeText(wrapper)).toBe('01:01:01')
  })

  it('缺省 value=0 时立即归零并挂 is-finished', () => {
    const wrapper = mountCountdown()
    expect(timeText(wrapper)).toBe('00:00:00')
    expect(wrapper.classes()).toContain('is-finished')
  })

  it('title / prefix / suffix 条件渲染', () => {
    const wrapper = mountCountdown({ value: 65, title: '活动倒计时', prefix: '剩余', suffix: '秒' })
    expect(wrapper.find('.ui-countdown__title').text()).toBe('活动倒计时')
    expect(wrapper.find('.ui-countdown__prefix').text()).toBe('剩余')
    expect(wrapper.find('.ui-countdown__suffix').text()).toBe('秒')
  })

  it('valueStyle 的对象与字符串写法都落到内容区', () => {
    const objectStyle = mountCountdown({ value: 1, valueStyle: { color: 'red', fontSize: '20px' } })
    expect(objectStyle.find('.ui-countdown__value').attributes('style')).toContain('color: red')
    expect(objectStyle.find('.ui-countdown__value').attributes('style')).toContain('font-size: 20px')
    const stringStyle = mountCountdown({ value: 1, valueStyle: 'font-weight: 700' })
    expect(stringStyle.find('.ui-countdown__value').attributes('style')).toContain('font-weight: 700')
  })

  it('format 支持 mm:ss 与天/时/分/秒组合', () => {
    expect(timeText(mountCountdown({ value: 65, format: 'mm:ss' }))).toBe('01:05')
    expect(timeText(mountCountdown({ value: 90061, format: 'D 天 HH:mm:ss' }))).toBe('1 天 01:01:01')
  })

  it('每秒递减剩余时间', async () => {
    const wrapper = mountCountdown({ value: 10 })
    expect(timeText(wrapper)).toBe('00:00:10')
    vi.advanceTimersByTime(3000)
    await nextTick()
    expect(timeText(wrapper)).toBe('00:00:07')
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(timeText(wrapper)).toBe('00:00:06')
  })

  it('归零后停在 00:00:00 且 is-finished 保持', async () => {
    const wrapper = mountCountdown({ value: 3 })
    vi.advanceTimersByTime(3000)
    await nextTick()
    expect(timeText(wrapper)).toBe('00:00:00')
    expect(wrapper.classes()).toContain('is-finished')
    vi.advanceTimersByTime(5000)
    await nextTick()
    expect(timeText(wrapper)).toBe('00:00:00')
    expect(wrapper.classes()).toContain('is-finished')
  })

  it('Date 作为目标时间', async () => {
    const wrapper = mountCountdown({ value: new Date(BASE_TIME + 9000) })
    expect(timeText(wrapper)).toBe('00:00:09')
    vi.advanceTimersByTime(2000)
    await nextTick()
    expect(timeText(wrapper)).toBe('00:00:07')
  })

  it('对象形态的 days / hours / minutes / seconds 参与总时长', () => {
    expect(timeText(mountCountdown({ value: { days: 1, hours: 2, minutes: 3, seconds: 4 } }))).toBe('02:03:04')
    expect(timeText(mountCountdown({ value: { minutes: 1, seconds: 30 } }))).toBe('00:01:30')
  })

  it('大于 1e11 的数值按绝对时间戳处理', async () => {
    const wrapper = mountCountdown({ value: BASE_TIME + 5000 })
    expect(timeText(wrapper)).toBe('00:00:05')
    vi.advanceTimersByTime(2000)
    await nextTick()
    expect(timeText(wrapper)).toBe('00:00:03')
  })

  it('改写 value 重新起算计时器', async () => {
    const wrapper = mountCountdown({ value: 10 })
    vi.advanceTimersByTime(2000)
    await nextTick()
    expect(timeText(wrapper)).toBe('00:00:08')
    await wrapper.setProps({ value: 30 })
    await nextTick()
    expect(timeText(wrapper)).toBe('00:00:30')
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(timeText(wrapper)).toBe('00:00:29')
  })

  it('已结束的实例改写 value 后恢复倒计时并摘掉 is-finished', async () => {
    const wrapper = mountCountdown({ value: 0 })
    expect(wrapper.classes()).toContain('is-finished')
    await wrapper.setProps({ value: 5 })
    await nextTick()
    expect(timeText(wrapper)).toBe('00:00:05')
    expect(wrapper.classes()).not.toContain('is-finished')
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(timeText(wrapper)).toBe('00:00:04')
  })

  it('负值按已结束处理', () => {
    const wrapper = mountCountdown({ value: -5 })
    expect(timeText(wrapper)).toBe('00:00:00')
    expect(wrapper.classes()).toContain('is-finished')
  })

  it('非有限数值回退为立即归零', () => {
    const wrapper = mountCountdown({ value: Number.NaN })
    expect(timeText(wrapper)).toBe('00:00:00')
    expect(wrapper.classes()).toContain('is-finished')
  })

  it('改写 format 后文本按新格式渲染', async () => {
    const wrapper = mountCountdown({ value: 3661 })
    expect(timeText(wrapper)).toBe('01:01:01')
    await wrapper.setProps({ format: 'mm:ss' })
    await nextTick()
    expect(timeText(wrapper)).toBe('01:01')
  })
})
