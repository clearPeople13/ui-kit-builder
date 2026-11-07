import type { VNodeChild } from 'vue'
import { computed, h, nextTick, ref } from 'vue'
import { ChevronDown, ChevronRight } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { collectDescendantKeys, collectTreeKeys, flattenTreeNodes, normalizeTreeNodes } from '../../shared/tree'
import type { UiTreeNode } from '../../shared/tree'
import { createCheckbox } from '../checkbox/core'
import './core.css'

const TreeV2Checkbox = createCheckbox([])

const treeV2BaseProps = {
  data: { type: Array, default: () => [] },
  props: { type: Object, default: () => ({}) },
  emptyText: { type: String, default: '暂无数据' },
  height: { type: [String, Number], default: '' },
  indent: { type: Number, default: 16 },
  defaultExpandAll: Boolean,
  defaultExpandedKeys: { type: Array, default: () => [] },
  expandOnClickNode: { type: Boolean, default: true },
  accordion: Boolean,
  highlightCurrent: Boolean
}

function toKeySet(value: unknown): Set<string | number> {
  return new Set(Array.isArray(value) ? (value as Array<string | number>) : [])
}

function sizeStyle(value: unknown): string | undefined {
  if (value === '' || value === undefined || value === null) {
    return undefined
  }
  return typeof value === 'number' ? `${value}px` : String(value)
}

