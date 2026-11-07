import type { CSSProperties, VNodeChild } from 'vue'
import { Teleport, computed, h, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Check, ChevronDown, X } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { sameValue } from '../../shared/value'
import { useFloatingPanel } from '../../shared/panel'
import { sizeValue } from '../../shared/behavior'
import './core.css'

const selectV2BaseProps = {
  // Boolean 出现在联合类型里且没写 default 时，Vue 会把"未传"归一成 false，
  // 于是未受控的 SelectV2 一上来就带着一个 false 选中值：占位符被吃掉，
  // value:false 的选项还会自动高亮（同 F-2 / F-4 / F-13 / F-14 / F-37 一类）。
  // 显式 default: undefined 保住"没传就是没传"，isEmptyValue 的三条判空才成立。
  modelValue: { type: [Array, String, Number, Boolean, Object], default: undefined },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择' },
  disabled: Boolean,
  size: { type: String, default: '' },
  fitWidth: { type: Boolean },
  maxWidth: { type: [String, Number] }
}

interface V2Option {
  label: string
  value: any
  disabled: boolean
  group?: boolean
}

const VIRTUAL_THRESHOLD = 100
const VIRTUAL_OVERSCAN = 5
const VIRTUAL_FALLBACK_ITEM_HEIGHT = 34

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
        const listScrollTop = ref(0)
        const measuredItemHeight = ref(0)

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
          listScrollTop.value = 0
          nextTick(() => {
            if (dropdownRef.value) {
              dropdownRef.value.scrollTop = 0
            }
            refresh()
            measureItemHeight()
          })
          if (props.filterable) {
            nextTick(() => {
              const input = dropdownRef.value?.querySelector('input')
              input?.focus()
            })
          }
        }

        // 行高由主题 token 决定（padding/font-size），运行时测量；取不到时先用回退值撑首帧
        function measureItemHeight() {
          const option = dropdownRef.value?.querySelector('.ui-select-v2__option')
          if (option instanceof HTMLElement && option.offsetHeight > 0) {
            measuredItemHeight.value = option.offsetHeight
          }
        }

        interface VirtualWindow {
          list: V2Option[]
          itemHeight: number
          total: number
          start: number
          end: number
        }

        // 分组列表行高不一，回退全量渲染；仅扁平大列表走窗口化
        function virtualWindow(): VirtualWindow | null {
          const list = visibleOptions.value
          if (list.length <= VIRTUAL_THRESHOLD || list.some((option) => option.group)) {
            return null
          }
          const itemHeight = measuredItemHeight.value || VIRTUAL_FALLBACK_ITEM_HEIGHT
          const total = list.length
          const viewHeight = dropdownRef.value?.clientHeight || 274
          const start = Math.max(0, Math.floor(listScrollTop.value / itemHeight) - VIRTUAL_OVERSCAN)
          const end = Math.min(total, Math.ceil((listScrollTop.value + viewHeight) / itemHeight) + VIRTUAL_OVERSCAN)
          return { list, itemHeight, total, start, end }
        }

        function handleListScroll(event: Event) {
          listScrollTop.value = (event.target as HTMLElement).scrollTop
        }

        function resetListScroll() {
          listScrollTop.value = 0
          if (dropdownRef.value) {
            dropdownRef.value.scrollTop = 0
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
          resetListScroll()
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

        function renderOptionNode(option: V2Option): VNodeChild {
          if (option.group) {
            return h('div', { class: 'ui-select-v2__group', key: `group-${option.label}` }, option.label)
          }
          const selected = selectedValues.value.some((value) => sameValue(value, option.value))
          return h(
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
          if (props.loading) {
            children.push(
              h('div', { class: 'ui-loader', role: 'status' }, [
                h('span', { class: 'ui-loader__spinner', 'aria-hidden': 'true' }),
                h('span', null, props.loadingText || '加载中')
              ])
            )
          } else if (!visibleOptions.value.length) {
            children.push(h('div', { class: 'ui-select-v2__empty' }, emptyText.value))
          } else {
            const win = virtualWindow()
            if (win) {
              children.push(
                h('div', { class: 'ui-select-v2__virtual', style: { height: `${win.total * win.itemHeight}px` } }, [
                  h(
                    'div',
                    {
                      class: 'ui-select-v2__virtual-window',
                      style: { transform: `translateY(${win.start * win.itemHeight}px)` }
                    },
                    win.list.slice(win.start, win.end).map(renderOptionNode)
                  )
                ])
              )
            } else {
              for (const option of visibleOptions.value) {
                children.push(renderOptionNode(option))
              }
            }
          }
          const dropdown = h(
            'div',
            {
              ref: dropdownRef,
              class: ['ui-select-v2__dropdown', `is-${props.effect || 'light'}`, props.popperClass],
              style: [props.popperStyle as CSSProperties, position.value],
              onKeydown: handleKeydown,
              onScroll: handleListScroll
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
          hideDropdown,
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
      styles: (props) => ({
        width: props.fitWidth ? 'fit-content' : undefined,
        maxWidth: sizeValue(props.maxWidth)
      }),
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
                return
              }
              // 面板是触发器的兄弟节点，面板上的 Escape 收不到焦点，触发器自己也要能收起
              if (event.key === 'Escape' && state.isOpen) {
                event.preventDefault()
                state.hideDropdown()
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
