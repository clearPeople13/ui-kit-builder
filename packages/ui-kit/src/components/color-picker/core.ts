import type { CSSProperties, VNodeChild } from 'vue'
import { Teleport, computed, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronDown, X } from '../../shared/icons'
import chroma from 'chroma-js'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { useFloatingPanel } from '../../shared/panel'
import { clamp } from '../../shared/utils'
import { colorPickerClearableFeature } from './features/clearable/index'
import { colorPickerPopperFeature } from './features/popper/index'
import { colorPickerFormatFeature } from './features/format/index'
import './core.css'

const colorPickerBaseProps = {
  modelValue: { type: String },
  disabled: { type: Boolean },
  size: { type: String },
  id: { type: String },
  showAlpha: { type: Boolean },
  colorFormat: { type: String },
  tabindex: { type: [String, Number], default: 0 },
  predefine: { type: Array },
  ariaLabel: { type: String }
}

const FALLBACK_COLOR = '#409eff'
const HUE_GRADIENT = 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'

interface HsvState {
  h: number
  s: number
  v: number
  a: number
}

export function createColorPicker(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiColorPicker',
      baseClass: 'ui-color-picker',
      props: colorPickerBaseProps,
      setup(props, { emit }) {
        const open = ref(false)
        const hsv = ref<HsvState>({ h: 210, s: 0.75, v: 1, a: 1 })
        const triggerRef = ref<HTMLElement>()
        const panelRef = ref<HTMLElement>()
        const svRef = ref<HTMLElement>()
        const hueRef = ref<HTMLElement>()
        const alphaRef = ref<HTMLElement>()
        let dragging: 'sv' | 'hue' | 'alpha' | null = null

        // 展示值来源：用户改过且使用方未回写时取内部草稿，否则一律跟随外部 modelValue
        const draftDirty = ref(false)
        // 空值与解析失败的色值都视作"没有值"，避免把兜底色当成用户的选择渲染出去
        const modelColor = computed(() => {
          const source = props.modelValue
          if (!source || !chroma.valid(String(source))) {
            return null
          }
          return chroma(String(source))
        })
        const draftColor = computed(() => {
          const state = hsv.value
          return chroma.hsv(state.h, state.s, state.v).alpha(state.a)
        })
        const displayColor = computed(() => (draftDirty.value ? draftColor.value : modelColor.value))
        const hasValue = computed(() => Boolean(displayColor.value))
        const solidColor = computed(() => draftColor.value.alpha(1).hex())
        const draftText = computed(() => formatColor(draftColor.value))
        const displayText = computed(() => (displayColor.value ? formatColor(displayColor.value) : ''))

        const { position, refresh } = useFloatingPanel({
          props,
          open: () => open.value,
          close: closePanel,
          trigger: triggerRef,
          panel: panelRef,
          placement: () => String(props.placement || 'bottom-start'),
          offset: () => 4,
          matchWidth: () => false
        })

        function readHsv(source: string): HsvState {
          const instance = chroma(source)
          const [h, s, v] = instance.hsv()
          const a = instance.alpha()
          return {
            h: Number.isFinite(h) ? h : 0,
            s: Number.isFinite(s) ? s : 0,
            v: Number.isFinite(v) ? v : 0,
            a: Number.isFinite(a) ? a : 1
          }
        }

        function formatColor(instance: any): string {
          const format = String(props.colorFormat || 'hex').toLowerCase()
          if (format === 'rgb') {
            return instance.css('rgb')
          }
          if (format === 'hsl') {
            return instance.css('hsl')
          }
          return props.showAlpha ? instance.hex('rgba') : instance.hex()
        }

        function emitValue(value: string) {
          emit('update:modelValue', value)
          emit('change', value)
        }

        function commitColor() {
          draftDirty.value = true
          emitValue(draftText.value)
        }

        function syncFromModel() {
          const source = props.modelValue
          // 外部值一旦同步，展示值重新交还给 props
          draftDirty.value = false
          if (!source || !chroma.valid(String(source))) {
            return
          }
          hsv.value = readHsv(source)
        }

        function openPanel() {
          if (props.disabled || open.value) {
            return
          }
          syncFromModel()
          open.value = true
          emit('visible-change', true)
          nextTick(refresh)
        }

        function closePanel() {
          if (!open.value) {
            return
          }
          open.value = false
          emit('visible-change', false)
        }

        function togglePanel() {
          if (open.value) {
            closePanel()
          } else {
            openPanel()
          }
        }

        function clearValue() {
          const valueOnClear = props.valueOnClear
          const next =
            typeof valueOnClear === 'function'
              ? valueOnClear()
              : valueOnClear !== undefined && valueOnClear !== null
                ? valueOnClear
                : ''
          emit('clear')
          emitValue(next)
          // 清空只决定写回什么值，展示值继续由外部 modelValue 决定：未回写就保持原值，不回吐兜底色
          draftDirty.value = false
          hsv.value = readHsv(FALLBACK_COLOR)
        }

        function applyColor(value: string) {
          if (!chroma.valid(value)) {
            return
          }
          hsv.value = readHsv(value)
          commitColor()
        }

        function pickPredefine(item: unknown) {
          const value = typeof item === 'object' && item !== null ? (item as Record<string, any>).value : item
          if (typeof value === 'string') {
            applyColor(value)
          }
        }

        function svStyle(): CSSProperties {
          return {
            background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${chroma.hsv(hsv.value.h, 1, 1).hex()})`
          }
        }

        function cursorStyle(): CSSProperties {
          return {
            left: `${hsv.value.s * 100}%`,
            top: `${(1 - hsv.value.v) * 100}%`,
            backgroundColor: solidColor.value
          }
        }

        function hueCursorStyle(): CSSProperties {
          return {
            left: `${(hsv.value.h / 360) * 100}%`,
            backgroundColor: chroma.hsv(hsv.value.h, 1, 1).hex()
          }
        }

        function alphaCursorStyle(): CSSProperties {
          return {
            left: `${hsv.value.a * 100}%`,
            backgroundColor: solidColor.value
          }
        }

        function updateDrag(kind: 'sv' | 'hue' | 'alpha', event: PointerEvent) {
          if (kind === 'sv') {
            const rect = svRef.value?.getBoundingClientRect()
            if (!rect) {
              return
            }
            const s = clamp((event.clientX - rect.left) / rect.width, 0, 1)
            const v = 1 - clamp((event.clientY - rect.top) / rect.height, 0, 1)
            hsv.value = { ...hsv.value, s, v }
            commitColor()
            return
          }
          if (kind === 'hue') {
            const rect = hueRef.value?.getBoundingClientRect()
            if (!rect) {
              return
            }
            const h = clamp((event.clientX - rect.left) / rect.width, 0, 0.999) * 360
            hsv.value = { ...hsv.value, h }
            commitColor()
            return
          }
          const rect = alphaRef.value?.getBoundingClientRect()
          if (!rect) {
            return
          }
          const a = clamp((event.clientX - rect.left) / rect.width, 0, 1)
          hsv.value = { ...hsv.value, a }
          commitColor()
        }

        function startDrag(kind: 'sv' | 'hue' | 'alpha', event: PointerEvent) {
          if (props.disabled) {
            return
          }
          event.preventDefault()
          dragging = kind
          updateDrag(kind, event)
        }

        function handlePointerMove(event: PointerEvent) {
          if (dragging) {
            updateDrag(dragging, event)
          }
        }

        function handlePointerUp() {
          dragging = null
        }

        function handlePointerDown(event: PointerEvent) {
          if (!open.value) {
            return
          }
          const target = event.target as Node | null
          if (triggerRef.value?.contains(target) || panelRef.value?.contains(target)) {
            return
          }
          closePanel()
        }

        function handleHexInput(event: Event) {
          applyColor((event.target as HTMLInputElement).value)
        }

        function handleKeydown(event: KeyboardEvent) {
          if (event.key === 'Escape' && open.value) {
            event.preventDefault()
            closePanel()
          }
        }

        watch(
          () => props.modelValue,
          () => {
            if (!open.value) {
              syncFromModel()
            }
          },
          { immediate: true }
        )

        onMounted(() => {
          document.addEventListener('pointerdown', handlePointerDown, true)
          window.addEventListener('pointermove', handlePointerMove)
          window.addEventListener('pointerup', handlePointerUp)
        })

        onBeforeUnmount(() => {
          document.removeEventListener('pointerdown', handlePointerDown, true)
          window.removeEventListener('pointermove', handlePointerMove)
          window.removeEventListener('pointerup', handlePointerUp)
        })

        function renderPredefine(): VNodeChild {
          const list = Array.isArray(props.predefine) ? props.predefine : []
          if (!list.length) {
            return null
          }
          return h(
            'div',
            { class: 'ui-color-picker__predefine' },
            list.map((item: unknown, index: number) => {
              const value = typeof item === 'object' && item !== null ? (item as Record<string, any>).value : item
              const color = typeof value === 'string' && chroma.valid(value) ? chroma(value).hex() : 'transparent'
              return h('button', {
                key: index,
                class: 'ui-color-picker__predefine-item',
                type: 'button',
                style: { backgroundColor: color },
                title: typeof value === 'string' ? value : '',
                onClick: () => pickPredefine(item)
              })
            })
          )
        }

        function renderPanel(): VNodeChild {
          if (!open.value && !props.persistent) {
            return null
          }
          const body: VNodeChild[] = [
            h(
              'div',
              {
                ref: svRef,
                class: 'ui-color-picker__sv',
                style: svStyle(),
                onPointerdown: (event: PointerEvent) => startDrag('sv', event)
              },
              [h('span', { class: 'ui-color-picker__sv-cursor', style: cursorStyle() })]
            ),
            h(
              'div',
              {
                ref: hueRef,
                class: 'ui-color-picker__slider ui-color-picker__hue',
                style: { background: HUE_GRADIENT },
                onPointerdown: (event: PointerEvent) => startDrag('hue', event)
              },
              [h('span', { class: 'ui-color-picker__slider-cursor', style: hueCursorStyle() })]
            )
          ]
          if (props.showAlpha) {
            body.push(
              h(
                'div',
                {
                  ref: alphaRef,
                  class: 'ui-color-picker__slider ui-color-picker__alpha',
                  onPointerdown: (event: PointerEvent) => startDrag('alpha', event)
                },
                [
                  h('span', {
                    class: 'ui-color-picker__alpha-gradient',
                    style: {
                      background: `linear-gradient(to right, rgba(0,0,0,0), ${solidColor.value})`
                    }
                  }),
                  h('span', { class: 'ui-color-picker__slider-cursor is-alpha', style: alphaCursorStyle() })
                ]
              )
            )
          }
          body.push(
            h('div', { class: 'ui-color-picker__fields' }, [
              h('input', {
                class: 'ui-color-picker__hex',
                type: 'text',
                id: props.id,
                value: draftText.value,
                'aria-label': props.ariaLabel,
                onChange: handleHexInput,
                onKeydown: (event: KeyboardEvent) => {
                  if (event.key === 'Enter') {
                    handleHexInput(event)
                  }
                }
              })
            ])
          )
          const predefine = renderPredefine()
          if (predefine) {
            body.push(predefine)
          }
          const actions: VNodeChild[] = []
          if (props.clearable) {
            actions.push(
              h(
                'button',
                {
                  class: 'ui-color-picker__action',
                  type: 'button',
                  onClick: () => {
                    clearValue()
                    closePanel()
                  }
                },
                '清空'
              )
            )
          }
          actions.push(
            h(
              'button',
              {
                class: 'ui-color-picker__action is-primary',
                type: 'button',
                onClick: () => {
                  commitColor()
                  closePanel()
                }
              },
              '确定'
            )
          )
          body.push(h('div', { class: 'ui-color-picker__footer' }, actions))
          const panel = h(
            'div',
            {
              ref: panelRef,
              class: ['ui-color-picker__dropdown', 'ui-floating-panel', props.popperClass],
              style: [props.popperStyle as CSSProperties, position.value, open.value ? null : { display: 'none' }],
              onKeydown: handleKeydown
            },
            body
          )
          if (props.teleported === false) {
            return panel
          }
          return h(Teleport, { to: props.appendTo || 'body' }, panel)
        }

        return {
          triggerRef,
          panelRef,
          get open() {
            return open.value
          },
          get hasValue() {
            return hasValue.value
          },
          get draftText() {
            return draftText.value
          },
          get displayText() {
            return displayText.value
          },
          togglePanel,
          closePanel,
          clearValue,
          renderPanel,
          swatchStyle: () => ({ background: hasValue.value ? displayText.value : 'transparent' })
        }
      },
      classes: (props, state) => [
        props.size ? `is-size-${props.size}` : '',
        props.disabled ? 'is-disabled' : '',
        state.open ? 'is-open' : '',
        state.hasValue ? 'has-value' : ''
      ],
      content: ({ props, state }) => {
        const actions: VNodeChild[] = []
        if (props.clearable && state.hasValue && !props.disabled) {
          actions.push(
            h(
              'span',
              {
                class: 'ui-color-picker__clear',
                onClick: (event: Event) => {
                  event.stopPropagation()
                  state.clearValue()
                }
              },
              [renderIcon(X)]
            )
          )
        }
        actions.push(
          renderIcon(ChevronDown, { class: state.open ? 'ui-color-picker__arrow is-open' : 'ui-color-picker__arrow' })
        )
        return [
          h(
            'div',
            {
              ref: state.triggerRef,
              class: 'ui-color-picker__trigger',
              tabindex: props.disabled ? undefined : props.tabindex,
              role: 'combobox',
              'aria-expanded': state.open,
              'aria-label': props.ariaLabel,
              onClick: state.togglePanel,
              onKeydown: (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                  state.closePanel()
                }
              }
            },
            [
              h('span', { class: 'ui-color-picker__swatch' }, [
                h('span', { class: 'ui-color-picker__swatch-color', style: state.swatchStyle() })
              ]),
              h(
                'span',
                {
                  class: state.hasValue ? 'ui-color-picker__value' : 'ui-color-picker__placeholder'
                },
                state.hasValue ? state.displayText : '选择颜色'
              ),
              h('span', { class: 'ui-color-picker__actions' }, actions)
            ]
          ),
          state.renderPanel()
        ]
      }
    },
    features
  )
}