export function createTreeV2(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiTreeV2',
      baseClass: 'ui-tree-v2',
      props: treeV2BaseProps,
      setup(props, { emit }) {
        const nodes = computed(() => normalizeTreeNodes(props.data, props.props ?? {}))
        const expandedKeys = ref<Set<string | number>>(
          new Set(
            props.defaultExpandAll
              ? collectTreeKeys(nodes.value)
              : (props.defaultExpandedKeys as Array<string | number>)
          )
        )
        const checkedKeys = ref<Set<string | number>>(toKeySet(props.defaultCheckedKeys))
        const currentKey = ref<string | number>('')
        const focusedKey = ref<string | number>('')

        function isExpanded(node: UiTreeNode): boolean {
          return expandedKeys.value.has(node.key)
        }

        function isChecked(node: UiTreeNode): boolean {
          return checkedKeys.value.has(node.key)
        }

        function toggleExpand(node: UiTreeNode) {
          if (!node.children.length) {
            return
          }
          const next = new Set(expandedKeys.value)
          if (next.has(node.key)) {
            next.delete(node.key)
          } else {
            if (props.accordion) {
              next.clear()
            }
            next.add(node.key)
          }
          expandedKeys.value = next
          emit('node-expand', node.raw, isExpanded(node))
        }

        function toggleCheck(node: UiTreeNode, checked: boolean) {
          const next = new Set(checkedKeys.value)
          const targets = props.checkStrictly ? [node.key] : [node.key, ...collectDescendantKeys(node)]
          for (const key of targets) {
            if (checked) {
              next.add(key)
            } else {
              next.delete(key)
            }
          }
          checkedKeys.value = next
          emit('check-change', node.raw, checked)
        }

        function handleNodeClick(node: UiTreeNode) {
          if (node.disabled) {
            return
          }
          currentKey.value = node.key
          emit('node-click', node.raw)
          if (props.showCheckbox && props.checkOnClickNode) {
            toggleCheck(node, !isChecked(node))
            return
          }
          if (props.expandOnClickNode && node.children.length) {
            toggleExpand(node)
          }
        }

        // 键盘移动只发生在已展开节点构成的可见序列上（WAI-ARIA Tree View）
        function visibleNodes(): UiTreeNode[] {
          return flattenTreeNodes(nodes.value, expandedKeys.value)
        }

        function findParentNode(
          list: UiTreeNode[],
          key: string | number,
          parent: UiTreeNode | null = null
        ): UiTreeNode | null {
          for (const node of list) {
            if (String(node.key) === String(key)) {
              return parent
            }
            const result = findParentNode(node.children, key, node)
            if (result) {
              return result
            }
          }
          return null
        }

        function moveFocusTo(key: string | number, container: HTMLElement) {
          focusedKey.value = key
          // tabindex 在 patch 完成后才从 -1 翻成 0，等渲染结束再聚焦
          nextTick(() => {
            const index = visibleNodes().findIndex((node) => String(node.key) === String(key))
            const element = container.children[index] as HTMLElement | undefined
            element?.focus({ preventScroll: true })
          })
        }

        // WAI-ARIA Tree View 键盘模式；展开/收起/选中复用 toggleExpand / handleNodeClick 同一出口
        function handleKeydown(event: KeyboardEvent) {
          const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter']
          if (!keys.includes(event.key)) {
            return
          }
          const container = event.currentTarget as HTMLElement
          const visible = visibleNodes()
          const list = visible.filter((node) => !node.disabled)
          if (!list.length) {
            return
          }
          // 事件来源行优先（焦点可能在行内子元素上），否则以 roving tabindex 停靠行为准
          const rows = Array.from(container.children) as HTMLElement[]
          const target = (event.target as HTMLElement | null)?.closest('.ui-tree-v2__node')
          const targetIndex = target ? rows.indexOf(target as HTMLElement) : -1
          const originKey = targetIndex >= 0 ? visible[targetIndex]?.key : focusedKey.value
          const currentIndex = list.findIndex((node) => String(node.key) === String(originKey))
          const current = list[currentIndex >= 0 ? currentIndex : 0]
          if (event.key === 'Enter') {
            event.preventDefault()
            handleNodeClick(current)
            return
          }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            const step = event.key === 'ArrowDown' ? 1 : -1
            const from = currentIndex >= 0 ? currentIndex : 0
            const next = list[(from + step + list.length) % list.length]
            moveFocusTo(next.key, container)
            return
          }
          if (event.key === 'ArrowRight') {
            if (!current.children.length) {
              return
            }
            event.preventDefault()
            if (!isExpanded(current)) {
              toggleExpand(current)
              return
            }
            const child = current.children.find((node) => !node.disabled)
            if (child) {
              moveFocusTo(child.key, container)
            }
            return
          }
          // ArrowLeft：已展开则收起，否则把焦点交回父节点
          if (current.children.length && isExpanded(current)) {
            event.preventDefault()
            toggleExpand(current)
            return
          }
          const parent = findParentNode(nodes.value, current.key)
          if (parent && !parent.disabled) {
            event.preventDefault()
            moveFocusTo(parent.key, container)
          }
        }

        function renderNodes(list: UiTreeNode[]): VNodeChild[] {
          // roving tabindex：键盘尚未介入时默认停靠第一个可见节点
          const tabStopKey = focusedKey.value === '' ? visibleNodes()[0]?.key : focusedKey.value
          return list.map((node) => {
            const expanded = isExpanded(node)
            const checked = isChecked(node)
            const indent = Number(props.indent ?? 16)
            const row = h(
              'div',
              {
                key: node.key,
                // WAI-ARIA Tree View：树节点用 treeitem 角色，展开/选中态与 ARIA 属性同步
                role: 'treeitem',
                tabindex: String(node.key) === String(tabStopKey) ? 0 : -1,
                'aria-expanded': node.children.length ? String(expanded) : undefined,
                'aria-selected': String(currentKey.value) === String(node.key) ? 'true' : 'false',
                class: [
                  'ui-tree-v2__node',
                  {
                    'is-expanded': expanded,
                    'is-current': currentKey.value === node.key && props.highlightCurrent,
                    'is-disabled': node.disabled
                  }
                ],
                style: { paddingLeft: `${node.level * indent + 4}px` },
                onClick: () => handleNodeClick(node)
              },
              [
                node.children.length
                  ? renderIcon(expanded ? ChevronDown : ChevronRight, {
                      class: 'ui-tree-v2__expand',
                      attrs: {
                        onClick: (event: Event) => {
                          event.stopPropagation()
                          if (!node.disabled) {
                            toggleExpand(node)
                          }
                        }
                      }
                    })
                  : h('span', { class: 'ui-tree-v2__expand is-leaf' }),
                props.showCheckbox
                  ? h(TreeV2Checkbox, {
                      class: 'ui-tree-v2__checkbox',
                      modelValue: checked,
                      disabled: Boolean(node.disabled),
                      onClick: (event: Event) => event.stopPropagation(),
                      'onUpdate:modelValue': (value: boolean) => toggleCheck(node, value)
                    })
                  : null,
                h('span', { class: 'ui-tree-v2__label' }, node.label)
              ]
            )
            return [row, expanded && node.children.length ? renderNodes(node.children) : null]
          })
        }

        return {
          get nodes() {
            return nodes.value
          },
          renderNodes,
          handleKeydown
        }
      },
      classes: (props) => [props.height ? 'is-scrollable' : ''],
      content: ({ props, state }) => {
        const children = state.nodes.length
          ? state.renderNodes(state.nodes)
          : h('div', { class: 'ui-tree-v2__empty' }, props.emptyText)
        return h(
          'div',
          {
            class: 'ui-tree-v2__nodes',
            role: 'tree',
            style: { height: sizeStyle(props.height) },
            onKeydown: state.handleKeydown
          },
          [children]
        )
      }
    },
    features
  )
}
