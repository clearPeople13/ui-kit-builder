import type { VNodeChild } from 'vue'
import { computed, h, nextTick, ref, watch } from 'vue'
import { Check, ChevronRight } from '../../shared/icons'
import { collectFeatureHooks, type UiFeature, type UiFeatureState } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { formatLocale, useLocale } from '../../shared/config'
import { renderIcon } from '../../shared/icon'
import { sameValue } from '../../shared/value'
import './core.css'

const cascaderPanelBaseProps = {
  modelValue: { type: [Number, String, Array, Object] },
  options: { type: Array, default: () => [] },
  value: { type: null },
  disabled: { type: null },
  props: { type: Object, default: () => ({}) },
  height: { type: Number, default: 204 },
  label: { type: null },
  children: { type: null },
  leaf: { type: null }
}

export interface PanelNode {
  label: string
  value: any
  disabled: boolean
  leaf: boolean
  children: PanelNode[]
}

export interface CascaderPanelColumnContext {
  column: PanelNode[]
  level: number
  height: number
  itemSize?: number
  renderNode: (node: PanelNode, level: number, tabStop: string, itemHeight?: number) => VNodeChild
  tabStop: string
}

export interface CascaderPanelColumnWindow {
  children: VNodeChild[]
  virtual: boolean
}

export type CascaderPanelColumnRenderer = (context: CascaderPanelColumnContext) => CascaderPanelColumnWindow | null

const MAPPING_ALIASES = ['label', 'value', 'children', 'leaf', 'disabled'] as const

function resolveMapping(props: Record<string, any>): Record<string, any> {
  const mapping: Record<string, any> = { ...(props.props ?? {}) }
  for (const key of MAPPING_ALIASES) {
    const alias = props[key]
    if (typeof alias === 'string' && alias) {
      mapping[key] = alias
    }
  }
  return mapping
}

function normalizePanelTree(input: unknown, mapping: Record<string, any>): PanelNode[] {
  if (!Array.isArray(input)) {
    return []
  }
  const fields = {
    label: mapping.label ?? 'label',
    value: mapping.value ?? 'value',
    children: mapping.children ?? 'children',
    disabled: mapping.disabled ?? 'disabled',
    leaf: mapping.leaf ?? 'leaf'
  }
  const result: PanelNode[] = []
  for (const item of input) {
    if (!item || typeof item !== 'object') {
      result.push({ label: String(item), value: item, disabled: false, leaf: true, children: [] })
      continue
    }
    const record = item as Record<string, any>
    result.push({
      label: String(record[fields.label] ?? record[fields.value] ?? ''),
      value: record[fields.value] ?? record[fields.label],
      disabled: Boolean(record[fields.disabled]),
      leaf: Boolean(record[fields.leaf]),
      children: normalizePanelTree(record[fields.children], mapping)
    })
  }
  return result
}

function pathKey(path: any[]): string {
  return JSON.stringify(path)
}

function pathEquals(left: any[], right: any[]): boolean {
  if (left.length !== right.length) {
    return false
  }
  return left.every((value, index) => sameValue(value, right[index]))
}

function toPath(value: unknown): any[] {
  if (Array.isArray(value)) {
    return value
  }
  if (value === undefined || value === null || value === '') {
    return []
  }
  return [value]
}

