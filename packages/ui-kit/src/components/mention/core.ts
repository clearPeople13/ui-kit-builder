import type { CSSProperties } from 'vue'
import { Teleport, h, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { useFloatingPanel } from '../../shared/panel'
import './core.css'

const mentionBaseProps = {
  value: { type: null },
  disabled: { type: Boolean },
  size: { type: String },
  modelValue: { type: String },
  type: { type: String, default: 'text' },
  options: { type: Array, default: () => [] },
  label: { type: null },
  id: { type: String },
  maxlength: { type: [String, Number] },
  minlength: { type: [String, Number] },
  resize: { type: String },
  autocomplete: { type: String, default: 'off' },
  placeholder: { type: String },
  form: { type: String },
  readonly: { type: Boolean },
  containerRole: { type: String },
  tabindex: { type: [String, Number], default: 0 },
  inputStyle: { type: [Object, Array, String, Boolean], default: () => [] },
  countGraphemes: { type: Function },
  autofocus: { type: Boolean },
  rows: { type: Number, default: 2 },
  ariaLabel: { type: String },
  inputmode: { type: String },
  name: { type: String },
  prefix: { type: [String, Array], default: '@' },
  split: { type: String, default: ' ' },
  filterable: { type: Boolean, default: true },
  filterMethod: { type: Function },
  whole: { type: Boolean },
  props: { type: Object, default: () => ({}) }
}

interface MentionTrigger {
  start: number
  end: number
  query: string
  prefix: string
}

function fieldKey(props: Record<string, any>, name: string, fallback: string): string {
  const mapping = props.props
  const value = mapping && typeof mapping === 'object' ? mapping[name] : undefined
  return typeof value === 'string' && value ? value : fallback
}

function optionLabel(item: unknown, props: Record<string, any>): string {
  if (item === null || item === undefined) {
    return ''
  }
  if (typeof item === 'string' || typeof item === 'number') {
    return String(item)
  }
  const key = fieldKey(props, 'label', 'label')
  const record = item as Record<string, unknown>
  const value = record[key] ?? record.label ?? record.value
  return value === null || value === undefined ? '' : String(value)
}

function optionDisabled(item: unknown, props: Record<string, any>): boolean {
  if (!item || typeof item !== 'object') {
    return false
  }
  const key = fieldKey(props, 'disabled', 'disabled')
  return Boolean((item as Record<string, unknown>)[key])
}

export function createMention(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiMention',
      baseClass: 'ui-mention',
      props: mentionBaseProps,
      classes: (props) => {
        const classes: string[] = []
        if (typeof props.size === 'string' && props.size) {
          classes.push(`ui-mention--size-${props.size}`)
        }
        if (props.disabled) {
          classes.push('is-disabled')
        }
        if (props.type === 'textarea') {
          classes.push('ui-mention--textarea')
        }
        return classes
      },
      styles: (props) => (props.inputStyle as CSSProperties) ?? {},
      setup(props, { emit }) {
        const inputRef = shallowRef<HTMLInputElement | HTMLTextAreaElement>()
        const panelRef = shallowRef<HTMLElement>()
        const open = ref(false)
        const options = shallowRef<unknown[]>([])
        const activeIndex = ref(-1)
        const trigger = ref<MentionTrigger | null>(null)
        let blurTimer: ReturnType<typeof setTimeout> | null = null

        const floating = useFloatingPanel({
          props,
          open: () => open.value,
          close: closePanel,
          trigger: inputRef,
          panel: panelRef,
          placement: () => props.placement ?? 'bottom-start',
          offset: () => Number(props.offset ?? 6),
          matchWidth: () => true,
          fallbackPlacements: () => props.fallbackPlacements as string[] | undefined
        })

        function clearBlurTimer() {
          if (blurTimer) {
            clearTimeout(blurTimer)
            blurTimer = null
          }
        }

        function setOpen(value: boolean) {
          if (open.value === value) {
            return
          }
          open.value = value
          emit('visible-change', value)
          if (!value) {
            activeIndex.value = -1
          }
        }

        function closePanel() {
          clearBlurTimer()
          trigger.value = null
          setOpen(false)
        }

        function findTrigger(value: string, caret: number): MentionTrigger | null {
          const before = value.slice(0, caret)
          const prefixes = Array.isArray(props.prefix) ? props.prefix : [props.prefix ?? '@']
          let best: { index: number; prefix: string } | null = null
          for (const prefix of prefixes) {
            if (!prefix) {
              continue
            }
            const index = before.lastIndexOf(prefix)
            if (index < 0) {
              continue
            }
            if (index > 0 && !/\s/.test(before[index - 1])) {
              continue
            }
            if (!best || index > best.index) {
              best = { index, prefix }
            }
          }
          if (!best) {
            return null
          }
          const query = before.slice(best.index + best.prefix.length)
          if (!props.whole) {
            if (/\s/.test(query)) {
              return null
            }
            const split = props.split || ' '
            if (split && query.includes(split)) {
              return null
            }
          }
          return { start: best.index, end: caret, query, prefix: best.prefix }
        }

        function filterOptions(query: string): unknown[] {
          const list = Array.isArray(props.options) ? props.options : []
          if (!props.filterable) {
            return list
          }
          if (typeof props.filterMethod === 'function') {
            return list.filter((item) => props.filterMethod(query, item))
          }
          const keyword = query.toLowerCase()
          return list.filter((item) => optionLabel(item, props).toLowerCase().includes(keyword))
        }

        function firstEnabledIndex(list: unknown[]): number {
          return list.findIndex((item) => !optionDisabled(item, props))
        }

        function applyTrigger(show: boolean) {
          const input = inputRef.value
          if (!input) {
            return
          }
          const value = input.value ?? ''
          const caret = input.selectionStart ?? value.length
          const found = findTrigger(value, caret)
          trigger.value = found
          if (!found) {
            closePanel()
            return
          }
          const list = filterOptions(found.query)
          options.value = list
          emit('search', found.query, found.prefix)
          activeIndex.value = firstEnabledIndex(list)
          if (show && list.length && !props.disabled && !props.readonly) {
            setOpen(true)
          } else if (!list.length) {
            setOpen(false)
          }
        }

        function handleInput(event: Event) {
          const value = (event.target as HTMLInputElement).value
          emit('update:modelValue', value)
          emit('input', value)
          clearBlurTimer()
          applyTrigger(true)
        }

        function handleFocus(event: Event) {
          clearBlurTimer()
          emit('focus', event)
          applyTrigger(true)
        }

        function handleBlur(event: Event) {
          emit('blur', event)
          clearBlurTimer()
          blurTimer = setTimeout(() => {
            blurTimer = null
            setOpen(false)
          }, 120)
        }

        function handleClick() {
          applyTrigger(true)
        }

        function handleKeyup(event: KeyboardEvent) {
          if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'].includes(event.key)) {
            return
          }
          applyTrigger(open.value)
        }

        function moveActive(delta: number) {
          const list = options.value
          if (!list.length) {
            return
          }
          const enabled = list
            .map((item, index) => ({ item, index }))
            .filter((entry) => !optionDisabled(entry.item, props))
          if (!enabled.length) {
            return
          }
          const current = enabled.findIndex((entry) => entry.index === activeIndex.value)
          let next = current + delta
          if (next < 0) {
            next = enabled.length - 1
          } else if (next >= enabled.length) {
            next = 0
          }
          activeIndex.value = enabled[next].index
          nextTick(() => {
            panelRef.value?.querySelector('.ui-mention__option.is-active')?.scrollIntoView({ block: 'nearest' })
          })
        }

        function choose(item: unknown) {
          const range = trigger.value
          if (!range || optionDisabled(item, props)) {
            return
          }
          const input = inputRef.value
          const text = input?.value ?? String(props.modelValue ?? props.value ?? '')
          const insert = range.prefix + optionLabel(item, props) + (props.split ?? ' ')
          const next = text.slice(0, range.start) + insert + text.slice(range.end)
          emit('update:modelValue', next)
          emit('input', next)
          emit('select', item)
          closePanel()
          nextTick(() => {
            if (!input) {
              return
            }
            const caret = range.start + insert.length
            input.setSelectionRange(caret, caret)
            input.focus()
          })
        }

        function handleKeydown(event: KeyboardEvent) {
          if (!open.value) {
            return
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            moveActive(1)
            return
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            moveActive(-1)
            return
          }
          if ((event.key === 'Enter' || event.key === 'Tab') && activeIndex.value >= 0) {
            event.preventDefault()
            choose(options.value[activeIndex.value])
            return
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            closePanel()
          }
        }

        function handleDocumentPointerDown(event: Event) {
          if (!open.value) {
            return
          }
          const target = event.target as Node | null
          if (target && (inputRef.value?.contains(target) || panelRef.value?.contains(target))) {
            return
          }
          closePanel()
        }

        function renderPanel() {
          if (!open.value) {
            return null
          }
          const list = options.value.map((item, index) =>
            h(
              'li',
              {
                key: index,
                role: 'option',
                class: [
                  'ui-mention__option',
                  index === activeIndex.value ? 'is-active' : '',
                  optionDisabled(item, props) ? 'is-disabled' : ''
                ],
                'aria-selected': index === activeIndex.value ? 'true' : 'false',
                onMousemove: () => {
                  if (!optionDisabled(item, props)) {
                    activeIndex.value = index
                  }
                },
                onClick: () => choose(item)
              },
              optionLabel(item, props)
            )
          )
          const panel = h(
            'div',
            {
              ref: panelRef,
              class: [
                'ui-mention__dropdown',
                'ui-floating-panel',
                `is-${floating.actualSide.value}`,
                props.popperClass
              ],
              role: 'listbox',
              style: [
                props.popperStyle as CSSProperties,
                floating.position.value,
                floating.position.value && Object.keys(floating.position.value).length ? null : { visibility: 'hidden' }
              ],
              onMousedown: (event: Event) => {
                event.preventDefault()
                clearBlurTimer()
              }
            },
            [
              props.loading
                ? h('div', { class: 'ui-loader', role: 'status' }, [
                    h('span', { class: 'ui-loader__spinner', 'aria-hidden': 'true' }),
                    h('span', null, '加载中…')
                  ])
                : h('ul', { class: 'ui-mention__list' }, list),
              props.showArrow ? h('span', { class: 'ui-floating-arrow', style: floating.arrowStyle.value }) : null
            ]
          )
          if (props.teleported === false) {
            return panel
          }
          const target = props.appendTo
          const teleportTarget = target && typeof target === 'object' && 'value' in target ? target.value : target
          return h(Teleport, { to: teleportTarget || 'body' }, [panel])
        }

        onMounted(() => {
          document.addEventListener('pointerdown', handleDocumentPointerDown, true)
        })

        onBeforeUnmount(() => {
          clearBlurTimer()
          document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
        })

        return {
          inputRef,
          panelRef,
          open,
          activeIndex,
          options,
          handleInput,
          handleFocus,
          handleBlur,
          handleClick,
          handleKeyup,
          handleKeydown,
          renderPanel
        }
      },
      attrs: (props) => (props.containerRole ? { role: props.containerRole } : {}),
      content: ({ state, props, slots, emit }) => {
        const shared: Record<string, any> = {
          ref: state.inputRef,
          class: 'ui-mention__inner',
          value: props.modelValue ?? props.value ?? '',
          disabled: Boolean(props.disabled),
          readonly: Boolean(props.readonly),
          placeholder: props.placeholder,
          autocomplete: props.autocomplete,
          name: props.name,
          maxlength: props.maxlength,
          minlength: props.minlength,
          autofocus: Boolean(props.autofocus),
          id: props.id,
          form: props.form,
          tabindex: props.tabindex,
          inputmode: props.inputmode,
          'aria-label': props.ariaLabel,
          role: 'combobox',
          'aria-autocomplete': 'list',
          'aria-expanded': state.open?.value ? 'true' : 'false',
          onInput: state.handleInput,
          onFocus: state.handleFocus,
          onBlur: state.handleBlur,
          onClick: state.handleClick,
          onKeyup: state.handleKeyup,
          onKeydown: state.handleKeydown,
          onChange: (event: Event) => {
            const value = (event.target as HTMLInputElement).value
            if (props.modelValue !== value) {
              emit('update:modelValue', value)
            }
            emit('change', value)
          }
        }
        let control
        if (props.type === 'textarea') {
          control = h('textarea', {
            ...shared,
            rows: props.rows ?? 2,
            style: props.resize ? { resize: props.resize } : undefined
          })
        } else {
          control = h('input', { ...shared, type: props.type || 'text' })
        }
        return [control, slots.append?.() ?? null, state.renderPanel()]
      }
    },
    features
  )
}
