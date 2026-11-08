import type { VNodeChild } from 'vue'
import { computed, h, ref } from 'vue'
import { ChevronDown, ChevronRight } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { collectFeatureHooks } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { useLocale } from '../../shared/config'
import { renderIcon } from '../../shared/icon'
import { collectDescendantKeys, collectTreeKeys, normalizeTreeNodes } from '../../shared/tree'
import { addUnit } from '../../shared/utils'
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
  height: { type: [String, Number], default: '' },
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

        // 特性（如 tree.virtualized）接管焦点落点：窗口化后目标行可能不在 DOM 里，
        // 由特性先滚动窗口再聚焦；未接管时按 DOM 顺序直接聚焦
        function focusVisibleNode(index: number, visible: UiTreeNode[], container: HTMLElement) {
          if (state.focusAdapter) {
            state.focusAdapter(index, visible, container)
          } else {
            const items = Array.from(container.querySelectorAll<HTMLElement>('.ui-tree__node'))
            items[index]?.focus({ preventScroll: true })
          }
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
          // data-key 优先：窗口化后 DOM 只剩可视切片，下标与 visible 全集不再一一对应
          const targetKey = target?.getAttribute('data-key')
          let currentIndex =
            targetKey !== null && targetKey !== undefined
              ? visible.findIndex((entry) => String(entry.key) === targetKey)
              : -1
          if (currentIndex < 0 && target) {
            currentIndex = items.indexOf(target as HTMLElement)
          }
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
                focusVisibleNode(index, visible, container)
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
                focusVisibleNode(index, visible, container)
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
                focusVisibleNode(index, visible, container)
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
                focusVisibleNode(index, visible, container)
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

        // 单行渲染：递归模式与窗口化模式（tree.virtualized 经 renderNodeWindow 钩子）共用同一出口，
        // 行的结构 / 事件 / 勾选语义只有一种实现
        function renderNodeRow(node: UiTreeNode, extend?: (node: UiTreeNode) => Record<string, any>): VNodeChild {
          const tabStop = rovingTabStopKey(visibleNodes())
          const expanded = isExpanded(node)
          const check = isChecked(node) ? 'checked' : checkState(node)
          const indent = Number(props.indent ?? 18)
          return h(
            'div',
            {
              key: node.key,
              // data-key 让键盘导航在窗口化（DOM 只剩可视切片）下也能定位全集下标
              'data-key': String(node.key),
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
          )
        }

        function renderNodes(list: UiTreeNode[], extend?: (node: UiTreeNode) => Record<string, any>): VNodeChild[] {
          return list.filter(matchesFilter).map((node) => {
            const expanded = isExpanded(node)
            return [
              renderNodeRow(node, extend),
              expanded && node.children.length ? renderNodes(node.children, extend) : null
            ]
          })
        }

        const state: Record<string, any> = {
          filterText,
          checkedKeys,
          expandedKeys,
          locale: useLocale('tree'),
          applyCheckedKeys,
          handleNodesKeydown,
          /** 滚动容器（content 渲染时挂 ref），供特性量行高 / 读可视高度 */
          nodesEl: undefined as HTMLElement | undefined,
          get nodes() {
            return nodes.value
          },
          visibleNodes,
          renderNodeRow,
          renderNodes
        }
        return state
      },
      classes: (props) => [props.height ? 'is-scrollable' : ''],
      content: ({ props, state, states }) => {
        if (!state.nodes.length) {
          return h('div', { class: 'ui-tree__empty' }, props.emptyText || state.locale.value.emptyText)
        }
        const hooks = collectFeatureHooks(states, 'treeNodeProps')
        const extend = hooks.length
          ? (node: UiTreeNode) =>
              Object.assign({}, ...hooks.map((hook: (node: UiTreeNode) => Record<string, any>) => hook(node)))
          : undefined
        // 窗口化特性（tree.virtualized）接管节点区渲染；未接管时退回递归全量渲染
        let children = state.renderNodes(state.nodes, extend)
        for (const hook of collectFeatureHooks(states, 'renderNodeWindow')) {
          const custom = hook({
            props,
            container: state.nodesEl as HTMLElement | undefined,
            nodes: state.visibleNodes(),
            extend,
            renderNode: state.renderNodeRow
          })
          if (custom) {
            children = custom
            break
          }
        }
        const scrollHooks = collectFeatureHooks(states, 'onNodesScroll')
        return h(
          'div',
          {
            class: 'ui-tree__nodes',
            style: { height: addUnit(props.height) },
            ref: (element: any) => {
              state.nodesEl = element ?? undefined
            },
            onScroll: scrollHooks.length ? (event: Event) => scrollHooks.forEach((hook) => hook({ event })) : undefined,
            onKeydown: state.handleNodesKeydown
          },
          [children]
        )
      }
    },
    features
  )
}
