import type { VNodeChild } from 'vue'
import { computed, h, ref } from 'vue'
import { ChevronDown, ChevronRight } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { collectFeatureHooks } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { collectDescendantKeys, collectTreeKeys, normalizeTreeNodes } from '../../shared/tree'
import type { UiTreeNode } from '../../shared/tree'
import { createCheckbox } from '../checkbox/core'
import './core.css'

const TreeCheckbox = createCheckbox([])

const treeBaseProps = {
  data: { type: Array, default: () => [] },
  emptyText: { type: String, default: '暂无数据' },
  defaultExpandAll: { type: Boolean },
  defaultCheckedKeys: { type: Array, default: () => [] },
  defaultExpandedKeys: { type: Array, default: () => [] },
  currentNodeKey: { type: [String, Number] },
  renderContent: { type: Function },
  showCheckbox: { type: Boolean },
  props: { type: Object, default: () => ({}) },
  highlightCurrent: { type: Boolean },
  filterNodeMethod: { type: Function },
  accordion: { type: Boolean },
  indent: { type: Number, default: 18 },
  expandOnClickNode: { type: Boolean, default: true },
  checkOnClickNode: { type: Boolean },
  checkStrictly: { type: Boolean }
}

function toKeySet(value: unknown): Set<string | number> {
  return new Set(Array.isArray(value) ? (value as Array<string | number>) : [])
}

