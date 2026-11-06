import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Progress } from '@ui-kit-full'

// 统一构造 Progress，收敛公共 props
function mountProgress(props: Record<string, unknown> = {}) {
  return mount(Progress, { props: { percentage: 40, ...props } })
}

describe('Progress 进度条', () => {
  it('默认折线形态渲染进度条与百分比文本', () => {
    const wrapper = mountProgress()
    expect(wrapper.classes()).toEqual(['ui-progress', 'ui-progress--line'])
    expect(wrapper.find('.ui-progress__bar').attributes('style')).toContain('height: 6px')
    expect(wrapper.find('.ui-progress__inner').attributes('style')).toContain('width: 40%')
    expect(wrapper.find('.ui-progress__text').text()).toBe('40%')
  })

  it('不传百分比时缺省为 0%', () => {
    const wrapper = mount(Progress)
    expect(wrapper.find('.ui-progress__inner').attributes('style')).toContain('width: 0%')
    expect(wrapper.find('.ui-progress__text').text()).toBe('0%')
  })

  it('百分比超过 100 被夹到上限', () => {
    const wrapper = mountProgress({ percentage: 150 })
    expect(wrapper.find('.ui-progress__inner').attributes('style')).toContain('width: 100%')
    expect(wrapper.find('.ui-progress__text').text()).toBe('100%')
  })

  it('百分比为负被夹到下限', () => {
    const wrapper = mountProgress({ percentage: -20 })
    expect(wrapper.find('.ui-progress__inner').attributes('style')).toContain('width: 0%')
    expect(wrapper.find('.ui-progress__text').text()).toBe('0%')
  })

  it('字符串 color 写入进度条背景色', () => {
    const wrapper = mountProgress({ color: 'rgb(1, 2, 3)' })
    expect(wrapper.find('.ui-progress__inner').attributes('style')).toContain('background-color: rgb(1, 2, 3)')
  })

  it('color 数组按阈值命中最高档', () => {
    const color = [
      { percentage: 20, color: 'red' },
      { percentage: 50, color: 'blue' }
    ]
    expect(mountProgress({ percentage: 60, color }).find('.ui-progress__inner').attributes('style')).toContain(
      'background-color: blue'
    )
    expect(mountProgress({ percentage: 30, color }).find('.ui-progress__inner').attributes('style')).toContain(
      'background-color: red'
    )
  })

  it('color 数组乱序传入仍按百分比升序命中', () => {
    const color = [
      { percentage: 80, color: 'green' },
      { percentage: 10, color: 'orange' }
    ]
    expect(mountProgress({ percentage: 85, color }).find('.ui-progress__inner').attributes('style')).toContain(
      'background-color: green'
    )
  })

  it('百分比低于所有阈值时不着色', () => {
    const color = [{ percentage: 50, color: 'blue' }]
    expect(mountProgress({ percentage: 30, color }).find('.ui-progress__inner').attributes('style')).toBe('width: 30%;')
  })

  it('color 函数按当前百分比求值', () => {
    const color = (value: number) => (value > 50 ? 'green' : '')
    expect(mountProgress({ percentage: 70, color }).find('.ui-progress__inner').attributes('style')).toContain(
      'background-color: green'
    )
    // 函数返回空串时不落背景色
    expect(mountProgress({ percentage: 20, color }).find('.ui-progress__inner').attributes('style')).not.toContain(
      'background-color'
    )
  })

  it('status 落到状态类名', () => {
    const wrapper = mountProgress({ status: 'success', percentage: 100 })
    expect(wrapper.classes()).toContain('ui-progress--status-success')
  })

  it('缺省 status 不产生状态类名', () => {
    expect(mountProgress().classes()).not.toContain('ui-progress--status-')
    expect(
      mountProgress({ status: '' })
        .classes()
        .filter((c) => c.includes('status'))
    ).toEqual([])
  })

  it('indeterminate 追加不确定态类名并隐藏百分比文本', () => {
    const wrapper = mountProgress({ indeterminate: true })
    expect(wrapper.classes()).toContain('is-indeterminate')
    expect(wrapper.find('.ui-progress__text').exists()).toBe(false)
  })

  it('showText=false 隐藏百分比文本', () => {
    expect(mountProgress({ showText: false }).find('.ui-progress__text').exists()).toBe(false)
  })

  it('strokeWidth 决定进度条粗细', () => {
    expect(mountProgress({ strokeWidth: 12 }).find('.ui-progress__bar').attributes('style')).toContain('height: 12px')
  })

  it('strokeWidth 为 0 时回落到缺省粗细', () => {
    // 0 经 || 兜底回到 6
    expect(mountProgress({ strokeWidth: 0 }).find('.ui-progress__bar').attributes('style')).toContain('height: 6px')
  })

  it('circle 形态渲染环形 svg 与中心文本', () => {
    const wrapper = mountProgress({ type: 'circle', width: 140, strokeWidth: 10, percentage: 40 })
    expect(wrapper.classes()).toContain('ui-progress--circle')
    const circle = wrapper.find('.ui-progress__circle')
    expect(circle.attributes('style')).toContain('width: 140px')
    expect(circle.attributes('style')).toContain('height: 140px')
    expect(wrapper.find('.ui-progress__circle-track').exists()).toBe(true)
    expect(wrapper.find('.ui-progress__circle-text').text()).toBe('40%')
  })

  it('circle 半径随宽度与线宽推导', () => {
    const wrapper = mountProgress({ type: 'circle', width: 140, strokeWidth: 10 })
    // r = (140 - 10) / 2 = 65
    expect(wrapper.find('.ui-progress__circle-path').attributes('r')).toBe('65')
    expect(wrapper.find('.ui-progress__circle-path').attributes('transform')).toBe('rotate(-90 70 70)')
  })

  it('circle 的 stroke-dasharray 按百分比换算', () => {
    const wrapper = mountProgress({ type: 'circle', width: 140, strokeWidth: 10, percentage: 40 })
    const circumference = 2 * Math.PI * 65
    expect(wrapper.find('.ui-progress__circle-path').attributes('stroke-dasharray')).toBe(
      `${(40 / 100) * circumference} ${circumference}`
    )
  })

  it('circle 颜色写入 stroke', () => {
    const wrapper = mountProgress({ type: 'circle', color: 'rgb(3, 3, 3)' })
    expect(wrapper.find('.ui-progress__circle-path').attributes('style')).toContain('stroke: rgb(3, 3, 3)')
  })

  it('circle 上 showText=false 隐藏中心文本', () => {
    const wrapper = mountProgress({ type: 'circle', showText: false })
    expect(wrapper.find('.ui-progress__circle-text').exists()).toBe(false)
  })

  it('dashboard 形态复用环形结构并带专属类名', () => {
    const wrapper = mountProgress({ type: 'dashboard', percentage: 30 })
    expect(wrapper.classes()).toContain('ui-progress--dashboard')
    expect(wrapper.find('.ui-progress__circle').exists()).toBe(true)
    expect(wrapper.find('.ui-progress__circle-path').exists()).toBe(true)
    // 默认宽度 126，默认线宽 6 → r = 60
    expect(wrapper.find('.ui-progress__circle-path').attributes('r')).toBe('60')
  })

  it('data 型进度随 percentage 响应式更新', async () => {
    const wrapper = mountProgress({ percentage: 20 })
    await wrapper.setProps({ percentage: 80 })
    expect(wrapper.find('.ui-progress__inner').attributes('style')).toContain('width: 80%')
    expect(wrapper.find('.ui-progress__text').text()).toBe('80%')
  })

  it('透传 id 与 aria-label 到根节点', () => {
    const wrapper = mount(Progress, { props: { percentage: 10 }, attrs: { id: 'p1', 'aria-label': '上传进度' } })
    expect(wrapper.attributes('id')).toBe('p1')
    expect(wrapper.attributes('aria-label')).toBe('上传进度')
  })
})
