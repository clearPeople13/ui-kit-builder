import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { ColorPicker, ColorPickerPanel, ConfigProvider } from '@ui-kit-full'
import type { ConfigProviderProps } from '@ui-kit-full'

// config-provider 的 locale 元数据未收录新命名空间，用例只验证注入行为
function localeOf(payload: Record<string, unknown>): NonNullable<ConfigProviderProps['locale']> {
  return payload as unknown as NonNullable<ConfigProviderProps['locale']>
}

const mounted: ReturnType<typeof mount>[] = []

function mountPicker(props: Record<string, any> = {}) {
  const wrapper = mount(ColorPicker, { props: { modelValue: '#ff0000', ...props }, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

function mountPanel(props: Record<string, any> = {}) {
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

function press(target: Element | null | undefined, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target?.dispatchEvent(event)
  return event
}

function slider(selector: string) {
  return document.querySelector(selector) as HTMLElement
}

// happy-dom 没有布局引擎，拖拽反算需要非零矩形才能算出比例；替身只喂几何，断言仍是色值与 ARIA
function stubRect(el: Element, rect: Partial<DOMRect> = {}) {
  Object.defineProperty(el, 'getBoundingClientRect', {
    configurable: true,
    value: () =>
      ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
        ...rect
      }) as DOMRect
  })
}

function triggerNode(wrapper: ReturnType<typeof mountPicker>) {
  return wrapper.element.querySelector('.ui-color-picker__trigger') as HTMLElement
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

  it('无法解析的色值视作空值，显示占位而不是兜底色', async () => {
    // F-19 回归：解析失败不再回退成 #409eff 并按有值渲染
    const wrapper = mountPicker({ modelValue: 'not-a-color' })
    await flush()
    expect(wrapper.classes()).not.toContain('has-value')
    expect(wrapper.element.querySelector('.ui-color-picker__value')).toBeNull()
    expect(wrapper.find('.ui-color-picker__placeholder').text()).toBe('选择颜色')
    expect(swatchStyle(wrapper)).toContain('transparent')
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

  it('清空后未回写 modelValue 时继续显示原值', async () => {
    // F-18 回归：clear 只写回事件载荷，展示值仍跟随 props，不再落到内部兜底色
    const wrapper = mountPicker()
    await wrapper.find('.ui-color-picker__clear').trigger('click')
    await flush()
    expect(wrapper.emitted('clear')).toEqual([[]])
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(triggerText(wrapper)).toBe('#ff0000')
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
    expect(wrapper.classes()).toContain('--size-large')
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

  it('触发器 Enter 打开面板并把焦点交给饱和度滑杆', async () => {
    const wrapper = mountPicker()
    await flush()
    const trigger = triggerNode(wrapper)
    trigger.focus()
    const event = press(trigger, 'Enter')
    await flush()
    expect(event.defaultPrevented).toBe(true)
    expect(visible()).toBe(true)
    expect(wrapper.emitted('visible-change')).toEqual([[true]])
    expect(document.activeElement).toBe(slider('.ui-color-picker__sv'))
  })

  it('触发器 Space 打开，再次按 Enter 收起', async () => {
    const wrapper = mountPicker()
    await flush()
    const trigger = triggerNode(wrapper)
    trigger.focus()
    press(trigger, ' ')
    await flush()
    expect(visible()).toBe(true)
    expect(document.activeElement).toBe(slider('.ui-color-picker__sv'))
    press(trigger, 'Enter')
    await flush()
    expect(visible()).toBe(false)
    expect(wrapper.find('.ui-color-picker__trigger').attributes('aria-expanded')).toBe('false')
  })

  it('触发器上的 Escape 收起面板，关闭态下不产生副作用', async () => {
    const wrapper = mountPicker()
    await flush()
    const trigger = triggerNode(wrapper)
    press(trigger, 'Escape')
    await flush()
    expect(visible()).toBe(false)
    expect(wrapper.emitted('visible-change')).toBeUndefined()
    await open(wrapper)
    press(trigger, 'Escape')
    await flush()
    expect(visible()).toBe(false)
    expect(wrapper.emitted('visible-change')).toEqual([[true], [false]])
  })

  it('三个滑杆带齐 slider 语义与当前值', async () => {
    const wrapper = mountPicker({ modelValue: '#3366cc', showAlpha: true })
    await open(wrapper)
    const sv = slider('.ui-color-picker__sv')
    const hue = slider('.ui-color-picker__hue')
    const alpha = slider('.ui-color-picker__alpha')
    for (const node of [sv, hue, alpha]) {
      expect(node.getAttribute('role')).toBe('slider')
      expect(node.getAttribute('aria-valuemin')).toBe('0')
      expect(node.getAttribute('tabindex')).toBe('0')
    }
    expect(sv.getAttribute('aria-valuemax')).toBe('100')
    expect(sv.getAttribute('aria-valuenow')).toBe('75')
    expect(sv.getAttribute('aria-valuetext')).toBe('饱和度 75%，明度 80%')
    expect(hue.getAttribute('aria-valuemax')).toBe('360')
    expect(hue.getAttribute('aria-valuenow')).toBe('220')
    expect(hue.getAttribute('aria-valuetext')).toBe('220°')
    expect(alpha.getAttribute('aria-valuemax')).toBe('100')
    expect(alpha.getAttribute('aria-valuenow')).toBe('100')
    expect(alpha.getAttribute('aria-valuetext')).toBe('100%')
  })

  it('饱和度滑杆方向键按 1% 步进并提交色值', async () => {
    const wrapper = mountPicker({ modelValue: '#3366cc' })
    await open(wrapper)
    const sv = slider('.ui-color-picker__sv')
    const right = press(sv, 'ArrowRight')
    await flush()
    expect(right.defaultPrevented).toBe(true)
    expect(sv.getAttribute('aria-valuenow')).toBe('76')
    expect(sv.getAttribute('aria-valuetext')).toBe('饱和度 76%，明度 80%')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    await flush()
    press(sv, 'ArrowLeft')
    await flush()
    expect(sv.getAttribute('aria-valuenow')).toBe('75')
    press(sv, 'ArrowDown')
    await flush()
    expect(sv.getAttribute('aria-valuetext')).toBe('饱和度 75%，明度 79%')
    press(sv, 'ArrowUp')
    await flush()
    expect(sv.getAttribute('aria-valuetext')).toBe('饱和度 75%，明度 80%')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(4)
  })

  it('饱和度与明度步进夹在 0–100 边界', async () => {
    const wrapper = mountPicker({ modelValue: '#ffffff' })
    await open(wrapper)
    const sv = slider('.ui-color-picker__sv')
    press(sv, 'ArrowLeft')
    await flush()
    expect(sv.getAttribute('aria-valuenow')).toBe('0')
    press(sv, 'ArrowUp')
    await flush()
    expect(sv.getAttribute('aria-valuetext')).toBe('饱和度 0%，明度 100%')
  })

  it('色相滑杆方向键按 1° 步进并夹在 0–360', async () => {
    const wrapper = mountPicker({ modelValue: '#ff0000' })
    await open(wrapper)
    const hue = slider('.ui-color-picker__hue')
    press(hue, 'ArrowRight')
    await flush()
    expect(hue.getAttribute('aria-valuenow')).toBe('1')
    expect(hue.getAttribute('aria-valuetext')).toBe('1°')
    press(hue, 'ArrowLeft')
    await flush()
    press(hue, 'ArrowLeft')
    await flush()
    expect(hue.getAttribute('aria-valuenow')).toBe('0')
    press(hue, 'ArrowUp')
    await flush()
    expect(hue.getAttribute('aria-valuenow')).toBe('1')

    wrapper.unmount()
    mounted.pop()
    document.body.innerHTML = ''
    const top = mountPicker({ modelValue: 'hsl(359, 100%, 50%)' })
    await open(top)
    const topHue = slider('.ui-color-picker__hue')
    press(topHue, 'ArrowRight')
    await flush()
    expect(topHue.getAttribute('aria-valuenow')).toBe('360')
    expect(topHue.getAttribute('aria-valuetext')).toBe('360°')
  })

  it('透明度滑杆方向键按 1% 步进并夹在 0–100', async () => {
    const wrapper = mountPicker({ modelValue: 'rgba(51, 102, 204, 0.5)', showAlpha: true })
    await open(wrapper)
    const alpha = slider('.ui-color-picker__alpha')
    expect(alpha.getAttribute('aria-valuenow')).toBe('50')
    press(alpha, 'ArrowRight')
    await flush()
    expect(alpha.getAttribute('aria-valuenow')).toBe('51')
    press(alpha, 'ArrowLeft')
    await flush()
    expect(alpha.getAttribute('aria-valuenow')).toBe('50')

    wrapper.unmount()
    mounted.pop()
    document.body.innerHTML = ''
    const clear = mountPicker({ modelValue: 'rgba(51, 102, 204, 0)', showAlpha: true })
    await open(clear)
    const clearAlpha = slider('.ui-color-picker__alpha')
    expect(clearAlpha.getAttribute('aria-valuenow')).toBe('0')
    press(clearAlpha, 'ArrowLeft')
    await flush()
    expect(clearAlpha.getAttribute('aria-valuenow')).toBe('0')
    press(clearAlpha, 'ArrowUp')
    await flush()
    expect(clearAlpha.getAttribute('aria-valuenow')).toBe('1')
  })

  it('滑杆忽略非方向键', async () => {
    const wrapper = mountPicker({ modelValue: '#3366cc' })
    await open(wrapper)
    const sv = slider('.ui-color-picker__sv')
    const event = press(sv, 'a')
    await flush()
    expect(event.defaultPrevented).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('面板内 Escape 收起并归还焦点给触发区', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    const sv = slider('.ui-color-picker__sv')
    sv.focus()
    const event = press(sv, 'Escape')
    await flush()
    expect(event.defaultPrevented).toBe(true)
    expect(visible()).toBe(false)
    expect(document.activeElement).toBe(triggerNode(wrapper))
  })

  it('SV 区拖拽按像素比例改写饱和度与明度', async () => {
    const wrapper = mountPicker({ modelValue: '#3366cc' })
    await open(wrapper)
    const sv = slider('.ui-color-picker__sv')
    stubRect(sv)
    sv.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 25, clientY: 25 }))
    await flush()
    expect(sv.getAttribute('aria-valuenow')).toBe('25')
    expect(sv.getAttribute('aria-valuetext')).toBe('饱和度 25%，明度 75%')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 75, clientY: 0 }))
    await flush()
    expect(sv.getAttribute('aria-valuenow')).toBe('75')
    expect(sv.getAttribute('aria-valuetext')).toBe('饱和度 75%，明度 100%')
    window.dispatchEvent(new MouseEvent('pointerup'))
    await flush()
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 10, clientY: 10 }))
    await flush()
    expect(wrapper.emitted('update:modelValue')).toHaveLength(2)
  })

  it('色相滑条拖拽写入角度，透明度滑条拖拽写入 alpha', async () => {
    const wrapper = mountPicker({ modelValue: '#ff0000', showAlpha: true })
    await open(wrapper)
    const hue = slider('.ui-color-picker__hue')
    stubRect(hue)
    hue.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 50 }))
    await flush()
    expect(hue.getAttribute('aria-valuenow')).toBe('180')
    expect(cursorPercent('.ui-color-picker__slider-cursor', 'left')).toBe('50.000')
    const alpha = slider('.ui-color-picker__alpha')
    stubRect(alpha)
    alpha.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 30 }))
    await flush()
    expect(alpha.getAttribute('aria-valuenow')).toBe('30')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(2)
  })

  it('按下触发区或面板内部不关闭面板', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    triggerNode(wrapper).dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await flush()
    expect(visible()).toBe(true)
    slider('.ui-color-picker__fields').dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await flush()
    expect(visible()).toBe(true)
  })

  it('hex 输入框 Enter 立即提交色值', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    const hex = hexInput()!
    hex.value = '#00ff00'
    press(hex, 'Enter')
    await flush()
    expect(wrapper.emitted('update:modelValue')).toEqual([['#00ff00']])
    expect(triggerText(wrapper)).toBe('#00ff00')
  })

  it('colorFormat 支持 hsl 输出', async () => {
    const wrapper = mountPicker({ colorFormat: 'hsl' })
    await flush()
    expect(triggerText(wrapper)).toBe('hsl(0deg 100% 50%)')
  })

  it('禁用态滑杆退出 Tab 序，拖拽与方向键都不生效', async () => {
    const wrapper = mountPicker({ modelValue: '#3366cc', disabled: true, showAlpha: true })
    await flush()
    const sv = slider('.ui-color-picker__sv')
    expect(sv.getAttribute('tabindex')).toBeNull()
    expect(sv.getAttribute('aria-disabled')).toBe('true')
    stubRect(sv)
    sv.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 50, clientY: 50 }))
    await flush()
    press(sv, 'ArrowRight')
    await flush()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(sv.getAttribute('aria-valuenow')).toBe('75')
  })

  it('persistent=false 时面板随收起卸载', async () => {
    const wrapper = mountPicker({ persistent: false })
    await flush()
    expect(dropdown()).toBeNull()
    await open(wrapper)
    expect(dropdown()).not.toBeNull()
    await clickNode(actionButtons()[1])
    expect(dropdown()).toBeNull()
  })

  it('触发区上的无关按键不切换面板', async () => {
    const wrapper = mountPicker()
    await flush()
    const event = press(triggerNode(wrapper), 'a')
    await flush()
    expect(event.defaultPrevented).toBe(false)
    expect(visible()).toBe(false)
  })

  it('关闭态的外部按下不触发收起流程', async () => {
    const wrapper = mountPicker()
    await flush()
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await flush()
    expect(wrapper.emitted('visible-change')).toBeUndefined()
    expect(visible()).toBe(false)
  })

  it('文案与滑杆 aria 文案来自 ConfigProvider 注入的 locale，未注入键回退中文', async () => {
    const provider = mount(ConfigProvider, {
      props: {
        locale: localeOf({ colorPicker: { confirm: 'Apply', svValueFormat: 'Sat {saturation}% / Val {value}%' } })
      },
      slots: { default: () => h(ColorPicker, { modelValue: '', showAlpha: true }) },
      attachTo: document.body
    })
    mounted.push(provider)
    await flush()
    // 无值时占位与清空、色相、不透明度等未注入键回退中文
    expect(triggerText(provider)).toBe('选择颜色')

    await open(provider)
    expect(actionButtons().map((button) => button.textContent)).toEqual(['清空', 'Apply'])
    const sv = dropdown()!.querySelector('.ui-color-picker__sv')!
    expect(sv.getAttribute('aria-label')).toBe('饱和度与明度')
    expect(sv.getAttribute('aria-valuetext')).toBe('Sat 75% / Val 100%')
    expect(dropdown()!.querySelector('.ui-color-picker__hue')!.getAttribute('aria-label')).toBe('色相')
    expect(dropdown()!.querySelector('.ui-color-picker__alpha')!.getAttribute('aria-label')).toBe('不透明度')

    // 切换注入的 locale 立即反映到已展开的面板与触发区
    await provider.setProps({
      locale: localeOf({
        colorPicker: {
          placeholder: 'Pick color',
          clear: 'Clear',
          confirm: 'OK',
          saturationBrightness: 'S/B',
          hue: 'Hue',
          opacity: 'Alpha',
          svValueFormat: '{saturation}-{value}'
        }
      })
    })
    await flush()
    expect(triggerText(provider)).toBe('Pick color')
    expect(actionButtons().map((button) => button.textContent)).toEqual(['Clear', 'OK'])
    expect(dropdown()!.querySelector('.ui-color-picker__sv')!.getAttribute('aria-valuetext')).toBe('75-100')
    expect(dropdown()!.querySelector('.ui-color-picker__alpha')!.getAttribute('aria-label')).toBe('Alpha')
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

  it('空值面板不回吐兜底色，文本位保持为空', async () => {
    // F-20 回归：modelValue 为空时 __value 是空串，而不是 #40a0ff
    const wrapper = mountPanel({ modelValue: '' })
    await flush()
    expect(wrapper.find('.ui-color-picker-panel__saturation').exists()).toBe(true)
    expect(wrapper.find('.ui-color-picker-panel__value').text()).toBe('')
    // 色相条仍停在缺省色的 210 度（210/360）
    expect(cursorPercent('.ui-color-picker-panel__bar-cursor', 'left', wrapper.element)).toBe('58.333')
  })
})
