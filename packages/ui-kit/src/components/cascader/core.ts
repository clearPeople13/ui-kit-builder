import type { VNodeChild } from 'vue'
import { Teleport, computed, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Check, ChevronDown, ChevronRight, X } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { useFloatingPanel } from '../../shared/panel'
import { sameValue } from '../../shared/value'
import { cascaderClearableFeature } from './features/clearable/index'
import { cascaderMultipleFeature } from './features/multiple/index'
import { cascaderFilterableFeature } from './features/filterable/index'
import { cascaderPopperFeature } from './features/popper/index'
import { cascaderLazyFeature } from './features/lazy/index'
import { cascaderVirtualizedFeature } from './features/virtualized/index'
import { cascaderFormatFeature } from './features/format/index'
import './core.css'

const cascaderBaseProps = {
  modelValue: { type: [Number, String, Array, Object] },
  options: { type: Array, default: () => [] },
  size: { type: String },
  disabled: { type: Boolean },
  multiple: { type: Boolean },
  props: { type: Object, default: () => ({}) },
  virtualScroll: { type: Boolean },
  height: { type: Number, default: 204 },
  placeholder: { type: String },
  separator: { type: String, default: ' / ' },
  showAllLevels: { type: Boolean, default: true },
  beforeFilter: { type: Function },
  effect: { type: String, default: 'light' },
}

interface CascaderNode {
  label: string
  value: any
  disabled: boolean
  leaf: boolean
  children: CascaderNode[]
}

interface LeafPath {
  values: any[]
  labels: string[]
  disabled: boolean
}

function normalizeTree(input: unknown, mapping: Record<string, any>): CascaderNode[] {
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
  const result: CascaderNode[] = []
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
      children: normalizeTree(record[fields.children], mapping)
    })
  }
  return result
}

function collectLeafPaths(nodes: CascaderNode[], values: any[], labels: string[], result: LeafPath[]): void {
  for (const node of nodes) {
    const nextValues = [...values, node.value]
    const nextLabels = [...labels, node.label]
    if (node.children.length) {
      collectLeafPaths(node.children, nextValues, nextLabels, result)
      continue
    }
    result.push({ values: nextValues, labels: nextLabels, disabled: node.disabled })
  }
}

function pathEquals(left: any[], right: any[]): boolean {
  if (left.length !== right.length) {
    return false
  }
  return left.every((value, index) => sameValue(value, right[index]))
}

