import type { CSSProperties } from 'vue'
import { Teleport, computed, h, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { useFloatingPanel } from '../../shared/panel'
import './core.css'

const autocompleteBaseProps = {
  size: { type: String },
  disabled: { type: Boolean },
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
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
  valueKey: { type: String, default: 'value' },
  fetchSuggestions: { type: [Function, Array], default: () => [] },
  triggerOnFocus: { type: Boolean, default: true },
  selectWhenUnmatched: { type: Boolean },
  hideLoading: { type: Boolean },
  highlightFirstItem: { type: Boolean },
  loopNavigation: { type: Boolean, default: true }
}

function suggestionText(item: unknown, valueKey: string): string {
  if (item === null || item === undefined) {
    return ''
  }
  if (typeof item === 'string' || typeof item === 'number') {
    return String(item)
  }
  const record = item as Record<string, unknown>
  const value = record.label ?? record[valueKey] ?? record.value
  return value === null || value === undefined ? '' : String(value)
}

function suggestionValue(item: unknown, valueKey: string): string {
  if (item === null || item === undefined) {
    return ''
  }
  if (typeof item === 'string' || typeof item === 'number') {
    return String(item)
  }
  const record = item as Record<string, unknown>
  const value = record[valueKey] ?? record.value ?? record.label
  return value === null || value === undefined ? '' : String(value)
}

export function createAutocomplete(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiAutocomplete',
      baseClass: 'ui-autocomplete',
      props: autocompleteBaseProps,
      classes: (props) => {
        const classes: string[] = []
        if (typeof props.size === 'string' && props.size) {
          classes.push(`ui-autocomplete--size-${props.size}`)
        }
        if (props.disabled) {
          classes.push('is-disabled')
        }
        if (props.type === 'textarea') {
          classes.push('ui-autocomplete--textarea')
        }
        return classes
      },
      styles: (props) => (props.inputStyle as CSSProperties) ?? {},
      setup(props, { emit }) {
        const inputRef = shallowRef<HTMLInputElement | HTMLTextAreaElement>()
        const fieldRef = computed<HTMLElement | undefined>(() => inputRef.value?.parentElement ?? undefined)
        const panelRef = shallowRef<HTMLElement>()
        const suggestions = shallowRef<unknown[]>([])
        const open = ref(false)
        const loading = ref(false)
        const activeIndex = ref(-1)
        const focused = ref(false)
        let fetchTimer: ReturnType<typeof setTimeout> | null = null
        let blurTimer: ReturnType<typeof setTimeout> | null = null
        let requestId = 0

        const floating = useFloatingPanel({
          props,
          open: () => open.value,
          close: closePanel,
          trigger: fieldRef,
          panel: panelRef,
          placement: () => props.placement ?? 'bottom-start',
          offset: () => Number(props.offset ?? 6),
          matchWidth: () => true,
          fixedWidth: () => props.fitInputWidth === true,
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

        function openPanel() {
          if (!props.disabled && !props.readonly && focused.value) {
            setOpen(true)
          }
        }

        function closePanel() {
          clearBlurTimer()
          setOpen(false)
        }

        function cancelPending() {
          if (fetchTimer) {
            clearTimeout(fetchTimer)
            fetchTimer = null
          }
          requestId += 1
        }

        function applySuggestions(list: unknown[]) {
          suggestions.value = list
          activeIndex.value = props.highlightFirstItem && list.length ? 0 : -1
          if (!list.length) {
            closePanel()
            return
          }
          openPanel()
          floating.refresh()
          nextTick(scrollActiveIntoView)
        }

        function scrollActiveIntoView() {
          const active = panelRef.value?.querySelector('.ui-autocomplete__option.is-active')
          active?.scrollIntoView({ block: 'nearest' })
        }

        function fetchRemote(query: string, source: (...args: any[]) => unknown) {
          const current = ++requestId
          loading.value = true
          if (!props.hideLoading) {
            suggestions.value = []
            activeIndex.value = -1
            openPanel()
            floating.refresh()
          }
          let settled = false
          const deliver = (list: unknown) => {
            if (settled || current !== requestId) {
              return
            }
            settled = true
            loading.value = false
            if (!focused.value) {
              return
            }
            applySuggestions(Array.isArray(list) ? list : [])
          }
          try {
            const result = source(query, deliver)
            if (result && typeof (result as Promise<unknown>).then === 'function') {
              ;(result as Promise<unknown>).then(deliver).catch(() => deliver([]))
            } else if (Array.isArray(result)) {
              deliver(result)
            }
          } catch {
            deliver([])
          }
        }

        function fetchLocal(query: string, source: unknown[]) {
          requestId += 1
          loading.value = false
          const keyword = query.trim().toLowerCase()
          const list = keyword
            ? source.filter((item) => suggestionText(item, props.valueKey).toLowerCase().includes(keyword))
            : source
          applySuggestions(list)
        }

        function runFetch(query: string) {
          const source = props.fetchSuggestions
          if (typeof source === 'function') {
            fetchRemote(query, source)
            return
          }
          fetchLocal(query, Array.isArray(source) ? source : [])
        }

        function scheduleFetch(query: string, immediate = false) {
          if (fetchTimer) {
            clearTimeout(fetchTimer)
            fetchTimer = null
          }
          const delay = immediate ? 0 : Number(props.debounce ?? 300)
          if (!delay) {
            runFetch(query)
            return
          }
          fetchTimer = setTimeout(() => {
            fetchTimer = null
            runFetch(query)
          }, delay)
        }

        function handleInput(event: Event) {
          const value = (event.target as HTMLInputElement).value
          emit('update:modelValue', value)
          emit('input', value)
          clearBlurTimer()
          focused.value = true
          if (value === '') {
            cancelPending()
            loading.value = false
            suggestions.value = []
            closePanel()
            return
          }
          scheduleFetch(value)
        }

        function handleFocus(event: Event) {
          focused.value = true
          clearBlurTimer()
          emit('focus', event)
          if (!props.triggerOnFocus) {
            return
          }
          const query = inputRef.value?.value ?? String(props.modelValue ?? '')
          scheduleFetch(query, true)
        }

        function handleBlur(event: Event) {
          focused.value = false
          emit('blur', event)
          clearBlurTimer()
          blurTimer = setTimeout(() => {
            blurTimer = null
            setOpen(false)
          }, 120)
        }

        function moveActive(delta: number) {
          const list = suggestions.value
          if (!list.length) {
            return
          }
          if (!open.value) {
            openPanel()
          }
          const loop = props.loopNavigation !== false
          let next = activeIndex.value + delta
          if (next < 0) {
            next = loop ? list.length - 1 : 0
          } else if (next >= list.length) {
            next = loop ? 0 : list.length - 1
          }
          activeIndex.value = next
          nextTick(scrollActiveIntoView)
        }

        function choose(item: unknown) {
          const value = suggestionValue(item, props.valueKey)
          emit('update:modelValue', value)
          emit('input', value)
          emit('change', value)
          emit('select', item)
          cancelPending()
          loading.value = false
          closePanel()
        }

        function handleKeydown(event: KeyboardEvent) {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            if (!open.value && suggestions.value.length) {
              openPanel()
              activeIndex.value = -1
            }
            moveActive(1)
            return
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            moveActive(-1)
            return
          }
          if (event.key === 'Enter') {
            if (open.value && activeIndex.value >= 0) {
              event.preventDefault()
              choose(suggestions.value[activeIndex.value])
              return
            }
            if (props.selectWhenUnmatched && String(props.modelValue ?? '').trim()) {
              emit('select', String(props.modelValue))
              closePanel()
            }
            return
          }
          if (event.key === 'Escape') {
            if (open.value) {
              event.preventDefault()
              cancelPending()
              closePanel()
            }
            return
          }
          if (event.key === 'Tab' && open.value) {
            closePanel()
          }
        }

        function handlePanelPointerDown() {
          clearBlurTimer()
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

        function renderLabel(item: unknown) {
          const label = suggestionText(item, props.valueKey)
          const keyword = String(props.modelValue ?? '').trim()
          if (!keyword) {
            return label
          }
          const index = label.toLowerCase().indexOf(keyword.toLowerCase())
          if (index < 0) {
            return label
          }
          return [
            label.slice(0, index),
            h('span', { class: 'ui-autocomplete__highlight' }, label.slice(index, index + keyword.length)),
            label.slice(index + keyword.length)
          ]
        }

        function renderPanel() {
          if (!open.value) {
            return null
          }
          const options = suggestions.value.map((item, index) =>
            h(
              'li',
              {
                key: index,
                role: 'option',
                class: [
                  'ui-autocomplete__option',
                  index === activeIndex.value ? 'is-active' : '',
                  suggestionValue(item, props.valueKey) === String(props.modelValue ?? '') ? 'is-selected' : ''
                ],
                'aria-selected': index === activeIndex.value ? 'true' : 'false',
                onMousemove: () => {
                  activeIndex.value = index
                },
                onClick: () => choose(item)
              },
              renderLabel(item)
            )
          )
          const panel = h(
            'div',
            {
              ref: panelRef,
              class: [
                'ui-autocomplete__dropdown',
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
                handlePanelPointerDown()
              }
            },
            [
              loading.value && !props.hideLoading
                ? h('div', { class: 'ui-loader', role: 'status' }, [
                    h('span', { class: 'ui-loader__spinner', 'aria-hidden': 'true' }),
                    h('span', null, '加载中…')
                  ])
                : h('ul', { class: 'ui-autocomplete__list' }, options),
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
          cancelPending()
          clearBlurTimer()
          document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
        })

        return {
          inputRef,
          panelRef,
          open,
          loading,
          activeIndex,
          suggestions,
          handleInput,
          handleFocus,
          handleBlur,
          handleKeydown,
          renderPanel,
          get position() {
            return floating.position.value
          },
          get actualSide() {
            return floating.actualSide.value
          }
        }
      },
      attrs: (props) => (props.containerRole ? { role: props.containerRole } : {}),
      content: ({ state, props, slots }) => {
        const shared: Record<string, any> = {
          ref: state.inputRef,
          class: 'ui-autocomplete__inner',
          value: props.modelValue ?? '',
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
          onKeydown: state.handleKeydown
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
