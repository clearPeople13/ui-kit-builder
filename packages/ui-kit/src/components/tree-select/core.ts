import type { CSSProperties, VNodeChild } from 'vue'
import { Teleport, computed, h, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Check, ChevronDown, ChevronRight, X } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { collectTreeKeys, flattenTreeNodes, normalizeTreeNodes } from '../../shared/tree'
import type { UiTreeNode } from '../../shared/tree'
import { sameValue } from '../../shared/value'
import { useFloatingPanel } from '../../shared/panel'
import { sizeValue } from '../../shared/behavior'
import './core.css'

const treeSelectBaseProps = {
  data: { type: Array, default: () => [] },
  modelValue: { type: [Array, String, Number, Object] },
  placeholder: { type: String, default: '请选择' },
  disabled: Boolean,
  size: { type: String, default: '' },
  props: { type: Object, default: () => ({}) },
  clearable: Boolean,
  emptyText: { type: String, default: '暂无数据' },
  defaultExpandAll: Boolean,
  fitWidth: { type: Boolean },
  maxWidth: { type: [String, Number] }
}

function collectNodes(nodes: UiTreeNode[]): UiTreeNode[] {
  const result: UiTreeNode[] = []
  for (const node of nodes) {
    result.push(node)
    result.push(...collectNodes(node.children))
  }
  return result
}

function filterNodes(nodes: UiTreeNode[], keyword: string): UiTreeNode[] {
  const result: UiTreeNode[] = []
  for (const node of nodes) {
    const children = filterNodes(node.children, keyword)
    if (node.label.toLowerCase().includes(keyword) || children.length) {
      result.push({ ...node, children })
    }
  }
  return result
}

