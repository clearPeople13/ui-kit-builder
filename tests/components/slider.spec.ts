import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { Slider } from '@ui-kit-full'

/**
 * Slider 滑块：happy-dom 没有真实布局，拖拽的坐标换算测不到，
 * 口径只落在静态结构、内联百分比、原生 range / number 输入以及按钮可测通路。
 * 事件里混有 VTU 为原生事件追加的记录，统一用 customEmits 过滤。
 */
const wrappers: any[] = []

function mountSlider(props: Record<string, unknown> = {}, slots?: Record<string, string>) {
  const wrapper = mount(Slider, { props: { modelValue: 30, ...props }, slots })
  wrappers.push(wrapper)
  return wrapper
}

function percent(style: string | undefined, prop: string) {
  const raw = style?.match(new RegExp(`${prop}:\\s*([\\d.]+)%`))?.[1]
  return raw ? Number(raw) : null
}

function customEmits(wrapper: any, name: string) {
  return (wrapper.emitted(name) ?? []).filter((payload: unknown[]) => !(payload[0] instanceof Event))
}

function fire(el: { dispatchEvent: (event: Event) => boolean }, type: string) {
  el.dispatchEvent(new Event(type, { bubbles: true }))
}

function setValue(wrapper: any, selector: string, value: string) {
  ;(wrapper.find(selector).element as HTMLInputElement).value = value
}

afterEach(() => {
  wrappers.forEach((wrapper) => wrapper.unmount())
  wrappers.length = 0
})

