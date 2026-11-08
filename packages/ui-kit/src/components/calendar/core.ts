import { computed, h, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { formatLocale, useLocale } from '../../shared/config'
import { renderIcon } from '../../shared/icon'
import './core.css'

const calendarBaseProps = {
  modelValue: { type: null },
  controllerType: { type: String, default: 'button' }
}

function toDate(value: unknown): Date {
  if (value instanceof Date) {
    return value
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }
  return new Date()
}

function toDateOnly(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getFullYear(), value.getMonth(), value.getDate())
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }
  return null
}

function sameDay(a: Date | null, b: Date | null): boolean {
  return (
    !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  )
}

function formatDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function createCalendar(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiCalendar',
      baseClass: 'ui-calendar',
      props: calendarBaseProps,
      setup(props, { emit }) {
        const locale = useLocale('calendar')
        const hasRange = computed(() => Array.isArray(props.range))
        const pendingStart = ref<Date | null>(null)
        const innerValue = ref<unknown>(props.modelValue)
        const rangeValue = computed(() => {
          if (pendingStart.value) {
            return { start: pendingStart.value, end: null as Date | null }
          }
          const value = innerValue.value
          if (Array.isArray(value)) {
            const start = toDateOnly(value[0])
            const end = toDateOnly(value[1])
            if (start || end) {
              return { start: start ?? end, end: start ? end : null }
            }
          }
          if (Array.isArray(props.range) && props.range.length >= 2) {
            const start = toDateOnly(props.range[0])
            const end = toDateOnly(props.range[1])
            if (start && end) {
              return { start, end }
            }
          }
          return { start: null, end: null }
        })
        const initial = hasRange.value ? (rangeValue.value.start ?? toDate(innerValue.value)) : toDate(innerValue.value)
        const viewYear = ref(initial.getFullYear())
        const viewMonth = ref(initial.getMonth())

        watch(
          () => props.modelValue,
          (value) => {
            innerValue.value = value
            if (Array.isArray(value) && toDateOnly(value[0]) && toDateOnly(value[1])) {
              pendingStart.value = null
            }
          }
        )

        function changeMonth(delta: number) {
          const next = new Date(viewYear.value, viewMonth.value + delta, 1)
          viewYear.value = next.getFullYear()
          viewMonth.value = next.getMonth()
        }

        function selectDate(day: number) {
          const next = new Date(viewYear.value, viewMonth.value, day)
          if (!hasRange.value) {
            innerValue.value = next
            emit('update:modelValue', next)
            emit('change', next)
            return
          }
          if (!pendingStart.value) {
            pendingStart.value = next
            return
          }
          let start = pendingStart.value
          let end = next
          if (end.getTime() < start.getTime()) {
            const swap = start
            start = end
            end = swap
          }
          pendingStart.value = null
          innerValue.value = [start, end]
          emit('update:modelValue', [start, end])
          emit('change', [start, end])
        }

        function cellDate(day: number): Date {
          return new Date(viewYear.value, viewMonth.value, day)
        }

        function isSelected(day: number) {
          if (hasRange.value) {
            const value = rangeValue.value
            return sameDay(cellDate(day), value.start) || sameDay(cellDate(day), value.end)
          }
          const selected = toDate(innerValue.value)
          return (
            selected.getFullYear() === viewYear.value &&
            selected.getMonth() === viewMonth.value &&
            selected.getDate() === day
          )
        }

        function isRangeStart(day: number) {
          return hasRange.value && sameDay(cellDate(day), rangeValue.value.start)
        }

        function isRangeEnd(day: number) {
          return hasRange.value && sameDay(cellDate(day), rangeValue.value.end)
        }

        function isInRange(day: number) {
          const { start, end } = rangeValue.value
          if (!hasRange.value || !start || !end) {
            return false
          }
          const time = cellDate(day).getTime()
          return time > start.getTime() && time < end.getTime()
        }

        function isToday(day: number) {
          const now = new Date()
          return now.getFullYear() === viewYear.value && now.getMonth() === viewMonth.value && now.getDate() === day
        }

        function days(): Array<number | null> {
          const firstWeekday = (new Date(viewYear.value, viewMonth.value, 1).getDay() + 6) % 7
          const total = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
          const cells: Array<number | null> = Array.from({ length: firstWeekday }, () => null)
          for (let day = 1; day <= total; day += 1) {
            cells.push(day)
          }
          while (cells.length % 7 !== 0) {
            cells.push(null)
          }
          return cells
        }

        return {
          locale,
          viewYear,
          viewMonth,
          pendingStart,
          changeMonth,
          selectDate,
          isSelected,
          isRangeStart,
          isRangeEnd,
          isInRange,
          isToday,
          days,
          get hasRange() {
            return hasRange.value
          },
          get rangeText() {
            const { start, end } = rangeValue.value
            if (pendingStart.value) {
              return formatLocale(locale.value.startHintFormat, { start: formatDay(pendingStart.value) })
            }
            if (start && end) {
              return formatLocale(locale.value.rangeFormat, { start: formatDay(start), end: formatDay(end) })
            }
            if (start) {
              return formatLocale(locale.value.startHintFormat, { start: formatDay(start) })
            }
            return locale.value.rangeHint
          },
          get title() {
            return formatLocale(locale.value.monthTitleFormat, {
              year: viewYear.value,
              month: viewMonth.value + 1
            })
          }
        }
      },
      classes: (props) => [
        props.controllerType ? `is-controller-${props.controllerType}` : '',
        Array.isArray(props.range) ? 'is-range' : ''
      ],
      content: ({ state }) => [
        h('div', { class: 'ui-calendar__header' }, [
          h(
            'button',
            {
              class: 'ui-calendar__nav',
              type: 'button',
              'aria-label': 'Previous month',
              onClick: () => state.changeMonth(-1)
            },
            [renderIcon(ChevronLeft)]
          ),
          h('span', { class: 'ui-calendar__title' }, state.title),
          h(
            'button',
            {
              class: 'ui-calendar__nav',
              type: 'button',
              'aria-label': 'Next month',
              onClick: () => state.changeMonth(1)
            },
            [renderIcon(ChevronRight)]
          )
        ]),
        state.hasRange ? h('div', { class: 'ui-calendar__range-tip' }, state.rangeText) : null,
        h(
          'div',
          { class: 'ui-calendar__weekdays' },
          state.locale.value.weekdays.map((day: string) => h('span', { class: 'ui-calendar__weekday', key: day }, day))
        ),
        h(
          'div',
          { class: 'ui-calendar__grid' },
          state.days().map((day: number | null, index: number) =>
            h(
              'div',
              {
                key: index,
                class: [
                  'ui-calendar__cell',
                  day === null ? 'is-empty' : '',
                  day !== null && state.isSelected(day) ? 'is-selected' : '',
                  day !== null && state.isRangeStart(day) ? 'is-range-start' : '',
                  day !== null && state.isRangeEnd(day) ? 'is-range-end' : '',
                  day !== null && state.isInRange(day) ? 'is-in-range' : '',
                  day !== null && state.isToday(day) ? 'is-today' : ''
                ],
                onClick: () => {
                  if (day !== null) {
                    state.selectDate(day)
                  }
                }
              },
              day === null ? '' : String(day)
            )
          )
        )
      ]
    },
    features
  )
}
