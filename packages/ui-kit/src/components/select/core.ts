import type { VNode, VNodeChild } from 'vue'
import { Fragment, Teleport, computed, h, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Check, ChevronDown, X } from '../../shared/icons'
import type { UiFeature, UiFeatureState } from '../../shared/feature'
import { collectFeatureHooks } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { useFloatingPanel } from '../../shared/panel'
import { sameValue } from '../../shared/value'
import { sizeValue } from '../../shared/behavior'
import './core.css'

const optionBaseProps = {
  value: { type: [String, Number, Boolean, Object] },
  label: { type: [String, Number], default: '' },
  disabled: { type: Boolean }
}

export interface SelectOption {
  label: string
  value: any
  disabled: boolean
  group?: boolean
}

const optionFields = {
  label: 'label',
  value: 'value',
  disabled: 'disabled',
  options: 'options'
}

/**
 * 虚拟窗口由 `select.select-virtualized` 特性注入（§25）：
 * core 只留扩展点，不开特性时这段渲染代码根本不会进产物。
 */
export interface SelectOptionListContext {
  list: SelectOption[]
  activeIndex: number
  /** 面板可视高度，未挂载时为 0，由特性自行兜底 */
  viewport: number
  isSelected: (option: SelectOption) => boolean
  renderOption: (option: SelectOption, index: number) => VNodeChild
  selectOption: (option: SelectOption) => void
}

export type SelectOptionListRenderer = (context: SelectOptionListContext) => VNodeChild

const optionGroupBaseProps = {
  label: { type: String, default: '' },
  disabled: { type: Boolean }
}

const selectBaseProps = {
  // 类型联合含 Boolean 时，Vue 会把"键不存在"归一化为 false，
  // 与"未选值"无法区分，导致占位文案被 false 顶掉，显式声明 default 保住 undefined 语义
  modelValue: { type: [Array, String, Number, Boolean, Object], default: undefined },
  size: { type: String },
  disabled: { type: Boolean },
  options: { type: Array },
  name: { type: String },
  id: { type: String },
  autocomplete: { type: String, default: 'off' },
  effect: { type: String, default: 'light' },
  placeholder: { type: String },
  tabindex: { type: [String, Number], default: 0 },
  props: { type: Object, default: () => ({}) },
  ariaLabel: { type: String },
  fitWidth: { type: Boolean },
  maxWidth: { type: [String, Number] }
}

function textOf(children: unknown): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children)
  }
  if (Array.isArray(children)) {
    return children.map(textOf).join('')
  }
  return ''
}

function componentName(vnode: VNode): string {
  const type = vnode.type as any
  if (!type || typeof type === 'string') {
    return ''
  }
  return String(type.name ?? type.__name ?? '')
}

function collectSlotOptions(nodes: VNodeChild, result: SelectOption[]): void {
  if (nodes === null || nodes === undefined || nodes === false) {
    return
  }
  if (Array.isArray(nodes)) {
    for (const node of nodes) {
      collectSlotOptions(node, result)
    }
    return
  }
  if (typeof nodes !== 'object' || !('type' in nodes)) {
    return
  }
  const vnode = nodes as VNode
  if (vnode.type === Fragment) {
    collectSlotOptions(vnode.children as VNodeChild, result)
    return
  }
  const name = componentName(vnode)
  if (name === 'UiOptionGroup') {
    const props = (vnode.props ?? {}) as Record<string, any>
    result.push({ label: String(props.label ?? ''), value: props.label, disabled: true, group: true })
    collectSlotOptions(vnode.children as VNodeChild, result)
    return
  }
  if (name === 'UiOption') {
    const props = (vnode.props ?? {}) as Record<string, any>
    result.push({
      label: String(props.label || textOf(vnode.children) || props.value || ''),
      value: props.value ?? props.label,
      disabled: Boolean(props.disabled)
    })
  }
}

function optionFieldKeys(mapping?: Record<string, any>): Record<keyof typeof optionFields, string> {
  const pick = (key: keyof typeof optionFields) =>
    typeof mapping?.[key] === 'string' && mapping[key] ? String(mapping[key]) : optionFields[key]
  return {
    label: pick('label'),
    value: pick('value'),
    disabled: pick('disabled'),
    options: pick('options')
  }
}

