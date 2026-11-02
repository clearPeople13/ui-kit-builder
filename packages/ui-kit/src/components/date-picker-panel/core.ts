import { h, ref } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { datePickerPanelClearableFeature } from './features/clearable/index'
import { datePickerPanelAppearanceFeature } from './features/appearance/index'
import { datePickerPanelFormatFeature } from './features/format/index'
import { datePickerPanelRangeFeature } from './features/range/index'
import './core.css'

type CalendarCell = {
  key: string
  date: Date
  label: string
  outside: boolean
}

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日']
const DAY_MS = 86400000

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return startOfDay(next)
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function sameDay(left: Date | null, right: Date | null): boolean {
  return Boolean(left && right && left.getTime() === right.getTime())
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : startOfDay(value)
  }
  if (typeof value === 'number') {
    const fromNumber = new Date(value)
    return Number.isNaN(fromNumber.getTime()) ? null : startOfDay(fromNumber)
  }
  if (typeof value === 'string' && value.trim()) {
    const matched = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (matched) {
      return new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]))
    }
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed)
  }
  return null
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function formatDate(date: Date, format: string): string {
  return format.replace(/YYYY|MM|DD|M|D/g, (token) => {
    if (token === 'YYYY') {
      return String(date.getFullYear())
    }
    if (token === 'MM') {
      return pad(date.getMonth() + 1)
    }
    if (token === 'DD') {
      return pad(date.getDate())
    }
    if (token === 'M') {
      return String(date.getMonth() + 1)
    }
    return String(date.getDate())
  })
}

