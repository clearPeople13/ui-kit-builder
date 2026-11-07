import type { VNodeChild } from 'vue'
import { computed, h, ref } from 'vue'
import { ChevronDown, ChevronRight } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { collectDescendantKeys, collectTreeKeys, normalizeTreeNodes } from '../../shared/tree'
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

        function renderNodes(list: UiTreeNode[]): VNodeChild[] {
          return list.map((node) => {
            const expanded = isExpanded(node)
            const checked = isChecked(node)
            const indent = Number(props.indent ?? 16)
            const row = h(
              'div',
              {
                key: node.key,
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
          renderNodes
        }
      },
      classes: (props) => [props.height ? 'is-scrollable' : ''],
      content: ({ props, state }) => {
        if (!state.nodes.length) {
          return h('div', { class: 'ui-tree-v2__empty' }, props.emptyText)
        }
        return h(
          'div',
          { class: 'ui-tree-v2__nodes', style: { height: sizeStyle(props.height) } },
          state.renderNodes(state.nodes)
        )
      }
    },
    features
  )
}
