import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { Rate } from '@ui-kit-full'

/**
 * Rate 评分：happy-dom 无布局，半星点击所需的指针坐标测不到，
 * 口径覆盖结构类名、分段颜色、受控值与点击 / 键盘提交、文案与分数模板。
 * clearable 属于特性开关，min/max 与禁用态单独验证。
 */
const wrappers: any[] = []

function mountRate(props: Record<string, any> = {}, slots?: Record<string, string>) {
  const wrapper = mount(Rate, { props, slots })
  wrappers.push(wrapper)
  return wrapper
}

function colorOf(style: string | undefined) {
  return style?.match(/color:\s*([^;]+)/)?.[1]?.trim()
}

afterEach(() => {
  wrappers.forEach((wrapper) => wrapper.unmount())
  wrappers.length = 0
})

describe('Rate 评分', () => {
  it('默认渲染五颗星、前三颗点亮并暴露无障碍数值', () => {
    const wrapper = mountRate({ modelValue: 3 })
    expect(wrapper.classes()).toEqual(['ui-rate'])
    expect(wrapper.attributes('role')).toBe('slider')
    expect(wrapper.attributes('tabindex')).toBe('0')
    expect(wrapper.attributes('aria-valuemin')).toBe('0')
    expect(wrapper.attributes('aria-valuemax')).toBe('5')
    expect(wrapper.attributes('aria-valuenow')).toBe('3')
    expect(wrapper.attributes('aria-valuetext')).toBe('3')
    const items = wrapper.findAll('.ui-rate__item')
    expect(items).toHaveLength(5)
    expect(items.map((item) => item.classes().includes('is-active'))).toEqual([true, true, true, false, false])
    expect(items[0].find('.ui-rate__icon--active').attributes('style')).toContain('width: 100%')
    expect(items[3].find('.ui-rate__icon--active').exists()).toBe(false)
    expect(wrapper.findAll('.ui-rate__icon--void')).toHaveLength(5)
    expect(wrapper.find('.ui-rate__text').exists()).toBe(false)
  })

  it('modelValue 夹在 0 与 max 之间，默认值为 0', () => {
    const overflow = mountRate({ modelValue: 9 })
    expect(overflow.attributes('aria-valuenow')).toBe('5')
    expect(overflow.findAll('.ui-rate__item.is-active')).toHaveLength(5)

    const negative = mountRate({ modelValue: -1 })
    expect(negative.attributes('aria-valuenow')).toBe('0')
    expect(negative.findAll('.ui-rate__item.is-active')).toHaveLength(0)

    const empty = mountRate()
    expect(empty.attributes('aria-valuenow')).toBe('0')
    expect(empty.attributes('aria-valuetext')).toBe('0')
  })

  it('非法 max 回退到 5，小数 max 向下取整', () => {
    const zero = mountRate({ modelValue: 2, max: 0 })
    expect(zero.findAll('.ui-rate__item')).toHaveLength(5)
    expect(zero.attributes('aria-valuemax')).toBe('5')

    const decimal = mountRate({ modelValue: 2, max: 3.7 })
    expect(decimal.findAll('.ui-rate__item')).toHaveLength(3)
    expect(decimal.attributes('aria-valuemax')).toBe('3')
  })

  it('allowHalf 下 2.5 分渲染半星，关闭时只点亮整颗', () => {
    const half = mountRate({ modelValue: 2.5, allowHalf: true })
    const items = half.findAll('.ui-rate__item')
    expect(items[2].classes()).toContain('is-half')
    expect(items[2].classes()).not.toContain('is-active')
    expect(items[2].find('.ui-rate__icon--active').attributes('style')).toContain('width: 50%')
    expect(items[3].find('.ui-rate__icon--active').exists()).toBe(false)

    const plain = mountRate({ modelValue: 2.5 })
    expect(plain.findAll('.ui-rate__item.is-half')).toHaveLength(0)
    expect(plain.findAll('.ui-rate__item.is-active')).toHaveLength(2)
  })

  it('点击第 N 颗提交 N 分并广播 update:modelValue / change', async () => {
    const wrapper = mountRate({ modelValue: 0 })
    await wrapper.findAll('.ui-rate__item')[1].trigger('click')
    await wrapper.findAll('.ui-rate__item')[4].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[2], [5]])
    expect(wrapper.emitted('change')).toEqual([[2], [5]])
    expect(wrapper.attributes('aria-valuenow')).toBe('0')
  })

  it('clearable 开启时点击当前分值清零，关闭时保持原值', async () => {
    const wrapper = mountRate({ modelValue: 3, clearable: true })
    expect(wrapper.classes()).toContain('ui-rate--clearable')
    await wrapper.findAll('.ui-rate__item')[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[0]])
    expect(wrapper.emitted('change')).toEqual([[0]])

    const plain = mountRate({ modelValue: 3 })
    expect(plain.classes()).not.toContain('ui-rate--clearable')
    await plain.findAll('.ui-rate__item')[2].trigger('click')
    expect(plain.emitted('update:modelValue')).toEqual([[3]])
  })

  it('colors 数组按低 / 中 / 高阈值取色', () => {
    const low = mountRate({ modelValue: 2, colors: ['#f00', '#fb0', '#0f0'] })
    expect(colorOf(low.find('.ui-rate__icon--active').attributes('style'))).toBe('#f00')
    const middle = mountRate({ modelValue: 3, colors: ['#f00', '#fb0', '#0f0'] })
    expect(colorOf(middle.find('.ui-rate__icon--active').attributes('style'))).toBe('#fb0')
    const high = mountRate({ modelValue: 5, colors: ['#f00', '#fb0', '#0f0'] })
    expect(colorOf(high.find('.ui-rate__icon--active').attributes('style'))).toBe('#0f0')
  })

  it('colors 对象按键值向上匹配，空档回退无颜色', () => {
    const wrapper = mountRate({ modelValue: 4, colors: { 2: '#aaa', 3: '#bbb', 5: '#ccc' } })
    expect(colorOf(wrapper.find('.ui-rate__icon--active').attributes('style'))).toBe('#ccc')
    const near = mountRate({ modelValue: 2, colors: { 2: '#aaa', 3: '#bbb', 5: '#ccc' } })
    expect(colorOf(near.find('.ui-rate__icon--active').attributes('style'))).toBe('#aaa')
    const none = mountRate({ modelValue: 4, colors: ['#f00'] })
    expect(colorOf(none.find('.ui-rate__icon--active').attributes('style'))).toBeUndefined()
  })

  it('voidColor 作用于整颗星，禁用态优先 disabledVoidColor', () => {
    const wrapper = mountRate({ modelValue: 1, voidColor: '#111' })
    expect(colorOf(wrapper.findAll('.ui-rate__item')[4].attributes('style'))).toBe('#111')
    expect(colorOf(wrapper.find('.ui-rate__icon--active').attributes('style'))).toBeUndefined()

    const disabled = mountRate({ modelValue: 1, disabled: true, voidColor: '#111', disabledVoidColor: '#222' })
    expect(colorOf(disabled.findAll('.ui-rate__item')[4].attributes('style'))).toBe('#222')
    const fallback = mountRate({ modelValue: 1, disabled: true, voidColor: '#111' })
    expect(colorOf(fallback.findAll('.ui-rate__item')[4].attributes('style'))).toBe('#111')
  })

  it('id 与 ariaLabel 透传到根节点', () => {
    const wrapper = mountRate({ modelValue: 2, id: 'score', ariaLabel: '评分' })
    expect(wrapper.attributes('id')).toBe('score')
    expect(wrapper.attributes('aria-label')).toBe('评分')
    expect(wrapper.attributes('tabindex')).toBe('0')
  })

  it('禁用态去掉 tabindex、置 aria-disabled，点击与键盘都不提交', async () => {
    const wrapper = mountRate({ modelValue: 2, disabled: true })
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    expect(wrapper.attributes('aria-disabled')).toBe('true')
    await wrapper.findAll('.ui-rate__item')[3].trigger('click')
    await wrapper.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('键盘方向键按 allowHalf 步长增减，Home / End 直达边界', async () => {
    const wrapper = mountRate({ modelValue: 2, allowHalf: true })
    await wrapper.trigger('keydown', { key: 'ArrowRight' })
    await wrapper.trigger('keydown', { key: 'End' })
    await wrapper.trigger('keydown', { key: 'Home' })
    await wrapper.trigger('keydown', { key: 'ArrowDown' })
    await wrapper.trigger('keydown', { key: 'x' })
    expect(wrapper.emitted('update:modelValue')).toEqual([[2.5], [5], [0], [1.5]])
    expect(wrapper.emitted('change')).toEqual([[2.5], [5], [0], [1.5]])

    const whole = mountRate({ modelValue: 2 })
    await whole.trigger('keydown', { key: 'ArrowUp' })
    expect(whole.emitted('update:modelValue')).toEqual([[3]])
  })

  it('showText 按分值映射文案并透传 textColor', () => {
    const texts = ['很差', '较差', '一般', '好', '很好']
    const wrapper = mountRate({ modelValue: 2.5, showText: true, texts, textColor: '#f60' })
    expect(wrapper.find('.ui-rate__text').text()).toBe('一般')
    expect(wrapper.find('.ui-rate__text').attributes('style')).toContain('color: #f60')
    expect(wrapper.attributes('aria-valuetext')).toBe('一般')

    const zero = mountRate({ modelValue: 0, showText: true, texts })
    expect(zero.find('.ui-rate__text').text()).toBe('')
    expect(zero.attributes('aria-valuetext')).toBe('0')

    const missing = mountRate({ modelValue: 2, showText: true })
    expect(missing.find('.ui-rate__text').text()).toBe('')
  })

  it('showScore 用模板替换 {value}，且优先于 showText', () => {
    const wrapper = mountRate({ modelValue: 4, showScore: true, scoreTemplate: '{value} 分' })
    expect(wrapper.find('.ui-rate__text').text()).toBe('4 分')
    expect(wrapper.attributes('aria-valuetext')).toBe('4 分')

    const spaced = mountRate({ modelValue: 4, showScore: true, scoreTemplate: '{ value }' })
    expect(spaced.find('.ui-rate__text').text()).toBe('4')

    const both = mountRate({ modelValue: 4, showScore: true, showText: true, texts: ['一'] })
    expect(both.find('.ui-rate__text').text()).toBe('4')
  })

  it('size 生成尺寸修饰类', () => {
    const wrapper = mountRate({ modelValue: 3, size: 'large' })
    expect(wrapper.classes()).toContain('ui-rate--size-large')
    expect(wrapper.findAll('.ui-rate__item')).toHaveLength(5)
  })

  it('默认插槽不会替换内置星级结构', () => {
    const wrapper = mountRate({ modelValue: 2 }, { default: '<span class="slot-probe">插槽</span>' })
    expect(wrapper.find('.slot-probe').exists()).toBe(false)
    expect(wrapper.findAll('.ui-rate__item')).toHaveLength(5)
  })
})
