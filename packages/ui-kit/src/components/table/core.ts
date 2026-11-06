import type { CSSProperties, VNode, VNodeChild } from 'vue'
import {
  Fragment,
  defineComponent,
  h,
  isVNode,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  shallowRef
} from 'vue'
import type { UiFeature, UiFeatureState } from '../../shared/feature'
import {
  collectFeatureClasses,
  collectFeatureExposed,
  collectFeatureFragments,
  collectFeatureStyles,
  mergeFeatureProps,
  resolveFeatureStates
} from '../../shared/feature'
import { sizeValue } from '../../shared/behavior'
import { createCheckbox } from '../checkbox/core'
import './core.css'

export const tableColumnMarker = Symbol.for('ui-table-column')

const TableCheckbox = createCheckbox([])

const tableBaseProps = {
  data: { type: Array, default: () => [] },
  height: { type: [String, Number] },
  maxHeight: { type: [String, Number] },
  stripe: { type: Boolean },
  border: { type: Boolean },
  size: { type: String },
  fit: { type: Boolean, default: true },
  showHeader: { type: Boolean, default: true },
  highlightCurrentRow: { type: Boolean },
  rowKey: { type: [String, Function] },
  rowClassName: { type: [String, Function], default: '' },
  rowStyle: { type: [Object, Function] },
  emptyText: { type: String, default: '暂无数据' },
  tableLayout: { type: String, default: 'fixed' },
  showOverflowTooltip: { type: Boolean }
}

const tableColumnBaseProps = {
  type: { type: String, default: 'default' },
  label: { type: String, default: '' },
  prop: { type: String, default: '' },
  width: { type: [String, Number] },
  minWidth: { type: [String, Number], default: 80 },
  fixed: { type: [Boolean, String], default: false },
  align: { type: String, default: 'left' },
  headerAlign: { type: String, default: '' },
  className: { type: String, default: '' },
  labelClassName: { type: String, default: '' },
  showOverflowTooltip: { type: Boolean },
  index: { type: [Number, Function] },
  formatter: { type: Function }
}

const columnDefaults: Record<string, any> = {
  type: 'default',
  label: '',
  prop: '',
  width: '',
  minWidth: 80,
  fixed: false,
  align: 'left',
  headerAlign: '',
  className: '',
  labelClassName: '',
  showOverflowTooltip: undefined,
  index: undefined,
  formatter: undefined
}

interface TableColumnSlots {
  default?: (scope: Record<string, any>) => VNodeChild
  header?: (scope: Record<string, any>) => VNodeChild
}

interface TableColumn {
  type: string
  label: string
  prop: string
  width: string | number
  minWidth: string | number
  fixed: boolean | string
  align: string
  headerAlign: string
  className: string
  labelClassName: string
  showOverflowTooltip?: boolean
  index?: number | ((index: number) => number)
  formatter?: (row: any, column: TableColumn, value: any, index: number) => any
  slots: TableColumnSlots
  key: string
  [key: string]: any
}

interface FixedOffsets {
  left: Record<number, number>
  right: Record<number, number>
  lastLeft: number
  firstRight: number
}

interface SummaryGroup {
  index: number
  span: number
  cell: any
}

// 首格的“合计”文案与其后的空单元格合并，避免被选择列的窄宽度挤成两行
function groupSummaryCells(cells: any[], columns: TableColumn[]): SummaryGroup[] {
  const groups: SummaryGroup[] = []
  let index = 0
  while (index < cells.length) {
    const cell = cells[index]
    const isLabel = typeof cell === 'string' && cell.trim() !== '' && !Number.isFinite(Number(cell))
    if (index !== 0 || !isLabel) {
      groups.push({ index, span: 1, cell })
      index += 1
      continue
    }
    const side = fixedSideOf(columns[index])
    let span = 1
    while (index + span < cells.length) {
      const next = cells[index + span]
      const nextColumn = columns[index + span]
      if (next !== '' && next !== null && next !== undefined) {
        break
      }
      // 只合并同一冻结侧的空格：跨越冻结边界会把中间列压在 sticky 单元格下面
      if (side !== fixedSideOf(nextColumn)) {
        break
      }
      span += 1
    }
    groups.push({ index, span, cell })
    index += span
  }
  return groups
}