export function createTreeSelect(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiTreeSelect',
      baseClass: 'ui-tree-select',
      props: treeSelectBaseProps,
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

        const nodes = computed(() => normalizeTreeNodes(props.data, props.props ?? {}))
        const allNodes = computed(() => collectNodes(nodes.value))
        const expandedKeys = ref<Set<string | number>>(
          new Set(props.defaultExpandAll ? collectTreeKeys(nodes.value) : [])
        )

        const selectedValues = computed<any[]>(() => {
          if (props.multiple) {
            return Array.isArray(props.modelValue) ? props.modelValue : []
          }
          return props.modelValue === undefined || props.modelValue === null || props.modelValue === ''
            ? []
            : [props.modelValue]
        })
        const selectedLabels = computed(() => {
          return selectedValues.value.map((value) => {
            const node = allNodes.value.find((item) => sameValue(item.value, value) || sameValue(item.key, value))
            return node?.label ?? String(value)
          })
        })
        const hasValue = computed(() => selectedValues.value.length > 0)

        const visibleNodes = computed(() => {
          const keyword = query.value.trim().toLowerCase()
          if (props.filterable && keyword) {
            return flattenTreeNodes(
              filterNodes(nodes.value, keyword),
              new Set(collectTreeKeys(filterNodes(nodes.value, keyword)))
            )
          }
          return flattenTreeNodes(nodes.value, expandedKeys.value)
        })

        function showDropdown() {
          if (props.disabled) {
            return
          }
          open.value = true
          nextTick(refresh)
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

        function isSelected(node: UiTreeNode): boolean {
          return selectedValues.value.some((value) => sameValue(value, node.value) || sameValue(value, node.key))
        }

        function selectNode(node: UiTreeNode) {
          if (node.disabled) {
            return
          }
          if (props.multiple) {
            const exists = isSelected(node)
            emitValue(
              exists
                ? selectedValues.value.filter((value) => !sameValue(value, node.value) && !sameValue(value, node.key))
                : [...selectedValues.value, node.value]
            )
            return
          }
          emitValue(node.value)
          hideDropdown()
        }

        function toggleExpand(node: UiTreeNode) {
          if (!node.children.length) {
            return
          }
          const next = new Set(expandedKeys.value)
          if (next.has(node.key)) {
            next.delete(node.key)
          } else {
            next.add(node.key)
          }
          expandedKeys.value = next
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
          if (typeof props.filterMethod === 'function') {
            props.filterMethod(query.value)
          }
        }

        function handleDocumentPointerDown(event: PointerEvent) {
          if (!open.value) {
            return
          }
          const target = event.target as Node | null
          if (triggerRef.value?.contains(target) || dropdownRef.value?.contains(target)) {
            return
          }
          hideDropdown()
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
          const tags: VNodeChild[] = []
          for (let index = 0; index < limit; index += 1) {
            const value = selectedValues.value[index]
            tags.push(
              h('span', { class: 'ui-tree-select__tag', key: `tag-${index}` }, [
                h('span', { class: 'ui-tree-select__tag-label' }, selectedLabels.value[index]),
                h(
                  'span',
                  {
                    class: 'ui-tree-select__tag-close',
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
            tags.push(
              h(
                'span',
                { class: 'ui-tree-select__tag ui-tree-select__tag--more' },
                `+${selectedLabels.value.length - limit}`
              )
            )
          }
          return tags
        }

        function renderNode(node: UiTreeNode): VNodeChild {
          const expanded = expandedKeys.value.has(node.key)
          const selected = isSelected(node)
          return h(
            'div',
            {
              key: node.key,
              class: [
                'ui-tree-select__node',
                {
                  'is-selected': selected,
                  'is-disabled': node.disabled
                }
              ],
              style: { paddingLeft: `${node.level * 16 + 8}px` },
              onClick: () => selectNode(node)
            },
            [
              renderIcon(expanded && node.children.length ? ChevronDown : ChevronRight, {
                class: node.children.length ? 'ui-tree-select__expand' : 'ui-tree-select__expand is-leaf',
                attrs: {
                  onClick: (event: Event) => {
                    event.stopPropagation()
                    toggleExpand(node)
                  }
                }
              }),
              h('span', { class: 'ui-tree-select__node-label' }, node.label),
              selected ? renderIcon(Check, { class: 'ui-tree-select__check' }) : null
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
              h('div', { class: 'ui-tree-select__search' }, [
                h('input', {
                  class: 'ui-tree-select__search-input',
                  value: query.value,
                  placeholder: props.placeholder,
                  onInput: handleFilter,
                  onKeydown: (event: KeyboardEvent) => {
                    if (event.key === 'Escape') {
                      hideDropdown()
                    }
                  }
                })
              ])
            )
          }
          if (!visibleNodes.value.length) {
            children.push(h('div', { class: 'ui-tree-select__empty' }, props.emptyText))
          } else {
            children.push(...visibleNodes.value.map(renderNode))
          }
          const dropdown = h(
            'div',
            {
              ref: dropdownRef,
              class: ['ui-tree-select__dropdown', `is-${props.effect || 'light'}`, props.popperClass],
              style: [props.popperStyle as CSSProperties, position.value]
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
        props.size ? `ui-tree-select--${props.size}` : '',
        props.disabled ? 'is-disabled' : ''
      ],
      styles: (props) => ({
        width: props.fitWidth ? 'fit-content' : undefined,
        maxWidth: sizeValue(props.maxWidth)
      }),
      content: ({ props, state }) => {
        const valueNodes: VNodeChild[] = []
        if (props.multiple && state.hasValue) {
          valueNodes.push(...state.renderTags())
        } else if (state.hasValue) {
          valueNodes.push(h('span', { class: 'ui-tree-select__selected' }, state.selectedLabels[0]))
        } else {
          valueNodes.push(h('span', { class: 'ui-tree-select__placeholder' }, props.placeholder))
        }
        const actions: VNodeChild[] = []
        if (props.clearable && state.hasValue && !props.disabled) {
          actions.push(
            h(
              'span',
              {
                class: 'ui-tree-select__clear',
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
          renderIcon(ChevronDown, { class: state.isOpen ? 'ui-tree-select__arrow is-open' : 'ui-tree-select__arrow' })
        )
        return [
          h(
            'div',
            {
              ref: state.triggerRef,
              class: ['ui-tree-select__trigger', { 'is-open': state.isOpen, 'is-disabled': props.disabled }],
              tabindex: props.disabled ? undefined : 0,
              onClick: state.toggleDropdown,
              onKeydown: (event: KeyboardEvent) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  state.toggleDropdown()
                  return
                }
                if (event.key === 'Escape' && state.isOpen) {
                  event.preventDefault()
                  state.hideDropdown()
                }
              }
            },
            [
              h('div', { class: 'ui-tree-select__value' }, valueNodes),
              h('div', { class: 'ui-tree-select__actions' }, actions)
            ]
          ),
          state.renderDropdown()
        ]
      }
    },
    features
  )
}
