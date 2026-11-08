import type { CSSProperties, Ref, VNodeChild } from 'vue'
import { Teleport, computed, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { formatLocale, useLocale } from '../../shared/config'
import { renderIcon } from '../../shared/icon'
import { useFloatingPanel } from '../../shared/panel'
import {
  addMonths,
  compareDate,
  formatDateValue,
  hasSecondsToken,
  isoWeekNumber,
  monthCells,
  pad,
  parseDateValue,
  startOfMonth
} from '../../shared/date'
import './core.css'

const datePickerBaseProps = {
  type: { type: String, default: 'date' },
  size: { type: String },
  disabled: { type: Boolean },
  modelValue: { type: [Array, String, Number], default: '' },
  defaultValue: { type: [Array, Date, String] },
  id: { type: [Array, String] },
  name: { type: [Array, String] },
  format: { type: String },
  dateFormat: { type: String },
  timeFormat: { type: String },
  saveOnBlur: { type: Boolean, default: true },
  readonly: { type: Boolean },
  placeholder: { type: String, default: '' },
  isRange: { type: Boolean },
  disabledHours: { type: Function },
  disabledMinutes: { type: Function },
  disabledSeconds: { type: Function },
  disabledDate: { type: Function },
  cellClassName: { type: Function },
  shortcuts: { type: Array, default: () => [] },
  tabindex: { type: [String, Number], default: 0 },
  singlePanel: { type: Boolean },
  ariaLabel: { type: String },
  showNow: { type: Boolean, default: true },
  showConfirm: { type: Boolean, default: true },
  showFooter: { type: Boolean, default: true }
}

export function createDatePicker(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiDatePicker',
      baseClass: 'ui-date-picker',
      props: datePickerBaseProps,
      emits: ['update:modelValue', 'change', 'clear', 'visible-change'],
      setup(props, { emit }) {
        const locale = useLocale('datePicker')
        const open = ref(false)
        const view = ref<'date' | 'month' | 'year'>('date')
        const panelDate = ref<Date>(startOfMonth(new Date()))
        const selectedDate = ref<Date | null>(null)
        // type=dates 多选：面板内维护一组勾选日期（归一到当地零点），每次切换以字符串数组抛值
        const selectedDates = ref<Date[]>([])
        const rangeStart = ref<Date | null>(null)
        const rangeEnd = ref<Date | null>(null)
        const rightPanelDate = ref<Date>(startOfMonth(new Date()))
        const rightOffset = ref(1)
        const hours = ref(new Date().getHours())
        const minutes = ref(new Date().getMinutes())
        const seconds = ref(new Date().getSeconds())
        const triggerRef = ref<HTMLElement>()
        const panelRef = ref<HTMLElement>()
        // 打开时的活动元素（触发元素），仅键盘关闭时归还焦点，与 dialog 的 restoreFocus 口径一致
        let restoreTarget: HTMLElement | null = null

        const range = computed(() => Boolean(props.isRange) || String(props.type || 'date').endsWith('range'))
        const type = computed(() => String(props.type || 'date'))
        const isDates = computed(() => type.value === 'dates')
        const isDatetime = computed(() => type.value.includes('datetime') || type.value.includes('time'))
        const baseView = computed<'date' | 'month' | 'year'>(() => {
          if (type.value.startsWith('month')) {
            return 'month'
          }
          if (type.value.startsWith('year')) {
            return 'year'
          }
          return 'date'
        })
        // 只认 s/ss token：格式串里带字面 s（如 '(summer)'）不得误开秒列，
        // 与 time-picker 共用 shared/date 的判定，保持两处口径一致
        const showSeconds = computed(() => hasSecondsToken(String(props.timeFormat || props.format || 'HH:mm:ss')))

        const { position, refresh } = useFloatingPanel({
          props,
          open: () => open.value,
          close: closePanel,
          trigger: triggerRef,
          panel: panelRef,
          placement: () => String(props.placement || 'bottom-start'),
          offset: () => 4,
          matchWidth: () => false,
          fallbackPlacements: () => props.fallbackPlacements as string[] | undefined
        })

        const displayFormat = computed(() => {
          if (props.format) {
            return String(props.format)
          }
          if (isDatetime.value) {
            return `${props.dateFormat || 'YYYY-MM-DD'} ${props.timeFormat || 'HH:mm:ss'}`
          }
          if (type.value.startsWith('month')) {
            return 'YYYY-MM'
          }
          if (type.value.startsWith('year')) {
            return 'YYYY'
          }
          return 'YYYY-MM-DD'
        })

        const outputFormat = computed(() => {
          if (props.valueFormat) {
            return String(props.valueFormat)
          }
          if (type.value.startsWith('year')) {
            return 'YYYY'
          }
          if (type.value.startsWith('month') && !range.value) {
            return 'YYYY-MM'
          }
          if (type.value.includes('datetime')) {
            return 'YYYY-MM-DD HH:mm:ss'
          }
          return 'YYYY-MM-DD'
        })

        const parsedStart = computed(() => {
          const value = props.modelValue
          if (range.value) {
            return Array.isArray(value) ? parseDateValue(value[0]) : null
          }
          return parseDateValue(value)
        })
        const parsedEnd = computed(() => {
          const value = props.modelValue
          if (range.value && Array.isArray(value)) {
            return parseDateValue(value[1])
          }
          return null
        })

        const displayStart = computed(() =>
          parsedStart.value ? formatDateValue(parsedStart.value, displayFormat.value) : ''
        )
        const displayEnd = computed(() =>
          parsedEnd.value ? formatDateValue(parsedEnd.value, displayFormat.value) : ''
        )
        const hasValue = computed(() => {
          if (range.value) {
            return Boolean(displayStart.value && displayEnd.value)
          }
          return Boolean(displayStart.value)
        })

        // F-65：editable 由 date-picker.editable 特性提供，裁剪掉时是 undefined。
        // 与 TimePicker 的 F-64 同源，只认显式 true 才能保证"关掉特性=不可键入"，
        // 由 scripts/verify-governance.mjs 的全库静态守卫守护。
        const canEdit = computed(() => props.editable === true && !props.readonly && !props.disabled)
        const secondPanelDate = computed(() =>
          props.unlinkPanels ? rightPanelDate.value : addMonths(panelDate.value, rightOffset.value)
        )
        const startText = ref(displayStart.value)
        const endText = ref(displayEnd.value)

        watch([displayStart, displayEnd], ([start, end]) => {
          startText.value = start
          endText.value = end
        })

        watch(
          () => props.unlinkPanels,
          (unlinked) => {
            if (unlinked) {
              rightPanelDate.value = addMonths(panelDate.value, rightOffset.value)
              return
            }
            rightOffset.value = Math.max(1, monthGap(panelDate.value, rightPanelDate.value))
          }
        )

        function monthGap(left: Date, right: Date): number {
          return (right.getFullYear() - left.getFullYear()) * 12 + right.getMonth() - left.getMonth()
        }

        function syncDrafts() {
          startText.value = displayStart.value
          endText.value = displayEnd.value
        }

        function emitValue(value: any) {
          emit('update:modelValue', value)
          emit('change', value)
        }

        function clearValue() {
          const valueOnClear = props.valueOnClear
          const next =
            typeof valueOnClear === 'function'
              ? valueOnClear()
              : valueOnClear !== undefined && valueOnClear !== null
                ? valueOnClear
                : range.value
                  ? []
                  : ''
          emit('clear')
          emitValue(next)
        }

        function withTime(date: Date): Date {
          const next = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            hours.value,
            minutes.value,
            seconds.value
          )
          return next
        }

        function finalize(date: Date): Date {
          return isDatetime.value ? withTime(date) : date
        }

        function commitSingle(date: Date) {
          selectedDate.value = new Date(date.getFullYear(), date.getMonth(), date.getDate())
          emitValue(formatDateValue(finalize(date), outputFormat.value))
        }

        function commitRange() {
          if (!rangeStart.value || !rangeEnd.value) {
            return
          }
          emitValue([
            formatDateValue(finalize(rangeStart.value), outputFormat.value),
            formatDateValue(finalize(rangeEnd.value), outputFormat.value)
          ])
        }

        function commitValue(date: Date, close: boolean) {
          if (!range.value) {
            commitSingle(date)
            if (close) {
              closePanel()
            }
            return
          }
          if (!rangeStart.value || (rangeStart.value && rangeEnd.value)) {
            rangeStart.value = date
            rangeEnd.value = null
            rightOffset.value = 1
            return
          }
          if (compareDate(date, rangeStart.value) < 0) {
            rangeEnd.value = rangeStart.value
            rangeStart.value = date
          } else {
            rangeEnd.value = date
          }
          commitRange()
          closePanel()
        }

        function defaultDateAt(index: number): Date | null {
          const list = props.defaultValue
          if (Array.isArray(list)) {
            return parseDateValue(list[index])
          }
          return index === 0 ? parseDateValue(list) : null
        }

        function syncFromValue() {
          if (isDates.value) {
            const list = Array.isArray(props.modelValue) ? props.modelValue : []
            selectedDates.value = list
              .map((item) => parseDateValue(item))
              .filter((date): date is Date => Boolean(date))
              .map((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()))
          }
          const start = parsedStart.value ?? defaultDateAt(0)
          const end = parsedEnd.value ?? (range.value ? defaultDateAt(1) : null)
          selectedDate.value = start ? new Date(start.getTime()) : null
          rangeStart.value = start ? new Date(start.getTime()) : null
          rangeEnd.value = end ? new Date(end.getTime()) : null
          const anchor = start ?? end ?? new Date()
          panelDate.value = startOfMonth(anchor)
          const gap = start && end ? monthGap(start, end) : 0
          rightOffset.value = Math.max(1, gap)
          rightPanelDate.value = addMonths(panelDate.value, rightOffset.value)
          hours.value = anchor.getHours()
          minutes.value = anchor.getMinutes()
          seconds.value = anchor.getSeconds()
          view.value = baseView.value
          syncDrafts()
        }

        function commitDraft(part: 'start' | 'end', close: boolean) {
          if (!canEdit.value) {
            syncDrafts()
            return
          }
          if (startText.value === displayStart.value && endText.value === displayEnd.value) {
            return
          }
          if (range.value) {
            let start = parseDateValue(startText.value)
            let end = parseDateValue(endText.value)
            if (!start) {
              syncDrafts()
              return
            }
            if (!end) {
              rangeStart.value = start
              rangeEnd.value = null
              panelDate.value = startOfMonth(start)
              rightOffset.value = 1
              rightPanelDate.value = addMonths(panelDate.value, 1)
              return
            }
            if (compareDate(start, end) > 0) {
              const swap = start
              start = end
              end = swap
            }
            rangeStart.value = start
            rangeEnd.value = end
            panelDate.value = startOfMonth(start)
            rightOffset.value = Math.max(1, monthGap(start, end))
            rightPanelDate.value = addMonths(panelDate.value, rightOffset.value)
            commitRange()
            startText.value = formatDateValue(finalize(start), displayFormat.value)
            endText.value = formatDateValue(finalize(end), displayFormat.value)
            if (close) {
              closePanel()
            }
            return
          }
          const parsed = parseDateValue(part === 'start' ? startText.value : endText.value)
          if (!parsed) {
            syncDrafts()
            return
          }
          hours.value = parsed.getHours()
          minutes.value = parsed.getMinutes()
          seconds.value = parsed.getSeconds()
          panelDate.value = startOfMonth(parsed)
          commitSingle(parsed)
          startText.value = formatDateValue(finalize(parsed), displayFormat.value)
          if (close) {
            closePanel()
          }
        }

        function handleDraftInput(part: 'start' | 'end', event: Event) {
          const text = (event.target as HTMLInputElement).value
          if (part === 'start') {
            startText.value = text
            return
          }
          endText.value = text
        }

        function handleDraftKeydown(part: 'start' | 'end', event: KeyboardEvent) {
          if (event.key === 'Enter') {
            event.preventDefault()
            // 草稿未改动时回车没有可提交内容，语义即打开面板；有改动时保持"提交并收起"的原路径
            if (!open.value && startText.value === displayStart.value && endText.value === displayEnd.value) {
              openPanel()
              focusActiveDay()
              return
            }
            commitDraft(part, true)
            return
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            if (!open.value) {
              openPanel()
              focusActiveDay()
            }
            return
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            syncDrafts()
            closePanel(true)
          }
        }

        // 输入框的 keydown 冒泡到这里时已由 handleDraftKeydown 分流，再处理会重复打开/抢焦点
        function handleTriggerKeydown(event: KeyboardEvent) {
          if ((event.target as HTMLElement | null)?.closest('input')) {
            return
          }
          if (event.key === 'Enter' || event.key === 'ArrowDown') {
            event.preventDefault()
            openPanel()
            focusActiveDay()
            return
          }
          if (event.key === 'Escape' && open.value) {
            event.preventDefault()
            closePanel(true)
          }
        }

        // 键盘打开后焦点落进网格：优先已选日，其次今天，兜底第一个非禁用日格
        function focusActiveDay() {
          nextTick(() => {
            const cells = Array.from(panelRef.value?.querySelectorAll<HTMLButtonElement>('.ui-date-picker__cell') ?? [])
            const target =
              cells.find((cell) => cell.classList.contains('is-selected') && !cell.disabled) ??
              cells.find((cell) => cell.classList.contains('is-today') && !cell.disabled) ??
              cells.find((cell) => !cell.disabled)
            target?.focus({ preventScroll: true })
          })
        }

        function handleDraftBlur(part: 'start' | 'end') {
          if (!canEdit.value) {
            return
          }
          if (props.saveOnBlur === false) {
            syncDrafts()
            return
          }
          commitDraft(part, false)
        }

        function handleDraftPointer(event: Event) {
          event.stopPropagation()
          if (!open.value && !props.disabled && !props.readonly) {
            openPanel()
          }
        }

        function openPanel() {
          if (props.disabled || props.readonly || open.value) {
            return
          }
          const active = document.activeElement
          restoreTarget = active instanceof HTMLElement ? active : null
          syncFromValue()
          open.value = true
          emit('visible-change', true)
          nextTick(refresh)
        }

        // 外点关闭不归还焦点：用户焦点已落在新目标上，抢回来反而打断点击流
        function closePanel(restoreFocus = false) {
          if (!open.value) {
            return
          }
          open.value = false
          emit('visible-change', false)
          if (restoreFocus) {
            const target = restoreTarget ?? triggerRef.value ?? null
            restoreTarget = null
            nextTick(() => target?.focus({ preventScroll: true }))
          }
        }

        function togglePanel() {
          if (open.value) {
            closePanel()
          } else {
            openPanel()
          }
        }

        function isSameDay(left: Date | null, right: Date | null): boolean {
          if (!left || !right) {
            return false
          }
          return (
            left.getFullYear() === right.getFullYear() &&
            left.getMonth() === right.getMonth() &&
            left.getDate() === right.getDate()
          )
        }

        function isSameMonth(left: Date | null, right: Date | null): boolean {
          if (!left || !right) {
            return false
          }
          return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
        }

        function isSameYear(left: Date | null, right: Date | null): boolean {
          return Boolean(left && right && left.getFullYear() === right.getFullYear())
        }

        function isDisabled(date: Date): boolean {
          if (typeof props.disabledDate !== 'function') {
            return false
          }
          return Boolean(props.disabledDate(date))
        }

        function cellClassNames(date: Date): string[] {
          if (typeof props.cellClassName !== 'function') {
            return []
          }
          const value = props.cellClassName(date)
          if (!value) {
            return []
          }
          return String(value).split(/\s+/).filter(Boolean)
        }

        function shiftPanelAt(target: Ref<Date>, direction: number) {
          const date = target.value
          if (view.value === 'year') {
            target.value = new Date(date.getFullYear() + direction * 12, date.getMonth(), 1)
            return
          }
          if (view.value === 'month') {
            target.value = new Date(date.getFullYear() + direction, date.getMonth(), 1)
            return
          }
          target.value = addMonths(date, direction)
        }

        function shiftPanel(direction: number) {
          shiftPanelAt(panelDate, direction)
        }

        function datesValue(): string[] {
          return [...selectedDates.value]
            .sort((left, right) => compareDate(left, right))
            .map((date) => formatDateValue(date, outputFormat.value))
        }

        function toggleDate(date: Date) {
          const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
          const existing = selectedDates.value.findIndex((item) => isSameDay(item, day))
          selectedDates.value =
            existing >= 0
              ? selectedDates.value.filter((_item, index) => index !== existing)
              : [...selectedDates.value, day]
          emitValue(datesValue())
        }

        function handleDayClick(date: Date) {
          if (isDisabled(date)) {
            return
          }
          if (isDates.value) {
            // 多选：切换该日勾选状态、按日期升序抛字符串数组，面板保持展开不收起
            toggleDate(date)
            return
          }
          commitValue(date, !isDatetime.value)
        }

        function handleMonthClick(monthIndex: number) {
          const next = new Date(panelDate.value.getFullYear(), monthIndex, 1)
          panelDate.value = next
          if (baseView.value === 'month') {
            commitValue(next, true)
            return
          }
          view.value = 'date'
        }

        function handleYearClick(year: number) {
          const next = new Date(year, panelDate.value.getMonth(), 1)
          panelDate.value = next
          if (baseView.value === 'year') {
            commitValue(next, true)
            return
          }
          view.value = 'month'
        }

        function applyTime() {
          if (range.value) {
            if (rangeStart.value && rangeEnd.value) {
              commitRange()
            }
            return
          }
          if (selectedDate.value) {
            commitSingle(selectedDate.value)
          }
        }

        function setNow() {
          const now = new Date()
          if (isDates.value) {
            // 多选下「今天」把今天并入勾选项，保持面板展开
            panelDate.value = startOfMonth(now)
            if (!selectedDates.value.some((item) => isSameDay(item, now))) {
              toggleDate(now)
            }
            return
          }
          hours.value = now.getHours()
          minutes.value = now.getMinutes()
          seconds.value = now.getSeconds()
          if (range.value) {
            rangeStart.value = now
            rangeEnd.value = now
            panelDate.value = startOfMonth(now)
            rightOffset.value = 1
            rightPanelDate.value = addMonths(panelDate.value, 1)
            commitRange()
            closePanel()
            return
          }
          panelDate.value = startOfMonth(now)
          commitValue(now, !isDatetime.value)
        }

        function applyShortcut(shortcut: Record<string, any>) {
          const value = shortcut?.value
          if (typeof value === 'function') {
            const resolved = value()
            if (resolved instanceof Date) {
              commitValue(resolved, true)
            }
            return
          }
          if (value instanceof Date) {
            commitValue(value, true)
            return
          }
          if (Array.isArray(value)) {
            const start = parseDateValue(value[0])
            const end = parseDateValue(value[1])
            if (start && end) {
              rangeStart.value = start
              rangeEnd.value = end
              panelDate.value = startOfMonth(start)
              rightOffset.value = Math.max(1, monthGap(start, end))
              rightPanelDate.value = addMonths(panelDate.value, rightOffset.value)
              commitRange()
              closePanel()
            }
            return
          }
          const parsed = parseDateValue(value)
          if (parsed) {
            commitValue(parsed, true)
          }
        }

        function confirmPanel() {
          if (isDates.value) {
            // 多选下「确定」提交当前勾选项并收起面板
            emitValue(datesValue())
            closePanel()
            return
          }
          if (range.value) {
            commitRange()
            closePanel()
            return
          }
          if (selectedDate.value) {
            commitSingle(selectedDate.value)
          }
          closePanel()
        }

        function isHourDisabled(hour: number): boolean {
          if (typeof props.disabledHours !== 'function') {
            return false
          }
          const list = props.disabledHours()
          return Array.isArray(list) && list.includes(hour)
        }

        function isMinuteDisabled(minute: number): boolean {
          if (typeof props.disabledMinutes !== 'function') {
            return false
          }
          const list = props.disabledMinutes(hours.value)
          return Array.isArray(list) && list.includes(minute)
        }

        function isSecondDisabled(second: number): boolean {
          if (typeof props.disabledSeconds !== 'function') {
            return false
          }
          const list = props.disabledSeconds(hours.value, minutes.value)
          return Array.isArray(list) && list.includes(second)
        }

        function handleGridKeydown(event: KeyboardEvent) {
          const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
          if (!keys.includes(event.key)) {
            return
          }
          const target = (event.target as HTMLElement | null)?.closest('.ui-date-picker__cell') as HTMLElement | null
          if (!target) {
            return
          }
          const grid = target.closest('.ui-date-picker__grid')
          const cells = Array.from(grid?.querySelectorAll<HTMLButtonElement>('.ui-date-picker__cell') ?? [])
          if (!cells.length) {
            return
          }
          event.preventDefault()
          const currentIndex = cells.indexOf(target as HTMLButtonElement)
          const enabled = (index: number) => index >= 0 && index < cells.length && !cells[index].disabled
          if (event.key === 'Home' || event.key === 'End') {
            const step = event.key === 'Home' ? 1 : -1
            const edge = event.key === 'Home' ? 0 : cells.length - 1
            for (let offset = 0; offset < cells.length; offset += 1) {
              const index = edge + step * offset
              if (enabled(index)) {
                cells[index].focus({ preventScroll: true })
                return
              }
            }
            return
          }
          // 日格按 7 列排布，↑↓ 按整周跳；禁用日拿不到焦点，逐格扫描跳过（对齐 menu/tree 的 skip-disabled 口径）
          const step =
            event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' ? -7 : 7
          for (let offset = 1; offset < cells.length; offset += 1) {
            const index = currentIndex + step * offset
            if (index < 0 || index >= cells.length) {
              break
            }
            if (enabled(index)) {
              cells[index].focus({ preventScroll: true })
              return
            }
          }
        }

        function handleKeydown(event: KeyboardEvent) {
          if (event.key === 'Escape' && open.value) {
            event.preventDefault()
            closePanel(true)
            return
          }
          handleGridKeydown(event)
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

        function renderDayCell(date: Date, month: number): VNodeChild {
          const inMonth = date.getMonth() === month
          // 上下月补位格不参与选中/区间高亮，避免同一日期在相邻月份重复高亮
          const selected =
            inMonth &&
            (isDates.value
              ? selectedDates.value.some((item) => isSameDay(item, date))
              : range.value
                ? isSameDay(date, rangeStart.value) || isSameDay(date, rangeEnd.value)
                : isSameDay(date, selectedDate.value))
          const inRange = Boolean(
            inMonth &&
              range.value &&
              rangeStart.value &&
              rangeEnd.value &&
              compareDate(date, rangeStart.value) > 0 &&
              compareDate(date, rangeEnd.value) < 0
          )
          const today = inMonth && isSameDay(date, new Date())
          return h(
            'button',
            {
              key: date.getTime(),
              class: [
                'ui-date-picker__cell',
                {
                  'is-outside': !inMonth,
                  'is-today': today,
                  'is-selected': selected,
                  'is-in-range': inRange,
                  'is-disabled': isDisabled(date)
                },
                ...cellClassNames(date)
              ],
              type: 'button',
              disabled: isDisabled(date),
              onClick: () => handleDayClick(date)
            },
            String(date.getDate())
          )
        }

        function renderMonthGrid(monthDate: Date): VNodeChild {
          const month = monthDate.getMonth()
          const showWeek = Boolean(props.showWeekNumber)
          const cells = monthCells(monthDate)
          const rows: VNodeChild[] = []
          if (showWeek) {
            for (let row = 0; row < 6; row += 1) {
              const weekStart = cells[row * 7]
              rows.push(
                h(
                  'span',
                  {
                    key: `week-${row}`,
                    class: 'ui-date-picker__week-num',
                    title: formatLocale(locale.value.weekNumberFormat, { week: isoWeekNumber(weekStart) })
                  },
                  `W${isoWeekNumber(weekStart)}`
                )
              )
              for (let column = 0; column < 7; column += 1) {
                rows.push(renderDayCell(cells[row * 7 + column], month))
              }
            }
          } else {
            rows.push(...cells.map((date) => renderDayCell(date, month)))
          }
          return h('div', { class: 'ui-date-picker__month' }, [
            h('div', { class: ['ui-date-picker__weekdays', showWeek ? 'is-week' : ''] }, [
              showWeek ? h('span', { class: 'ui-date-picker__weekday is-week', key: 'week' }, locale.value.week) : null,
              ...locale.value.weekdays.map((label) =>
                h('span', { class: 'ui-date-picker__weekday', key: label }, label)
              )
            ]),
            h('div', { class: ['ui-date-picker__grid', showWeek ? 'is-week' : ''] }, rows)
          ])
        }

        function renderMonthView(): VNodeChild {
          const year = panelDate.value.getFullYear()
          return h(
            'div',
            { class: 'ui-date-picker__months' },
            Array.from({ length: 12 }, (_item, index) => {
              const date = new Date(year, index, 1)
              const selected = range.value
                ? isSameMonth(date, rangeStart.value) || isSameMonth(date, rangeEnd.value)
                : isSameMonth(date, selectedDate.value)
              return h(
                'button',
                {
                  key: index,
                  class: ['ui-date-picker__month-cell', selected ? 'is-selected' : ''],
                  type: 'button',
                  onClick: () => handleMonthClick(index)
                },
                formatLocale(locale.value.monthFormat, { month: index + 1 })
              )
            })
          )
        }

        function renderYearView(): VNodeChild {
          const year = panelDate.value.getFullYear()
          const start = year - (year % 12)
          return h(
            'div',
            { class: 'ui-date-picker__years' },
            Array.from({ length: 12 }, (_item, index) => {
              const date = new Date(start + index, 0, 1)
              const selected = range.value
                ? isSameYear(date, rangeStart.value) || isSameYear(date, rangeEnd.value)
                : isSameYear(date, selectedDate.value)
              return h(
                'button',
                {
                  key: index,
                  class: ['ui-date-picker__month-cell', selected ? 'is-selected' : ''],
                  type: 'button',
                  onClick: () => handleYearClick(start + index)
                },
                String(start + index)
              )
            })
          )
        }

        function renderMonthPanel(date: Date): VNodeChild {
          return h('div', { class: 'ui-date-picker__panel' }, [
            h(
              'div',
              { class: 'ui-date-picker__panel-title' },
              formatLocale(locale.value.yearMonthFormat, { year: date.getFullYear(), month: date.getMonth() + 1 })
            ),
            renderMonthGrid(date)
          ])
        }

        function renderBody(): VNodeChild {
          if (view.value === 'year') {
            return renderYearView()
          }
          if (view.value === 'month') {
            return renderMonthView()
          }
          if (range.value && !props.singlePanel) {
            if (props.unlinkPanels) {
              return h('div', { class: 'ui-date-picker__panels' }, [
                h('div', { class: 'ui-date-picker__panel' }, [
                  renderPanelHeader(panelDate.value, (direction) => shiftPanelAt(panelDate, direction)),
                  renderMonthGrid(panelDate.value)
                ]),
                h('div', { class: 'ui-date-picker__panel' }, [
                  renderPanelHeader(rightPanelDate.value, (direction) => shiftPanelAt(rightPanelDate, direction)),
                  renderMonthGrid(rightPanelDate.value)
                ])
              ])
            }
            return h('div', { class: 'ui-date-picker__panels' }, [
              renderMonthPanel(panelDate.value),
              renderMonthPanel(secondPanelDate.value)
            ])
          }
          return renderMonthGrid(panelDate.value)
        }

        function renderTimeColumn(
          label: string,
          count: number,
          current: number,
          disabledOf: (value: number) => boolean,
          onPick: (value: number) => void
        ): VNodeChild {
          return h('div', { class: 'ui-date-picker__time-column' }, [
            h('div', { class: 'ui-date-picker__time-title' }, label),
            h(
              'div',
              { class: 'ui-date-picker__time-list' },
              Array.from({ length: count }, (_item, value) =>
                h(
                  'button',
                  {
                    key: value,
                    class: [
                      'ui-date-picker__time-item',
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

        function renderTime(): VNodeChild {
          const columns: VNodeChild[] = [
            renderTimeColumn(locale.value.hour, 24, hours.value, isHourDisabled, (value) => {
              hours.value = value
              applyTime()
            }),
            renderTimeColumn(locale.value.minute, 60, minutes.value, isMinuteDisabled, (value) => {
              minutes.value = value
              applyTime()
            })
          ]
          if (showSeconds.value) {
            columns.push(
              renderTimeColumn(locale.value.second, 60, seconds.value, isSecondDisabled, (value) => {
                seconds.value = value
                applyTime()
              })
            )
          }
          return h('div', { class: 'ui-date-picker__time' }, columns)
        }

        function renderHeader(): VNodeChild {
          const year = panelDate.value.getFullYear()
          const month = panelDate.value.getMonth() + 1
          return h('div', { class: 'ui-date-picker__header' }, [
            h(
              'button',
              {
                class: 'ui-date-picker__nav',
                type: 'button',
                'aria-label': locale.value.prevPage,
                onClick: () => shiftPanel(-1)
              },
              [renderIcon(ChevronLeft)]
            ),
            h('div', { class: 'ui-date-picker__titles' }, [
              h(
                'button',
                {
                  class: ['ui-date-picker__title', view.value === 'year' ? 'is-active' : ''],
                  type: 'button',
                  onClick: () => {
                    view.value = 'year'
                  }
                },
                formatLocale(locale.value.yearFormat, { year })
              ),
              baseView.value === 'date' && !(range.value && !props.singlePanel)
                ? h(
                    'button',
                    {
                      class: ['ui-date-picker__title', view.value === 'month' ? 'is-active' : ''],
                      type: 'button',
                      onClick: () => {
                        view.value = 'month'
                      }
                    },
                    formatLocale(locale.value.monthFormat, { month })
                  )
                : null
            ]),
            h(
              'button',
              {
                class: 'ui-date-picker__nav',
                type: 'button',
                'aria-label': locale.value.nextPage,
                onClick: () => shiftPanel(1)
              },
              [renderIcon(ChevronRight)]
            )
          ])
        }

        function renderPanelHeader(date: Date, onShift: (direction: number) => void): VNodeChild {
          return h('div', { class: 'ui-date-picker__header' }, [
            h(
              'button',
              {
                class: 'ui-date-picker__nav',
                type: 'button',
                'aria-label': locale.value.prevPage,
                onClick: () => onShift(-1)
              },
              [renderIcon(ChevronLeft)]
            ),
            h('div', { class: 'ui-date-picker__titles' }, [
              h(
                'span',
                { class: 'ui-date-picker__title is-static' },
                formatLocale(locale.value.yearMonthFormat, {
                  year: date.getFullYear(),
                  month: date.getMonth() + 1
                })
              )
            ]),
            h(
              'button',
              {
                class: 'ui-date-picker__nav',
                type: 'button',
                'aria-label': locale.value.nextPage,
                onClick: () => onShift(1)
              },
              [renderIcon(ChevronRight)]
            )
          ])
        }

        function renderFooter(): VNodeChild {
          if (props.showFooter === false) {
            return null
          }
          const shortcuts = Array.isArray(props.shortcuts) ? props.shortcuts : []
          const actions: VNodeChild[] = []
          if (props.showNow !== false) {
            actions.push(
              h(
                'button',
                {
                  class: 'ui-date-picker__action',
                  type: 'button',
                  onClick: setNow
                },
                isDatetime.value ? locale.value.now : locale.value.today
              )
            )
          }
          if (props.showConfirm !== false) {
            actions.push(
              h(
                'button',
                {
                  class: 'ui-date-picker__action is-primary',
                  type: 'button',
                  onClick: confirmPanel
                },
                locale.value.confirm
              )
            )
          }
          if (!shortcuts.length && !actions.length) {
            return null
          }
          return h('div', { class: 'ui-date-picker__footer' }, [
            h(
              'div',
              { class: 'ui-date-picker__shortcuts' },
              shortcuts.map((shortcut: Record<string, any>, index: number) =>
                h(
                  'button',
                  {
                    key: index,
                    class: 'ui-date-picker__shortcut',
                    type: 'button',
                    onClick: () => applyShortcut(shortcut)
                  },
                  shortcut?.text ?? shortcut?.label ?? ''
                )
              )
            ),
            h('div', { class: 'ui-date-picker__footer-actions' }, actions)
          ])
        }

        function renderPanel(): VNodeChild {
          if (!open.value) {
            return null
          }
          const content: VNodeChild[] = []
          const unlinkedRange = range.value && !props.singlePanel && Boolean(props.unlinkPanels)
          if (!unlinkedRange) {
            content.push(renderHeader())
          }
          content.push(h('div', { class: 'ui-date-picker__body' }, [renderBody()]))
          if (isDatetime.value) {
            content.push(renderTime())
          }
          content.push(renderFooter())
          const panel = h(
            'div',
            {
              ref: panelRef,
              class: ['ui-date-picker__dropdown', 'ui-floating-panel', props.popperClass],
              style: [props.popperStyle as CSSProperties, position.value],
              onKeydown: handleKeydown
            },
            content
          )
          return h(Teleport, { to: 'body' }, panel)
        }

        return {
          locale,
          triggerRef,
          get open() {
            return open.value
          },
          get range() {
            return range.value
          },
          get hasValue() {
            return hasValue.value
          },
          get displayStart() {
            return displayStart.value
          },
          get displayEnd() {
            return displayEnd.value
          },
          get displayFormat() {
            return displayFormat.value
          },
          get startText() {
            return startText.value
          },
          get endText() {
            return endText.value
          },
          get editable() {
            return canEdit.value
          },
          get clearIcon() {
            return props.clearIcon || X
          },
          togglePanel,
          openPanel,
          closePanel,
          clearValue,
          handleDraftInput,
          handleDraftKeydown,
          handleDraftBlur,
          handleDraftPointer,
          handleTriggerKeydown,
          renderPanel
        }
      },
      classes: (props, state) => [
        props.size ? `--size-${props.size}` : '',
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
                class: 'ui-date-picker__clear',
                onClick: (event: Event) => {
                  event.stopPropagation()
                  state.clearValue()
                }
              },
              [renderIcon(state.clearIcon)]
            )
          )
        }
        actions.push(renderIcon(ChevronDown, { class: 'ui-date-picker__arrow' }))
        const inputClass = state.editable ? 'ui-date-picker__input' : 'ui-date-picker__input is-readonly'
        const inputTabindex = props.disabled ? undefined : props.tabindex
        const singleId = Array.isArray(props.id) ? props.id[0] : props.id
        const singleName = Array.isArray(props.name) ? props.name[0] : props.name
        const triggerChildren: VNodeChild[] = [
          renderIcon(props.prefixIcon || Calendar, { class: 'ui-date-picker__icon' }),
          h('input', {
            class: inputClass,
            type: 'text',
            autocomplete: 'off',
            value: state.startText,
            placeholder: props.placeholder || state.locale.value.placeholder,
            readonly: !state.editable,
            disabled: Boolean(props.disabled),
            id: singleId,
            name: singleName,
            tabindex: inputTabindex,
            onInput: (event: Event) => state.handleDraftInput('start', event),
            onClick: state.handleDraftPointer,
            onKeydown: (event: KeyboardEvent) => state.handleDraftKeydown('start', event),
            onBlur: () => state.handleDraftBlur('start')
          }),
          h('span', { class: 'ui-date-picker__actions' }, actions)
        ]
        const trigger = h(
          'div',
          {
            ref: state.triggerRef,
            class: 'ui-date-picker__trigger',
            tabindex: props.disabled ? undefined : props.tabindex,
            role: 'combobox',
            'aria-expanded': state.open,
            'aria-label': props.ariaLabel,
            onClick: state.togglePanel,
            onKeydown: state.handleTriggerKeydown
          },
          [h('div', { class: 'ui-date-picker__value-wrap' }, triggerChildren)]
        )
        const rangeIds = Array.isArray(props.id) ? props.id : [props.id]
        const rangeNames = Array.isArray(props.name) ? props.name : [props.name]
        const rangeFields = h('div', { class: 'ui-date-picker__fields' }, [
          h(
            'div',
            {
              ref: state.triggerRef,
              class: 'ui-date-picker__field',
              tabindex: props.disabled ? undefined : props.tabindex,
              role: 'combobox',
              'aria-expanded': state.open,
              onClick: state.togglePanel,
              onKeydown: state.handleTriggerKeydown
            },
            [
              renderIcon(props.prefixIcon || Calendar, { class: 'ui-date-picker__icon' }),
              h('input', {
                class: inputClass,
                type: 'text',
                autocomplete: 'off',
                value: state.startText,
                placeholder: props.startPlaceholder || state.locale.value.startPlaceholder,
                readonly: !state.editable,
                disabled: Boolean(props.disabled),
                id: rangeIds[0],
                name: rangeNames[0],
                tabindex: inputTabindex,
                onInput: (event: Event) => state.handleDraftInput('start', event),
                onClick: state.handleDraftPointer,
                onKeydown: (event: KeyboardEvent) => state.handleDraftKeydown('start', event),
                onBlur: () => state.handleDraftBlur('start')
              })
            ]
          ),
          h('span', { class: 'ui-date-picker__separator' }, props.rangeSeparator || '-'),
          h(
            'div',
            {
              class: 'ui-date-picker__field',
              tabindex: props.disabled ? undefined : props.tabindex,
              role: 'combobox',
              'aria-expanded': state.open,
              onClick: state.togglePanel,
              onKeydown: state.handleTriggerKeydown
            },
            [
              h('input', {
                class: inputClass,
                type: 'text',
                autocomplete: 'off',
                value: state.endText,
                placeholder: props.endPlaceholder || state.locale.value.endPlaceholder,
                readonly: !state.editable,
                disabled: Boolean(props.disabled),
                id: rangeIds[1],
                name: rangeNames[1],
                tabindex: inputTabindex,
                onInput: (event: Event) => state.handleDraftInput('end', event),
                onClick: state.handleDraftPointer,
                onKeydown: (event: KeyboardEvent) => state.handleDraftKeydown('end', event),
                onBlur: () => state.handleDraftBlur('end')
              })
            ]
          ),
          h('span', { class: 'ui-date-picker__actions' }, actions)
        ])
        return [state.range ? rangeFields : trigger, state.renderPanel()]
      }
    },
    features
  )
}