function flattenVNodes(nodes: any[], out: VNode[] = []): VNode[] {
  for (const node of nodes ?? []) {
    if (!isVNode(node)) {
      continue
    }
    if (node.type === Fragment) {
      flattenVNodes(node.children as any[], out)
    } else {
      out.push(node)
    }
  }
  return out
}

function camelize(name: string): string {
  return name.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())
}

function readColumnSlots(children: any): TableColumnSlots {
  if (!children) {
    return {}
  }
  if (typeof children === 'function') {
    return { default: children }
  }
  if (Array.isArray(children)) {
    return { default: () => children }
  }
  if (typeof children !== 'object') {
    return {}
  }
  const slots: TableColumnSlots = {}
  if (typeof children.default === 'function') {
    slots.default = children.default
  } else if (Array.isArray(children.default)) {
    slots.default = () => children.default
  }
  if (typeof children.header === 'function') {
    slots.header = children.header
  } else if (Array.isArray(children.header)) {
    slots.header = () => children.header
  }
  return slots
}

function readColumns(slots: Record<string, any>): TableColumn[] {
  return flattenVNodes(slots.default?.() ?? [])
    .filter((node) => Boolean((node.type as any)?.[tableColumnMarker]))
    .map((node, position) => {
      const raw = (node.props ?? {}) as Record<string, any>
      const column = { slots: readColumnSlots(node.children) } as TableColumn
      for (const name of Object.keys(raw)) {
        if (name === 'key') {
          continue
        }
        column[camelize(name)] = raw[name]
      }
      for (const name of Object.keys(columnDefaults)) {
        if (column[name] === undefined) {
          column[name] = columnDefaults[name]
        }
      }
      const baseKey = raw.key ?? column.prop ?? column.type ?? 'column'
      column.key = `${String(baseKey)}:${position}`
      return column
    })
}

function fixedSideOf(column: TableColumn): 'left' | 'right' | null {
  if (column.fixed === true || column.fixed === 'left') {
    return 'left'
  }
  if (column.fixed === 'right') {
    return 'right'
  }
  return null
}

function numericWidth(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\d+(\.\d+)?(px)?$/.test(trimmed)) {
      return Number.parseFloat(trimmed)
    }
  }
  return null
}

function flattenHooks(states: UiFeatureState[], name: string): ((...args: any[]) => any)[] {
  const hooks: ((...args: any[]) => any)[] = []
  for (const state of states) {
    const hook = state.hooks?.[name]
    if (typeof hook === 'function') {
      hooks.push(hook)
    }
  }
  return hooks
}

function mergeHookResults(hooks: ((...args: any[]) => any)[], args: any[]): Record<string, any> {
  const result: Record<string, any> = {}
  for (const hook of hooks) {
    const value = hook(...args)
    if (value) {
      Object.assign(result, value)
    }
  }
  return result
}

