import type { VNodeChild } from 'vue'
import { computed, h, ref } from 'vue'
import { ChevronDown, ChevronRight } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { collectFeatureHooks } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { useLocale } from '../../shared/config'
import { renderIcon } from '../../shared/icon'
import { collectDescendantKeys, collectTreeKeys, normalizeTreeNodes } from '../../shared/tree'
import type { UiTreeNode } from '../../shared/tree'
import { createCheckbox } from '../checkbox/core'
import './core.css'

const TreeCheckbox = createCheckbox([])

const treeBaseProps = {
  data: { type: Array, default: () => [] },
  // 不给 default：留空才能让 ConfigProvider 的 locale 生效，显式传值仍优先
  emptyText: { type: String },
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
      setup(props, { emit, slots }) {
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

        // 可见节点扁平序列：与 renderNodes 的渲染顺序一致（filter 命中 + 已展开才下钻），
        // 键盘导航的「上一个/下一个可见节点」与 DOM 顺序共享同一份推导
        function visibleNodes(): UiTreeNode[] {
          const list: UiTreeNode[] = []
          const walk = (source: UiTreeNode[]) => {
            for (const node of source) {
              if (!matchesFilter(node)) {
                continue
              }
              list.push(node)
              if (node.children.length && isExpanded(node)) {
                walk(node.children)
              }
            }
          }
          walk(nodes.value)
          return list
        }

        // roving tabindex 当前项：优先 currentKey（点击/currentNodeKey 已同步），
        // 失效（被收起/过滤/禁用）时兜底落到首个可见非禁用节点，保证树始终有一个 Tab 停靠点
        function rovingTabStopKey(visible: UiTreeNode[]): string | number {
          const current = currentKey.value
          if (current !== '' && visible.some((node) => !node.disabled && String(node.key) === String(current))) {
            return current
          }
          return visible.find((node) => !node.disabled)?.key ?? ''
        }

        function focusVisibleNode(index: number, visible: UiTreeNode[], items: HTMLElement[]) {
          items[index]?.focus({ preventScroll: true })
          currentKey.value = visible[index].key
        }

        // WAI-ARIA Tree 键盘映射：↑↓ 在可见节点间移动（跳过禁用），→ 展开/进首个子节点，
        // ← 收起/回父节点，Home/End 跳首末可见节点；容器层 roving 不抢 checkbox 的 Space
        function handleNodesKeydown(event: KeyboardEvent) {
          const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
          if (!keys.includes(event.key)) {
            return
          }
          const container = event.currentTarget as HTMLElement
          const items = Array.from(container.querySelectorAll<HTMLElement>('.ui-tree__node'))
          const visible = visibleNodes()
          if (!items.length || !visible.length) {
            return
          }
          const target = (event.target as HTMLElement | null)?.closest('.ui-tree__node')
          const currentIndex = target ? items.indexOf(target as HTMLElement) : -1
          if (currentIndex < 0) {
            return
          }
          const node = visible[currentIndex]
          if (node.disabled) {
            return
          }
          event.preventDefault()
          const enabled = (index: number) => index >= 0 && index < visible.length && !visible[index].disabled
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            const step = event.key === 'ArrowDown' ? 1 : -1
            for (let offset = 1; offset < visible.length; offset += 1) {
              const index = currentIndex + step * offset
              if (index < 0 || index >= visible.length) {
                break
              }
              if (enabled(index)) {
                focusVisibleNode(index, visible, items)
                return
              }
            }
            return
          }
          if (event.key === 'Home' || event.key === 'End') {
            const step = event.key === 'Home' ? 1 : -1
            const edge = event.key === 'Home' ? 0 : visible.length - 1
            for (let offset = 0; offset < visible.length; offset += 1) {
              const index = (edge + step * offset + visible.length * offset) % visible.length
              if (enabled(index)) {
                focusVisibleNode(index, visible, items)
                return
              }
            }
            return
          }
          if (event.key === 'ArrowRight') {
            if (node.children.length && !isExpanded(node)) {
              toggleExpand(node)
              return
            }
            // 已展开：进到第一个非禁用的直接子节点
            for (
              let index = currentIndex + 1;
              index < visible.length && visible[index].level > node.level;
              index += 1
            ) {
              if (visible[index].level === node.level + 1 && enabled(index)) {
                focusVisibleNode(index, visible, items)
                return
              }
            }
            return
          }
          // ArrowLeft：已展开则收起；已收起则回到父节点
          if (node.children.length && isExpanded(node)) {
            toggleExpand(node)
            return
          }
          for (let index = currentIndex - 1; index >= 0; index -= 1) {
            if (visible[index].level < node.level) {
              if (enabled(index)) {
                focusVisibleNode(index, visible, items)
              }
              return
            }
          }
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
          const tabStop = rovingTabStopKey(visibleNodes())
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
                  // roving tabindex：整棵树一个 Tab 停靠点，禁用节点移出 Tab 序
                  tabindex: node.disabled ? undefined : String(tabStop) === String(node.key) ? 0 : -1,
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
                    slots.default
                      ? slots.default({ node, data: node.raw, level: node.level })
                      : props.renderContent
                        ? props.renderContent(node.raw, node)
                        : node.label
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
          locale: useLocale('tree'),
          applyCheckedKeys,
          handleNodesKeydown,
          get nodes() {
            return nodes.value
          },
          renderNodes
        }
      },
      content: ({ props, state, states }) => {
        if (!state.nodes.length) {
          return h('div', { class: 'ui-tree__empty' }, props.emptyText || state.locale.value.emptyText)
        }
        const hooks = collectFeatureHooks(states, 'treeNodeProps')
        const extend = hooks.length
          ? (node: UiTreeNode) =>
              Object.assign({}, ...hooks.map((hook: (node: UiTreeNode) => Record<string, any>) => hook(node)))
          : undefined
        return h(
          'div',
          { class: 'ui-tree__nodes', onKeydown: state.handleNodesKeydown },
          state.renderNodes(state.nodes, extend)
        )
      }
    },
    features
  )
}
