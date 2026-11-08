import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import { ColorPickerPanel, ConfigProvider } from '@ui-kit-full'

/**
 * ColorPickerPanel 颜色面板：happy-dom 里色板 rect 恒为 0×0，
 * 拖拽换算与真实取色测不到，只用静态结构、内联百分比 / 背景、
 * 预置色点击与禁用态守卫；指针路径只验证「未按下不提交」。
 */
const wrappers: any[] = []

function mountPanel(props: Record<string, unknown> = {}, slots?: Record<string, string>) {
  const wrapper = mount(ColorPickerPanel, { props: { modelValue: '#3366cc', ...props }, slots })
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

afterEach(() => {
  wrappers.forEach((wrapper) => wrapper.unmount())
  wrappers.length = 0
})

describe('ColorPickerPanel 颜色面板', () => {
  it('默认渲染色板、色相条与底部预览，无 alpha 与预置色', () => {
    const wrapper = mountPanel()
    expect(wrapper.classes()).toEqual(['ui-color-picker-panel', 'ui-color-picker-panel--appearance'])
    expect(wrapper.find('.ui-color-picker-panel__body').exists()).toBe(true)
    expect(wrapper.find('.ui-color-picker-panel__saturation').exists()).toBe(true)
    expect(wrapper.find('.ui-color-picker-panel__cursor').exists()).toBe(true)
    expect(wrapper.findAll('.ui-color-picker-panel__sliders > *')).toHaveLength(1)
    expect(wrapper.find('.ui-color-picker-panel__hue').exists()).toBe(true)
    expect(wrapper.find('.ui-color-picker-panel__alpha').exists()).toBe(false)
    expect(wrapper.find('.ui-color-picker-panel__predefine').exists()).toBe(false)
    expect(wrapper.findAll('.ui-color-picker-panel__footer > *')).toHaveLength(2)
  })

  it('受控色值换算光标位置、色相条进度与预览色', () => {
    const wrapper = mountPanel({ modelValue: '#3366cc' })
    const cursor = wrapper.find('.ui-color-picker-panel__cursor').attributes('style')
    expect(percent(cursor, 'left')).toBeCloseTo(75, 3)
    expect(percent(cursor, 'top')).toBeCloseTo(20, 3)
    expect(percent(wrapper.find('.ui-color-picker-panel__bar-cursor').attributes('style'), 'left')).toBeCloseTo(
      61.111,
      3
    )
    expect(wrapper.find('.ui-color-picker-panel__saturation').attributes('style')).toContain('hsl(220, 100%, 50%)')
    expect(wrapper.find('.ui-color-picker-panel__preview').attributes('style')).toContain(
      'background: rgb(51, 102, 204)'
    )
    expect(wrapper.find('.ui-color-picker-panel__value').text()).toBe('#3366cc')
  })

  it('空值不回吐兜底色，色相条停在缺省 210 度', () => {
    const wrapper = mountPanel({ modelValue: '' })
    expect(wrapper.find('.ui-color-picker-panel__value').text()).toBe('')
    expect(percent(wrapper.find('.ui-color-picker-panel__bar-cursor').attributes('style'), 'left')).toBeCloseTo(
      58.333,
      3
    )
    expect(wrapper.find('.ui-color-picker-panel__preview').attributes('style')).toContain(
      'background: rgb(64, 160, 255)'
    )
  })

  it('三位十六进制展开成六位', () => {
    const wrapper = mountPanel({ modelValue: '#abc' })
    expect(wrapper.find('.ui-color-picker-panel__value').text()).toBe('#aabbcc')
    expect(wrapper.find('.ui-color-picker-panel__preview').attributes('style')).toContain(
      'background: rgb(170, 187, 204)'
    )
  })

  it('showAlpha 追加 alpha 条与八位 hex', () => {
    const wrapper = mountPanel({ modelValue: '#3366cc', showAlpha: true })
    expect(wrapper.findAll('.ui-color-picker-panel__sliders > *')).toHaveLength(2)
    expect(wrapper.find('.ui-color-picker-panel__alpha').exists()).toBe(true)
    expect(wrapper.find('.ui-color-picker-panel__alpha-fill').attributes('style')).toContain(
      'linear-gradient(to right, rgba(51, 102, 204, 0), rgb(51, 102, 204))'
    )
    const cursors = wrapper.findAll('.ui-color-picker-panel__bar-cursor')
    expect(percent(cursors[1].attributes('style'), 'left')).toBeCloseTo(100, 3)
    expect(wrapper.find('.ui-color-picker-panel__preview').attributes('style')).toContain(
      'background: rgba(51, 102, 204, 1.00)'
    )
    expect(wrapper.find('.ui-color-picker-panel__value').text()).toBe('#3366ccff')
  })

  it('rgba 输入按 alpha 百分比定位并输出半透明值', () => {
    const wrapper = mountPanel({ modelValue: 'rgba(51, 102, 204, 0.5)', showAlpha: true })
    const cursors = wrapper.findAll('.ui-color-picker-panel__bar-cursor')
    expect(percent(cursors[1].attributes('style'), 'left')).toBeCloseTo(50.196, 3)
    expect(wrapper.find('.ui-color-picker-panel__value').text()).toBe('#3366cc80')
    expect(wrapper.find('.ui-color-picker-panel__preview').attributes('style')).toContain(
      'background: rgba(51, 102, 204, 0.50)'
    )
  })

  it('colorFormat 支持 rgb / hsl 及其带 alpha 形式', () => {
    const rgb = mountPanel({ modelValue: '#3366cc', colorFormat: 'rgb' })
    expect(rgb.find('.ui-color-picker-panel__value').text()).toBe('rgb(51, 102, 204)')
    const rgba = mountPanel({ modelValue: 'rgba(51, 102, 204, 0.5)', colorFormat: 'rgb', showAlpha: true })
    expect(rgba.find('.ui-color-picker-panel__value').text()).toBe('rgba(51, 102, 204, 0.50)')
    const hsl = mountPanel({ modelValue: '#3366cc', colorFormat: 'hsl' })
    expect(hsl.find('.ui-color-picker-panel__value').text()).toBe('hsl(220, 60%, 50%)')
    const hsla = mountPanel({ modelValue: 'rgba(51, 102, 204, 0.5)', colorFormat: 'hsl', showAlpha: true })
    expect(hsla.find('.ui-color-picker-panel__value').text()).toBe('hsla(220, 60%, 50%, 0.50)')
  })

  it('未知 colorFormat 回落十六进制', () => {
    const wrapper = mountPanel({ modelValue: '#3366cc', colorFormat: 'cmyk' })
    expect(wrapper.find('.ui-color-picker-panel__value').text()).toBe('#3366cc')
  })

  it('border 开关控制外观修饰类', () => {
    const bordered = mountPanel()
    expect(bordered.classes()).toContain('ui-color-picker-panel--appearance')
    const plain = mountPanel({ border: false })
    expect(plain.classes()).not.toContain('ui-color-picker-panel--appearance')
  })

  it('hueSliderClass 与 hueSliderStyle 合并到色相条', () => {
    const wrapper = mountPanel({
      hueSliderClass: ['hue-a', 'hue-b'],
      hueSliderStyle: { opacity: '0.5' }
    })
    const hue = wrapper.find('.ui-color-picker-panel__hue')
    expect(hue.classes()).toEqual(['ui-color-picker-panel__hue', 'hue-a', 'hue-b'])
    expect(hue.attributes('style')).toContain('background: linear-gradient')
    expect(hue.attributes('style')).toContain('opacity: 0.5')
  })

  it('predefine 渲染预设按钮，点击提交对应十六进制', async () => {
    const wrapper = mountPanel({ predefine: ['#fff', 'rgb(0, 128, 0)'] })
    const presets = wrapper.findAll('.ui-color-picker-panel__preset')
    expect(presets).toHaveLength(2)
    expect(presets[0].attributes('aria-label')).toBe('预设颜色 #fff')
    expect(presets[0].attributes('type')).toBe('button')
    expect(presets[1].attributes('style')).toContain('background: rgb(0, 128, 0)')
    await presets[1].trigger('click')
    expect(customEmits(wrapper, 'update:modelValue').at(-1)).toEqual(['#008000'])
    expect(customEmits(wrapper, 'change').at(-1)).toEqual(['#008000'])
  })

  it('预置色里的颜色名归一化为十六进制', async () => {
    const wrapper = mountPanel({ predefine: ['red'] })
    await wrapper.find('.ui-color-picker-panel__preset').trigger('click')
    expect(customEmits(wrapper, 'update:modelValue').at(-1)).toEqual(['#ff0000'])
  })

  it('禁用态加类名、预设按钮 disabled 且点击与指针都不提交', async () => {
    const wrapper = mountPanel({ disabled: true, predefine: ['#fff'] })
    expect(wrapper.classes()).toContain('is-disabled')
    const preset = wrapper.find('.ui-color-picker-panel__preset')
    expect(preset.attributes('disabled')).toBeDefined()
    await preset.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper
      .find('.ui-color-picker-panel__saturation')
      .element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10, buttons: 1 }))
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('指针移动但未按下时不取色', async () => {
    const wrapper = mountPanel()
    wrapper
      .find('.ui-color-picker-panel__saturation')
      .element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, buttons: 0 }))
    wrapper
      .find('.ui-color-picker-panel__hue')
      .element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, buttons: 0 }))
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('默认插槽不会替换内置面板结构', () => {
    const wrapper = mountPanel({}, { default: '<span class="slot-probe">插槽</span>' })
    expect(wrapper.find('.slot-probe').exists()).toBe(false)
    expect(wrapper.find('.ui-color-picker-panel__body').exists()).toBe(true)
  })

  it('预置色 aria 文案来自 ConfigProvider 注入的 locale，缺键回退中文', () => {
    const injected = mount(ConfigProvider, {
      props: { locale: { colorPicker: { presetFormat: 'Preset {color}' } } },
      slots: { default: () => h(ColorPickerPanel, { modelValue: '#3366cc', predefine: ['#ff0000'] }) }
    })
    wrappers.push(injected)
    expect(injected.find('.ui-color-picker-panel__preset').attributes('aria-label')).toBe('Preset #ff0000')

    const fallback = mount(ConfigProvider, {
      props: { locale: { colorPicker: { clear: 'Clear' } } },
      slots: { default: () => h(ColorPickerPanel, { modelValue: '#3366cc', predefine: ['#00ff00'] }) }
    })
    wrappers.push(fallback)
    expect(fallback.find('.ui-color-picker-panel__preset').attributes('aria-label')).toBe('预设颜色 #00ff00')
  })
})
