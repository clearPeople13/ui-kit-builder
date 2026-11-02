import type { CSSProperties, VNodeChild } from 'vue'
import { Teleport, computed, h, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Check, ChevronDown, X } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { sameValue } from '../../shared/value'
import { useFloatingPanel } from '../../shared/panel'
import { selectV2ClearableFeature } from './features/clearable/index'
import { selectV2FilterableFeature } from './features/filterable/index'
import { selectV2MultipleFeature } from './features/multiple/index'
import { selectV2PopperFeature } from './features/popper/index'
import './core.css'

const selectV2BaseProps = {
  modelValue: { type: [Array, String, Number, Boolean, Object] },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择' },
  disabled: Boolean,
  size: { type: String, default: '' }
}

interface V2Option {
  label: string
  value: any
  disabled: boolean
  group?: boolean
}

function optionFields(props: Record<string, any>) {
  const mapping = props.props ?? {}
  return {
    label: mapping.label ?? 'label',
    value: mapping.value ?? 'value',
    options: mapping.options ?? 'options',
    disabled: mapping.disabled ?? 'disabled'
  }
}

function normalizeOptions(list: unknown, props: Record<string, any>): V2Option[] {
  if (!Array.isArray(list)) {
    return []
  }
  const fields = optionFields(props)
  const result: V2Option[] = []
  for (const item of list) {
    if (!item || typeof item !== 'object') {
      result.push({ label: String(item), value: item, disabled: false })
      continue
    }
    const record = item as Record<string, any>
    if (Array.isArray(record[fields.options])) {
      result.push({
        label: String(record[fields.label] ?? ''),
        value: record[fields.label],
        disabled: true,
        group: true
      })
      result.push(...normalizeOptions(record[fields.options], props))
      continue
    }
    result.push({
      label: String(record[fields.label] ?? record[fields.value] ?? ''),
      value: record[fields.value] ?? record[fields.label],
      disabled: Boolean(record[fields.disabled])
    })
  }
  return result
}

