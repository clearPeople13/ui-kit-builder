import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { ColorPicker, ColorPickerPanel } from '@ui-kit-full'

const mounted: ReturnType<typeof mount>[] = []

function mountPicker(props: Record<string, unknown> = {}) {
  const wrapper = mount(ColorPicker, { props: { modelValue: '#ff0000', ...props }, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

function mountPanel(props: Record<string, unknown> = {}) {
  const wrapper = mount(ColorPickerPanel, { props: { modelValue: '#3366cc', ...props }, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

function dropdown() {
  return document.querySelector('.ui-color-picker__dropdown') as HTMLElement | null
}

async function flush() {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

async function open(wrapper: ReturnType<typeof mountPicker>) {
  await wrapper.find('.ui-color-picker__trigger').trigger('click')
  await flush()
  expect(dropdown()).not.toBeNull()
}

async function clickNode(node: HTMLElement | null | undefined) {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await flush()
}

function visible(scope: HTMLElement | null = dropdown()) {
  return scope ? scope.style.display !== 'none' : false
}

function triggerText(wrapper: ReturnType<typeof mountPicker>) {
  const node = wrapper.element.querySelector(
    '.ui-color-picker__value, .ui-color-picker__placeholder'
  ) as HTMLElement | null
  return node?.textContent ?? null
}

function swatchStyle(wrapper: ReturnType<typeof mountPicker>) {
  return (wrapper.element.querySelector('.ui-color-picker__swatch-color') as HTMLElement).getAttribute('style') ?? ''
}

function background(el: Element | null | undefined) {
  return el ? ((el as HTMLElement).getAttribute('style')?.match(/background(?:-color)?:\s*([^;]+)/)?.[1] ?? '') : ''
}

// 游标百分比在不同组件里浮点位数不同，统一保留三位再比
function cursorPercent(selector: string, prop: 'left' | 'top', scope: Element | Document = document) {
  const style = (scope.querySelector(selector) as HTMLElement | null)?.getAttribute('style') ?? ''
  const raw = style.match(new RegExp(`${prop}:\\s*([\\d.]+)%`))?.[1]
  return raw ? Number(raw).toFixed(3) : null
}

function actionButtons(scope: HTMLElement | null = dropdown()) {
  return Array.from(scope?.querySelectorAll('.ui-color-picker__action') ?? []) as HTMLElement[]
}

function presetButtons(scope: HTMLElement | null = dropdown()) {
  return Array.from(scope?.querySelectorAll('.ui-color-picker__predefine-item') ?? []) as HTMLElement[]
}

function hexInput(scope: HTMLElement | null = dropdown()) {
  return scope?.querySelector('.ui-color-picker__hex') as HTMLInputElement | undefined
}

function fire(el: Element | undefined, type: string) {
  el?.dispatchEvent(new Event(type, { bubbles: true }))
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()!.unmount()
  }
  document.body.innerHTML = ''
})

describe('ColorPicker 颜色选择', () => {
  it('触发区由色块、色值文本与动作区组成', async () => {
    const wrapper = mountPicker()
    await flush()
    expect(wrapper.classes()).toEqual([
      'ui-color-picker',
      'has-value',
      'ui-color-picker--clearable',
      'ui-color-picker--popper',
      'ui-color-picker--format'
    ])
    const trigger = wrapper.find('.ui-color-picker__trigger')
    expect(trigger.attributes('role')).toBe('combobox')
    expect(trigger.attributes('tabindex')).toBe('0')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(swatchStyle(wrapper)).toContain('background: #ff0000')
    expect(triggerText(wrapper)).toBe('#ff0000')
    expect(
      Array.from(wrapper.find('.ui-color-picker__actions').element.children).map((child) => child.className)
    ).toEqual(['ui-color-picker__clear', 'ui-icon ui-color-picker__arrow'])
  })

  it('色值统一归一化成小写六位十六进制', async () => {
    const named = mountPicker({ modelValue: 'red' })
    await flush()
    expect(triggerText(named)).toBe('#ff0000')
    named.unmount()
    document.body.innerHTML = ''

    const upper = mountPicker({ modelValue: '#ABCDEF' })
    await flush()
    expect(triggerText(upper)).toBe('#abcdef')
    upper.unmount()
    document.body.innerHTML = ''

    const short = mountPicker({ modelValue: '#abc' })
    await flush()
    expect(triggerText(short)).toBe('#aabbcc')
  })

  it('空值显示占位且色块透明', async () => {
    const wrapper = mountPicker({ modelValue: '' })
    await flush()
    expect(wrapper.classes()).not.toContain('has-value')
    expect(wrapper.element.querySelector('.ui-color-picker__value')).toBeNull()
    expect(wrapper.find('.ui-color-picker__placeholder').text()).toBe('选择颜色')
    expect(swatchStyle(wrapper)).toContain('transparent')
  })

  it('无法解析的文本被吞成兜底色，仍算有值', async () => {
    const wrapper = mountPicker({ modelValue: 'not-a-color' })
    await flush()
    expect(wrapper.classes()).toContain('has-value')
    expect(triggerText(wrapper)).toMatch(/^#[0-9a-f]{6}$/)
    expect(triggerText(wrapper)).not.toBe('not-a-color')
  })

  it('showAlpha 让色值补上 alpha 通道', async () => {
    const wrapper = mountPicker({ modelValue: '#3366cc', showAlpha: true })
    await flush()
    expect(triggerText(wrapper)).toBe('#3366ccff')
    expect(swatchStyle(wrapper)).toContain('#3366ccff')
    await open(wrapper)
    expect(hexInput()!.value).toBe('#3366ccff')
    expect(dropdown()!.querySelector('.ui-color-picker__alpha')).not.toBeNull()
  })

  it('colorFormat 改写展示文本', async () => {
    const wrapper = mountPicker({ colorFormat: 'rgb' })
    await flush()
    expect(triggerText(wrapper)).toBe('rgb(255 0 0)')
  })

  it('面板常驻 DOM，收起时用 display 隐藏', async () => {
    const wrapper = mountPicker()
    await flush()
    expect(dropdown()).not.toBeNull()
    expect(visible()).toBe(false)
    await open(wrapper)
    expect(visible()).toBe(true)
    expect(wrapper.find('.ui-color-picker__trigger').attributes('aria-expanded')).toBe('true')
    await clickNode(actionButtons()[1])
    expect(visible()).toBe(false)
    expect(wrapper.find('.ui-color-picker__trigger').attributes('aria-expanded')).toBe('false')
  })

  it('面板由 SV 区、色相滑条、hex 输入与底部动作组成', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    expect(Array.from(dropdown()!.children).map((child) => child.className)).toEqual([
      'ui-color-picker__sv',
      'ui-color-picker__slider ui-color-picker__hue',
      'ui-color-picker__fields',
      'ui-color-picker__footer'
    ])
    expect(actionButtons().map((button) => button.textContent)).toEqual(['清空', '确定'])
    expect(actionButtons()[1].className).toContain('is-primary')
    expect(dropdown()!.querySelector('.ui-color-picker__predefine')).toBeNull()
    expect(dropdown()!.querySelector('.ui-color-picker__alpha')).toBeNull()
  })

  it('纯红时 SV 游标落在右上、色相游标落在左端', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    expect(cursorPercent('.ui-color-picker__sv-cursor', 'left')).toBe('100.000')
    expect(cursorPercent('.ui-color-picker__sv-cursor', 'top')).toBe('0.000')
    expect(cursorPercent('.ui-color-picker__slider-cursor', 'left')).toBe('0.000')
    expect(background(document.querySelector('.ui-color-picker__sv'))).toContain('linear-gradient')
  })

  it('hex 输入只在 change 时提交', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    const hex = hexInput()!
    expect(hex.type).toBe('text')
    expect(hex.value).toBe('#ff0000')
    hex.value = '#00ff00'
    fire(hex, 'input')
    await flush()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    fire(hex, 'change')
    await flush()
    expect(wrapper.emitted('update:modelValue')).toEqual([['#00ff00']])
    expect(wrapper.emitted('change')).toEqual([['#00ff00']])
    expect(triggerText(wrapper)).toBe('#00ff00')
  })

  it('hex 支持三位缩写，非法文本不提交也不回滚', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    const hex = hexInput()!
    hex.value = '#ABC'
    fire(hex, 'change')
    await flush()
    expect(wrapper.emitted('update:modelValue')).toEqual([['#aabbcc']])
    hex.value = '乱码'
    fire(hex, 'change')
    await flush()
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(hexInput()!.value).toBe('乱码')
  })

  it('预置色按钮保留原始文案，点击写回归一化色值', async () => {
    const wrapper = mountPicker({ predefine: ['#333', 'rgb(0, 128, 0)', 'red'] })
    await open(wrapper)
    const presets = presetButtons()
    expect(presets.map((button) => button.getAttribute('title'))).toEqual(['#333', 'rgb(0, 128, 0)', 'red'])
    expect(presets.map((button) => background(button))).toEqual(['#333333', '#008000', '#ff0000'])
    await clickNode(presets[1])
    expect(wrapper.emitted('update:modelValue')).toEqual([['#008000']])
    expect(wrapper.emitted('change')).toEqual([['#008000']])
    expect(visible()).toBe(true)
    expect(triggerText(wrapper)).toBe('#008000')
    expect(hexInput()!.value).toBe('#008000')
  })

  it('确定按钮提交当前色并收起', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    const hex = hexInput()!
    hex.value = '#0000ff'
    fire(hex, 'change')
    await flush()
    expect(wrapper.emitted('update:modelValue')).toEqual([['#0000ff']])
    await clickNode(actionButtons()[1])
    expect(wrapper.emitted('update:modelValue')).toHaveLength(2)
    expect(wrapper.emitted('update:modelValue')![1]).toEqual(['#0000ff'])
    expect(visible()).toBe(false)
  })

  it('触发区与面板底部两种清空都抛空值', async () => {
    const wrapper = mountPicker()
    await wrapper.find('.ui-color-picker__clear').trigger('click')
    await flush()
    expect(wrapper.emitted('clear')).toEqual([[]])
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    wrapper.unmount()
    document.body.innerHTML = ''

    const inPanel = mountPicker()
    await open(inPanel)
    await clickNode(actionButtons()[0])
    expect(inPanel.emitted('clear')).toEqual([[]])
    expect(inPanel.emitted('update:modelValue')).toEqual([['']])
    expect(visible()).toBe(false)
  })

  it('清空后受控值未回写时显示兜底色', async () => {
    const wrapper = mountPicker()
    await wrapper.find('.ui-color-picker__clear').trigger('click')
    await flush()
    expect(triggerText(wrapper)).toBe('#409eff')
    expect(wrapper.classes()).toContain('has-value')
    await wrapper.setProps({ modelValue: '' })
    expect(wrapper.classes()).not.toContain('has-value')
    expect(triggerText(wrapper)).toBe('选择颜色')
  })

  it('valueOnClear 改写清空写回的值', async () => {
    const wrapper = mountPicker({ valueOnClear: '#000000' })
    await wrapper.find('.ui-color-picker__clear').trigger('click')
    await flush()
    expect(wrapper.emitted('update:modelValue')).toEqual([['#000000']])
    expect(wrapper.emitted('change')).toEqual([['#000000']])
  })

  it('禁用态没有清空图标且无法展开', async () => {
    const wrapper = mountPicker({ disabled: true })
    await flush()
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.find('.ui-color-picker__clear').exists()).toBe(false)
    await wrapper.find('.ui-color-picker__trigger').trigger('click')
    await flush()
    expect(visible()).toBe(false)
    expect(wrapper.find('.ui-color-picker__trigger').attributes('aria-expanded')).toBe('false')
  })

  it('点击外部收起面板', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    document.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await flush()
    expect(visible()).toBe(false)
    expect(wrapper.emitted('visible-change')).toEqual([[true], [false]])
  })

  it('SV 区与滑条在零尺寸容器下不产生提交', async () => {
    const wrapper = mountPicker({ modelValue: '#3366cc' })
    await open(wrapper)
    const sv = document.querySelector('.ui-color-picker__sv') as HTMLElement
    sv.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }))
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 10, clientY: 10 }))
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    await flush()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    const hue = document.querySelector('.ui-color-picker__slider') as HTMLElement
    hue.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 30, clientY: 4 }))
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    await flush()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('teleported 为 false 时面板留在组件内', async () => {
    const wrapper = mountPicker({ teleported: false })
    await open(wrapper)
    expect(wrapper.element.contains(dropdown())).toBe(true)
    expect(dropdown()!.parentElement).not.toBe(document.body)
  })

  it('size 与 tabindex、ariaLabel 落到触发区', async () => {
    const wrapper = mountPicker({ size: 'large', tabindex: 4, ariaLabel: '主题色' })
    await flush()
    expect(wrapper.classes()).toContain('is-size-large')
    const trigger = wrapper.find('.ui-color-picker__trigger')
    expect(trigger.attributes('tabindex')).toBe('4')
    expect(trigger.attributes('aria-label')).toBe('主题色')
  })

  it('clearable 为 false 时没有清空图标，特性类同步摘掉', async () => {
    const wrapper = mountPicker({ clearable: false })
    await flush()
    expect(wrapper.find('.ui-color-picker__clear').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('ui-color-picker--clearable')
    expect(wrapper.classes()).toEqual([
      'ui-color-picker',
      'has-value',
      'ui-color-picker--popper',
      'ui-color-picker--format'
    ])
  })
})

