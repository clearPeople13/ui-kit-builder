import type { VNodeChild } from 'vue'
import { computed, h, ref, watch } from 'vue'
import { Check, ChevronRight } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
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

interface PanelNode {
  label: string
  value: any
  disabled: boolean
  leaf: boolean
  children: PanelNode[]
}

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
        const activePath = ref<any[]>([])
        const lazyChildren = ref<Record<string, PanelNode[]>>({})
        const lazyLoading = ref<Record<string, boolean>>({})
        const lazyLoaded = ref<Record<string, boolean>>({})
        const scrollTops = ref<Record<number, number>>({})
        const rootLoading = ref(false)
        const rootLoaded = ref(false)

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
          const expandable = isExpandable(node, path)
          if (expandable) {
            ensureChildren(node, path)
          }
          activePath.value = path
          if (!expandable || Boolean(props.checkStrictly)) {
            emitSelection(path)
          }
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

        function renderNode(node: PanelNode, level: number, itemHeight?: number): VNodeChild {
          const path = [...activePath.value.slice(0, level), node.value]
          const expandable = isExpandable(node, path)
          const loading = isLoading(node, path)
          const selected = isSelected(path)
          const active = sameValue(activePath.value[level], node.value) && !expandable
          const checkable = props.multiple && (!expandable || Boolean(props.checkStrictly))
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
                    h('span', null, '加载中…')
                  ])
                : expandable
                  ? renderIcon(ChevronRight, { class: 'ui-cascader-panel__node-arrow' })
                  : selected
                    ? renderIcon(Check, { class: 'ui-cascader-panel__check-icon' })
                    : null
            ]
          )
        }

        function handleColumnScroll(level: number, event: Event): void {
          const top = (event.target as HTMLElement).scrollTop
          if ((scrollTops.value[level] ?? 0) === top) {
            return
          }
          scrollTops.value = { ...scrollTops.value, [level]: top }
        }

        function renderColumn(column: PanelNode[], level: number): VNodeChild {
          const height = Number(props.height ?? 204)
          const itemHeight = Number(props.itemSize ?? 0)
          const virtual = itemHeight > 0 && column.length > 40
          const scrollTop = scrollTops.value[level] ?? 0
          const start = virtual
            ? Math.min(Math.max(0, column.length - 1), Math.max(0, Math.floor(scrollTop / itemHeight) - 4))
            : 0
          const end = virtual
            ? Math.min(column.length, Math.ceil((scrollTop + height) / itemHeight) + 4)
            : column.length
          let children: VNodeChild[] = []
          if (!column.length) {
            children = [
              h('div', { class: 'ui-cascader-panel__empty' }, level === 0 && rootLoading.value ? '加载中…' : '无数据')
            ]
          } else if (!virtual) {
            children = column.map((node) => renderNode(node, level))
          } else {
            const rows: VNodeChild[] = []
            for (let index = start; index < end; index += 1) {
              rows.push(
                h(
                  'div',
                  {
                    key: `row-${level}-${index}`,
                    class: 'ui-cascader-panel__row',
                    style: { top: `${index * itemHeight}px` }
                  },
                  [renderNode(column[index], level, itemHeight)]
                )
              )
            }
            children = [
              h(
                'div',
                { class: 'ui-cascader-panel__window', style: { height: `${column.length * itemHeight}px` } },
                rows
              )
            ]
          }
          return h(
            'div',
            {
              key: `column-${level}`,
              class: ['ui-cascader-panel__column', virtual ? 'is-virtual' : ''],
              style: { maxHeight: `${height}px` },
              role: 'listbox',
              'aria-label': `第 ${level + 1} 级`,
              onScroll: virtual ? (event: Event) => handleColumnScroll(level, event) : undefined
            },
            children
          )
        }

        return {
          renderColumns: () => columns().map((column, level) => renderColumn(column, level))
        }
      },
      content: ({ state }) => (state.renderColumns as () => VNodeChild[])(),
      styles: (props) => ({
        '--ui-cascader-panel-height': `${Number(props.height ?? 204)}px`
      })
    },
    features
  )
}