export function createSelectV2(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiSelectV2',
      baseClass: 'ui-select-v2',
      props: selectV2BaseProps,
      setup(props, { emit }) {
        const open = ref(false)
        const query = ref('')
        const triggerRef = ref<HTMLElement>()
        const dropdownRef = ref<HTMLElement>()

        const { position, refresh } = useFloatingPanel({
          props,
          open: () => open.value,
          close: hideDropdown,
          trigger: triggerRef,
          panel: dropdownRef,
          placement: () => String(props.placement || 'bottom-start'),
          offset: () => 4,
          matchWidth: () => true
        })

        const allOptions = computed(() => normalizeOptions(props.options, props))
        const dataOptions = computed(() => allOptions.value.filter((option) => !option.group))
        const selectedValues = computed<any[]>(() => {
          if (props.multiple) {
            return Array.isArray(props.modelValue) ? props.modelValue : []
          }
          return props.modelValue === undefined || props.modelValue === null || props.modelValue === ''
            ? []
            : [props.modelValue]
        })
        const selectedLabels = computed(() => {
          return selectedValues.value.map(
            (value) => dataOptions.value.find((option) => sameValue(option.value, value))?.label ?? String(value)
          )
        })
        const hasValue = computed(() => selectedValues.value.length > 0)

        const visibleOptions = computed(() => {
          if (!props.filterable || !query.value) {
            return allOptions.value
          }
          if (props.remote) {
            return allOptions.value
          }
          if (typeof props.filterMethod === 'function') {
            return allOptions.value.filter((option) => option.group || props.filterMethod(query.value, option))
          }
          const keyword = query.value.toLowerCase()
          return allOptions.value.filter((option) => option.group || option.label.toLowerCase().includes(keyword))
        })

        const emptyText = computed(() => {
          if (props.loading) {
            return props.loadingText || '加载中'
          }
          if (props.filterable && query.value) {
            return props.noMatchText || '无匹配数据'
          }
          return props.noDataText || '无数据'
        })

        function showDropdown() {
          if (props.disabled) {
            return
          }
          open.value = true
          nextTick(refresh)
          if (props.filterable) {
            nextTick(() => {
              const input = dropdownRef.value?.querySelector('input')
              input?.focus()
            })
          }
        }

        function hideDropdown() {
          open.value = false
          query.value = ''
        }

        function toggleDropdown() {
          if (open.value) {
            hideDropdown()
          } else {
            showDropdown()
          }
        }

        function emitValue(value: any) {
          emit('update:modelValue', value)
          emit('change', value)
        }

        function selectOption(option: V2Option) {
          if (option.disabled || option.group) {
            return
          }
          if (props.multiple) {
            const current = selectedValues.value
            const exists = current.some((value) => sameValue(value, option.value))
            emitValue(exists ? current.filter((value) => !sameValue(value, option.value)) : [...current, option.value])
            return
          }
          emitValue(option.value)
          hideDropdown()
        }

        function removeValue(value: any) {
          if (props.multiple) {
            emitValue(selectedValues.value.filter((item) => !sameValue(item, value)))
            return
          }
          emitValue(undefined)
        }

        function clearValue() {
          emitValue(props.multiple ? [] : undefined)
        }

        function handleFilter(event: Event) {
          query.value = (event.target as HTMLInputElement).value
          emit('filter-change', query.value)
          if (props.remote && typeof props.remoteMethod === 'function') {
            props.remoteMethod(query.value)
          }
        }

        function handleDocumentPointerDown(event: PointerEvent) {
          if (!open.value) {
            return
          }
          const target = event.target as Node | null
          if (triggerRef.value?.contains(target)) {
            return
          }
          if (dropdownRef.value?.contains(target)) {
            return
          }
          hideDropdown()
        }

        function handleKeydown(event: KeyboardEvent) {
          if (event.key === 'Escape' && open.value) {
            event.preventDefault()
            hideDropdown()
          }
        }

        onMounted(() => {
          document.addEventListener('pointerdown', handleDocumentPointerDown, true)
        })

        onBeforeUnmount(() => {
          document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
        })

        function renderTags(): VNodeChild[] {
          const max = Number(props.maxCollapseTags ?? 1)
          const limit = props.collapseTags && selectedValues.value.length > max ? max : selectedValues.value.length
          const nodes: VNodeChild[] = []
          for (let index = 0; index < limit; index += 1) {
            const value = selectedValues.value[index]
            nodes.push(
              h('span', { class: 'ui-select-v2__tag', key: `tag-${index}` }, [
                h('span', { class: 'ui-select-v2__tag-label' }, selectedLabels.value[index]),
                h(
                  'span',
                  {
                    class: 'ui-select-v2__tag-close',
                    onClick: (event: Event) => {
                      event.stopPropagation()
                      removeValue(value)
                    }
                  },
                  [renderIcon(X)]
                )
              ])
            )
          }
          if (limit < selectedLabels.value.length) {
            nodes.push(
              h(
                'span',
                { class: 'ui-select-v2__tag ui-select-v2__tag--more' },
                `+${selectedLabels.value.length - limit}`
              )
            )
          }
          return nodes
        }

        function renderDropdown(): VNodeChild {
          if (!open.value) {
            return null
          }
          const children: VNodeChild[] = []
          if (props.filterable) {
            children.push(
              h('div', { class: 'ui-select-v2__search' }, [
                h('input', {
                  class: 'ui-select-v2__search-input',
                  value: query.value,
                  placeholder: props.placeholder,
                  onInput: handleFilter,
                  onKeydown: handleKeydown
                })
              ])
            )
          }
          if (!visibleOptions.value.length) {
            children.push(h('div', { class: 'ui-select-v2__empty' }, emptyText.value))
          } else {
            for (const option of visibleOptions.value) {
              if (option.group) {
                children.push(h('div', { class: 'ui-select-v2__group', key: `group-${option.label}` }, option.label))
                continue
              }
              const selected = selectedValues.value.some((value) => sameValue(value, option.value))
              children.push(
                h(
                  'div',
                  {
                    key: `option-${option.label}-${String(option.value)}`,
                    class: [
                      'ui-select-v2__option',
                      {
                        'is-selected': selected,
                        'is-disabled': option.disabled
                      }
                    ],
                    onClick: () => selectOption(option)
                  },
                  [
                    h('span', { class: 'ui-select-v2__option-label' }, option.label),
                    selected ? renderIcon(Check, { class: 'ui-select-v2__check' }) : null
                  ]
                )
              )
            }
          }
          const dropdown = h(
            'div',
            {
              ref: dropdownRef,
              class: ['ui-select-v2__dropdown', `is-${props.effect || 'light'}`, props.popperClass],
              style: [props.popperStyle as CSSProperties, position.value],
              onKeydown: handleKeydown
            },
            children
          )
          return props.teleported ? h(Teleport, { to: 'body' }, dropdown) : dropdown
        }

        return {
          triggerRef,
          get isOpen() {
            return open.value
          },
          get triggerClasses() {
            return {
              'is-open': open.value,
              'is-disabled': Boolean(props.disabled)
            }
          },
          get hasValue() {
            return hasValue.value
          },
          get selectedLabels() {
            return selectedLabels.value
          },
          toggleDropdown,
          clearValue,
          renderTags,
          renderDropdown
        }
      },
      classes: (props) => [
        props.multiple ? 'is-multiple' : '',
        props.filterable ? 'is-filterable' : '',
        props.size ? `ui-select-v2--${props.size}` : '',
        props.disabled ? 'is-disabled' : ''
      ],
      content: ({ props, state }) => {
        const triggerChildren: VNodeChild[] = []
        if (props.multiple && state.hasValue) {
          triggerChildren.push(...state.renderTags())
        } else if (state.hasValue) {
          triggerChildren.push(h('span', { class: 'ui-select-v2__selected' }, state.selectedLabels[0]))
        } else {
          triggerChildren.push(h('span', { class: 'ui-select-v2__placeholder' }, props.placeholder))
        }
        const actions: VNodeChild[] = []
        if (props.clearable && state.hasValue && !props.disabled) {
          actions.push(
            h(
              'span',
              {
                class: 'ui-select-v2__clear',
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
          renderIcon(ChevronDown, { class: state.isOpen ? 'ui-select-v2__arrow is-open' : 'ui-select-v2__arrow' })
        )
        const trigger = h(
          'div',
          {
            ref: state.triggerRef,
            class: ['ui-select-v2__trigger', state.triggerClasses],
            tabindex: props.disabled ? undefined : 0,
            onClick: state.toggleDropdown,
            onKeydown: (event: KeyboardEvent) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                state.toggleDropdown()
              }
            }
          },
          [
            h('div', { class: 'ui-select-v2__value' }, triggerChildren),
            h('div', { class: 'ui-select-v2__actions' }, actions)
          ]
        )
        return [trigger, state.renderDropdown()]
      }
    },
    features
  )
}
