import type { VNodeChild } from 'vue'
import { Teleport, computed, h, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronDown, Clock, X } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { useFloatingPanel } from '../../shared/panel'
import { formatDateValue, parseTimeValue } from '../../shared/date'
import { timeSelectClearableFeature } from './features/clearable/index'
import { timeSelectIconsFeature } from './features/icons/index'
import { timeSelectPopperFeature } from './features/popper/index'
import { timeSelectEditableFeature } from './features/editable/index'
import { timeSelectFormatFeature } from './features/format/index'
import './core.css'

const timeSelectBaseProps = {
  modelValue: { type: String },
  disabled: { type: Boolean },
  size: { type: String },
  format: { type: String, default: 'HH:mm' },
  effect: { type: String, default: 'light' },
  placeholder: { type: String },
  start: { type: String, default: '09:00' },
  end: { type: String, default: '18:00' },
  step: { type: String, default: '00:30' },
  minTime: { type: String },
  maxTime: { type: String },
  includeEndTime: { type: Boolean },
  name: { type: String }
}

function toMinutes(value: string): number {
  const [hours, minutes] = String(value).split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

function toLabel(totalMinutes: number): string {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
  const minutes = String(totalMinutes % 60).padStart(2, '0')
  return `${hours}:${minutes}`
}

// 复用共享的 formatDateValue，把 'HH:mm'/'HH:mm:ss' 等模式（含中文小时/分钟/秒后缀）完整展开，
// 修正 ss 段被当字面量输出的缺陷
function formatTime(value: string, format: string): string {
  const parts = parseTimeValue(value)
  const date = new Date(2000, 0, 1, parts?.hours ?? 0, parts?.minutes ?? 0, parts?.seconds ?? 0)
  return formatDateValue(date, String(format || 'HH:mm'))
}

function buildOptions(props: Record<string, any>): string[] {
  const start = toMinutes(props.start || '09:00')
  const end = toMinutes(props.end || '18:00')
  const step = Math.max(1, toMinutes(props.step || '00:30'))
  const min = props.minTime !== undefined ? toMinutes(props.minTime) : start
  const max = props.maxTime !== undefined ? toMinutes(props.maxTime) : end
  const list: string[] = []
  for (let minute = start; minute <= end; minute += step) {
    if (minute < min) {
      continue
    }
    if (minute > max) {
      continue
    }
    if (!props.includeEndTime && minute === end) {
      continue
    }
    list.push(toLabel(minute))
  }
  return list
}

export function createTimeSelect(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiTimeSelect',
      baseClass: 'ui-time-select',
      props: timeSelectBaseProps,
      setup(props, { emit }) {
        const open = ref(false)
        const triggerRef = ref<HTMLElement>()
        const panelRef = ref<HTMLElement>()
        const options = computed(() => buildOptions(props))
        const hasValue = computed(() => Boolean(props.modelValue))

        const { position, refresh } = useFloatingPanel({
          props,
          open: () => open.value,
          close: closePanel,
          trigger: triggerRef,
          panel: panelRef,
          placement: () => String(props.placement || 'bottom-start'),
          offset: () => 4,
          matchWidth: () => true
        })

        function emitValue(value: any) {
          emit('update:modelValue', value)
          emit('change', value)
        }

        function clearValue() {
          const valueOnClear = props.valueOnClear
          const next = typeof valueOnClear === 'function' ? valueOnClear() : valueOnClear
          emit('clear')
          emitValue(next)
        }

        function selectTime(time: string) {
          emitValue(time)
          closePanel()
        }

        function openPanel() {
          if (props.disabled || open.value) {
            return
          }
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

        function handleKeydown(event: KeyboardEvent) {
          if (event.key === 'Escape' && open.value) {
            event.preventDefault()
            closePanel()
          }
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

        onMounted(() => {
          document.addEventListener('pointerdown', handlePointerDown, true)
        })

        onBeforeUnmount(() => {
          document.removeEventListener('pointerdown', handlePointerDown, true)
        })

        function renderPanel(): VNodeChild {
          if (!open.value) {
            return null
          }
          const children: VNodeChild[] = options.value.length
            ? options.value.map((time) =>
                h(
                  'div',
                  {
                    key: time,
                    class: ['ui-time-select__option', time === props.modelValue ? 'is-selected' : ''],
                    onClick: () => selectTime(time)
                  },
                  formatTime(time, props.format)
                )
              )
            : [h('div', { class: 'ui-floating-panel__empty' }, '无可选时间')]
          const panel = h(
            'div',
            {
              ref: panelRef,
              class: [
                'ui-time-select__dropdown',
                'ui-floating-panel',
                `is-${props.effect || 'light'}`,
                props.popperClass
              ],
              style: [props.popperStyle, position.value]
            },
            children
          )
          return h(Teleport, { to: 'body' }, panel)
        }

        return {
          triggerRef,
          get open() {
            return open.value
          },
          get hasValue() {
            return hasValue.value
          },
          togglePanel,
          closePanel,
          clearValue,
          renderPanel
        }
      },
      classes: (props, state) => [
        props.size ? `is-size-${props.size}` : '',
        props.disabled ? 'is-disabled' : '',
        state.open ? 'is-open' : ''
      ],
      content: ({ props, state }) => {
        const actions: VNodeChild[] = []
        if (props.clearable && state.hasValue && !props.disabled) {
          actions.push(
            h(
              'span',
              {
                class: 'ui-time-select__clear',
                onClick: (event: Event) => {
                  event.stopPropagation()
                  state.clearValue()
                }
              },
              [renderIcon(props.clearIcon || X)]
            )
          )
        }
        actions.push(
          renderIcon(ChevronDown, { class: state.open ? 'ui-time-select__arrow is-open' : 'ui-time-select__arrow' })
        )
        return [
          h(
            'div',
            {
              ref: state.triggerRef,
              class: 'ui-time-select__trigger',
              tabindex: props.disabled ? undefined : 0,
              role: 'combobox',
              'aria-expanded': state.open,
              onClick: state.togglePanel,
              onKeydown: (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                  state.closePanel()
                }
              }
            },
            [
              renderIcon(props.prefixIcon || Clock, { class: 'ui-time-select__icon' }),
              h(
                'span',
                { class: state.hasValue ? 'ui-time-select__value' : 'ui-time-select__placeholder' },
                state.hasValue ? formatTime(props.modelValue, props.format) : props.placeholder || '选择时间'
              ),
              h('span', { class: 'ui-time-select__actions' }, actions)
            ]
          ),
          h('input', {
            type: 'hidden',
            name: props.name,
            value: state.hasValue ? formatTime(props.modelValue, props.format) : ''
          }),
          state.renderPanel()
        ]
      }
    },
    features
  )
}