function normalizeOptions(input: unknown, mapping?: Record<string, any>): SelectOption[] {
  if (!Array.isArray(input)) {
    return []
  }
  const fields = optionFieldKeys(mapping)
  const result: SelectOption[] = []
  for (const item of input) {
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
      result.push(...normalizeOptions(record[fields.options], mapping))
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

export function createOption(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiOption',
      baseClass: 'ui-select',
      props: optionBaseProps,
      tag: () => 'span',
      attrs: (props) => ({ 'data-value': props.value, 'data-disabled': Boolean(props.disabled) || undefined }),
      content: ({ props, slots }) => slots.default?.() ?? props.label ?? props.value ?? null
    },
    features
  )
}

export function createOptionGroup(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiOptionGroup',
      baseClass: 'ui-option-group',
      props: optionGroupBaseProps,
      tag: () => 'span',
      attrs: (props) => ({ 'data-label': props.label, 'data-disabled': Boolean(props.disabled) || undefined }),
      content: ({ props, slots }) => slots.default?.() ?? props.label ?? null
    },
    features
  )
}

export function createSelect(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiSelect',
      baseClass: 'ui-select',
      props: selectBaseProps,
      setup(props, { emit, slots }) {
        const open = ref(false)
        const query = ref('')
        // 搜索中清空关键字后不要回填选中项文本，否则输入框内容永远删不干净
        const searching = ref(false)
        const activeIndex = ref(-1)
        const triggerRef = ref<HTMLElement>()
        const panelRef = ref<HTMLElement>()
        const inputRef = ref<HTMLInputElement>()
        let remoteTimer: ReturnType<typeof setTimeout> | null = null

        const slotOptions = computed(() => {
          const result: SelectOption[] = []
          collectSlotOptions(slots.default?.() ?? null, result)
          return result
        })

        const optionList = computed(() => {
          const list = normalizeOptions(props.options, props.props)
          return list.length ? list : slotOptions.value
        })

        const selectedValues = computed<any[]>(() => {
          if (props.multiple) {
            return Array.isArray(props.modelValue) ? props.modelValue : []
          }
          const value = props.modelValue
          return value === undefined || value === null || value === '' ? [] : [value]
        })
        const selectedLabels = computed(() =>
          selectedValues.value.map(
            (value) =>
              optionList.value.find((option) => !option.group && sameValue(option.value, value))?.label ?? String(value)
          )
        )
        const hasValue = computed(() => selectedValues.value.length > 0)

        const visibleOptions = computed(() => {
          const keyword = query.value.trim()
          if (!props.filterable || !keyword || props.remote) {
            return optionList.value
          }
          if (typeof props.filterMethod === 'function') {
            return optionList.value.filter((option) => option.group || props.filterMethod(keyword, option))
          }
          const lower = keyword.toLowerCase()
          return optionList.value.filter((option) => option.group || option.label.toLowerCase().includes(lower))
        })

        const emptyText = computed(() => {
          if (props.filterable && query.value) {
            return props.noMatchText || '无匹配数据'
          }
          return props.noDataText || '无数据'
        })

        const { position, arrowStyle, actualSide, refresh } = useFloatingPanel({
          props,
          open: () => open.value,
          close: closePanel,
          trigger: triggerRef,
          panel: panelRef,
          placement: () => String(props.placement || 'bottom-start'),
          offset: () => Number(props.offset ?? 4),
          matchWidth: () => true,
          fallbackPlacements: () => props.fallbackPlacements as string[] | undefined
        })

        // ---- 特性扩展点（虚拟窗口等由特性注入，core 不感知具体算法）----
        // 不开特性时 featureStates 里没有对应 hook，下面所有调用都会自然退化为 no-op，
        // 虚拟渲染与 VirtualList 的代码也不会被打进产物。
        let featureStates: UiFeatureState[] = []

        function featureHook<T extends (...args: any[]) => any>(name: string): T | undefined {
          return collectFeatureHooks(featureStates, name)[0] as T | undefined
        }

        function emitValue(value: any) {
          emit('update:modelValue', value)
          emit('change', value)
        }

        function resolveClearValue(): any {
          const valueOnClear = props.valueOnClear
          if (typeof valueOnClear === 'function') {
            return valueOnClear()
          }
          if (valueOnClear !== undefined) {
            return valueOnClear
          }
          return props.multiple ? [] : undefined
        }

        function clearValue() {
          emit('clear')
          emitValue(resolveClearValue())
        }

        function isSelected(option: SelectOption): boolean {
          return selectedValues.value.some((value) => sameValue(value, option.value))
        }

        function selectOption(option: SelectOption) {
          if (option.disabled || option.group || props.disabled) {
            return
          }
          if (!props.multiple) {
            emitValue(option.value)
            closePanel()
            return
          }
          const exists = isSelected(option)
          if (!exists) {
            const limit = Number(props.multipleLimit ?? 0)
            if (limit > 0 && selectedValues.value.length >= limit) {
              return
            }
            emitValue([...selectedValues.value, option.value])
          } else {
            emit('remove-tag', option.value)
            emitValue(selectedValues.value.filter((value) => !sameValue(value, option.value)))
          }
          query.value = ''
          nextTick(refresh)
        }

        function removeValue(index: number) {
          const value = selectedValues.value[index]
          emit('remove-tag', value)
          emitValue(selectedValues.value.filter((_item, current) => current !== index))
          nextTick(refresh)
        }

        function enabledIndexes(): number[] {
          const indexes: number[] = []
          visibleOptions.value.forEach((option, index) => {
            if (!option.group && !option.disabled) {
              indexes.push(index)
            }
          })
          return indexes
        }

        function moveActive(step: number) {
          if (props.loading) {
            return
          }
          const indexes = enabledIndexes()
          if (!indexes.length) {
            return
          }
          const current = indexes.indexOf(activeIndex.value)
          const next =
            current < 0 ? (step > 0 ? 0 : indexes.length - 1) : (current + step + indexes.length) % indexes.length
          activeIndex.value = indexes[next]
          // 方向键把活动项移出可视区时，由特性负责滚动跟随（未开特性时无此 hook）
          featureHook('onActiveChange')?.({
            index: activeIndex.value,
            panel: panelRef.value,
            list: visibleOptions.value
          })
        }

        function handleKeydown(event: KeyboardEvent) {
          if (event.key === 'Escape') {
            if (open.value) {
              event.preventDefault()
              closePanel()
            }
            return
          }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            if (!open.value) {
              openPanel()
              return
            }
            moveActive(event.key === 'ArrowDown' ? 1 : -1)
            return
          }
          if (event.key === 'Enter') {
            if (!open.value) {
              event.preventDefault()
              openPanel()
              return
            }
            if (props.loading) {
              return
            }
            const option = visibleOptions.value[activeIndex.value]
            if (option && !option.group) {
              event.preventDefault()
              selectOption(option)
            }
            return
          }
          if (event.key === 'Tab') {
            closePanel()
          }
        }

        function openPanel() {
          if (props.disabled || open.value) {
            return
          }
          open.value = true
          activeIndex.value = enabledIndexes()[0] ?? -1
          emit('visible-change', true)
          nextTick(() => {
            refresh()
            featureHook('onListOpen')?.({ panel: panelRef.value, list: visibleOptions.value })
            if (props.filterable) {
              inputRef.value?.focus()
            }
          })
        }

        function closePanel() {
          if (!open.value) {
            return
          }
          open.value = false
          query.value = ''
          searching.value = false
          activeIndex.value = -1
          featureHook('onListClose')?.({ panel: panelRef.value })
          emit('visible-change', false)
        }

        function togglePanel() {
          if (open.value) {
            closePanel()
          } else {
            openPanel()
          }
        }

        function handleFilterInput(event: Event) {
          query.value = (event.target as HTMLInputElement).value
          searching.value = true
          featureHook('onListReset')?.({ panel: panelRef.value })
          emit('filter-change', query.value)
          if (!open.value) {
            open.value = true
            emit('visible-change', true)
          }
          activeIndex.value = enabledIndexes()[0] ?? -1
          if (props.remote && typeof props.remoteMethod === 'function') {
            if (remoteTimer) {
              clearTimeout(remoteTimer)
            }
            remoteTimer = setTimeout(
              () => {
                props.remoteMethod(query.value)
              },
              Number(props.debounce ?? 300)
            )
          }
          nextTick(refresh)
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
          if (remoteTimer) {
            clearTimeout(remoteTimer)
          }
        })

        function renderTags(): VNodeChild[] {
          const labels = selectedLabels.value
          const max = props.collapseTags ? Math.max(1, Number(props.maxCollapseTags ?? 1)) : labels.length
          const limit = Math.min(max, labels.length)
          const nodes: VNodeChild[] = []
          for (let index = 0; index < limit; index += 1) {
            nodes.push(
              h(
                'span',
                {
                  key: `tag-${index}`,
                  class: ['ui-select__tag', `is-${props.tagType || 'info'}`, `is-${props.tagEffect || 'light'}`]
                },
                [
                  h('span', { class: 'ui-select__tag-label' }, labels[index]),
                  h(
                    'span',
                    {
                      class: 'ui-select__tag-close',
                      onClick: (event: Event) => {
                        event.stopPropagation()
                        removeValue(index)
                      }
                    },
                    [renderIcon(X)]
                  )
                ]
              )
            )
          }
          if (limit < labels.length) {
            nodes.push(h('span', { class: 'ui-select__tag ui-select__tag--more' }, `+${labels.length - limit}`))
          }
          return nodes
        }

        function renderInput(): VNodeChild {
          const showLabel = !query.value && !searching.value && selectedLabels.value.length === 1 && !props.multiple
          return h('input', {
            ref: inputRef,
            class: 'ui-select__input',
            value: query.value || (showLabel ? selectedLabels.value[0] : ''),
            placeholder: hasValue.value ? '' : props.placeholder || '请选择',
            disabled: Boolean(props.disabled),
            readonly: Boolean(props.disabled),
            autocomplete: props.autocomplete,
            name: props.name,
            tabindex: props.tabindex,
            role: 'combobox',
            'aria-label': props.ariaLabel,
            'aria-expanded': open.value,
            onInput: handleFilterInput,
            onFocus: openPanel,
            onKeydown: handleKeydown
          })
        }

        function renderValue(): VNodeChild[] {
          if (props.multiple && hasValue.value) {
            return props.filterable ? [...renderTags(), renderInput()] : renderTags()
          }
          if (props.filterable) {
            return [renderInput()]
          }
          if (hasValue.value) {
            return [h('span', { class: 'ui-select__selected' }, selectedLabels.value[0])]
          }
          return [h('span', { class: 'ui-select__placeholder' }, props.placeholder || '请选择')]
        }

        function renderOptionRow(option: SelectOption, index: number): VNodeChild {
          const selected = isSelected(option)
          return h(
            'div',
            {
              key: `option-${index}-${String(option.value)}`,
              class: [
                'ui-select__option',
                {
                  'is-selected': selected,
                  'is-disabled': option.disabled,
                  'is-active': activeIndex.value === index
                }
              ],
              role: 'option',
              'aria-selected': selected,
              onMouseenter: () => {
                if (!option.disabled && !option.group) {
                  activeIndex.value = index
                }
              },
              onClick: () => selectOption(option)
            },
            [
              h('span', { class: 'ui-select__option-label' }, option.label),
              selected ? renderIcon(Check, { class: 'ui-select__check' }) : null
            ]
          )
        }

        function renderPanel(states: UiFeatureState[] = []): VNodeChild {
          featureStates = states
          if (!open.value && !props.persistent) {
            return null
          }
          const children: VNodeChild[] = []
          let virtualized = false
          if (props.loading) {
            children.push(
              h('div', { class: 'ui-loader', role: 'status' }, [
                h('span', { class: 'ui-loader__spinner', 'aria-hidden': 'true' }),
                h('span', null, props.loadingText || '加载中')
              ])
            )
          } else if (visibleOptions.value.length) {
            const renderList = featureHook<SelectOptionListRenderer>('renderOptionList')
            // 特性返回 null 表示当前列表不该窗口化（未达阈值 / 含分组行），回退全量渲染
            const custom: VNodeChild | null = renderList
              ? (renderList({
                  list: visibleOptions.value,
                  activeIndex: activeIndex.value,
                  viewport: panelRef.value?.clientHeight ?? 0,
                  isSelected,
                  renderOption: renderOptionRow,
                  selectOption
                }) ?? null)
              : null
            if (custom) {
              virtualized = true
              children.push(custom)
            } else {
              visibleOptions.value.forEach((option, index) => {
                if (option.group) {
                  children.push(h('div', { key: `group-${index}`, class: 'ui-select__group' }, option.label))
                  return
                }
                children.push(renderOptionRow(option, index))
              })
            }
          } else {
            children.push(h('div', { class: 'ui-floating-panel__empty' }, emptyText.value))
          }
          if (props.showArrow) {
            children.push(h('span', { class: 'ui-floating-arrow', style: arrowStyle.value }))
          }
          const panel = h(
            'div',
            {
              ref: panelRef,
              class: [
                'ui-select__dropdown',
                'ui-floating-panel',
                virtualized ? 'is-virtual' : '',
                `is-${props.effect || 'light'}`,
                `is-${actualSide.value}`,
                props.popperClass
              ],
              style: [props.popperStyle, position.value, open.value ? null : { display: 'none' }],
              role: 'listbox',
              'aria-label': props.ariaLabel,
              onMousedown: (event: Event) => event.preventDefault(),
              onScroll: (event: Event) => featureHook('onListScroll')?.({ event, panel: panelRef.value }),
              onKeydown: handleKeydown
            },
            children
          )
          const target = props.appendTo
          const teleportTarget = target && typeof target === 'object' && 'value' in target ? target.value : target
          return props.teleported === false ? panel : h(Teleport, { to: teleportTarget || 'body' }, panel)
        }

        return {
          triggerRef,
          get open() {
            return open.value
          },
          get hasValue() {
            return hasValue.value
          },
          refresh,
          togglePanel,
          closePanel,
          clearValue,
          handleKeydown,
          renderValue,
          renderPanel
        }
      },
      classes: (props, state) => [
        props.size ? `is-size-${props.size}` : '',
        props.disabled ? 'is-disabled' : '',
        state.open ? 'is-open' : ''
      ],
      styles: (props) => ({
        width: props.fitWidth ? 'fit-content' : undefined,
        maxWidth: sizeValue(props.maxWidth)
      }),
      content: ({ props, state, states }) => {
        const actions: VNodeChild[] = []
        if (props.clearable && state.hasValue && !props.disabled) {
          actions.push(
            h(
              'span',
              {
                class: 'ui-select__clear',
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
          renderIcon(props.suffixIcon || ChevronDown, {
            class: state.open ? 'ui-select__arrow is-open' : 'ui-select__arrow'
          })
        )
        const trigger = h(
          'div',
          {
            ref: state.triggerRef,
            class: 'ui-select__trigger',
            // id 声明成 prop 后不再走 attrs 透传；combobox 才是可被 label/aria 引用的节点
            id: props.id || undefined,
            role: 'combobox',
            tabindex: props.filterable || props.disabled ? undefined : props.tabindex,
            'aria-expanded': state.open,
            'aria-label': props.ariaLabel,
            onClick: () => {
              if (props.filterable) {
                if (!state.open) {
                  state.togglePanel()
                }
                return
              }
              state.togglePanel()
            },
            onKeydown: (event: KeyboardEvent) => {
              if (props.filterable) {
                return
              }
              state.handleKeydown(event)
            }
          },
          [
            h('div', { class: 'ui-select__value' }, state.renderValue()),
            h('div', { class: 'ui-select__actions' }, actions)
          ]
        )
        return [trigger, state.renderPanel(states)]
      }
    },
    features
  )
}
