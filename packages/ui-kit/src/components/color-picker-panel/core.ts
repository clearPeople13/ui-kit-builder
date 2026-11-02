import { h } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { colorPickerPanelAppearanceFeature } from './features/appearance/index'
import './core.css'

type Rgba = { r: number; g: number; b: number; a: number }
type Hsv = { h: number; s: number; v: number }

function clampRange(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeHex(input: string): string {
  const hex = input.replace(/^#/, '')
  if (hex.length === 3 || hex.length === 4) {
    const expanded = hex
      .split('')
      .map((char) => char + char)
      .join('')
    return normalizeHex(`#${expanded}`)
  }
  return `#${hex.padEnd(6, '0').slice(0, 8)}`
}

function parseColor(input: unknown): Rgba {
  if (typeof input !== 'string' || !input.trim()) {
    return { r: 64, g: 158, b: 255, a: 255 }
  }
  const value = input.trim().toLowerCase()
  if (value.startsWith('#')) {
    const hex = normalizeHex(value)
    return {
      r: Number.parseInt(hex.slice(1, 3), 16),
      g: Number.parseInt(hex.slice(3, 5), 16),
      b: Number.parseInt(hex.slice(5, 7), 16),
      a: hex.length >= 9 ? Number.parseInt(hex.slice(7, 9), 16) : 255
    }
  }
  const rgbaMatch = value.match(/^rgba?\(([^)]+)\)$/)
  if (rgbaMatch) {
    const parts = rgbaMatch[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number)
    const [r = 0, g = 0, b = 0, alpha = 1] = parts
    return {
      r: clampRange(Math.round(r), 0, 255),
      g: clampRange(Math.round(g), 0, 255),
      b: clampRange(Math.round(b), 0, 255),
      a: clampRange(Math.round((Number.isFinite(alpha) ? alpha : 1) * 255), 0, 255)
    }
  }
  const hslMatch = value.match(/^hsla?\(([^)]+)\)$/)
  if (hslMatch) {
    const parts = hslMatch[1].split(/[\s,/]+/).filter(Boolean)
    const hue = Number.parseFloat(parts[0] ?? '0')
    const saturation = Number.parseFloat(parts[1] ?? '0') / 100
    const lightness = Number.parseFloat(parts[2] ?? '0') / 100
    const alpha = parts[3] === undefined ? 1 : Number.parseFloat(parts[3])
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
    const section = (hue % 360) / 60
    const second = chroma * (1 - Math.abs((section % 2) - 1))
    const fallback = lightness - chroma / 2
    const [r, g, b] =
      section < 1
        ? [chroma, second, 0]
        : section < 2
          ? [second, chroma, 0]
          : section < 3
            ? [0, chroma, second]
            : section < 4
              ? [0, second, chroma]
              : section < 5
                ? [second, 0, chroma]
                : [chroma, 0, second]
    return {
      r: Math.round((r + fallback) * 255),
      g: Math.round((g + fallback) * 255),
      b: Math.round((b + fallback) * 255),
      a: clampRange(Math.round((Number.isFinite(alpha) ? alpha : 1) * 255), 0, 255)
    }
  }
  return { r: 64, g: 158, b: 255, a: 255 }
}

function rgbToHsv(color: Rgba): Hsv {
  const r = color.r / 255
  const g = color.g / 255
  const b = color.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let hue = 0
  if (delta !== 0) {
    if (max === r) {
      hue = ((g - b) / delta) % 6
    } else if (max === g) {
      hue = (b - r) / delta + 2
    } else {
      hue = (r - g) / delta + 4
    }
    hue = Math.round(hue * 60)
    if (hue < 0) {
      hue += 360
    }
  }
  return { h: hue, s: max === 0 ? 0 : delta / max, v: max }
}

function hsvToRgb(hue: number, saturation: number, value: number): Omit<Rgba, 'a'> {
  const chroma = value * saturation
  const section = (((hue % 360) + 360) % 360) / 60
  const second = chroma * (1 - Math.abs((section % 2) - 1))
  const fallback = value - chroma
  const [r, g, b] =
    section < 1
      ? [chroma, second, 0]
      : section < 2
        ? [second, chroma, 0]
        : section < 3
          ? [0, chroma, second]
          : section < 4
            ? [0, second, chroma]
            : section < 5
              ? [second, 0, chroma]
              : [chroma, 0, second]
  return {
    r: Math.round((r + fallback) * 255),
    g: Math.round((g + fallback) * 255),
    b: Math.round((b + fallback) * 255)
  }
}

function toHexChannel(value: number): string {
  return clampRange(Math.round(value), 0, 255).toString(16).padStart(2, '0')
}

function toHsl(color: Rgba, withAlpha: boolean): string {
  const r = color.r / 255
  const g = color.g / 255
  const b = color.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const lightness = (max + min) / 2
  let hue = 0
  let saturation = 0
  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1))
    if (max === r) {
      hue = ((g - b) / delta) % 6
    } else if (max === g) {
      hue = (b - r) / delta + 2
    } else {
      hue = (r - g) / delta + 4
    }
    hue = Math.round(hue * 60)
    if (hue < 0) {
      hue += 360
    }
  }
  const core = `${hue}, ${Math.round(saturation * 100)}%, ${Math.round(lightness * 100)}%`
  return withAlpha ? `hsla(${core}, ${(color.a / 255).toFixed(2)})` : `hsl(${core})`
}

function formatColor(color: Rgba, format: string, withAlpha: boolean): string {
  if (format === 'rgb') {
    return withAlpha
      ? `rgba(${color.r}, ${color.g}, ${color.b}, ${(color.a / 255).toFixed(2)})`
      : `rgb(${color.r}, ${color.g}, ${color.b})`
  }
  if (format === 'hsl') {
    return toHsl(color, withAlpha)
  }
  const base = `#${toHexChannel(color.r)}${toHexChannel(color.g)}${toHexChannel(color.b)}`
  return withAlpha ? `${base}${toHexChannel(color.a)}` : base
}

