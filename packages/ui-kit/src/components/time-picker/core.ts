import type { CSSProperties, VNodeChild } from 'vue'
import { Teleport, computed, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronDown, Clock, X } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { useFloatingPanel } from '../../shared/panel'
import type { TimeParts } from '../../shared/date'
import { formatDateValue, hasSecondsToken, pad, parseDateValue, parseTimeText } from '../../shared/date'
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
        const showSeconds = computed(() => hasSecondsToken(displayFormat.value))
        // 特性被裁剪掉时 props.editable 是 undefined（Vue 不会给未声明的 prop 套 default）。
        // 只认显式 true，才能保证"关掉 editable 特性 = 不可键入"，而不是漏成可编辑。
        const canEdit = computed(() => props.editable === true && !props.readonly && !props.disabled)
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
          const other = parseModelValue(valueAt(activeSide.value === 0 ? 1 : 0))
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

        function toDate(parts: TimeParts): Date {
          return new Date(2000, 0, 1, parts.hours, parts.minutes, parts.seconds)
        }

        // modelValue 按 outputFormat 写、草稿按 displayFormat 写，两者不能共用一套解析
        function parseModelValue(value: unknown): TimeParts | null {
          return parseTimeText(value, outputFormat.value)
        }

        function parseDraftText(value: unknown): TimeParts | null {
          return parseTimeText(value, displayFormat.value)
        }

        function formatDisplay(parts: TimeParts): string {
          return formatDateValue(toDate(parts), displayFormat.value)
        }

        function displayFromModel(value: unknown): string {
          const parts = parseModelValue(value)
          if (parts) {
            return formatDisplay(parts)
          }
          return value === undefined || value === null || value === '' ? '' : String(value)
        }

        function normalizeModelValue(value: unknown): string {
          const parts = parseModelValue(value)
          if (parts) {
            return formatDateValue(toDate(parts), outputFormat.value)
          }
          return value === undefined || value === null || value === '' ? '' : String(value)
        }

        // 默认值链只在这里定义一次：面板初始高亮与输入框初始回显共用（F-59）
        function initialPartsAt(index: number): TimeParts | null {
          const fallback = Array.isArray(props.defaultTime) ? props.defaultTime[index] : props.defaultTime
          const fallbackTime = parseModelValue(fallback)
          if (fallbackTime) {
            return fallbackTime
          }
          const fallbackDate = parseDateValue(fallback)
          if (fallbackDate) {
            return {
              hours: fallbackDate.getHours(),
              minutes: fallbackDate.getMinutes(),
              seconds: fallbackDate.getSeconds()
            }
          }
          const rawDefault = Array.isArray(props.defaultValue)
            ? props.defaultValue[index]
            : index === 0
              ? props.defaultValue
              : undefined
          if (rawDefault instanceof Date) {
            const date = parseDateValue(rawDefault)
            if (date) {
              return {
                hours: date.getHours(),
                minutes: date.getMinutes(),
                seconds: date.getSeconds()
              }
            }
          }
          return parseModelValue(rawDefault)
        }

        function valueAt(index: number): unknown {
          const value = props.modelValue
          if (range.value) {
            return Array.isArray(value) ? value[index] : ''
          }
          return value
        }

        function displayAt(index: number): string {
          const raw = valueAt(index)
          const parsed = parseModelValue(raw)
          if (parsed) {
            return formatDisplay(parsed)
          }
          if (raw !== undefined && raw !== null && String(raw) !== '') {
            return String(raw)
          }
          const initial = initialPartsAt(index)
          return initial ? formatDisplay(initial) : ''
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

        /**
         * 所有写回都经这里：一次操作只 emit 一次，并同步把草稿改成"显示值"，
         * 消除"输入框显示 A、modelValue 却是 B"的背离（F-56 / F-61）。
         * 区间两端一律按 outputFormat 规范化，不再出现一端带秒一端不带秒（F-60）。
         */
        function writeValue(index: number, value: string, parts: TimeParts) {
          if (!range.value) {
            drafts[0].value = formatDisplay(parts)
            drafts[1].value = ''
            emitValue(value)
            return
          }
          const current: string[] = Array.isArray(props.modelValue)
            ? props.modelValue.map(normalizeModelValue)
            : ['', '']
          while (current.length < 2) {
            current.push('')
          }
          current[index] = value
          drafts[0].value = displayFromModel(current[0])
          drafts[1].value = displayFromModel(current[1])
          emitValue(current)
        }

        function applyTime() {
          const parts = clampToRange({ hours: hours.value, minutes: minutes.value, seconds: seconds.value })
          if (parts.hours !== hours.value || parts.minutes !== minutes.value || parts.seconds !== seconds.value) {
            assignTime(parts)
          }
          writeValue(activeSide.value, formatDateValue(toDate(parts), outputFormat.value), parts)
        }

        function syncFromValue() {
          const parsed = parseModelValue(valueAt(activeSide.value))
          if (parsed) {
            assignTime(clampToRange(parsed))
            return
          }
          if (range.value) {
            const other = parseModelValue(valueAt(activeSide.value === 0 ? 1 : 0))
            if (other) {
              assignTime(other)
              return
            }
          }
          const initial = initialPartsAt(activeSide.value)
          if (initial) {
            assignTime(initial)
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

        // 触发区里的真实 <input> 只负责"打开"，不负责"关闭"（F-55）。
        // 面板已开时点输入框应能继续键入 / 移动光标，而不是把浮层收起。
        function openSide(side: number) {
          if (props.disabled || props.readonly) {
            return
          }
          if (open.value && activeSide.value === side) {
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
          if (range.value) {
            const pair = Array.isArray(next) ? next : ['', '']
            drafts[0].value = displayFromModel(pair[0])
            drafts[1].value = displayFromModel(pair[1])
          } else {
            drafts[0].value = displayFromModel(Array.isArray(next) ? next[0] : next)
            drafts[1].value = ''
          }
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
          adoptDraft(activeSide.value)
          hours.value = value
          applyTime()
          if (props.showConfirm === false) {
            closePanel()
          }
        }

        function pickMinute(value: number) {
          adoptDraft(activeSide.value)
          minutes.value = value
          applyTime()
          if (props.showConfirm === false) {
            closePanel()
          }
        }

        function pickSecond(value: number) {
          adoptDraft(activeSide.value)
          seconds.value = value
          applyTime()
          if (props.showConfirm === false) {
            closePanel()
          }
        }

        // 焦点本就在面板外（输入框上 Escape）时不动它；焦点在面板里才归还触发字段
        function restoreFieldFocus() {
          const active = document.activeElement
          const target =
            active instanceof HTMLElement && !panelRef.value?.contains(active)
              ? active
              : fieldRefs[activeSide.value]?.value
          target?.focus({ preventScroll: true })
        }

        // 键盘打开后焦点落进首列选中项（禁用时退到第一个可用项），列项本身是原生 button，Enter 即确认
        function focusSelectedItem() {
          nextTick(() => {
            const column = panelRef.value?.querySelector('.ui-time-picker__column')
            const items = Array.from(column?.querySelectorAll<HTMLButtonElement>('.ui-time-picker__time-item') ?? [])
            const target =
              items.find((item) => item.classList.contains('is-selected') && !item.disabled) ??
              items.find((item) => !item.disabled)
            target?.focus({ preventScroll: true })
          })
        }

        function handleKeydown(event: KeyboardEvent) {
          if (event.key === 'Escape' && open.value) {
            event.preventDefault()
            closePanel()
            restoreFieldFocus()
            return
          }
          if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
            return
          }
          const target = (event.target as HTMLElement | null)?.closest(
            '.ui-time-picker__time-item'
          ) as HTMLElement | null
          if (!target) {
            return
          }
          const list = target.closest('.ui-time-picker__list')
          const items = Array.from(list?.querySelectorAll<HTMLButtonElement>('.ui-time-picker__time-item') ?? [])
          if (!items.length) {
            return
          }
          event.preventDefault()
          const currentIndex = items.indexOf(target as HTMLButtonElement)
          const step = event.key === 'ArrowDown' ? 1 : -1
          // 禁用项拿不到焦点，逐格扫描跳过（对齐 menu/tree 的 skip-disabled 口径）
          for (let offset = 1; offset < items.length; offset += 1) {
            const index = currentIndex + step * offset
            if (index < 0 || index >= items.length) {
              break
            }
            if (!items[index].disabled) {
              items[index].focus({ preventScroll: true })
              return
            }
          }
        }

        // 输入框的 keydown 冒泡到这里时已由 handleDraftKeydown 分流，再处理会重复打开/抢焦点
        function handleFieldKeydown(index: number, event: KeyboardEvent) {
          if ((event.target as HTMLElement | null)?.closest('input')) {
            return
          }
          if (event.key === 'Enter' || event.key === 'ArrowDown') {
            event.preventDefault()
            openSide(index)
            focusSelectedItem()
            return
          }
          if (event.key === 'Escape' && open.value) {
            event.preventDefault()
            closePanel()
            restoreFieldFocus()
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

        /**
         * 把草稿并入面板的时分秒，不 emit。所有写回通道（回车 / 失焦 / 点列项）
         * 都先经过它，保证同一次点击不会用"打开面板时的旧值"覆盖用户输入（F-56）。
         */
        function adoptDraft(index: number): boolean {
          const text = drafts[index].value
          if (text === displayAt(index)) {
            return false
          }
          const parsed = parseDraftText(text)
          if (!parsed) {
            // 解析失败：不提交，回退到原显示
            drafts[index].value = displayAt(index)
            return false
          }
          assignTime(parsed)
          return true
        }

        function commitDraft(index: number) {
          if (!canEdit.value) {
            drafts[index].value = displayAt(index)
            return
          }
          if (!adoptDraft(index)) {
            return
          }
          const parts = { hours: hours.value, minutes: minutes.value, seconds: seconds.value }
          writeValue(index, formatDateValue(toDate(parts), outputFormat.value), parts)
        }

        function handleDraftInput(index: number, event: Event) {
          drafts[index].value = (event.target as HTMLInputElement).value
        }

        function handleDraftKeydown(index: number, event: KeyboardEvent) {
          if (event.key === 'Enter') {
            event.preventDefault()
            if (!open.value) {
              // 草稿未改动时回车没有可提交内容，语义即打开面板；有改动时保持"提交草稿"的原路径
              if (drafts[index].value !== displayAt(index)) {
                commitDraft(index)
                return
              }
              openSide(index)
              focusSelectedItem()
              return
            }
            commitDraft(index)
            return
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            if (!open.value) {
              openSide(index)
              focusSelectedItem()
            }
            return
          }
          if (event.key === 'Escape' && open.value) {
            event.preventDefault()
            closePanel()
            restoreFieldFocus()
          }
        }

        function handleDraftBlur(index: number, event?: FocusEvent) {
          const next = (event?.relatedTarget ?? document.activeElement) as Node | null
          // 焦点移到面板内部时，草稿交给 pickXxx 的 adoptDraft 统一处理，
          // 避免"输入未回车 → 点列项"这一真实浏览器序列产生两次写回。
          if (next && panelRef.value?.contains(next)) {
            return
          }
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
          openSide,
          closePanel,
          clearValue,
          renderPanel,
          displayAt,
          draftAt: (index: number) => drafts[index].value,
          handleDraftInput,
          handleDraftKeydown,
          handleDraftBlur,
          handleFieldKeydown,
          idAt,
          nameAt
        }
      },
      classes: (props, state) => [
        props.size ? `--size-${props.size}` : '',
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
              onClick: (event: MouseEvent) => {
                const target = event.target as HTMLElement | null
                // 点到真实输入框时只开不关（F-55）；图标等其余区域仍走 toggle
                if (target?.tagName === 'INPUT' || target?.closest?.('input')) {
                  state.openSide(index)
                  return
                }
                state.toggleSide(index)
              },
              onKeydown: (event: KeyboardEvent) => state.handleFieldKeydown(index, event)
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
                onBlur: (event: FocusEvent) => state.handleDraftBlur(index, event)
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