export function createTable(features: UiFeature[] = []) {
  return defineComponent({
    name: 'UiTable',
    inheritAttrs: false,
    props: { ...tableBaseProps, ...mergeFeatureProps(features) },
    emits: [
      'row-click',
      'selection-change',
      'current-change',
      'sort-change',
      'resize-change',
      'tree-expand'
    ],
    setup(props, { attrs, slots, emit, expose }) {
      const resolved = props as Record<string, any>
      const root = shallowRef<HTMLElement | null>(null)
      const wrapper = shallowRef<HTMLElement | null>(null)
      const tableRef = shallowRef<HTMLTableElement | null>(null)
      const headerView = shallowRef<HTMLElement | null>(null)
      const headerTable = shallowRef<HTMLTableElement | null>(null)
      const footerView = shallowRef<HTMLElement | null>(null)
      const footerTable = shallowRef<HTMLTableElement | null>(null)
      const selectedKeys = ref(new Set<any>())
      const expandedKeys = ref(new Set<any>())
      const currentKey = ref<any>(null)
      const measuredWidths = ref<number[]>([])
      const scrollState = ref({ left: false, right: false })
      const availableWidth = ref(0)
      const scrollbarGutter = ref(0)
      let latestColumns: TableColumn[] = []
      let measureFrame = 0
      let resizeObserver: ResizeObserver | null = null

      function rowKeyOf(row: any, index: number) {
        const key = resolved.rowKey
        if (typeof key === 'function') {
          return key(row)
        }
        if (typeof key === 'string') {
          return row?.[key]
        }
        return index
      }

      function selectableOf(columns: TableColumn[], row: any, index: number) {
        const column = columns.find((item) => item.type === 'selection')
        return column?.selectable ? Boolean(column.selectable(row, index)) : true
      }

      function toggleRow(row: any, index: number, checked: boolean, columns: TableColumn[]) {
        if (!selectableOf(columns, row, index)) {
          return
        }
        const key = rowKeyOf(row, index)
        const next = new Set(selectedKeys.value)
        if (checked) {
          next.add(key)
        } else {
          next.delete(key)
        }
        selectedKeys.value = next
        emit(
          'selection-change',
          (resolved.data ?? []).filter((item: any, itemIndex: number) => {
            return next.has(rowKeyOf(item, itemIndex))
          })
        )
      }

      function toggleAll(checked: boolean, columns: TableColumn[]) {
        const next = new Set<any>()
        if (checked) {
          ;(resolved.data ?? []).forEach((row: any, index: number) => {
            if (selectableOf(columns, row, index)) {
              next.add(rowKeyOf(row, index))
            }
          })
        }
        selectedKeys.value = next
        emit(
          'selection-change',
          (resolved.data ?? []).filter((item: any, itemIndex: number) => {
            return next.has(rowKeyOf(item, itemIndex))
          })
        )
      }

      function toggleExpand(row: any, index: number) {
        const key = rowKeyOf(row, index)
        const next = new Set(expandedKeys.value)
        if (next.has(key)) {
          next.delete(key)
        } else {
          next.add(key)
        }
        expandedKeys.value = next
      }

      function handleRowClick(row: any, index: number) {
        if (resolved.highlightCurrentRow) {
          currentKey.value = rowKeyOf(row, index)
          emit('current-change', row)
        }
        emit('row-click', row)
      }

      const state = {
        selectedKeys,
        latestColumns: () => latestColumns,
        rowKeyOf,
        selectableOf,
        toggleRow,
        toggleAll
      }
      const featureContext = {
        attrs,
        slots,
        emit: emit as any,
        root,
        state
      }
      const states = resolveFeatureStates(features, resolved, featureContext)
      const exposed = collectFeatureExposed(features, { ...featureContext, props: resolved })
      if (Object.keys(exposed).length) {
        expose(exposed)
      }

      function measureAvailableWidth() {
        const element = wrapper.value
        if (!element) {
          return
        }
        const width = element.clientWidth
        if (Math.abs(availableWidth.value - width) > 0.5) {
          availableWidth.value = width
        }
        const gutter = Math.max(0, element.offsetWidth - element.clientWidth)
        if (scrollbarGutter.value !== gutter) {
          scrollbarGutter.value = gutter
        }
      }

      function measureColumns() {
        if (typeof window === 'undefined') {
          return
        }
        measureAvailableWidth()
        const columns = latestColumns
        if (!columns.some((column) => fixedSideOf(column))) {
          return
        }
        let cells: Element[] = []
        const headerEl = headerTable.value
        if (headerEl) {
          cells = Array.from(headerEl.querySelectorAll(':scope > thead > tr > th'))
        }
        const tableEl = tableRef.value
        if (cells.length !== columns.length && tableEl) {
          cells = Array.from(tableEl.querySelectorAll(':scope > thead > tr > th'))
        }
        if (cells.length !== columns.length && tableEl) {
          cells = Array.from(tableEl.querySelectorAll(':scope > tbody > tr > td'))
        }
        if (cells.length !== columns.length) {
          return
        }
        const next = cells.map((cell) => Math.round(cell.getBoundingClientRect().width * 100) / 100)
        const prev = measuredWidths.value
        let changed = prev.length !== next.length
        if (!changed) {
          for (let index = 0; index < next.length; index += 1) {
            if (Math.abs((prev[index] ?? 0) - next[index]) > 0.5) {
              changed = true
              break
            }
          }
        }
        if (changed) {
          measuredWidths.value = next
        }
      }

      function scheduleMeasure() {
        if (typeof window === 'undefined' || measureFrame) {
          return
        }
        measureFrame = window.requestAnimationFrame(() => {
          measureFrame = 0
          measureColumns()
        })
      }

      function updateScrollState() {
        const element = wrapper.value
        if (!element) {
          return
        }
        const left = element.scrollLeft > 0
        const right = element.scrollLeft + element.clientWidth < element.scrollWidth - 1
        if (left !== scrollState.value.left || right !== scrollState.value.right) {
          scrollState.value = { left, right }
        }
      }

      function syncFixedSections() {
        const element = wrapper.value
        if (!element) {
          return
        }
        const left = element.scrollLeft
        for (const view of [headerView.value, footerView.value]) {
          if (view && Math.abs(view.scrollLeft - left) >= 0.5) {
            view.scrollLeft = left
          }
        }
      }

      function handleScroll() {
        updateScrollState()
        syncFixedSections()
      }

      onMounted(() => {
        wrapper.value?.addEventListener('scroll', handleScroll, { passive: true })
        measureColumns()
        updateScrollState()
        syncFixedSections()
        scheduleMeasure()
        if (typeof ResizeObserver !== 'undefined' && wrapper.value) {
          resizeObserver = new ResizeObserver(() => scheduleMeasure())
          resizeObserver.observe(wrapper.value)
        }
      })

      onUpdated(() => {
        measureAvailableWidth()
        scheduleMeasure()
        updateScrollState()
        syncFixedSections()
      })

      onBeforeUnmount(() => {
        wrapper.value?.removeEventListener('scroll', handleScroll)
        resizeObserver?.disconnect()
        if (measureFrame && typeof window !== 'undefined') {
          window.cancelAnimationFrame(measureFrame)
        }
        measureFrame = 0
      })

      interface CellOptions {
        column: TableColumn
        row: any
        rowIndex: number
        columnIndex: number
        meta: Record<string, any>
        prependHooks: ((...args: any[]) => any)[]
      }

      function renderCell(options: CellOptions): VNodeChild {
        const { column, row, rowIndex, meta, prependHooks } = options
        if (column.type === 'selection') {
          const key = rowKeyOf(row, rowIndex)
          return h(TableCheckbox, {
            class: 'ui-table__checkbox',
            modelValue: selectedKeys.value.has(key),
            disabled: !selectableOf([column], row, rowIndex),
            onClick: (event: Event) => event.stopPropagation(),
            'onUpdate:modelValue': (checked: boolean) => toggleRow(row, rowIndex, checked, [column])
          })
        }
        if (column.type === 'index') {
          const value = typeof column.index === 'function' ? column.index(rowIndex) : rowIndex + 1
          return typeof column.index === 'number' ? rowIndex + column.index : value
        }
        if (column.type === 'expand') {
          const key = rowKeyOf(row, rowIndex)
          const expanded = expandedKeys.value.has(key)
          return h(
            'button',
            {
              type: 'button',
              class: ['ui-table__expand', expanded ? 'is-expanded' : ''],
              'aria-label': expanded ? '收起行' : '展开行',
              'aria-expanded': expanded ? 'true' : 'false',
              onClick: (event: Event) => {
                event.stopPropagation()
                toggleExpand(row, rowIndex)
              }
            },
            [h('span', { class: 'ui-table__expand-arrow', 'aria-hidden': 'true' })]
          )
        }
        const scope = {
          row,
          column,
          $index: rowIndex,
          rowIndex,
          columnIndex: options.columnIndex,
          meta
        }
        const value = column.prop ? row?.[column.prop] : undefined
        let content: VNodeChild
        if (column.slots.default) {
          content = column.slots.default(scope)
        } else if (typeof column.formatter === 'function') {
          content = column.formatter(row, column, value, rowIndex)
        } else {
          content = value === undefined || value === null ? '' : String(value)
        }
        const prepend: VNodeChild[] = []
        for (const hook of prependHooks) {
          const fragment = hook(scope)
          if (fragment !== undefined && fragment !== null) {
            prepend.push(fragment)
          }
        }
        return prepend.length ? [...prepend, content] : content
      }

      return function render() {
        const columns = readColumns(slots)
        latestColumns = columns
        let rows: any[] = Array.isArray(resolved.data) ? [...resolved.data] : []
        for (const hook of flattenHooks(states, 'tableRows')) {
          rows = hook(rows, columns, resolved)
        }

        const widthHooks = flattenHooks(states, 'tableColumnWidth')
        const spanHooks = flattenHooks(states, 'tableSpan')
        const prependHooks = flattenHooks(states, 'tableCellPrepend')
        const headerExtraHooks = flattenHooks(states, 'tableHeaderExtra')
        const rowMetaHooks = flattenHooks(states, 'tableRowMeta')
        const sortStateHooks = flattenHooks(states, 'tableSortState')

        const widthCache = new Map<string, string | number | undefined>()
        function effectiveWidthOf(column: TableColumn): string | number | undefined {
          if (widthCache.has(column.key)) {
            return widthCache.get(column.key)
          }
          let value: string | number | undefined
          for (const hook of widthHooks) {
            const next = hook(column)
            if (next !== undefined && next !== null && next !== '') {
              value = next
              break
            }
          }
          if (value === undefined) {
            value = column.width
          }
          widthCache.set(column.key, value)
          return value
        }

        function columnColWidth(column: TableColumn): string | number {
          const effective = effectiveWidthOf(column)
          if (effective === undefined || effective === null || effective === '') {
            return column.minWidth
          }
          return effective
        }

        function layoutColumnWidths(columns: TableColumn[]): Array<number | string> {
          const widths = columns.map((column) => columnColWidth(column))
          const numeric = widths.map((width) => numericWidth(width))
          if (numeric.some((width) => width === null)) {
            return widths
          }
          const numbers = numeric as number[]
          const total = numbers.reduce((sum, width) => sum + width, 0)
          const available = availableWidth.value
          if (resolved.fit === false || !available || total >= available) {
            return numbers
          }
          const flexible: number[] = []
          columns.forEach((column, index) => {
            const width = effectiveWidthOf(column)
            if (width === undefined || width === null || width === '') {
              flexible.push(index)
            }
          })
          // 所有列都写死宽度时，剩余空间也要分摊，否则宽容器里右侧会留白
          const targets = flexible.length ? flexible : columns.map((_column, index) => index)
          const extra = available - total
          const share = Math.floor(extra / targets.length)
          let remainder = extra - share * targets.length
          for (const index of targets) {
            numbers[index] += share
            if (remainder > 0) {
              numbers[index] += 1
              remainder -= 1
            }
          }
          return numbers
        }

        const layoutWidths = layoutColumnWidths(columns)
        const layoutTotal = layoutWidths.every((width) => typeof width === 'number')
          ? (layoutWidths as number[]).reduce((sum, width) => sum + width, 0)
          : null
        const tableStyle: CSSProperties = layoutTotal ? { width: `${layoutTotal}px` } : {}

        function renderedWidthOf(index: number, column: TableColumn): number {
          const measured = measuredWidths.value[index]
          if (measured && measured > 0) {
            return measured
          }
          return numericWidth(effectiveWidthOf(column)) ?? numericWidth(column.minWidth) ?? 0
        }

        const offsets: FixedOffsets = { left: {}, right: {}, lastLeft: -1, firstRight: -1 }
        let leftOffset = 0
        columns.forEach((column, index) => {
          if (fixedSideOf(column) !== 'left') {
            return
          }
          offsets.left[index] = leftOffset
          leftOffset += renderedWidthOf(index, column)
          offsets.lastLeft = index
        })
        let rightOffset = 0
        for (let index = columns.length - 1; index >= 0; index -= 1) {
          const column = columns[index]
          if (fixedSideOf(column) !== 'right') {
            continue
          }
          offsets.right[index] = rightOffset
          rightOffset += renderedWidthOf(index, column)
          offsets.firstRight = index
        }
        const hasFixedLeft = offsets.lastLeft >= 0
        const hasFixedRight = offsets.firstRight >= 0

        function fixedCellClass(index: number): string[] {
          const classes: string[] = []
          if (offsets.left[index] !== undefined) {
            classes.push('is-fixed-left')
            if (index === offsets.lastLeft) {
              classes.push('is-fixed-left-edge')
            }
          }
          if (offsets.right[index] !== undefined) {
            classes.push('is-fixed-right')
            if (index === offsets.firstRight) {
              classes.push('is-fixed-right-edge')
            }
          }
          return classes
        }

        function fixedCellStyle(index: number): CSSProperties | undefined {
          if (offsets.left[index] !== undefined) {
            return { left: `${offsets.left[index]}px` }
          }
          if (offsets.right[index] !== undefined) {
            return { right: `${offsets.right[index]}px` }
          }
          return undefined
        }

        function cellTitle(column: TableColumn, row: any): string | undefined {
          const enabled =
            column.showOverflowTooltip === true ||
            (column.showOverflowTooltip !== false && Boolean(resolved.showOverflowTooltip))
          if (!enabled || column.slots.default) {
            return undefined
          }
          const value = column.prop ? row?.[column.prop] : undefined
          if (typeof value === 'string' || typeof value === 'number') {
            return String(value)
          }
          return undefined
        }

        const headerClick = (column: TableColumn) => {
          for (const hook of flattenHooks(states, 'tableHeaderClick')) {
            hook(column, columns, resolved)
          }
        }

        const selectableKeys: any[] = []
        if (columns.some((column) => column.type === 'selection')) {
          rows.forEach((row, index) => {
            if (selectableOf(columns, row, index)) {
              selectableKeys.push(rowKeyOf(row, index))
            }
          })
        }
        const selectedCount = selectableKeys.filter((key) => selectedKeys.value.has(key)).length
        const allSelected = selectableKeys.length > 0 && selectedCount === selectableKeys.length

        const featureClasses = collectFeatureClasses(states)
        const rootClass = [
          attrs.class,
          'ui-table',
          resolved.fit === false ? 'ui-table--auto-fit' : '',
          resolved.stripe ? 'ui-table--striped' : '',
          resolved.border ? 'ui-table--bordered' : '',
          resolved.size ? `ui-table--${resolved.size}` : '',
          resolved.showOverflowTooltip ? 'ui-table--overflow-tooltip' : '',
          hasFixedLeft ? 'has-fixed-left' : '',
          hasFixedRight ? 'has-fixed-right' : '',
          hasFixedLeft && scrollState.value.left ? 'is-scrolled-left' : '',
          hasFixedRight && scrollState.value.right ? 'is-scrolled-right' : '',
          ...featureClasses
        ]
        const rootStyle: CSSProperties = {
          ...(attrs.style as Record<string, any>),
          ...collectFeatureStyles(states)
        }
        const rootHeight = sizeValue(resolved.height)
        if (rootHeight) {
          rootStyle.height = rootHeight
        }
        const rootMaxHeight = sizeValue(resolved.maxHeight)
        if (rootMaxHeight) {
          rootStyle.maxHeight = rootMaxHeight
        }

        function renderColgroup() {
          return h(
            'colgroup',
            columns.map((_column, index) =>
              h('col', {
                style: {
                  width: sizeValue(layoutWidths[index])
                }
              })
            )
          )
        }

        const header =
          resolved.showHeader === false
            ? null
            : h('thead', { class: 'ui-table__header' }, [
                h(
                  'tr',
                  columns.map((column, index) => {
                    const sortState = mergeHookResults(sortStateHooks, [column])
                    const sortable = Boolean(column.sortable)
                    const scope = { column, $index: index, columnIndex: index }
                    const extras: VNodeChild[] = []
                    for (const hook of headerExtraHooks) {
                      const extra = hook(scope)
                      if (extra !== undefined && extra !== null) {
                        extras.push(extra)
                      }
                    }
                    const label = column.slots.header ? column.slots.header(scope) : column.label
                    return h(
                      'th',
                      {
                        class: [
                          column.labelClassName,
                          column.headerAlign || column.align ? `is-${column.headerAlign || column.align}` : '',
                          sortable ? 'is-sortable' : '',
                          sortState.order ? `is-${sortState.order}` : '',
                          ...fixedCellClass(index)
                        ],
                        style: fixedCellStyle(index),
                        'aria-sort':
                          sortState.order === 'ascending'
                            ? 'ascending'
                            : sortState.order === 'descending'
                              ? 'descending'
                              : undefined,
                        onClick: sortable ? () => headerClick(column) : undefined
                      },
                      column.type === 'selection'
                        ? [
                            h(TableCheckbox, {
                              class: 'ui-table__checkbox',
                              modelValue: allSelected,
                              indeterminate: selectedCount > 0 && !allSelected,
                              disabled: !selectableKeys.length,
                              'onUpdate:modelValue': (checked: boolean) => toggleAll(checked, columns)
                            }),
                            ...extras
                          ]
                        : [label, ...extras]
                    )
                  })
                )
              ])

        const bodyRows: VNode[] = []
        const occupied = new Map<number, Set<number>>()
        rows.forEach((row, rowIndex) => {
          const rowClass =
            typeof resolved.rowClassName === 'function'
              ? resolved.rowClassName({ row, rowIndex })
              : resolved.rowClassName
          const rowStyle =
            typeof resolved.rowStyle === 'function'
              ? resolved.rowStyle({ row, rowIndex })
              : resolved.rowStyle
          const key = rowKeyOf(row, rowIndex)
          const isExpanded = expandedKeys.value.has(key)
          const meta = mergeHookResults(rowMetaHooks, [row, rowIndex, columns])
          const cells: VNode[] = []
          for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
            if (occupied.get(rowIndex)?.has(columnIndex)) {
              continue
            }
            const column = columns[columnIndex]
            let span: { rowspan?: number; colspan?: number } | null = null
            for (const hook of spanHooks) {
              const result = hook({ row, column, rowIndex, columnIndex, columns })
              if (Array.isArray(result)) {
                span = { rowspan: result[0], colspan: result[1] }
              } else if (result) {
                span = result
              }
            }
            const rowspan = Math.max(1, Math.min(Number(span?.rowspan) || 1, rows.length - rowIndex))
            const colspan = Math.max(1, Math.min(Number(span?.colspan) || 1, columns.length - columnIndex))
            for (let spanRow = rowIndex; spanRow < rowIndex + rowspan; spanRow += 1) {
              for (let spanColumn = columnIndex; spanColumn < columnIndex + colspan; spanColumn += 1) {
                if (spanRow === rowIndex && spanColumn === columnIndex) {
                  continue
                }
                if (!occupied.has(spanRow)) {
                  occupied.set(spanRow, new Set())
                }
                occupied.get(spanRow)!.add(spanColumn)
              }
            }
            cells.push(
              h(
                'td',
                {
                  class: [column.className, column.align ? `is-${column.align}` : '', ...fixedCellClass(columnIndex)],
                  style: fixedCellStyle(columnIndex),
                  title: cellTitle(column, row),
                  rowspan: rowspan > 1 ? rowspan : undefined,
                  colspan: colspan > 1 ? colspan : undefined
                },
                [
                  renderCell({
                    column,
                    row,
                    rowIndex,
                    columnIndex,
                    meta,
                    prependHooks
                  })
                ]
              )
            )
          }
          bodyRows.push(
            h(
              'tr',
              {
                key: String(key),
                class: [
                  rowClass,
                  resolved.stripe && rowIndex % 2 === 1 ? 'is-striped' : '',
                  resolved.highlightCurrentRow && currentKey.value === key ? 'current-row' : ''
                ],
                style: rowStyle,
                onClick: () => handleRowClick(row, rowIndex)
              },
              cells
            )
          )
          if (isExpanded) {
            const expandColumn = columns.find((column) => column.type === 'expand')
            const scope = { row, $index: rowIndex, rowIndex }
            bodyRows.push(
              h('tr', { key: `expand-${key}`, class: 'ui-table__expanded-row' }, [
                h('td', { colspan: Math.max(1, columns.length) }, [
                  expandColumn?.slots.default ? expandColumn.slots.default(scope) : null
                ])
              ])
            )
          }
        })

        if (!rows.length) {
          bodyRows.push(
            h('tr', { class: 'ui-table__empty-row' }, [
              h('td', { colspan: Math.max(1, columns.length) }, [
                slots.empty ? slots.empty() : resolved.emptyText
              ])
            ])
          )
        }

        const body = h('tbody', { class: 'ui-table__body' }, bodyRows)

        const summaryNodes: VNodeChild[] = []
        for (const hook of flattenHooks(states, 'tableSummary')) {
          const cells = hook(columns, rows)
          if (Array.isArray(cells) && cells.length) {
            summaryNodes.push(
              h(
                'tr',
                { class: 'ui-table__summary-row' },
                groupSummaryCells(cells, columns).map((group) => {
                  const column = columns[group.index]
                  const classes = [column?.align ? `is-${column.align}` : '', ...fixedCellClass(group.index)]
                  if (group.span > 1 && group.index + group.span - 1 === offsets.lastLeft) {
                    classes.push('is-fixed-left-edge')
                  }
                  return h(
                    'td',
                    {
                      class: classes,
                      style: fixedCellStyle(group.index),
                      colspan: group.span > 1 ? group.span : undefined
                    },
                    group.cell
                  )
                })
              )
            )
          }
        }
        const footer = summaryNodes.length ? h('tfoot', { class: 'ui-table__footer' }, summaryNodes) : null

        const innerStyle = {
          ...tableStyle,
          ...(resolved.tableLayout ? { tableLayout: resolved.tableLayout } : {})
        }
        // auto 布局的列宽由浏览器按内容决定，拆表后表头与表体无法保证对齐，仍走单表
        const autoLayout = resolved.tableLayout === 'auto'
        // 用透明右边框而不是 padding：二者都能把内容区收成 body clientWidth，
        // 但 overflow 裁剪到 padding box，边框能把滚动内容挡在滚动条槽之外，冻结列右侧不会透出下层列内容
        const gutterStyle: CSSProperties | undefined = scrollbarGutter.value
          ? { borderRight: `${scrollbarGutter.value}px solid transparent` }
          : undefined

        function renderInner(target: typeof tableRef, children: VNodeChild[]) {
          return h(
            'table',
            {
              ref: target,
              class: 'ui-table__inner',
              cellspacing: '0',
              cellpadding: '0',
              border: '0',
              style: innerStyle
            },
            children
          )
        }

        const bodyWrapper = h(
          'div',
          { ref: wrapper, class: 'ui-table__wrapper' },
          autoLayout
            ? renderInner(tableRef, [renderColgroup(), header, body, footer])
            : renderInner(tableRef, [renderColgroup(), body])
        )
        const headerSection =
          !autoLayout && header
            ? h(
                'div',
                { ref: headerView, class: 'ui-table__header-view', style: gutterStyle },
                renderInner(headerTable, [renderColgroup(), header])
              )
            : null
        const footerSection =
          !autoLayout && footer
            ? h(
                'div',
                { ref: footerView, class: 'ui-table__footer-view', style: gutterStyle },
                renderInner(footerTable, [renderColgroup(), footer])
              )
            : null

        const prefixNodes = collectFeatureFragments(states, 'prefix').map((fragment) => fragment())
        const suffixNodes = collectFeatureFragments(states, 'suffix').map((fragment) => fragment())

        return h(
          'div',
          {
            ...attrs,
            ref: root,
            class: rootClass,
            style: rootStyle
          },
          [
            ...prefixNodes,
            ...(autoLayout ? [bodyWrapper] : [headerSection, bodyWrapper, footerSection]),
            ...suffixNodes
          ]
        )
      }
    }
  })
}

export function createTableColumn(features: UiFeature[] = []) {
  const component = defineComponent({
    name: 'UiTableColumn',
    props: { ...tableColumnBaseProps, ...mergeFeatureProps(features) },
    setup() {
      return function render() {
        return h('div', { class: 'ui-table-column', style: { display: 'none' } })
      }
    }
  })
  ;(component as any)[tableColumnMarker] = true
  return component
}