const colorPickerPanelBaseProps = {
  modelValue: { type: String },
  disabled: { type: Boolean },
  showAlpha: { type: Boolean },
  colorFormat: { type: String },
  predefine: { type: Array },
  hueSliderClass: { type: [String, Array, Object, Boolean] },
  hueSliderStyle: { type: [String, Array, Object, Boolean] }
}

const HUE_GRADIENT = 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'

export function createColorPickerPanel(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiColorPickerPanel',
      baseClass: 'ui-color-picker-panel',
      props: colorPickerPanelBaseProps,
      tag: () => 'div',
      classes: (props) => [props.disabled ? 'is-disabled' : ''],
      content: ({ props, emit }) => {
        const color = parseColor(props.modelValue)
        const hsv = rgbToHsv(color)
        const withAlpha = Boolean(props.showAlpha)
        const format = String(props.colorFormat ?? 'hex')

        function commit(next: Hsv, alpha: number) {
          if (props.disabled) {
            return
          }
          const rgb = hsvToRgb(next.h, next.s, next.v)
          const value = formatColor({ ...rgb, a: alpha }, format, withAlpha)
          emit('update:modelValue', value)
          emit('change', value)
        }

        function readRatio(event: PointerEvent, horizontal: boolean): number {
          const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
          if (!horizontal) {
            return clampRange((event.clientY - rect.top) / rect.height, 0, 1)
          }
          return clampRange((event.clientX - rect.left) / rect.width, 0, 1)
        }

        function handleSaturation(event: PointerEvent) {
          if (event.type === 'pointermove' && event.buttons !== 1) {
            return
          }
          if (event.type === 'pointerdown') {
            ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
          }
          const saturation = readRatio(event, true)
          const value = 1 - readRatio(event, false)
          commit({ h: hsv.h, s: saturation, v: value }, color.a)
        }

        function handleHue(event: PointerEvent) {
          if (event.type === 'pointermove' && event.buttons !== 1) {
            return
          }
          if (event.type === 'pointerdown') {
            ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
          }
          commit({ h: readRatio(event, true) * 360, s: hsv.s, v: hsv.v }, color.a)
        }

        function handleAlpha(event: PointerEvent) {
          if (event.type === 'pointermove' && event.buttons !== 1) {
            return
          }
          if (event.type === 'pointerdown') {
            ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
          }
          commit(hsv, Math.round(readRatio(event, true) * 255))
        }

        function pickPredefine(item: unknown) {
          if (props.disabled) {
            return
          }
          const preset = parseColor(item)
          const value = formatColor(preset, format, withAlpha)
          emit('update:modelValue', value)
          emit('change', value)
        }

        const saturationArea = h(
          'div',
          {
            class: 'ui-color-picker-panel__saturation',
            style: {
              background: `linear-gradient(to top, #000, rgba(0, 0, 0, 0)), linear-gradient(to right, #fff, hsl(${hsv.h}, 100%, 50%))`
            },
            onPointerdown: handleSaturation,
            onPointermove: handleSaturation
          },
          [
            h('span', {
              class: 'ui-color-picker-panel__cursor',
              style: { left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }
            })
          ]
        )

        const baseRgb = hsvToRgb(hsv.h, hsv.s, hsv.v)
        const currentColor = formatColor({ ...baseRgb, a: color.a }, 'rgb', withAlpha)

        const hueBar = h(
          'div',
          {
            class: ['ui-color-picker-panel__hue', props.hueSliderClass],
            style: [{ background: HUE_GRADIENT }, props.hueSliderStyle],
            onPointerdown: handleHue,
            onPointermove: handleHue
          },
          [h('span', { class: 'ui-color-picker-panel__bar-cursor', style: { left: `${(hsv.h / 360) * 100}%` } })]
        )

        const alphaBar = withAlpha
          ? h(
              'div',
              { class: 'ui-color-picker-panel__alpha', onPointerdown: handleAlpha, onPointermove: handleAlpha },
              [
                h('span', {
                  class: 'ui-color-picker-panel__alpha-fill',
                  style: {
                    background: `linear-gradient(to right, rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, 0), rgb(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}))`
                  }
                }),
                h('span', {
                  class: 'ui-color-picker-panel__bar-cursor',
                  style: { left: `${(color.a / 255) * 100}%` }
                })
              ]
            )
          : null

        const predefineList = Array.isArray(props.predefine)
          ? props.predefine.map((item, index) =>
              h('button', {
                key: index,
                class: 'ui-color-picker-panel__preset',
                type: 'button',
                style: { background: String(item) },
                disabled: Boolean(props.disabled),
                'aria-label': `预设颜色 ${String(item)}`,
                onClick: () => pickPredefine(item)
              })
            )
          : []

        return [
          h('div', { class: 'ui-color-picker-panel__body' }, [
            saturationArea,
            h('div', { class: 'ui-color-picker-panel__sliders' }, [hueBar, alphaBar])
          ]),
          predefineList.length ? h('div', { class: 'ui-color-picker-panel__predefine' }, predefineList) : null,
          h('div', { class: 'ui-color-picker-panel__footer' }, [
            h('span', {
              class: 'ui-color-picker-panel__preview',
              style: { background: currentColor }
            }),
            h(
              'span',
              { class: 'ui-color-picker-panel__value' },
              formatColor({ ...baseRgb, a: color.a }, format, withAlpha)
            )
          ])
        ]
      }
    },
    features
  )
}