describe('ColorPickerPanel 颜色面板', () => {
  it('独立面板渲染 SV 区、色相滑条与预览', async () => {
    const wrapper = mountPanel()
    await flush()
    expect(wrapper.classes()).toEqual(['ui-color-picker-panel', 'ui-color-picker-panel--appearance'])
    expect(wrapper.element.querySelector('.ui-color-picker-panel__body')?.children).toHaveLength(2)
    expect(background(wrapper.element.querySelector('.ui-color-picker-panel__saturation'))).toContain(
      'linear-gradient(to right, #fff, hsl(220, 100%, 50%))'
    )
    expect(cursorPercent('.ui-color-picker-panel__cursor', 'left', wrapper.element)).toBe('75.000')
    expect(cursorPercent('.ui-color-picker-panel__cursor', 'top', wrapper.element)).toBe('20.000')
    expect(cursorPercent('.ui-color-picker-panel__bar-cursor', 'left', wrapper.element)).toBe('61.111')
    expect(background(wrapper.element.querySelector('.ui-color-picker-panel__preview'))).toBe('rgb(51, 102, 204)')
    expect(wrapper.find('.ui-color-picker-panel__value').text()).toBe('#3366cc')
    expect(wrapper.find('.ui-color-picker-panel__alpha').exists()).toBe(false)
  })

  it('showAlpha 增加明度滑条并把预览与文本写成八位', async () => {
    const wrapper = mountPanel({ showAlpha: true })
    await flush()
    expect(wrapper.find('.ui-color-picker-panel__alpha').exists()).toBe(true)
    expect(background(wrapper.element.querySelector('.ui-color-picker-panel__preview'))).toBe(
      'rgba(51, 102, 204, 1.00)'
    )
    expect(wrapper.find('.ui-color-picker-panel__value').text()).toBe('#3366ccff')
  })

  it('predefine 用预置色按钮位承载', async () => {
    const wrapper = mountPanel({ predefine: ['#fff', 'red'] })
    await flush()
    const presets = wrapper.findAll('.ui-color-picker-panel__preset')
    expect(presets).toHaveLength(2)
    expect(wrapper.find('.ui-color-picker-panel__predefine').exists()).toBe(true)
  })

  it('border 参数不改变类名', async () => {
    const without = mountPanel()
    await flush()
    expect(without.classes()).toContain('ui-color-picker-panel--appearance')
    without.unmount()
    document.body.innerHTML = ''

    const withBorder = mountPanel({ border: true })
    await flush()
    expect(withBorder.classes()).toEqual(without.classes())
  })

  it('空值面板回吐近似兜底色，滑条停在 210 度色相', async () => {
    const wrapper = mountPanel({ modelValue: '' })
    await flush()
    expect(wrapper.find('.ui-color-picker-panel__saturation').exists()).toBe(true)
    // 空值不显示占位，而是把内部兜底色反解析成文本（注意并非声明的 #409eff）
    expect(wrapper.find('.ui-color-picker-panel__value').text()).toBe('#40a0ff')
    // 210 度色相 = 210/360，兜底色并不是零位
    expect(cursorPercent('.ui-color-picker-panel__bar-cursor', 'left', wrapper.element)).toBe('58.333')
  })
})