function isoWeek(date: Date): number {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const weekday = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - weekday)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil(((target.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7)
}

function buildCells(month: Date, type: string): CalendarCell[] {
  if (type === 'month') {
    return Array.from({ length: 12 }, (_unused, index) => {
      const date = new Date(month.getFullYear(), index, 1)
      return { key: `month-${index}`, date, label: `${index + 1}月`, outside: false }
    })
  }
  if (type === 'year') {
    const decadeStart = month.getFullYear() - (month.getFullYear() % 10) - 1
    return Array.from({ length: 12 }, (_unused, index) => {
      const year = decadeStart + index
      const date = new Date(year, 0, 1)
      return { key: `year-${year}`, date, label: String(year), outside: index === 0 || index === 11 }
    })
  }
  const first = startOfMonth(month)
  const offset = (first.getDay() + 6) % 7
  const start = addDays(first, -offset)
  return Array.from({ length: 42 }, (_unused, index) => {
    const date = addDays(start, index)
    return {
      key: `day-${date.getTime()}`,
      date,
      label: String(date.getDate()),
      outside: date.getMonth() !== first.getMonth()
    }
  })
}

const datePickerPanelBaseProps = {
  disabled: { type: Boolean },
  modelValue: { type: [Array, String, Number], default: '' },
  defaultValue: { type: Array },
  type: { type: String, default: 'date' },
  dateFormat: { type: String },
  isRange: { type: Boolean },
  disabledDate: { type: Function },
  cellClassName: { type: Function },
  shortcuts: { type: Array, default: () => [] },
  showNow: { type: Boolean, default: true },
  showConfirm: { type: Boolean },
  showFooter: { type: Boolean, default: true }
}

export function createDatePickerPanel(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiDatePickerPanel',
      baseClass: 'ui-date-picker-panel',
      props: datePickerPanelBaseProps,
      tag: () => 'div',
      classes: (props) => [props.disabled ? 'is-disabled' : '', props.isRange ? 'is-range' : ''],
      setup(props, { emit }) {
        const initial =
          (Array.isArray(props.modelValue) ? parseDate(props.modelValue[0]) : parseDate(props.modelValue)) ??
          (Array.isArray(props.defaultValue) ? parseDate(props.defaultValue[0]) : parseDate(props.defaultValue)) ??
          startOfDay(new Date())
        const leftMonth = ref(startOfMonth(initial))
        const rightMonth = ref(addMonths(leftMonth.value, 1))
        const pendingStart = ref<Date | null>(null)
        const pendingEnd = ref<Date | null>(null)

        function gridType(): string {
          if (props.isRange) {
            return 'date'
          }
          return props.type === 'month' || props.type === 'year' ? props.type : 'date'
        }

        function outputFormat(): string {
          return String(props.valueFormat ?? props.dateFormat ?? 'YYYY-MM-DD')
        }

        function selectionStart(): Date | null {
          if (pendingStart.value) {
            return pendingStart.value
          }
          if (Array.isArray(props.modelValue)) {
            return parseDate(props.modelValue[0])
          }
          return parseDate(props.modelValue)
        }

        function selectionEnd(): Date | null {
          if (pendingEnd.value) {
            return pendingEnd.value
          }
          return Array.isArray(props.modelValue) ? parseDate(props.modelValue[1]) : null
        }

        function emitValue(value: string | string[]) {
          emit('update:modelValue', value)
          emit('change', value)
        }

        function applySelection() {
          const start = selectionStart()
          const end = selectionEnd()
          if (props.isRange) {
            if (!start || !end) {
              return
            }
            emitValue([formatDate(start, outputFormat()), formatDate(end, outputFormat())])
          } else if (start) {
            emitValue(formatDate(start, outputFormat()))
          }
          pendingStart.value = null
          pendingEnd.value = null
        }

        function pick(date: Date) {
          if (props.disabled) {
            return
          }
          if (typeof props.disabledDate === 'function' && props.disabledDate(date)) {
            return
          }
          leftMonth.value = startOfMonth(date)
          if (props.isRange && !props.unlinkPanels) {
            rightMonth.value = addMonths(leftMonth.value, 1)
          }
          if (props.isRange) {
            const start = pendingStart.value
            const completed = Boolean(pendingStart.value && pendingEnd.value)
            if (!start || completed) {
              pendingStart.value = date
              pendingEnd.value = null
              return
            }
            const swap = date.getTime() < start.getTime()
            pendingStart.value = swap ? date : start
            pendingEnd.value = swap ? start : date
          } else {
            pendingStart.value = date
            pendingEnd.value = null
          }
          if (!props.showConfirm) {
            applySelection()
          }
        }

        function move(panel: 'left' | 'right', direction: number, large: boolean) {
          const type = gridType()
          const months = type === 'date' ? (large ? 12 : 1) : type === 'month' ? (large ? 120 : 12) : 120
          const target = panel === 'left' ? leftMonth : rightMonth
          target.value = addMonths(target.value, direction * months)
          if (props.isRange && !props.unlinkPanels) {
            if (panel === 'left') {
              rightMonth.value = addMonths(leftMonth.value, 1)
            } else {
              leftMonth.value = addMonths(rightMonth.value, -1)
            }
          }
        }

        function titleOf(month: Date): string {
          const type = gridType()
          if (type === 'month') {
            return `${month.getFullYear()}年`
          }
          if (type === 'year') {
            const start = month.getFullYear() - (month.getFullYear() % 10)
            return `${start - 1} - ${start + 10}`
          }
          return `${month.getFullYear()}年 ${month.getMonth() + 1}月`
        }

        function isDisabled(date: Date): boolean {
          return typeof props.disabledDate === 'function' ? Boolean(props.disabledDate(date)) : false
        }

        function cellClass(date: Date): string[] {
          const start = selectionStart()
          const end = selectionEnd()
          const classes: string[] = []
          if (sameDay(date, startOfDay(new Date()))) {
            classes.push('is-today')
          }
          if (props.isRange && start && end && date.getTime() > start.getTime() && date.getTime() < end.getTime()) {
            classes.push('is-in-range')
          }
          if (sameDay(date, start)) {
            classes.push('is-selected', 'is-start')
          }
          if (props.isRange && sameDay(date, end)) {
            classes.push('is-selected', 'is-end')
          }
          if (isDisabled(date)) {
            classes.push('is-disabled')
          }
          if (typeof props.cellClassName === 'function') {
            const extra = props.cellClassName(date)
            if (typeof extra === 'string' && extra) {
              classes.push(extra)
            }
          }
          return classes
        }

        function pickNow() {
          if (props.disabled) {
            return
          }
          const today = startOfDay(new Date())
          if (props.isRange) {
            pendingStart.value = today
            pendingEnd.value = today
            leftMonth.value = startOfMonth(today)
            rightMonth.value = addMonths(leftMonth.value, 1)
          } else {
            pendingStart.value = today
            leftMonth.value = startOfMonth(today)
          }
          applySelection()
        }

        function clear() {
          if (props.disabled) {
            return
          }
          pendingStart.value = null
          pendingEnd.value = null
          emitValue(props.isRange ? [] : '')
        }

        function confirm() {
          if (props.disabled || !pendingStart.value) {
            return
          }
          applySelection()
        }

        function applyShortcut(value: unknown) {
          if (props.disabled) {
            return
          }
          if (Array.isArray(value)) {
            const start = parseDate(value[0])
            const end = parseDate(value[1])
            if (!start || !end) {
              return
            }
            pendingStart.value = start
            pendingEnd.value = end
            leftMonth.value = startOfMonth(start)
            rightMonth.value = addMonths(leftMonth.value, 1)
          } else {
            const date = parseDate(value)
            if (!date) {
              return
            }
            pendingStart.value = date
            leftMonth.value = startOfMonth(date)
          }
          applySelection()
        }

        return {
          get leftMonth(): Date {
            return leftMonth.value
          },
          get rightMonth(): Date {
            return rightMonth.value
          },
          gridType,
          titleOf,
          cellClass,
          pick,
          move,
          pickNow,
          clear,
          confirm,
          applyShortcut,
          get hasClear(): boolean {
            return 'clearable' in props && props.clearable !== false
          },
          get hasFooter(): boolean {
            if (props.showFooter === false) {
              return false
            }
            return Boolean(
              props.showNow !== false ||
                props.showConfirm ||
                ('clearable' in props && props.clearable !== false) ||
                (Array.isArray(props.shortcuts) && props.shortcuts.length > 0)
            )
          },
          get canConfirm(): boolean {
            return Boolean(pendingStart.value && (props.isRange ? pendingEnd.value : true))
          }
        }
      },
      content: ({ props, state }) => {
        const type = state.gridType()
        const showWeek = Boolean(props.showWeekNumber) && type === 'date'

        function renderPanel(month: Date, panel: 'left' | 'right') {
          const cells = buildCells(month, type)
          const rows: CalendarCell[][] = []
          for (let index = 0; index < cells.length; index += 7) {
            rows.push(cells.slice(index, index + 7))
          }
          return h('div', { class: 'ui-date-picker-panel__panel' }, [
            h('div', { class: 'ui-date-picker-panel__header' }, [
              h(
                'button',
                {
                  class: 'ui-date-picker-panel__nav is-prev-year',
                  type: 'button',
                  disabled: Boolean(props.disabled),
                  'aria-label': '上一组',
                  onClick: () => state.move(panel, -1, true)
                },
                '«'
              ),
              h(
                'button',
                {
                  class: 'ui-date-picker-panel__nav is-prev',
                  type: 'button',
                  disabled: Boolean(props.disabled),
                  'aria-label': '上一页',
                  onClick: () => state.move(panel, -1, false)
                },
                '‹'
              ),
              h('span', { class: 'ui-date-picker-panel__title' }, state.titleOf(month)),
              h(
                'button',
                {
                  class: 'ui-date-picker-panel__nav is-next',
                  type: 'button',
                  disabled: Boolean(props.disabled),
                  'aria-label': '下一页',
                  onClick: () => state.move(panel, 1, false)
                },
                '›'
              ),
              h(
                'button',
                {
                  class: 'ui-date-picker-panel__nav is-next-year',
                  type: 'button',
                  disabled: Boolean(props.disabled),
                  'aria-label': '下一组',
                  onClick: () => state.move(panel, 1, true)
                },
                '»'
              )
            ]),
            type !== 'date'
              ? null
              : h('div', { class: ['ui-date-picker-panel__weekdays', showWeek ? 'is-with-week' : ''] }, [
                  showWeek ? h('span', { class: 'ui-date-picker-panel__weekday is-week-number' }, '周') : null,
                  ...WEEK_LABELS.map((label) => h('span', { class: 'ui-date-picker-panel__weekday' }, label))
                ]),
            h(
              'div',
              { class: ['ui-date-picker-panel__grid', `is-${type}`, showWeek ? 'is-with-week' : ''] },
              type === 'date'
                ? rows.map((row) =>
                    h('div', { class: 'ui-date-picker-panel__row' }, [
                      showWeek
                        ? h('span', { class: 'ui-date-picker-panel__week-number' }, String(isoWeek(row[0].date)))
                        : null,
                      ...row.map((cell) => {
                        const cellClasses = state.cellClass(cell.date)
                        return h(
                          'button',
                          {
                            key: cell.key,
                            class: ['ui-date-picker-panel__cell', cell.outside ? 'is-outside' : '', ...cellClasses],
                            type: 'button',
                            disabled: Boolean(props.disabled) || cellClasses.includes('is-disabled'),
                            onClick: () => state.pick(cell.date)
                          },
                          cell.label
                        )
                      })
                    ])
                  )
                : cells.map((cell) => {
                    const cellClasses = state.cellClass(cell.date)
                    return h(
                      'button',
                      {
                        key: cell.key,
                        class: ['ui-date-picker-panel__cell', cell.outside ? 'is-outside' : '', ...cellClasses],
                        type: 'button',
                        disabled: Boolean(props.disabled) || cellClasses.includes('is-disabled'),
                        onClick: () => state.pick(cell.date)
                      },
                      cell.label
                    )
                  })
            )
          ])
        }

        const panels = [renderPanel(state.leftMonth, 'left')]
        if (props.isRange && type === 'date') {
          panels.push(renderPanel(state.rightMonth, 'right'))
        }

        const shortcuts = Array.isArray(props.shortcuts) ? props.shortcuts : []
        const shortcutNodes = shortcuts
          .map((item: Record<string, unknown>, index: number) =>
            h(
              'button',
              {
                key: index,
                class: 'ui-date-picker-panel__shortcut',
                type: 'button',
                disabled: Boolean(props.disabled),
                onClick: () => state.applyShortcut(item.value)
              },
              String(item.text ?? '')
            )
          )
          .filter(Boolean)

        const footer = state.hasFooter
          ? h('div', { class: 'ui-date-picker-panel__footer' }, [
              props.showNow !== false
                ? h(
                    'button',
                    {
                      class: 'ui-date-picker-panel__now',
                      type: 'button',
                      disabled: Boolean(props.disabled),
                      onClick: () => state.pickNow()
                    },
                    '此刻'
                  )
                : null,
              state.hasClear
                ? h(
                    'button',
                    {
                      class: 'ui-date-picker-panel__clear',
                      type: 'button',
                      disabled: Boolean(props.disabled),
                      onClick: () => state.clear()
                    },
                    '清空'
                  )
                : null,
              props.showConfirm
                ? h(
                    'button',
                    {
                      class: 'ui-date-picker-panel__confirm',
                      type: 'button',
                      disabled: Boolean(props.disabled) || !state.canConfirm,
                      onClick: () => state.confirm()
                    },
                    '确定'
                  )
                : null
            ])
          : null

        return [
          shortcutNodes.length
            ? h('div', { class: 'ui-date-picker-panel__body' }, [
                h('div', { class: 'ui-date-picker-panel__shortcuts' }, shortcutNodes),
                h('div', { class: 'ui-date-picker-panel__panels' }, panels)
              ])
            : h('div', { class: 'ui-date-picker-panel__panels' }, panels),
          footer
        ]
      }
    },
    features
  )
}
