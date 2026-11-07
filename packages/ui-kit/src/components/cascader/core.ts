import type { VNodeChild } from 'vue'
import { Teleport, computed, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Check, ChevronDown, ChevronRight, Minus, X } from '../../shared/icons'
import { collectFeatureHooks, type UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { useFloatingPanel } from '../../shared/panel'
import { sameValue } from '../../shared/value'
import { sizeValue } from '../../shared/behavior'
import { computeVirtualRange } from '../../shared/virtual-window'
import './core.css'

const cascaderBaseProps = {
  modelValue: { type: [Number, String, Array, Object] },
  options: { type: Array, default: () => [] },
  size: { type: String },
  disabled: { type: Boolean },
  multiple: { type: Boolean },
  checkbox: { type: Boolean },
  checkStrictly: { type: Boolean },
  emitPath: { type: Boolean, default: true },
  props: { type: Object, default: () => ({}) },
  virtualScroll: { type: Boolean },
  height: { type: Number, default: 204 },
  placeholder: { type: String },
  separator: { type: String, default: ' / ' },
  showAllLevels: { type: Boolean, default: true },
  beforeFilter: { type: Function },
  effect: { type: String, default: 'light' },
  fitWidth: { type: Boolean },
  maxWidth: { type: [String, Number] }
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
      // 逐个对应本文件里的 emit(...) 调用点，避免监听落入 attrs 与 emit 双通道
      emits: ['update:modelValue', 'change', 'clear', 'expand-change', 'visible-change'],
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
        let tagPopTimer: ReturnType<typeof setTimeout> | null = null
        const tagPopOpen = ref(false)

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

        function collectNodePaths(list: CascaderNode[], values: any[], labels: string[], result: LeafPath[]): void {
          for (const node of list) {
            const nextValues = [...values, node.value]
            const nextLabels = [...labels, node.label]
            result.push({ values: nextValues, labels: nextLabels, disabled: node.disabled })
            collectNodePaths(childrenOf(node, nextValues), nextValues, nextLabels, result)
          }
        }

        // 已加载节点的全路径（含中间节点）：checkStrictly 与全选的可选集。
        // lazy 未加载子树不展开——只覆盖已知节点，全选不触发 lazy 加载
        const nodePaths = computed<LeafPath[]>(() => {
          const result: LeafPath[] = []
          collectNodePaths(rootNodes.value, [], [], result)
          return result
        })

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
          if (!props.multiple) {
            if (value === undefined || value === null || value === '') {
              return []
            }
            return [resolveIncomingPath(value)]
          }
          if (!Array.isArray(value)) {
            return []
          }
          return value.map(resolveIncomingPath).filter((path) => path.length > 0)
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

        // emitPath=false 时 v-model 只存末级值，回显前反查完整路径；
        // 同值多分支时取第一个匹配，值为未知时退化为单元素路径兜底显示
        function resolveIncomingPath(item: unknown): any[] {
          if (Array.isArray(item)) {
            return item
          }
          const hit = nodePaths.value.find((path) => sameValue(path.values[path.values.length - 1], item))
          return hit ? [...hit.values] : [item]
        }

        function toEmit(paths: any[][]): any {
          if (!props.multiple) {
            const path = paths[0]
            if (!path) {
              return undefined
            }
            return props.emitPath === false ? path[path.length - 1] : path
          }
          return paths.map((path) => (props.emitPath === false ? path[path.length - 1] : path))
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

        function toggleLeaf(path: any[]) {
          if (!props.multiple) {
            emitValue(toEmit([path]))
            closePanel()
            return
          }
          const exists = isPathSelected(path)
          const next = exists ? modelPaths.value.filter((item) => !pathEquals(item, path)) : [...modelPaths.value, path]
          emitValue(toEmit(next))
          nextTick(refresh)
        }

        // 已加载子树的全部叶子路径（checkbox 级联勾选的可选集）
        function leavesUnder(path: any[]): LeafPath[] {
          const result: LeafPath[] = []
          const walk = (node: CascaderNode, values: any[], labels: string[]) => {
            const children = childrenOf(node, values)
            if (children.length === 0) {
              result.push({ values, labels, disabled: node.disabled })
              return
            }
            for (const child of children) {
              walk(child, [...values, child.value], [...labels, child.label])
            }
          }
          let current = rootNodes.value
          let prefix: any[] = []
          let target: CascaderNode | undefined
          for (const value of path) {
            target = current.find((item) => sameValue(item.value, value))
            if (!target) {
              return []
            }
            prefix = [...prefix, value]
            current = childrenOf(target, prefix)
          }
          if (!target) {
            return []
          }
          walk(target, [...path], labelsOfPath(path))
          return result
        }

        type CheckState = 'checked' | 'indeterminate' | 'unchecked'

        function checkStateOf(path: any[]): CheckState {
          const leaves = leavesUnder(path).filter((item) => !item.disabled)
          if (leaves.length === 0) {
            return 'unchecked'
          }
          const selected = leaves.filter((item) => isPathSelected(item.values)).length
          if (selected === 0) {
            return 'unchecked'
          }
          return selected === leaves.length ? 'checked' : 'indeterminate'
        }

        // checkbox 级联：勾选父级选中其全部（已加载）叶子，再次点击取消
        function toggleCascade(path: any[]) {
          const leaves = leavesUnder(path).filter((item) => !item.disabled)
          if (leaves.length === 0) {
            return
          }
          const allSelected = leaves.every((item) => isPathSelected(item.values))
          const next = allSelected
            ? modelPaths.value.filter((item) => !leaves.some((leaf) => pathEquals(leaf.values, item)))
            : [...modelPaths.value, ...leaves.filter((item) => !isPathSelected(item.values)).map((item) => item.values)]
          emitValue(toEmit(next))
          nextTick(refresh)
        }

        function handleNode(node: CascaderNode, level: number) {
          if (node.disabled) {
            return
          }
          const checkboxMode = Boolean(props.checkbox) && isMultiple.value
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
          // checkbox 模式选中只由复选框触发，行点击仅展开/下钻
          if (checkboxMode) {
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
          emitValue(toEmit(modelPaths.value.filter((_item, current) => current !== index)))
        }

        // +N 折叠标签浮层：mouseleave 在离开「标签+浮层」子树时才触发，
        // 延迟关闭覆盖指针穿越 6px 空隙的间隙；重新进入子树即取消
        function showTagPop() {
          if (tagPopTimer) {
            clearTimeout(tagPopTimer)
            tagPopTimer = null
          }
          tagPopOpen.value = true
        }

        function hideTagPop() {
          if (tagPopTimer) {
            clearTimeout(tagPopTimer)
          }
          tagPopTimer = setTimeout(() => {
            tagPopTimer = null
            tagPopOpen.value = false
          }, 150)
        }

        // 全选栏（cascader.select-all feature 通过 panelHeader hook 注入）。
        // 可选集：leaf 模式为全部叶子路径；checkStrictly 为全部已加载节点（含中间节点），
        // lazy 未加载子树不强制加载，选不到即选不到
        const selectablePaths = computed<LeafPath[]>(() => (props.checkStrictly ? nodePaths.value : leafPaths.value))

        function renderSelectAllBar(): VNodeChild {
          if (!props.multiple || !props.selectAll) {
            return null
          }
          const candidates = selectablePaths.value.filter((item) => !item.disabled)
          const selectedCount = candidates.filter((item) => isPathSelected(item.values)).length
          const allSelected = candidates.length > 0 && selectedCount === candidates.length
          const indeterminate = selectedCount > 0 && !allSelected
          const toggleAll = (event: Event) => {
            event.stopPropagation()
            emitValue(toEmit(allSelected ? [] : candidates.map((item) => item.values)))
          }
          return h('div', { class: 'ui-cascader__select-all' }, [
            h(
              'span',
              {
                class: [
                  'ui-cascader__select-all-box',
                  { 'is-checked': allSelected, 'is-indeterminate': indeterminate }
                ],
                onClick: toggleAll
              },
              [allSelected ? renderIcon(Check) : indeterminate ? renderIcon(Minus) : null]
            ),
            h('span', { class: 'ui-cascader__select-all-label', onClick: toggleAll }, allSelected ? '清空' : '全选'),
            h('span', { class: 'ui-cascader__select-all-count' }, `${selectedCount} / ${candidates.length}`)
          ])
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
          if (tagPopTimer) {
            clearTimeout(tagPopTimer)
            tagPopTimer = null
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
                  h('span', { class: 'ui-cascader__tag-label' }, displayText(item)),
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
                  'aria-label': `还有 ${hidden.length} 个已选项`,
                  onMouseenter: showTagPop,
                  onMouseleave: hideTagPop
                },
                [
                  `+${hidden.length}`,
                  props.collapseTagsTooltip
                    ? h(
                        'span',
                        {
                          class: ['ui-cascader__tag-popover', { 'is-open': tagPopOpen.value }],
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
          const strict = Boolean(props.checkStrictly) && isMultiple.value
          const checkboxMode = Boolean(props.checkbox) && isMultiple.value
          const selectable = strict || !expandable
          const selected = selectable && isPathSelected(path)
          const checkState: CheckState = strict
            ? selected
              ? 'checked'
              : 'unchecked'
            : checkboxMode
              ? checkStateOf(path)
              : 'unchecked'
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
              strict || checkboxMode
                ? h(
                    'span',
                    {
                      class: [
                        'ui-cascader__checkbox',
                        {
                          'is-checked': checkState === 'checked',
                          'is-indeterminate': checkState === 'indeterminate',
                          'is-disabled': node.disabled
                        }
                      ],
                      onClick: (event: Event) => {
                        event.stopPropagation()
                        if (node.disabled) {
                          return
                        }
                        if (strict) {
                          toggleLeaf(path)
                        } else {
                          toggleCascade(path)
                        }
                      }
                    },
                    [
                      checkState === 'checked'
                        ? renderIcon(Check, { class: 'ui-cascader__checkbox-icon' })
                        : checkState === 'indeterminate'
                          ? renderIcon(Minus, { class: 'ui-cascader__checkbox-icon' })
                          : null
                    ]
                  )
                : null,
              h('span', { class: 'ui-cascader__node-label' }, node.label),
              loading
                ? h('span', { class: 'ui-loader ui-loader--inline', role: 'status' }, [
                    h('span', { class: 'ui-loader__spinner', 'aria-hidden': 'true' }),
                    h('span', null, '加载中…')
                  ])
                : expandable
                  ? renderIcon(ChevronRight, { class: 'ui-cascader__node-arrow' })
                  : selected && !strict && !checkboxMode
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
          // §25：窗口区间统一走 shared/virtual-window，不再各自 clamp
          const range = computeVirtualRange({
            scrollTop: scrollTops.value[level] ?? 0,
            viewport: height,
            itemSize: itemHeight,
            total: column.length,
            overscan: 4
          })
          const start = virtual ? range.start : 0
          const end = virtual ? range.end : column.length
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

        function renderPanel(header: VNodeChild[] = []): VNodeChild {
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
            [...header, content]
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
          renderPanel,
          renderSelectAllBar
        }
      },
      classes: (props, state) => [
        props.size ? `is-size-${props.size}` : '',
        props.disabled ? 'is-disabled' : '',
        state.open ? 'is-open' : ''
      ],
      styles: (props) => ({
        width: props.fitWidth ? 'fit-content' : undefined,
        maxWidth: sizeValue(props.maxWidth)
      }),
      content: ({ props, state, states }) => {
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
          state.renderPanel(
            collectFeatureHooks(states, 'panelHeader')
              .map((renderHeader) => renderHeader())
              .filter((node) => node !== null && node !== undefined && node !== false)
          )
        ]
      }
    },
    features
  )
}