export function createCascader(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiCascader',
      baseClass: 'ui-cascader',
      props: cascaderBaseProps,
      setup(props, { emit }) {
        const open = ref(false)
        const query = ref('')
        const inputText = ref('')
        const triggerRef = ref<HTMLElement>()
        const panelRef = ref<HTMLElement>()
        const inputRef = ref<HTMLInputElement>()
        const activePath = ref<any[]>([])
        const lazyChildren = ref<Record<string, CascaderNode[]>>({})
        const lazyLoadedKeys = ref<Set<string>>(new Set())
        const lazyLoadingKeys = ref<Set<string>>(new Set())
        const rootLoading = ref(false)
        const rootLoaded = ref(false)
        const scrollTops = ref<Record<number, number>>({})
        let filterTimer: ReturnType<typeof setTimeout> | null = null

        const nodes = computed(() => normalizeTree(props.options, props.props ?? {}))
        const leafPaths = computed(() => {
          const result: LeafPath[] = []
          collectLeafPaths(nodes.value, [], [], result)
          return result
        })

        const lazyEnabled = computed(() => Boolean(props.lazy || props.props?.lazy))
        const lazyLoader = computed<((node: any, resolve: (children: any[]) => void) => void) | undefined>(() => {
          if (typeof props.lazyLoad === 'function') {
            return props.lazyLoad
          }
          const mapped = props.props?.lazyLoad
          return typeof mapped === 'function' ? mapped : undefined
        })
        const rootNodes = computed<CascaderNode[]>(() => {
          if (!lazyEnabled.value) {
            return nodes.value
          }
          return lazyChildren.value['[]'] ?? nodes.value
        })

        function pathKey(path: any[]): string {
          return JSON.stringify(path)
        }

        function childrenOf(node: CascaderNode, path: any[]): CascaderNode[] {
          if (!lazyEnabled.value) {
            return node.children
          }
          return lazyChildren.value[pathKey(path)] ?? node.children
        }

        function isExpandable(node: CascaderNode, path: any[]): boolean {
          if (!lazyEnabled.value) {
            return node.children.length > 0
          }
          if (node.leaf) {
            return false
          }
          const key = pathKey(path)
          if (lazyLoadedKeys.value.has(key)) {
            return (lazyChildren.value[key] ?? []).length > 0
          }
          return true
        }

        function isLoading(path: any[]): boolean {
          return lazyLoadingKeys.value.has(pathKey(path))
        }

        function labelsOfPath(path: any[]): string[] {
          const labels: string[] = []
          let current = rootNodes.value
          let prefix: any[] = []
          for (const value of path) {
            const node = current.find((item) => sameValue(item.value, value))
            if (!node) {
              labels.push(String(value))
              break
            }
            labels.push(node.label)
            prefix = [...prefix, value]
            current = childrenOf(node, prefix)
          }
          return labels
        }

        const modelPaths = computed<any[][]>(() => {
          const value = props.modelValue
          if (!Array.isArray(value)) {
            return []
          }
          if (!props.multiple) {
            return value.length ? [value] : []
          }
          return value.filter((item) => Array.isArray(item))
        })

        const isMultiple = computed(() => Boolean(props.multiple))

        const displayLabels = computed<{ labels: string[]; values: any[] }[]>(() => {
          return modelPaths.value.map((path) => {
            const leaf = leafPaths.value.find((item) => pathEquals(item.values, path))
            if (leaf) {
              return { labels: leaf.labels, values: leaf.values }
            }
            return { labels: labelsOfPath(path), values: path }
          })
        })

        const hasValue = computed(() => displayLabels.value.length > 0)

        const columns = computed<CascaderNode[][]>(() => {
          const result: CascaderNode[][] = [rootNodes.value]
          const paths: any[][] = [[]]
          for (const value of activePath.value) {
            const list = result[result.length - 1]
            const node = list.find((item) => sameValue(item.value, value))
            if (!node) {
              break
            }
            const nodePath = [...paths[paths.length - 1], value]
            const children = childrenOf(node, nodePath)
            if (!children.length) {
              break
            }
            result.push(children)
            paths.push(nodePath)
          }
          return result
        })

        const searchResults = computed<LeafPath[]>(() => {
          const keyword = query.value.trim().toLowerCase()
          if (!props.filterable || !keyword) {
            return []
          }
          const matched = leafPaths.value.filter((item) => item.labels.join(' ').toLowerCase().includes(keyword))
          if (typeof props.filterMethod === 'function') {
            return matched.filter((item) => props.filterMethod(keyword, item))
          }
          return matched
        })

        const { position, refresh } = useFloatingPanel({
          props,
          open: () => open.value,
          close: closePanel,
          trigger: triggerRef,
          panel: panelRef,
          placement: () => String(props.placement || 'bottom-start'),
          offset: () => 4,
          matchWidth: () => Boolean(props.fitInputWidth),
          fallbackPlacements: () => props.fallbackPlacements as string[] | undefined
        })

        function emitValue(value: any) {
          emit('update:modelValue', value)
          emit('change', value)
        }

        function applyLazyChildren(path: any[], children: any[]): void {
          const key = pathKey(path)
          lazyChildren.value = { ...lazyChildren.value, [key]: normalizeTree(children, props.props ?? {}) }
          const loaded = new Set(lazyLoadedKeys.value)
          loaded.add(key)
          lazyLoadedKeys.value = loaded
          const loading = new Set(lazyLoadingKeys.value)
          loading.delete(key)
          lazyLoadingKeys.value = loading
          nextTick(refresh)
        }

        function loadChildren(node: CascaderNode, path: any[]): void {
          const loader = lazyLoader.value
          const key = pathKey(path)
          if (!loader || lazyLoadingKeys.value.has(key) || lazyLoadedKeys.value.has(key)) {
            return
          }
          const loading = new Set(lazyLoadingKeys.value)
          loading.add(key)
          lazyLoadingKeys.value = loading
          loader(
            {
              level: path.length,
              value: node.value,
              label: node.label,
              pathValues: [...path],
              pathLabels: labelsOfPath(path),
              leaf: false,
              root: false
            },
            (children) => applyLazyChildren(path, Array.isArray(children) ? children : [])
          )
        }

        function ensureRootLoaded(): void {
          const loader = lazyLoader.value
          if (!lazyEnabled.value || rootLoaded.value || rootLoading.value || nodes.value.length || !loader) {
            return
          }
          rootLoading.value = true
          loader(
            {
              level: 0,
              value: undefined,
              label: '',
              pathValues: [],
              pathLabels: [],
              leaf: false,
              root: true
            },
            (children) => {
              lazyChildren.value = {
                ...lazyChildren.value,
                '[]': normalizeTree(Array.isArray(children) ? children : [], props.props ?? {})
              }
              rootLoaded.value = true
              rootLoading.value = false
              nextTick(refresh)
            }
          )
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
          activePath.value = []
          query.value = ''
          inputText.value = ''
          refresh()
        }

        function isPathSelected(path: any[]): boolean {
          return modelPaths.value.some((item) => pathEquals(item, path))
        }

        function isLeafSelected(node: CascaderNode, level: number): boolean {
          const path = [...activePath.value.slice(0, level), node.value]
          if (isExpandable(node, path)) {
            return false
          }
          return isPathSelected(path)
        }

        function toggleLeaf(path: any[]) {
          if (!props.multiple) {
            emitValue(path)
            closePanel()
            return
          }
          const exists = isPathSelected(path)
          const next = exists ? modelPaths.value.filter((item) => !pathEquals(item, path)) : [...modelPaths.value, path]
          emitValue(next)
          nextTick(refresh)
        }

        function handleNode(node: CascaderNode, level: number) {
          if (node.disabled) {
            return
          }
          const next = [...activePath.value.slice(0, level), node.value]
          activePath.value = next
          emit('expand-change', next)
          if (lazyEnabled.value && !node.leaf && !lazyLoadedKeys.value.has(pathKey(next))) {
            loadChildren(node, next)
            refresh()
            return
          }
          if (childrenOf(node, next).length) {
            refresh()
            return
          }
          toggleLeaf(next)
        }

        function removePath(index: number) {
          if (!props.multiple) {
            clearValue()
            return
          }
          emitValue(modelPaths.value.filter((_item, current) => current !== index))
        }

        function openPanel() {
          if (props.disabled || open.value) {
            return
          }
          const current = modelPaths.value[0]
          if (current && !props.multiple) {
            activePath.value = [...current]
          }
          open.value = true
          scrollTops.value = {}
          ensureRootLoaded()
          emit('visible-change', true)
          nextTick(() => {
            refresh()
            panelRef.value?.querySelectorAll('.ui-cascader__column').forEach((element) => {
              ;(element as HTMLElement).scrollTop = 0
            })
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
          inputText.value = ''
          if (filterTimer) {
            clearTimeout(filterTimer)
            filterTimer = null
          }
          emit('visible-change', false)
        }

        function togglePanel() {
          if (open.value) {
            closePanel()
          } else {
            openPanel()
          }
        }

        function scheduleFilter(text: string): void {
          if (filterTimer) {
            clearTimeout(filterTimer)
            filterTimer = null
          }
          const wait = Number(props.debounce ?? 0)
          if (!Number.isFinite(wait) || wait <= 0) {
            query.value = text
            nextTick(refresh)
            return
          }
          filterTimer = setTimeout(() => {
            filterTimer = null
            query.value = text
            nextTick(refresh)
          }, wait)
        }

        function handleFilterInput(event: Event) {
          const text = (event.target as HTMLInputElement).value
          inputText.value = text
          if (typeof props.beforeFilter === 'function') {
            props.beforeFilter(text)
          }
          if (!open.value) {
            open.value = true
            ensureRootLoaded()
            emit('visible-change', true)
          }
          scheduleFilter(text)
          nextTick(refresh)
        }

        function handleKeydown(event: KeyboardEvent) {
          if (event.key === 'Escape' && open.value) {
            event.preventDefault()
            closePanel()
          }
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
          if (filterTimer) {
            clearTimeout(filterTimer)
            filterTimer = null
          }
        })

        watch(
          () => props.modelValue,
          () => {
            if (open.value && !props.multiple) {
              activePath.value = modelPaths.value[0] ? [...modelPaths.value[0]] : []
              nextTick(refresh)
            }
          },
          { deep: true }
        )

        function renderTags(): VNodeChild[] {
          const items = displayLabels.value
          const max = props.collapseTags ? Math.max(1, Number(props.maxCollapseTags ?? 1)) : items.length
          const limit = Math.min(max, items.length)
          const tags: VNodeChild[] = []
          for (let index = 0; index < limit; index += 1) {
            const item = items[index]
            tags.push(
              h(
                'span',
                {
                  key: `tag-${index}`,
                  class: ['ui-cascader__tag', `is-${props.tagType || 'info'}`, `is-${props.tagEffect || 'light'}`]
                },
                [
                  h('span', { class: 'ui-cascader__tag-label' }, item.labels[item.labels.length - 1] ?? ''),
                  h(
                    'span',
                    {
                      class: 'ui-cascader__tag-close',
                      onClick: (event: Event) => {
                        event.stopPropagation()
                        removePath(index)
                      }
                    },
                    [renderIcon(X)]
                  )
                ]
              )
            )
          }
          if (limit < items.length) {
            const hidden = items.slice(limit)
            tags.push(
              h(
                'span',
                {
                  class: 'ui-cascader__tag ui-cascader__tag--more',
                  tabindex: 0,
                  'aria-label': `还有 ${hidden.length} 个已选项`
                },
                [
                  `+${hidden.length}`,
                  props.collapseTagsTooltip
                    ? h(
                        'span',
                        {
                          class: 'ui-cascader__tag-popover',
                          onClick: (event: Event) => event.stopPropagation()
                        },
                        hidden.map((item, index) =>
                          h(
                            'span',
                            { key: `tag-hidden-${index}`, class: 'ui-cascader__tag-popover-item' },
                            item.labels.join(props.separator || ' / ')
                          )
                        )
                      )
                    : null
                ]
              )
            )
          }
          return tags
        }

        function displayText(item: { labels: string[] }): string {
          return props.showAllLevels
            ? item.labels.join(props.separator || ' / ')
            : item.labels[item.labels.length - 1] || ''
        }

        function renderValue(): VNodeChild[] {
          if (isMultiple.value && hasValue.value) {
            return renderTags()
          }
          if (props.filterable) {
            return [
              h('input', {
                ref: inputRef,
                class: 'ui-cascader__input',
                value: inputText.value,
                placeholder: hasValue.value ? displayText(displayLabels.value[0]) : props.placeholder || '请选择',
                disabled: Boolean(props.disabled),
                readonly: Boolean(props.disabled),
                onInput: handleFilterInput,
                onFocus: openPanel,
                onKeydown: handleKeydown
              })
            ]
          }
          if (hasValue.value) {
            return [h('span', { class: 'ui-cascader__selected' }, displayText(displayLabels.value[0]))]
          }
          return [h('span', { class: 'ui-cascader__placeholder' }, props.placeholder || '请选择')]
        }

        function renderNode(node: CascaderNode, level: number, itemHeight?: number): VNodeChild {
          const path = [...activePath.value.slice(0, level), node.value]
          const expandable = isExpandable(node, path)
          const loading = isLoading(path)
          const selected = !expandable && isPathSelected(path)
          const active = expandable
            ? sameValue(activePath.value[level], node.value) && activePath.value.length > level
            : selected
          return h(
            'div',
            {
              key: `node-${level}-${String(node.value)}`,
              class: [
                'ui-cascader__node',
                {
                  'is-active': active,
                  'is-selected': selected,
                  'is-disabled': node.disabled,
                  'is-loading': loading
                }
              ],
              style: itemHeight ? { height: `${itemHeight}px` } : undefined,
              onClick: () => handleNode(node, level)
            },
            [
              h('span', { class: 'ui-cascader__node-label' }, node.label),
              loading
                ? h('span', { class: 'ui-cascader__node-loading' }, '加载中…')
                : expandable
                  ? renderIcon(ChevronRight, { class: 'ui-cascader__node-arrow' })
                  : selected
                    ? renderIcon(Check, { class: 'ui-cascader__check' })
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

        function renderColumn(column: CascaderNode[], level: number): VNodeChild {
          const height = Number(props.height ?? 204)
          const itemHeight = Math.max(16, Number(props.itemSize ?? 34))
          const virtual = Boolean(props.virtualScroll) && column.length > 40
          const scrollTop = scrollTops.value[level] ?? 0
          const maxStart = Math.max(0, column.length - 1)
          const start = virtual ? Math.min(maxStart, Math.max(0, Math.floor(scrollTop / itemHeight) - 4)) : 0
          const end = virtual
            ? Math.min(column.length, Math.ceil((scrollTop + height) / itemHeight) + 4)
            : column.length
          const children: VNodeChild[] = []
          if (!column.length) {
            const emptyText = level === 0 && rootLoading.value ? '加载中…' : '无数据'
            children.push(h('div', { class: 'ui-floating-panel__empty' }, emptyText))
          } else if (!virtual) {
            for (let index = 0; index < column.length; index += 1) {
              children.push(renderNode(column[index], level))
            }
          } else {
            const rows: VNodeChild[] = []
            for (let index = start; index < end; index += 1) {
              rows.push(
                h(
                  'div',
                  {
                    key: `row-${level}-${index}`,
                    class: 'ui-cascader__row',
                    style: { top: `${index * itemHeight}px` }
                  },
                  [renderNode(column[index], level, itemHeight)]
                )
              )
            }
            children.push(
              h('div', { class: 'ui-cascader__window', style: { height: `${column.length * itemHeight}px` } }, rows)
            )
          }
          return h(
            'div',
            {
              key: `column-${level}`,
              class: ['ui-cascader__column', virtual ? 'is-virtual' : ''],
              style: { maxHeight: `${height}px` },
              onScroll: virtual ? (event: Event) => handleColumnScroll(level, event) : undefined
            },
            children
          )
        }

        function renderColumns(): VNodeChild {
          return h(
            'div',
            { class: 'ui-cascader__columns' },
            columns.value.map((column, level) => renderColumn(column, level))
          )
        }

        function renderSearch(): VNodeChild {
          const items = searchResults.value
          if (!items.length) {
            return h('div', { class: 'ui-floating-panel__empty' }, '无匹配数据')
          }
          return h(
            'div',
            { class: 'ui-cascader__search-list' },
            items.map((item, index) =>
              h(
                'div',
                {
                  key: `search-${index}`,
                  class: [
                    'ui-cascader__node',
                    {
                      'is-selected': isPathSelected(item.values),
                      'is-disabled': item.disabled
                    }
                  ],
                  onClick: () => {
                    if (!item.disabled) {
                      toggleLeaf(item.values)
                    }
                  }
                },
                [
                  h('span', { class: 'ui-cascader__node-label' }, item.labels.join(props.separator || ' / ')),
                  isPathSelected(item.values) ? renderIcon(Check, { class: 'ui-cascader__check' }) : null
                ]
              )
            )
          )
        }

        function renderPanel(): VNodeChild {
          if (!open.value && !props.persistent) {
            return null
          }
          const content = query.value.trim() && props.filterable ? renderSearch() : renderColumns()
          const panel = h(
            'div',
            {
              ref: panelRef,
              class: ['ui-cascader__dropdown', 'ui-floating-panel', `is-${props.effect || 'light'}`, props.popperClass],
              style: [props.popperStyle, position.value, open.value ? null : { display: 'none' }]
            },
            [content]
          )
          return props.teleported === false ? panel : h(Teleport, { to: 'body' }, panel)
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
          renderValue,
          renderPanel
        }
      },
      classes: (props, state) => [
        props.size ? `is-size-${props.size}` : '',
        props.disabled ? 'is-disabled' : '',
        state.open ? 'is-open' : ''
      ],
      content: ({ props, state }) => {
        const actions: VNodeChild[] = []
        if (props.clearable && state.hasValue && !props.disabled) {
          actions.push(
            h(
              'span',
              {
                class: 'ui-cascader__clear',
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
          renderIcon(ChevronDown, { class: state.open ? 'ui-cascader__arrow is-open' : 'ui-cascader__arrow' })
        )
        return [
          h(
            'div',
            {
              ref: state.triggerRef,
              class: 'ui-cascader__trigger',
              tabindex: props.disabled ? undefined : 0,
              role: 'combobox',
              'aria-expanded': state.open,
              onClick: () => {
                if (props.filterable && state.open) {
                  return
                }
                state.togglePanel()
              },
              onKeydown: (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                  state.closePanel()
                }
              }
            },
            [
              h('div', { class: 'ui-cascader__value' }, state.renderValue()),
              h('div', { class: 'ui-cascader__actions' }, actions)
            ]
          ),
          state.renderPanel()
        ]
      }
    },
    features
  )
}