export function createTree(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiTree',
      baseClass: 'ui-tree',
      props: treeBaseProps,
      setup(props, { emit }) {
        const nodes = computed(() => normalizeTreeNodes(props.data, props.props ?? {}))
        const expandedKeys = ref<Set<string | number>>(
          new Set(
            props.defaultExpandAll
              ? collectTreeKeys(nodes.value)
              : (props.defaultExpandedKeys as Array<string | number>)
          )
        )
        const checkedKeys = ref<Set<string | number>>(expandCheckedKeys(toKeySet(props.defaultCheckedKeys)))
        const currentKey = ref<string | number>(props.currentNodeKey ?? '')
        const filterText = ref('')

        function isExpanded(node: UiTreeNode) {
          return expandedKeys.value.has(node.key)
        }

        function subtreeState(node: UiTreeNode, keys: Set<string | number>): 'checked' | 'indeterminate' | 'unchecked' {
          if (props.checkStrictly || !node.children.length) {
            return keys.has(node.key) ? 'checked' : 'unchecked'
          }
          const selectable = node.children.filter((child) => !child.disabled)
          const relevant = selectable.length ? selectable : node.children
          const states = relevant.map((child) => subtreeState(child, keys))
          if (states.every((state) => state === 'checked')) {
            return 'checked'
          }
          return states.some((state) => state !== 'unchecked') ? 'indeterminate' : 'unchecked'
        }

        function isChecked(node: UiTreeNode) {
          return checkedKeys.value.has(node.key)
        }

        function checkState(node: UiTreeNode) {
          return subtreeState(node, checkedKeys.value)
        }

        function findNode(list: UiTreeNode[], key: string | number): UiTreeNode | null {
          for (const node of list) {
            if (node.key === key) {
              return node
            }
            const found = findNode(node.children, key)
            if (found) {
              return found
            }
          }
          return null
        }

        function normalizeParents(keys: Set<string | number>) {
          function walk(list: UiTreeNode[]) {
            for (const node of list) {
              walk(node.children)
              if (!node.children.length) {
                continue
              }
              if (subtreeState(node, keys) === 'checked') {
                keys.add(node.key)
              } else {
                keys.delete(node.key)
              }
            }
          }
          walk(nodes.value)
        }

        function expandCheckedKeys(keys: Set<string | number>): Set<string | number> {
          const next = new Set(keys)
          if (props.checkStrictly) {
            return next
          }
          for (const key of keys) {
            const node = findNode(nodes.value, key)
            if (!node) {
              continue
            }
            for (const childKey of collectDescendantKeys(node)) {
              next.add(childKey)
            }
          }
          normalizeParents(next)
          return next
        }

        function applyCheckedKeys(keys: Array<string | number>) {
          const next = expandCheckedKeys(new Set(keys))
          checkedKeys.value = next
          emit('update:checked-keys', [...next])
        }

        function matchesFilter(node: UiTreeNode): boolean {
          if (!filterText.value) {
            return true
          }
          if (props.filterNodeMethod) {
            return Boolean(props.filterNodeMethod(filterText.value, node.raw))
          }
          return node.label.includes(filterText.value) || node.children.some(matchesFilter)
        }

        function findSiblings(list: UiTreeNode[], target: UiTreeNode): UiTreeNode[] | null {
          if (list.some((node) => node.key === target.key)) {
            return list
          }
          for (const node of list) {
            const siblings = findSiblings(node.children, target)
            if (siblings) {
              return siblings
            }
          }
          return null
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
              for (const sibling of findSiblings(nodes.value, node) ?? []) {
                next.delete(sibling.key)
              }
            }
            next.add(node.key)
          }
          expandedKeys.value = next
          emit('node-expand', node.raw, next.has(node.key))
        }

        function toggleCheck(node: UiTreeNode, checked: boolean) {
          const next = new Set(checkedKeys.value)
          if (props.checkStrictly) {
            if (checked) {
              next.add(node.key)
            } else {
              next.delete(node.key)
            }
          } else {
            for (const key of [node.key, ...collectDescendantKeys(node)]) {
              if (checked) {
                next.add(key)
              } else {
                next.delete(key)
              }
            }
            normalizeParents(next)
          }
          checkedKeys.value = next
          emit('check-change', node.raw, checked)
          emit('update:checked-keys', [...next])
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

        function renderNodes(list: UiTreeNode[], extend?: (node: UiTreeNode) => Record<string, any>): VNodeChild[] {
          return list.filter(matchesFilter).map((node) => {
            const expanded = isExpanded(node)
            const check = isChecked(node) ? 'checked' : checkState(node)
            const indent = Number(props.indent ?? 18)
            return [
              h(
                'div',
                {
                  key: node.key,
                  class: [
                    'ui-tree__node',
                    {
                      'is-expanded': expanded,
                      'is-current': props.highlightCurrent && String(currentKey.value) === String(node.key),
                      'is-disabled': node.disabled
                    }
                  ],
                  style: { paddingLeft: `${node.level * indent + 4}px` },
                  onClick: () => handleNodeClick(node),
                  ...(extend?.(node) ?? {})
                },
                [
                  node.children.length
                    ? renderIcon(props.icon || (expanded ? ChevronDown : ChevronRight), {
                        class: 'ui-tree__expand',
                        attrs: {
                          onClick: (event: Event) => {
                            event.stopPropagation()
                            if (!node.disabled) {
                              toggleExpand(node)
                            }
                          }
                        }
                      })
                    : h('span', { class: 'ui-tree__expand is-leaf' }),
                  props.showCheckbox
                    ? h(TreeCheckbox, {
                        class: 'ui-tree__checkbox',
                        modelValue: check === 'checked',
                        indeterminate: check === 'indeterminate',
                        disabled: Boolean(node.disabled),
                        onClick: (event: Event) => event.stopPropagation(),
                        'onUpdate:modelValue': (checked: boolean) => toggleCheck(node, checked)
                      })
                    : null,
                  h('span', { class: 'ui-tree__label' }, [
                    props.renderContent ? props.renderContent(node.raw, node) : node.label
                  ])
                ]
              ),
              expanded && node.children.length ? renderNodes(node.children, extend) : null
            ]
          })
        }

        return {
          filterText,
          checkedKeys,
          expandedKeys,
          applyCheckedKeys,
          get nodes() {
            return nodes.value
          },
          renderNodes
        }
      },
      content: ({ props, state, states }) => {
        if (!state.nodes.length) {
          return h('div', { class: 'ui-tree__empty' }, props.emptyText)
        }
        const hooks = collectFeatureHooks(states, 'treeNodeProps')
        const extend = hooks.length
          ? (node: UiTreeNode) =>
              Object.assign({}, ...hooks.map((hook: (node: UiTreeNode) => Record<string, any>) => hook(node)))
          : undefined
        return h('div', { class: 'ui-tree__nodes' }, state.renderNodes(state.nodes, extend))
      }
    },
    features
  )
}