describe('Slider 滑块', () => {
  it('默认渲染轨道、滑块按钮与原生 range 输入', () => {
    const wrapper = mountSlider()
    expect(wrapper.classes()).toContain('ui-slider')
    expect(wrapper.classes()).toContain('ui-slider--popper')
    expect(wrapper.classes()).toContain('ui-slider--format')
    expect(wrapper.classes()).not.toContain('is-vertical')
    expect(wrapper.classes()).not.toContain('ui-slider--range')
    expect(wrapper.find('.ui-slider__inner').exists()).toBe(true)
    expect(wrapper.find('.ui-slider__runway').exists()).toBe(true)
    expect(wrapper.find('.ui-slider__bar').exists()).toBe(true)
    expect(wrapper.find('.ui-slider__button-wrapper').exists()).toBe(true)
    expect(wrapper.find('.ui-slider__button').exists()).toBe(true)
    expect(wrapper.find('.ui-slider__tooltip').text()).toBe('30')
    const input = wrapper.find('.ui-slider__input')
    expect(input.attributes('type')).toBe('range')
    expect(input.attributes('min')).toBe('0')
    expect(input.attributes('max')).toBe('100')
    expect(input.attributes('step')).toBe('1')
    expect((input.element as HTMLInputElement).value).toBe('30')
    expect(wrapper.findAll('.ui-slider__number')).toHaveLength(0)
  })

  it('受控值换算成进度条宽度与按钮位置', () => {
    const wrapper = mountSlider({ modelValue: 30 })
    expect(percent(wrapper.find('.ui-slider__bar').attributes('style'), 'width')).toBe(30)
    expect(percent(wrapper.find('.ui-slider__button-wrapper').attributes('style'), 'left')).toBe(30)
  })

  it('越界值夹到 min / max，min 与 max 相等时进度为零', () => {
    const overflow = mountSlider({ modelValue: 150, min: -10, max: 110 })
    expect(percent(overflow.find('.ui-slider__bar').attributes('style'), 'width')).toBe(100)
    expect(percent(overflow.find('.ui-slider__button-wrapper').attributes('style'), 'left')).toBe(100)
    expect(overflow.find('.ui-slider__tooltip').text()).toBe('110')

    const flat = mountSlider({ modelValue: 5, min: 5, max: 5 })
    expect(percent(flat.find('.ui-slider__bar').attributes('style'), 'width')).toBe(0)
    expect(flat.find('.ui-slider__tooltip').text()).toBe('5')
  })

  it('modelValue 是数组但未开 range 时只取首项', () => {
    const wrapper = mountSlider({ modelValue: [40, 70] })
    expect(wrapper.find('.ui-slider__input').attributes('value')).toBe('40')
    expect(wrapper.classes()).not.toContain('ui-slider--range')
  })

  it('垂直模式改高度轴与缺省 200px，range 输入撑宽度', () => {
    const wrapper = mountSlider({ modelValue: 30, vertical: true })
    expect(wrapper.classes()).toContain('is-vertical')
    expect(wrapper.find('.ui-slider__inner').attributes('style')).toContain('height: 200px')
    expect(percent(wrapper.find('.ui-slider__bar').attributes('style'), 'height')).toBe(30)
    expect(percent(wrapper.find('.ui-slider__button-wrapper').attributes('style'), 'bottom')).toBe(30)
    expect(wrapper.find('.ui-slider__button-wrapper').attributes('style')).toContain('left: 50%')

    const custom = mountSlider({ modelValue: 30, vertical: true, height: '120px' })
    expect(custom.find('.ui-slider__inner').attributes('style')).toContain('height: 120px')
    expect(custom.find('.ui-slider__input').attributes('style')).toContain('width: 120px')
  })

  it('formatTooltip 改写文案，placement 与 tooltipClass 落到气泡', () => {
    const wrapper = mountSlider({
      modelValue: 30,
      placement: 'bottom',
      formatTooltip: (value: number) => `${value}%`,
      tooltipClass: ['tip-a', 'tip-b']
    })
    const tooltip = wrapper.find('.ui-slider__tooltip')
    expect(tooltip.text()).toBe('30%')
    expect(tooltip.classes()).toEqual(['ui-slider__tooltip', 'is-bottom', 'tip-a', 'tip-b'])
  })

  it('showTooltip 为假时不渲染气泡', () => {
    const wrapper = mountSlider({ showTooltip: false })
    expect(wrapper.find('.ui-slider__tooltip').exists()).toBe(false)
    expect(wrapper.find('.ui-slider__button').exists()).toBe(true)
  })

  it('persistent 为假时气泡默认隐藏，悬停才显示', async () => {
    const wrapper = mountSlider({ modelValue: 10, persistent: false })
    const tooltip = () => wrapper.find('.ui-slider__tooltip')
    expect(tooltip().classes()).toContain('is-hidden')
    await wrapper.find('.ui-slider__inner').trigger('mouseenter')
    expect(tooltip().classes()).not.toContain('is-hidden')
    await wrapper.find('.ui-slider__inner').trigger('mouseleave')
    expect(tooltip().classes()).toContain('is-hidden')
  })

  it('showStops 按步长铺刻度，数量是区间除以步长减一', () => {
    const wrapper = mountSlider({ modelValue: 30, showStops: true, step: 10 })
    const stops = wrapper.findAll('.ui-slider__stop')
    expect(stops).toHaveLength(9)
    expect(percent(stops[0].attributes('style'), 'left')).toBe(10)
    expect(percent(stops[8].attributes('style'), 'left')).toBe(90)

    const vertical = mountSlider({ modelValue: 30, vertical: true, showStops: true, step: 10 })
    const verticalStops = vertical.findAll('.ui-slider__stop')
    expect(percent(verticalStops[0].attributes('style'), 'bottom')).toBe(10)
    expect(verticalStops[0].attributes('style')).not.toContain('left')
  })

  it('marks 排序、过滤越界点并回退空文案为刻度值', () => {
    const wrapper = mountSlider({
      modelValue: 30,
      marks: { 100: 'C', 0: 'A', 150: '越界', '-10': '越界', 50: '' }
    })
    expect(wrapper.find('.ui-slider__inner').classes()).toContain('has-marks')
    const marks = wrapper.findAll('.ui-slider__mark')
    expect(marks.map((mark) => mark.text())).toEqual(['A', '50', 'C'])
    expect(marks.map((mark) => percent(mark.attributes('style'), 'left'))).toEqual([0, 50, 100])
  })

  it('range 模式渲染双滑块与中段进度条', () => {
    const wrapper = mountSlider({ modelValue: [20, 60], range: true })
    expect(wrapper.classes()).toContain('ui-slider--range')
    expect(wrapper.find('.ui-slider__inner').classes()).toContain('is-range')
    const style = wrapper.find('.ui-slider__bar').attributes('style')
    expect(percent(style, 'left')).toBe(20)
    expect(percent(style, 'width')).toBe(40)
    const low = wrapper.find('.ui-slider__button-wrapper.is-low')
    const high = wrapper.find('.ui-slider__button-wrapper.is-high')
    expect(percent(low.attributes('style'), 'left')).toBe(20)
    expect(percent(high.attributes('style'), 'left')).toBe(60)
    expect(low.find('.ui-slider__tooltip').classes()).toContain('is-low')
    expect(high.find('.ui-slider__tooltip').text()).toBe('60')
    expect(wrapper.findAll('.ui-slider__input')).toHaveLength(2)
  })

  it('range 模式对调设置值与越界值做夹取', () => {
    const wrapper = mountSlider({ modelValue: [120, -10], range: true })
    const style = wrapper.find('.ui-slider__bar').attributes('style')
    expect(percent(style, 'left')).toBe(0)
    expect(percent(style, 'width')).toBe(100)
    expect(wrapper.find('.ui-slider__tooltip.is-low').text()).toBe('0')
    expect(wrapper.find('.ui-slider__tooltip.is-high').text()).toBe('100')
  })

  it('range 拖动低位输入时抛排序后的数组与 input 事件', async () => {
    const wrapper = mountSlider({ modelValue: [20, 60], range: true })
    const low = wrapper.find('.ui-slider__input.is-low')
    setValue(wrapper, '.ui-slider__input.is-low', '70')
    fire(low.element, 'input')
    await nextTick()
    expect(customEmits(wrapper, 'update:modelValue').at(-1)).toEqual([[60, 70]])
    expect(customEmits(wrapper, 'input').at(-1)).toEqual([[60, 70]])
  })

  it('range 的 change 载荷带本次拖拽结果', async () => {
    const wrapper = mountSlider({ modelValue: [20, 60], range: true })
    const low = wrapper.find('.ui-slider__input.is-low')
    setValue(wrapper, '.ui-slider__input.is-low', '30')
    fire(low.element, 'input')
    await nextTick()
    fire(low.element, 'change')
    await nextTick()
    expect(customEmits(wrapper, 'change').at(-1)).toEqual([[30, 60]])
  })

  it('showInput 渲染数字输入与加减按钮，inputSize 落到包装层', () => {
    const wrapper = mountSlider({ showInput: true, inputSize: 'small' })
    expect(wrapper.find('.ui-slider__input-wrapper').classes()).toContain('is-small')
    const number = wrapper.find('.ui-slider__number')
    expect(number.attributes('type')).toBe('number')
    expect(number.attributes('min')).toBe('0')
    expect(number.attributes('max')).toBe('100')
    expect(number.attributes('step')).toBe('1')
    expect((number.element as HTMLInputElement).value).toBe('30')
    expect(wrapper.find('.ui-slider__input-control.is-minus').text()).toBe('−')
    expect(wrapper.find('.ui-slider__input-control.is-plus').text()).toBe('+')
  })

  it('加减按钮按 step 步进并在边界夹取', async () => {
    const wrapper = mountSlider({ modelValue: 30, showInput: true, step: 2 })
    await wrapper.find('.ui-slider__input-control.is-plus').trigger('click')
    await wrapper.find('.ui-slider__input-control.is-minus').trigger('click')
    expect(customEmits(wrapper, 'update:modelValue')).toEqual([[32], [28]])
    expect(customEmits(wrapper, 'change')).toEqual([[32], [28]])

    const high = mountSlider({ modelValue: 99, showInput: true, step: 2 })
    await high.find('.ui-slider__input-control.is-plus').trigger('click')
    expect(customEmits(high, 'update:modelValue').at(-1)).toEqual([100])
    const low = mountSlider({ modelValue: 1, showInput: true, step: 2 })
    await low.find('.ui-slider__input-control.is-minus').trigger('click')
    expect(customEmits(low, 'update:modelValue').at(-1)).toEqual([0])
  })

  it('数字输入 change 提交，showInputControls 为假时只剩输入框', async () => {
    const wrapper = mountSlider({ modelValue: 30, showInput: true })
    setValue(wrapper, '.ui-slider__number', '55')
    fire(wrapper.find('.ui-slider__number').element, 'change')
    await nextTick()
    expect(customEmits(wrapper, 'update:modelValue').at(-1)).toEqual([55])
    expect(customEmits(wrapper, 'change').at(-1)).toEqual([55])

    const bare = mountSlider({ modelValue: 30, showInput: true, showInputControls: false, inputSize: 'large' })
    expect(bare.find('.ui-slider__input-wrapper').classes()).toContain('is-large')
    expect(bare.findAll('button')).toHaveLength(0)
    expect(bare.find('.ui-slider__number').exists()).toBe(true)
  })

  it('range 的 showInput 是两个数字框加「至」分隔符', () => {
    const wrapper = mountSlider({ modelValue: [20, 60], range: true, showInput: true })
    const numbers = wrapper.findAll('.ui-slider__number')
    expect(numbers).toHaveLength(2)
    expect((numbers[0].element as HTMLInputElement).value).toBe('20')
    expect((numbers[1].element as HTMLInputElement).value).toBe('60')
    expect(wrapper.find('.ui-slider__range-separator').text()).toBe('至')
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('disabled / size / id / ariaLabel 落到原生输入', () => {
    const wrapper = mountSlider({
      modelValue: 40,
      showInput: true,
      disabled: true,
      size: 'small',
      id: 'volume',
      ariaLabel: '音量'
    })
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.classes()).toContain('ui-slider--size-small')
    const input = wrapper.find('.ui-slider__input')
    expect(input.attributes('disabled')).toBeDefined()
    expect(input.attributes('id')).toBe('volume')
    expect(input.attributes('aria-label')).toBe('音量')
    expect(wrapper.find('.ui-slider__number').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.ui-slider__input-control.is-plus').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.ui-slider__input-control.is-minus').attributes('disabled')).toBeDefined()
  })

  it('默认插槽不会替换内置结构', () => {
    const wrapper = mountSlider({}, { default: '<span class="slot-probe">插槽</span>' })
    expect(wrapper.find('.slot-probe').exists()).toBe(false)
    expect(wrapper.find('.ui-slider__runway').exists()).toBe(true)
  })

  it('垂直模式的气泡缺省贴在右侧', () => {
    const wrapper = mountSlider({ vertical: true })
    expect(wrapper.find('.ui-slider__tooltip').classes()).toContain('is-right')
  })
})
