import type { CSSProperties, VNodeChild } from 'vue'
import { Teleport, computed, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronDown, Clock, X } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { useFloatingPanel } from '../../shared/panel'
import { formatDateValue, pad, parseDateValue, parseTimeValue } from '../../shared/date'
import { timePickerClearableFeature } from './features/clearable/index'
import { timePickerIconsFeature } from './features/icons/index'
import { timePickerPopperFeature } from './features/popper/index'
import { timePickerEditableFeature } from './features/editable/index'
import { timePickerFormatFeature } from './features/format/index'
import { timePickerRangeFeature } from './features/range/index'
import './core.css'

const timePickerBaseProps = {
  type: { type: String, default: '' },
  size: { type: String },
  disabled: { type: Boolean },
  modelValue: { type: [Array, String] },
  defaultValue: { type: [Array, Date, String] },
  id: { type: [Array, String] },
  name: { type: [Array, String] },
  format: { type: String },
  timeFormat: { type: String },
  readonly: { type: Boolean },
  placeholder: { type: String, default: '' },
  defaultTime: { type: [Array, Date, String] },
  isRange: { type: Boolean },
  disabledHours: { type: Function },
  disabledMinutes: { type: Function },
  disabledSeconds: { type: Function },
  tabindex: { type: [String, Number], default: 0 },
  ariaLabel: { type: String },
  showNow: { type: Boolean, default: true },
  showConfirm: { type: Boolean, default: true },
  showFooter: { type: Boolean, default: true }
}