export function createCascaderPanel(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiCascaderPanel',
      baseClass: 'ui-cascader-panel',
      props: cascaderPanelBaseProps,
      classes: (props) => (props.disabled === true ? ['is-disabled'] : []),
      setup(props, { emit }) {
        // 与 cascader 共用同一命名空间：内联面板的文案口径必须与浮层版本一致
        const locale = useLocale('cascader')
        const activePath = ref<any[]>([])
        const focusKey = ref('')
        const lazyChildren = ref<Record<string, PanelNode[]>>({})
        const lazyLoading = ref<Record<string, boolean>>({})
        const lazyLoaded = ref<Record<string, boolean>>({})
        const rootLoading = ref(false)
        const rootLoaded = ref(false)
        let featureStates: UiFeatureState[] = []

        // 特性扩展点：虚拟窗口由 cascader-panel.virtualized 注入，core 不感知算法与滚动状态
        function featureHook<T extends (...args: any[]) => any>(name: string): T | undefined {
          return collectFeatureHooks(featureStates, name)[0] as T | undefined
        }

        const mapping = computed(() => resolveMapping(props))
        const nodes = computed(() => normalizePanelTree(props.options, mapping.value))
        const lazyEnabled = computed(() => Boolean(props.lazy || mapping.value.lazy))
        const lazyLoader = computed<((node: any, resolve: (children: any[]) => void) => void) | undefined>(() => {
          return typeof mapping.value.lazyLoad === 'function' ? mapping.value.lazyLoad : undefined
        })
        const rootNodes = computed<PanelNode[]>(() => {
          if (!nodes.value.length && lazyEnabled.value) {
            return lazyChildren.value['[]'] ?? []
          }
          return nodes.value
        })

        const selectedPaths = computed<any[][]>(() => {
          if (props.multiple) {
            if (!Array.isArray(props.modelValue)) {
              return []
            }
            return props.modelValue.map((entry: unknown) => toPath(entry)).filter((path: any[]) => path.length > 0)
          }
          const path = toPath(props.modelValue)
          return path.length ? [path] : []
        })

        watch(
          () => props.modelValue,
          () => {
            if (props.multiple) {
              const first = selectedPaths.value[0]
              if (first && !activePath.value.length) {
                activePath.value = [...first]
              }
              return
            }
            const path = toPath(props.modelValue)
            if (path.length) {
              activePath.value = [...path]
            }
          },
          { immediate: true }
        )

        function ensureRootLoaded(): void {
          if (!lazyEnabled.value || rootLoaded.value || rootLoading.value || nodes.value.length || !lazyLoader.value) {
            return
          }
          rootLoading.value = true
          lazyLoader.value(
            {
              level: 0,
              value: undefined,
              label: '',
              pathValues: [],
              pathLabels: [],
              leaf: false,
              root: true
            },
            (children: any[]) => {
              lazyChildren.value = {
                ...lazyChildren.value,
                '[]': normalizePanelTree(children, mapping.value)
              }
              rootLoaded.value = true
              rootLoading.value = false
            }
          )
        }

        watch([lazyEnabled, nodes, lazyLoader], ensureRootLoaded, { immediate: true })

        function childrenOf(node: PanelNode, path: any[]): PanelNode[] {
          if (node.children.length) {
            return node.children
          }
          if (lazyEnabled.value && !node.leaf) {
            return lazyChildren.value[pathKey(path)] ?? []
          }
          return []
        }

        function isExpandable(node: PanelNode, _path: any[]): boolean {
          return node.children.length > 0 || (lazyEnabled.value && !node.leaf)
        }

        function isLoading(node: PanelNode, path: any[]): boolean {
          return Boolean(lazyLoading.value[pathKey(path)])
        }

        function ensureChildren(node: PanelNode, path: any[]): void {
          if (!lazyEnabled.value || node.children.length || node.leaf) {
            return
          }
          const key = pathKey(path)
          if (lazyLoaded.value[key] || lazyLoading.value[key] || !lazyLoader.value) {
            return
          }
          lazyLoading.value = { ...lazyLoading.value, [key]: true }
          lazyLoader.value(
            {
              value: node.value,
              label: node.label,
              level: path.length,
              pathValues: path,
              pathLabels: [],
              leaf: node.leaf,
              root: false
            },
            (children: any[]) => {
              lazyChildren.value = {
                ...lazyChildren.value,
                [key]: normalizePanelTree(children, mapping.value)
              }
              lazyLoaded.value = { ...lazyLoaded.value, [key]: true }
              lazyLoading.value = { ...lazyLoading.value, [key]: false }
            }
          )
        }

        function isSelected(path: any[]): boolean {
          return selectedPaths.value.some((item) => pathEquals(item, path))
        }

        function emitSelection(path: any[]): void {
          if (props.multiple) {
            const exists = isSelected(path)
            const next = exists
              ? selectedPaths.value.filter((item) => !pathEquals(item, path))
              : [...selectedPaths.value, path]
            emit('update:modelValue', next)
            emit('change', next)
            return
          }
          emit('update:modelValue', [...path])
          emit('change', [...path])
        }

        function handleNode(node: PanelNode, level: number): void {
          if (node.disabled || props.disabled === true) {
            return
          }
          const path = [...activePath.value.slice(0, level), node.value]
          focusKey.value = pathKey(path)
          const expandable = isExpandable(node, path)
          if (expandable) {
            ensureChildren(node, path)
          }
          activePath.value = path
          if (!expandable || Boolean(props.checkStrictly)) {
            emitSelection(path)
          }
        }

        // roving tabindex 停靠点：键盘/点击共用 focusKey 同步，失效时兜底第一列首个非禁用节点，
        // 整面板只占一个 Tab 位，与 tree/cascader 口径一致
        function tabStopKey(cols: PanelNode[][]): string {
          for (let level = 0; level < cols.length; level += 1) {
            const prefix = activePath.value.slice(0, level)
            for (const node of cols[level]) {
              if (!node.disabled && pathKey([...prefix, node.value]) === focusKey.value) {
                return focusKey.value
              }
            }
          }
          const first = cols[0]?.find((node) => !node.disabled)
          return first ? pathKey([first.value]) : ''
        }

        function columns(): PanelNode[][] {
          const result: PanelNode[][] = [rootNodes.value]
          let level = 0
          while (activePath.value.length > level) {
            const column = result[level]
            const node = column.find((item) => sameValue(item.value, activePath.value[level]))
            if (!node) {
              break
            }
            const children = childrenOf(node, activePath.value.slice(0, level + 1))
            if (!children.length) {
              break
            }
            result.push(children)
            level += 1
          }
          return result
        }

        function renderNode(node: PanelNode, level: number, tabStop: string, itemHeight?: number): VNodeChild {
          const path = [...activePath.value.slice(0, level), node.value]
          const expandable = isExpandable(node, path)
          const loading = isLoading(node, path)
          const selected = isSelected(path)
          const active = sameValue(activePath.value[level], node.value) && !expandable
          const checkable = props.multiple && (!expandable || Boolean(props.checkStrictly))
          const keyboardOff = props.disabled === true
          return h(
            'div',
            {
              key: `node-${level}-${String(node.value)}`,
              class: [
                'ui-cascader-panel__node',
                {
                  'is-active': active,
                  'is-selected': selected,
                  'is-disabled': node.disabled,
                  'is-loading': loading
                }
              ],
              style: itemHeight ? { height: `${itemHeight}px` } : undefined,
              role: 'option',
              'aria-selected': selected,
              'aria-disabled': node.disabled || undefined,
              'data-node-key': pathKey(path),
              tabindex: keyboardOff || node.disabled ? undefined : tabStop === pathKey(path) ? 0 : -1,
              onClick: () => handleNode(node, level)
            },
            [
              checkable
                ? h('span', { class: ['ui-cascader-panel__check', { 'is-checked': selected }] }, [
                    selected ? renderIcon(Check) : null
                  ])
                : null,
              h('span', { class: 'ui-cascader-panel__node-label' }, node.label),
              loading
                ? h('span', { class: 'ui-loader ui-loader--inline', role: 'status' }, [
                    h('span', { class: 'ui-loader__spinner', 'aria-hidden': 'true' }),
                    h('span', null, locale.value.loading)
                  ])
                : expandable
                  ? renderIcon(ChevronRight, { class: 'ui-cascader-panel__node-arrow' })
                  : selected
                    ? renderIcon(Check, { class: 'ui-cascader-panel__check-icon' })
                    : null
            ]
          )
        }

        // WAI-ARIA 级联键盘映射，与 cascader/menu/tree 同口径：↑↓ 同列移动（跳过禁用、边界停住），
        // → 展开并进入子列首项，← 收起子列或回父级节点，Home/End 跳列首末，Enter/Space 等同点击
        function handleColumnKeydown(level: number, event: KeyboardEvent): void {
          const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' ']
          if (!keys.includes(event.key)) {
            return
          }
          const columnEl = event.currentTarget as HTMLElement
          const target = (event.target as HTMLElement | null)?.closest('.ui-cascader-panel__node')
          if (!target || !columnEl.contains(target) || target.classList.contains('is-disabled')) {
            return
          }
          const cols = columns()
          const items = Array.from(columnEl.querySelectorAll<HTMLElement>('.ui-cascader-panel__node'))
          const currentIndex = items.indexOf(target as HTMLElement)
          const column = cols[level] ?? []
          const node = column[currentIndex]
          if (currentIndex < 0 || !node) {
            return
          }
          const path = [...activePath.value.slice(0, level), node.value]
          const keyOf = (element: HTMLElement) => element.getAttribute('data-node-key') ?? ''
          const moveFocus = (element: HTMLElement | undefined | null) => {
            if (!element) {
              return
            }
            element.focus({ preventScroll: true })
            focusKey.value = keyOf(element)
          }
          const enabled = (index: number) => index >= 0 && index < column.length && !column[index].disabled
          event.preventDefault()

          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            const step = event.key === 'ArrowDown' ? 1 : -1
            for (let offset = 1; offset < column.length; offset += 1) {
              const index = currentIndex + step * offset
              if (index < 0 || index >= column.length) {
                break
              }
              if (enabled(index)) {
                moveFocus(items[index])
                return
              }
            }
            return
          }
          if (event.key === 'Home' || event.key === 'End') {
            const edge = event.key === 'Home' ? 0 : column.length - 1
            const step = event.key === 'Home' ? 1 : -1
            for (let offset = 0; offset < column.length; offset += 1) {
              const index = edge + step * offset
              if (index < 0 || index >= column.length) {
                break
              }
              if (enabled(index)) {
                moveFocus(items[index])
                return
              }
            }
            return
          }
          if (event.key === 'Enter' || event.key === ' ') {
            focusKey.value = pathKey(path)
            handleNode(node, level)
            return
          }
          if (event.key === 'ArrowRight') {
            if (!isExpandable(node, path)) {
              return
            }
            focusKey.value = pathKey(path)
            handleNode(node, level)
            // 子列是展开后才新建的，必须在 nextTick 里重新查询，捕获的旧引用里没有它
            nextTick(() => {
              const columnsNow = Array.from(
                columnEl.parentElement?.querySelectorAll<HTMLElement>('.ui-cascader-panel__column') ?? []
              )
              const first = Array.from(
                columnsNow[level + 1]?.querySelectorAll<HTMLElement>('.ui-cascader-panel__node') ?? []
              ).find((element) => !element.classList.contains('is-disabled'))
              moveFocus(first)
            })
            return
          }
          const columnEls = Array.from(
            columnEl.parentElement?.querySelectorAll<HTMLElement>('.ui-cascader-panel__column') ?? []
          )
          // ArrowLeft：已展开子列则收起（activePath 摘掉当前节点，子列整体退场），否则焦点回父级节点
          if (level + 1 < cols.length && sameValue(activePath.value[level], node.value)) {
            moveFocus(items[currentIndex])
            activePath.value = [...activePath.value.slice(0, level)]
            return
          }
          if (level > 0) {
            const parentItems = Array.from(
              columnEls[level - 1]?.querySelectorAll<HTMLElement>('.ui-cascader-panel__node') ?? []
            )
            moveFocus(
              parentItems.find((element) => element.getAttribute('data-node-key') === pathKey(path.slice(0, -1)))
            )
          }
        }

        function renderColumn(column: PanelNode[], level: number, tabStop: string): VNodeChild {
          const height = Number(props.height ?? 204)
          const columnWindow =
            featureHook<CascaderPanelColumnRenderer>('renderColumn')?.({
              column,
              level,
              height,
              itemSize: featureHook<() => number>('columnItemSize')?.(),
              renderNode,
              tabStop
            }) ?? null
          let children: VNodeChild[] = []
          if (!column.length) {
            children = [
              h(
                'div',
                { class: 'ui-cascader-panel__empty', role: 'option', 'aria-disabled': 'true' },
                level === 0 && rootLoading.value ? locale.value.loading : locale.value.noData
              )
            ]
          } else if (!columnWindow) {
            children = column.map((node) => renderNode(node, level, tabStop))
          } else {
            children = columnWindow.children
          }
          return h(
            'div',
            {
              key: `column-${level}`,
              class: ['ui-cascader-panel__column', columnWindow?.virtual ? 'is-virtual' : ''],
              style: { maxHeight: `${height}px` },
              role: 'listbox',
              'aria-label': formatLocale(locale.value.levelFormat, { level: level + 1 }),
              onScroll: (event: Event) => featureHook('onColumnScroll')?.({ level, event }),
              onKeydown: (event: KeyboardEvent) => handleColumnKeydown(level, event)
            },
            children
          )
        }

        return {
          renderColumns: (states: UiFeatureState[] = []) => {
            featureStates = states
            const cols = columns()
            const tabStop = tabStopKey(cols)
            return cols.map((column, level) => renderColumn(column, level, tabStop))
          }
        }
      },
      content: ({ state, states }) => (state.renderColumns as (items: UiFeatureState[]) => VNodeChild[])(states),
      styles: (props) => ({
        '--ui-cascader-panel-height': `${Number(props.height ?? 204)}px`
      })
    },
    features
  )
}