export function createTimePicker(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiTimePicker',
      baseClass: 'ui-time-picker',
      props: timePickerBaseProps,
      setup(props, { emit }) {
        const open = ref(false)
        const activeSide = ref(0)
        const activeTrigger = ref<HTMLElement>()
        const fieldRefs = [ref<HTMLElement>(), ref<HTMLElement>()]
        const panelRef = ref<HTMLElement>()
        const hours = ref(0)
        const minutes = ref(0)
        const seconds = ref(0)
        // 触发区可输入控件的草稿文本：随 modelValue/format 同步，编辑后未提交不抛值
        const drafts = [ref(''), ref('')]

        const range = computed(() => Boolean(props.isRange) || String(props.type || '') === 'time-range')
        const displayFormat = computed(() => String(props.format || props.timeFormat || 'HH:mm:ss'))
        const outputFormat = computed(() => String(props.valueFormat || displayFormat.value))
        const showSeconds = computed(() => displayFormat.value.includes('s'))
        const canEdit = computed(() => props.editable !== false && !props.readonly && !props.disabled)
        const hasValue = computed(() => {
          const value = props.modelValue
          if (range.value) {
            return Array.isArray(value) && value.some((item) => Boolean(item))
          }
          return Boolean(value)
        })

        const rangeBound = computed(() => {
          if (!range.value) {
            return null
          }
          const other = parseTimeValue(valueAt(activeSide.value === 0 ? 1 : 0))
          if (!other) {
            return null
          }
          return showSeconds.value ? other : { hours: other.hours, minutes: other.minutes, seconds: 0 }
        })

        const { position, refresh } = useFloatingPanel({
          props,
          open: () => open.value,
          close: closePanel,
          trigger: activeTrigger,
          panel: panelRef,
          placement: () => String(props.placement || 'bottom-start'),
          offset: () => 4,
          matchWidth: () => false,
          fallbackPlacements: () => props.fallbackPlacements as string[] | undefined
        })

        function emitValue(value: any) {
          emit('update:modelValue', value)
          emit('change', value)
        }

        function valueAt(index: number): unknown {
          const value = props.modelValue
          if (range.value) {
            return Array.isArray(value) ? value[index] : ''
          }
          return value
        }

        function displayAt(index: number): string {
          const parsed = parseTimeValue(valueAt(index))
          if (!parsed) {
            return String(valueAt(index) ?? '')
          }
          return formatDateValue(
            new Date(2000, 0, 1, parsed.hours, parsed.minutes, parsed.seconds),
            displayFormat.value
          )
        }

        function assignTime(parts: { hours: number; minutes: number; seconds: number }) {
          hours.value = parts.hours
          minutes.value = parts.minutes
          seconds.value = parts.seconds
        }

        function toSecondOfDay(parts: { hours: number; minutes: number; seconds: number }): number {
          return parts.hours * 3600 + parts.minutes * 60 + (showSeconds.value ? parts.seconds : 0)
        }

        function clampToRange(parts: { hours: number; minutes: number; seconds: number }) {
          const bound = rangeBound.value
          if (!bound) {
            return parts
          }
          const diff = toSecondOfDay(parts) - toSecondOfDay(bound)
          if (activeSide.value === 1 ? diff >= 0 : diff <= 0) {
            return parts
          }
          return { hours: bound.hours, minutes: bound.minutes, seconds: bound.seconds }
        }

        function applyTime() {
          const parts = clampToRange({ hours: hours.value, minutes: minutes.value, seconds: seconds.value })
          if (parts.hours !== hours.value || parts.minutes !== minutes.value || parts.seconds !== seconds.value) {
            assignTime(parts)
          }
          const value = formatDateValue(
            new Date(2000, 0, 1, parts.hours, parts.minutes, parts.seconds),
            outputFormat.value
          )
          if (!range.value) {
            emitValue(value)
            return
          }
          const current = Array.isArray(props.modelValue) ? [...props.modelValue] : ['', '']
          current[activeSide.value] = value
          emitValue(current)
        }

        function syncFromValue() {
          const parsed = parseTimeValue(valueAt(activeSide.value))
          if (parsed) {
            assignTime(clampToRange(parsed))
            return
          }
          if (range.value) {
            const other = parseTimeValue(valueAt(activeSide.value === 0 ? 1 : 0))
            if (other) {
              assignTime(other)
              return
            }
          }
          const fallback = Array.isArray(props.defaultTime) ? props.defaultTime[activeSide.value] : props.defaultTime
          const fallbackTime = parseTimeValue(fallback)
          if (fallbackTime) {
            assignTime(fallbackTime)
            return
          }
          const fallbackDate = parseDateValue(fallback)
          if (fallbackDate) {
            assignTime({
              hours: fallbackDate.getHours(),
              minutes: fallbackDate.getMinutes(),
              seconds: fallbackDate.getSeconds()
            })
            return
          }
          const rawDefault = Array.isArray(props.defaultValue)
            ? props.defaultValue[activeSide.value]
            : activeSide.value === 0
              ? props.defaultValue
              : undefined
          if (rawDefault instanceof Date) {
            const date = parseDateValue(rawDefault)
            if (date) {
              assignTime({ hours: date.getHours(), minutes: date.getMinutes(), seconds: date.getSeconds() })
              return
            }
          }
          const defaultParsed = parseTimeValue(rawDefault)
          if (defaultParsed) {
            assignTime(defaultParsed)
            return
          }
          const now = new Date()
          assignTime({ hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds() })
        }

        function centerSelected() {
          nextTick(() => {
            const items = panelRef.value?.querySelectorAll<HTMLElement>('.ui-time-picker__time-item.is-selected')
            items?.forEach((item) => {
              const list = item.parentElement
              if (list) {
                list.scrollTop = item.offsetTop - list.clientHeight / 2 + item.clientHeight / 2
              }
            })
          })
        }

        function openPanel(side: number) {
          activeSide.value = side
          activeTrigger.value = fieldRefs[side]?.value
          syncFromValue()
          open.value = true
          emit('visible-change', true)
          nextTick(refresh)
          centerSelected()
        }

        function closePanel() {
          if (!open.value) {
            return
          }
          open.value = false
          emit('visible-change', false)
        }

        function toggleSide(side: number) {
          if (props.disabled || props.readonly) {
            return
          }
          if (open.value && activeSide.value === side) {
            closePanel()
            return
          }
          openPanel(side)
        }

        function clearValue() {
          const valueOnClear = props.valueOnClear
          const fallback = range.value ? ['', ''] : ''
          const next =
            typeof valueOnClear === 'function'
              ? valueOnClear()
              : valueOnClear !== undefined && valueOnClear !== null
                ? valueOnClear
                : fallback
          emit('clear')
          emitValue(next)
        }

        function confirmPanel() {
          closePanel()
        }

        function selectNow() {
          const now = new Date()
          hours.value = now.getHours()
          minutes.value = now.getMinutes()
          seconds.value = now.getSeconds()
          applyTime()
          if (props.showConfirm === false) {
            closePanel()
          }
        }

        function isHourDisabled(hour: number): boolean {
          if (typeof props.disabledHours === 'function') {
            const list = props.disabledHours()
            if (Array.isArray(list) && list.includes(hour)) {
              return true
            }
          }
          const bound = rangeBound.value
          if (!bound) {
            return false
          }
          return activeSide.value === 1 ? hour < bound.hours : hour > bound.hours
        }

        function isMinuteDisabled(minute: number): boolean {
          if (typeof props.disabledMinutes === 'function') {
            const list = props.disabledMinutes(hours.value)
            if (Array.isArray(list) && list.includes(minute)) {
              return true
            }
          }
          const bound = rangeBound.value
          if (!bound || hours.value !== bound.hours) {
            return false
          }
          return activeSide.value === 1 ? minute < bound.minutes : minute > bound.minutes
        }

        function isSecondDisabled(second: number): boolean {
          if (typeof props.disabledSeconds === 'function') {
            const list = props.disabledSeconds(hours.value, minutes.value)
            if (Array.isArray(list) && list.includes(second)) {
              return true
            }
          }
          const bound = rangeBound.value
          if (!bound || hours.value !== bound.hours || minutes.value !== bound.minutes) {
            return false
          }
          return activeSide.value === 1 ? second < bound.seconds : second > bound.seconds
        }

        function pickHour(value: number) {
          hours.value = value
          applyTime()
          if (props.showConfirm === false) {
            closePanel()
          }
        }

        function pickMinute(value: number) {
          minutes.value = value
          applyTime()
          if (props.showConfirm === false) {
            closePanel()
          }
        }

        function pickSecond(value: number) {
          seconds.value = value
          applyTime()
          if (props.showConfirm === false) {
            closePanel()
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
          if (fieldRefs.some((item) => item.value?.contains(target)) || panelRef.value?.contains(target)) {
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

        function renderColumn(
          label: string,
          count: number,
          current: number,
          disabledOf: (value: number) => boolean,
          onPick: (value: number) => void
        ): VNodeChild {
          return h('div', { class: 'ui-time-picker__column' }, [
            h('div', { class: 'ui-time-picker__column-title' }, label),
            h(
              'div',
              { class: 'ui-time-picker__list' },
              Array.from({ length: count }, (_item, value) =>
                h(
                  'button',
                  {
                    key: value,
                    class: [
                      'ui-time-picker__time-item',
                      value === current ? 'is-selected' : '',
                      disabledOf(value) ? 'is-disabled' : ''
                    ],
                    type: 'button',
                    disabled: disabledOf(value),
                    onClick: () => onPick(value)
                  },
                  pad(value)
                )
              )
            )
          ])
        }

        function renderFooter(): VNodeChild {
          if (props.showFooter === false) {
            return null
          }
          const actions: VNodeChild[] = []
          if (props.showNow !== false) {
            actions.push(
              h(
                'button',
                {
                  class: 'ui-time-picker__action',
                  type: 'button',
                  onClick: selectNow
                },
                '此刻'
              )
            )
          }
          if (props.showConfirm !== false) {
            actions.push(
              h(
                'button',
                {
                  class: 'ui-time-picker__action is-primary',
                  type: 'button',
                  onClick: confirmPanel
                },
                '确定'
              )
            )
          }
          if (!actions.length) {
            return null
          }
          return h('div', { class: 'ui-time-picker__footer' }, actions)
        }

        function renderPanel(): VNodeChild {
          if (!open.value) {
            return null
          }
          const columns: VNodeChild[] = [
            renderColumn('时', 24, hours.value, isHourDisabled, pickHour),
            renderColumn('分', 60, minutes.value, isMinuteDisabled, pickMinute)
          ]
          if (showSeconds.value) {
            columns.push(renderColumn('秒', 60, seconds.value, isSecondDisabled, pickSecond))
          }
          const body: VNodeChild[] = []
          if (range.value) {
            body.push(h('div', { class: 'ui-time-picker__caption' }, activeSide.value === 0 ? '开始时间' : '结束时间'))
          }
          body.push(h('div', { class: 'ui-time-picker__columns' }, columns))
          body.push(renderFooter())
          const panel = h(
            'div',
            {
              ref: panelRef,
              class: ['ui-time-picker__dropdown', 'ui-floating-panel', props.popperClass],
              style: [props.popperStyle as CSSProperties, position.value],
              onKeydown: handleKeydown
            },
            body
          )
          return h(Teleport, { to: 'body' }, panel)
        }

        function syncDrafts() {
          drafts[0].value = displayAt(0)
          drafts[1].value = displayAt(1)
        }

        function commitDraft(index: number) {
          if (!canEdit.value) {
            drafts[index].value = displayAt(index)
            return
          }
          if (drafts[index].value === displayAt(index)) {
            // 文本未变化：不产生多余的写回事件
            return
          }
          const parsed = parseTimeValue(drafts[index].value)
          if (!parsed) {
            // 解析失败：不提交，回退到原显示
            drafts[index].value = displayAt(index)
            return
          }
          const value = formatDateValue(
            new Date(2000, 0, 1, parsed.hours, parsed.minutes, parsed.seconds),
            outputFormat.value
          )
          if (!range.value) {
            emitValue(value)
            return
          }
          const current = Array.isArray(props.modelValue) ? [...props.modelValue] : ['', '']
          current[index] = value
          emitValue(current)
        }

        function handleDraftInput(index: number, event: Event) {
          drafts[index].value = (event.target as HTMLInputElement).value
        }

        function handleDraftKeydown(index: number, event: KeyboardEvent) {
          if (event.key === 'Enter') {
            event.preventDefault()
            commitDraft(index)
          }
        }

        function handleDraftBlur(index: number) {
          commitDraft(index)
        }

        function idAt(index: number) {
          return Array.isArray(props.id) ? props.id[index] : index === 0 ? props.id : undefined
        }

        function nameAt(index: number) {
          return Array.isArray(props.name) ? props.name[index] : index === 0 ? props.name : undefined
        }

        syncDrafts()
        watch(() => [props.modelValue, props.format, props.timeFormat, range.value], syncDrafts)

        return {
          get open() {
            return open.value
          },
          get range() {
            return range.value
          },
          get activeSide() {
            return activeSide.value
          },
          get hasValue() {
            return hasValue.value
          },
          get canEdit() {
            return canEdit.value
          },
          fieldRefs,
          toggleSide,
          closePanel,
          clearValue,
          renderPanel,
          displayAt,
          draftAt: (index: number) => drafts[index].value,
          handleDraftInput,
          handleDraftKeydown,
          handleDraftBlur,
          idAt,
          nameAt
        }
      },
      classes: (props, state) => [
        props.size ? `is-size-${props.size}` : '',
        props.disabled ? 'is-disabled' : '',
        state.open ? 'is-open' : ''
      ],
      content: ({ props, state }) => {
        const renderActions = () => {
          const actions: VNodeChild[] = []
          if (props.clearable && state.hasValue && !props.disabled) {
            actions.push(
              h(
                'span',
                {
                  class: 'ui-time-picker__clear',
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
            renderIcon(ChevronDown, { class: state.open ? 'ui-time-picker__arrow is-open' : 'ui-time-picker__arrow' })
          )
          return h('span', { class: 'ui-time-picker__actions' }, actions)
        }

        const renderField = (index: number) => {
          return h(
            'div',
            {
              ref: state.fieldRefs[index],
              class: state.range ? 'ui-time-picker__field' : 'ui-time-picker__trigger',
              tabindex: props.disabled ? undefined : props.tabindex,
              role: 'combobox',
              'aria-expanded': state.open && state.activeSide === index,
              'aria-label': props.ariaLabel,
              onClick: () => state.toggleSide(index),
              onKeydown: (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                  state.closePanel()
                }
              }
            },
            [
              renderIcon(props.prefixIcon || Clock, { class: 'ui-time-picker__icon' }),
              h('input', {
                class: state.draftAt(index) ? 'ui-time-picker__value' : 'ui-time-picker__placeholder',
                type: 'text',
                autocomplete: 'off',
                value: state.draftAt(index),
                placeholder: state.range
                  ? [props.startPlaceholder, props.endPlaceholder][index] || ['开始时间', '结束时间'][index]
                  : props.placeholder || '选择时间',
                readonly: !state.canEdit,
                disabled: Boolean(props.disabled),
                id: state.idAt(index),
                name: state.nameAt(index),
                onInput: (event: Event) => state.handleDraftInput(index, event),
                onKeydown: (event: KeyboardEvent) => state.handleDraftKeydown(index, event),
                onBlur: () => state.handleDraftBlur(index)
              }),
              ...(state.range ? [] : [renderActions()])
            ]
          )
        }

        const fields = state.range
          ? h('div', { class: 'ui-time-picker__fields' }, [
              renderField(0),
              h('span', { class: 'ui-time-picker__separator' }, props.rangeSeparator || '至'),
              renderField(1),
              renderActions()
            ])
          : renderField(0)

        return [fields, state.renderPanel()]
      }
    },
    features
  )
}
