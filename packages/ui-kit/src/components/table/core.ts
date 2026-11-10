import type { CSSProperties, VNode, VNodeChild } from 'vue'
import {
  Fragment,
  computed,
  defineComponent,
  h,
  isVNode,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  shallowRef,
  toRaw,
  watch
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
import { useLocale } from '../../shared/config'
import { mergeStyles } from '../../shared/utils'
import { createCheckbox } from '../checkbox/core'
import './core.css'

export const tableColumnMarker = Symbol.for('ui-table-column')

const TableCheckbox = createCheckbox([])

// 虚拟滚动：首帧行高未测量完时的回退值（默认主题实际行高约 40px，挂载后会被实测值替换）
const VIRTUAL_FALLBACK_ROW_HEIGHT = 40
const VIRTUAL_OVERSCAN = 8

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
  // 不给 default：留空才能让 ConfigProvider 的 locale 生效，显式传值仍优先
  emptyText: { type: String },
  tableLayout: { type: String, default: 'fixed' },
  virtual: { type: Boolean }
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
      'tree-expand',
      'expand-change'
    ],
    setup(props, { attrs, slots, emit, expose }) {
      const locale = useLocale('table')
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
      // 滚动期间容器尺寸不变，逐帧读 clientWidth/scrollWidth 会在 DOM 刚 patch 后强制同步布局；
      // 宽度在测量时机缓存，偏移每帧只读一次供阴影状态与表头/合计对齐共用
      let contentWidth = 0
      let lastScrollLeft = 0
      const bodyScrollTop = ref(0)
      const measuredRowHeight = ref(0)
      let latestColumns: TableColumn[] = []
      let latestColumnsKey = ''
      let measuredColumnsKey = ''
      // 上一次真正渲染出来的列宽（含铺满余量分摊）：用户拖过列宽后要按它钉住，不能再按声明的 width 重算
      let renderedColumnWidths = new Map<string, number>()
      let overriddenColumnKeys = new Set<string>()
      let summaryCache: { key: string; rows: any[]; cells: any[][] } | null = null
      let rowVNodeCache = new Map<string, VNode>()
      let measureFrame = 0
      let resizeObserver: ResizeObserver | null = null

      // 行身份：排序、树形折叠、虚拟窗口都会改变渲染下标，用下标当键会把选中态串到别的行上；
      // 未配 rowKey 或字段缺失时退化为对象身份，保证逐行可区分
      const rowIdentity = new WeakMap<object, number>()
      let rowIdentitySeed = 0

      function rowIdentityOf(row: any) {
        if (row === null || typeof row !== 'object') {
          return row
        }
        const raw = toRaw(row)
        let identity = rowIdentity.get(raw)
        if (identity === undefined) {
          rowIdentitySeed += 1
          identity = rowIdentitySeed
          rowIdentity.set(raw, identity)
        }
        return identity
      }

      function rowKeyOf(row: any) {
        const key = resolved.rowKey
        const value = typeof key === 'function' ? key(row) : typeof key === 'string' ? row?.[key] : undefined
        return value === undefined || value === null ? rowIdentityOf(row) : value
      }

      interface RowEligibility {
        selectable: boolean
        checkboxVisible: boolean
      }

      let eligibilityCache: {
        rows: any[]
        columnsKey: string
        rowKey: unknown
        selectable: unknown
        showCheckbox: unknown
        values: Map<any, RowEligibility>
      } | null = null

      // 滚动帧只换窗口位置，行/列/回调不变时复用全表可用性，逐行重跑 selectable 会把回调摊到每帧
      function eligibilityOf(row: any): RowEligibility {
        const rows = flatRowGraph.value.rows
        const column = latestColumns.find((item) => item.type === 'selection')
        const selectable = column?.selectable ?? resolved.selectable
        const showCheckbox = column?.showCheckbox ?? resolved.showCheckbox
        if (
          eligibilityCache &&
          eligibilityCache.rows === rows &&
          eligibilityCache.columnsKey === latestColumnsKey &&
          eligibilityCache.rowKey === resolved.rowKey &&
          eligibilityCache.selectable === selectable &&
          eligibilityCache.showCheckbox === showCheckbox
        ) {
          return eligibilityCache.values.get(toRaw(row)) ?? { selectable: true, checkboxVisible: true }
        }
        const values = new Map<any, RowEligibility>()
        for (const item of rows) {
          const index = rowIndexOf(item)
          const allowed = typeof selectable === 'function' ? Boolean(selectable(item, index)) : true
          const show = typeof showCheckbox === 'function' ? Boolean(showCheckbox(item, index)) : showCheckbox !== false
          values.set(toRaw(item), { selectable: allowed, checkboxVisible: show })
        }
        eligibilityCache = {
          rows,
          columnsKey: latestColumnsKey,
          rowKey: resolved.rowKey,
          selectable,
          showCheckbox,
          values
        }
        return values.get(toRaw(row)) ?? { selectable: true, checkboxVisible: true }
      }

      function selectableOf(row: any) {
        return eligibilityOf(row).selectable
      }

      function checkboxVisibleOf(column: TableColumn | undefined, row: any) {
        return column ? eligibilityOf(row).checkboxVisible : false
      }

      function checkStrictlyOf(columns: TableColumn[]) {
        const column = columns.find((item) => item.type === 'selection')
        return Boolean(column?.checkStrictly ?? resolved.checkStrictly)
      }

      function treeChildrenKey() {
        const treeProps = resolved.treeProps
        if (treeProps && typeof treeProps === 'object') {
          const children = (treeProps as Record<string, unknown>).children
          if (typeof children === 'string' && children) {
            return children
          }
        }
        return 'children'
      }

      function collectFlatRows(list: any[], output: any[]) {
        const childrenKey = treeChildrenKey()
        for (const row of list) {
          output.push(row)
          const children = row?.[childrenKey]
          if (Array.isArray(children) && children.length) {
            collectFlatRows(children, output)
          }
        }
      }

      // 全量行的 DFS 图：选择载荷、回调下标、祖先链共用一份，折叠/排序/虚拟窗口都不改变行身份
      const flatRowGraph = computed(() => {
        const childrenKey = treeChildrenKey()
        const rows: any[] = []
        const indexes = new Map<any, number>()
        const parents = new Map<any, any>()
        function walk(list: any[], parent: any) {
          for (const row of list) {
            const raw = toRaw(row)
            indexes.set(raw, rows.length)
            rows.push(row)
            if (parent !== null) {
              parents.set(raw, parent)
            }
            const children = row?.[childrenKey]
            if (Array.isArray(children) && children.length) {
              walk(children, row)
            }
          }
        }
        walk(Array.isArray(resolved.data) ? resolved.data : [], null)
        return { rows, indexes, parents }
      })

      function rowIndexOf(row: any) {
        return flatRowGraph.value.indexes.get(toRaw(row)) ?? -1
      }

      function descendantsOf(row: any): any[] {
        const children = row?.[treeChildrenKey()]
        if (!Array.isArray(children) || !children.length) {
          return []
        }
        const output: any[] = []
        collectFlatRows(children, output)
        return output
      }

      function ancestorRowsOf(row: any): any[] {
        const parents = flatRowGraph.value.parents
        const trail: any[] = []
        let ancestor = parents.get(toRaw(row))
        while (ancestor !== undefined) {
          trail.push(ancestor)
          ancestor = parents.get(toRaw(ancestor))
        }
        return trail.reverse()
      }

      // 0 未选 / 1 部分选（半选）/ 2 全选，只统计可选且勾选框可见的后代；
      // keys 由调用方传入本次提交中的集合，读已提交的 selectedKeys 会拿到上一轮的旧状态
      function descendantCheckState(
        row: any,
        column: TableColumn | undefined,
        keys: Set<any> = selectedKeys.value
      ): 0 | 1 | 2 {
        const descendants = descendantsOf(row).filter(
          (child) => selectableOf(child) && checkboxVisibleOf(column, child)
        )
        if (!descendants.length) {
          return 0
        }
        let checked = 0
        for (const child of descendants) {
          if (keys.has(rowKeyOf(child))) {
            checked += 1
          }
        }
        if (checked === 0) {
          return 0
        }
        return checked === descendants.length ? 2 : 1
      }

      function emitSelection(next: Set<any>) {
        emit(
          'selection-change',
          flatRowGraph.value.rows.filter((row) => next.has(rowKeyOf(row)))
        )
      }

      function toggleRow(row: any, checked: boolean, columns: TableColumn[]) {
        if (!selectableOf(row)) {
          return
        }
        const column = columns.find((item) => item.type === 'selection')
        const key = rowKeyOf(row)
        const next = new Set(selectedKeys.value)
        if (checked) {
          next.add(key)
        } else {
          next.delete(key)
        }
        if (!checkStrictlyOf(columns)) {
          // 树形联动：勾选向下传播给可选且可见的后代，向上传播保持祖先全选/半选状态
          for (const child of descendantsOf(row)) {
            if (!selectableOf(child) || !checkboxVisibleOf(column, child)) {
              continue
            }
            const childKey = rowKeyOf(child)
            if (checked) {
              next.add(childKey)
            } else {
              next.delete(childKey)
            }
          }
          for (const ancestor of ancestorRowsOf(row)) {
            const ancestorKey = rowKeyOf(ancestor)
            if (descendantCheckState(ancestor, column, next) === 2) {
              next.add(ancestorKey)
            } else {
              next.delete(ancestorKey)
            }
          }
        }
        selectedKeys.value = next
        emitSelection(next)
      }

      function toggleAll(checked: boolean, columns: TableColumn[], rows: any[]) {
        const column = columns.find((item) => item.type === 'selection')
        const next = new Set<any>()
        if (checked) {
          // 展开后的行 + 联动时的后代：隐藏行与不可选行始终不进集合
          for (const row of rows) {
            if (!selectableOf(row) || !checkboxVisibleOf(column, row)) {
              continue
            }
            next.add(rowKeyOf(row))
            if (!checkStrictlyOf(columns)) {
              for (const child of descendantsOf(row)) {
                if (selectableOf(child) && checkboxVisibleOf(column, child)) {
                  next.add(rowKeyOf(child))
                }
              }
            }
          }
        }
        selectedKeys.value = next
        emitSelection(next)
      }

      function toggleExpand(row: any) {
        const key = rowKeyOf(row)
        const next = new Set(expandedKeys.value)
        const expanded = !next.has(key)
        if (expanded) {
          next.add(key)
        } else {
          next.delete(key)
        }
        expandedKeys.value = next
        emit('expand-change', { row, expanded })
      }

      function handleRowClick(row: any) {
        if (resolved.highlightCurrentRow) {
          currentKey.value = rowKeyOf(row)
          emit('current-change', row)
        }
        emit('row-click', row)
      }

      let selectionCache: {
        rows: any[]
        columnsKey: string
        rowKey: unknown
        selectable: unknown
        showCheckbox: unknown
        keys: Set<any>
        selectableCount: number
        selectedCount: number
        allSelected: boolean
      } | null = null

      // 表头全选态按「行引用 + 列签名 + 回调身份 + 选中集合」缓存：滚动帧只换窗口位置，
      // 不缓存会让 selectable/showCheckbox 这类全表回调在每个滚动帧上重跑一遍
      function selectionSummaryOf(rows: any[], columns: TableColumn[]) {
        const column = columns.find((item) => item.type === 'selection')
        const selectable = column?.selectable ?? resolved.selectable
        const showCheckbox = column?.showCheckbox ?? resolved.showCheckbox
        const keys = selectedKeys.value
        if (
          selectionCache &&
          selectionCache.rows === rows &&
          selectionCache.columnsKey === latestColumnsKey &&
          selectionCache.rowKey === resolved.rowKey &&
          selectionCache.selectable === selectable &&
          selectionCache.showCheckbox === showCheckbox &&
          selectionCache.keys === keys
        ) {
          return selectionCache
        }
        let selectableCount = 0
        let selectedCount = 0
        if (column) {
          for (const row of rows) {
            if (!selectableOf(row) || !checkboxVisibleOf(column, row)) {
              continue
            }
            selectableCount += 1
            if (keys.has(rowKeyOf(row))) {
              selectedCount += 1
            }
          }
        }
        selectionCache = {
          rows,
          columnsKey: latestColumnsKey,
          rowKey: resolved.rowKey,
          selectable,
          showCheckbox,
          keys,
          selectableCount,
          selectedCount,
          allSelected: selectableCount > 0 && selectedCount === selectableCount
        }
        return selectionCache
      }

      const state = {
        selectedKeys,
        latestColumns: () => latestColumns,
        flatRows: () => flatRowGraph.value.rows,
        rowKeyOf,
        selectableOf,
        selectionSummaryOf,
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
      const summaryHooks = flattenHooks(states, 'tableSummary')
      const exposed = collectFeatureExposed(features, { ...featureContext, props: resolved })
      if (Object.keys(exposed).length) {
        expose(exposed)
      }

      // 树形展开后的可见行（含被 hook 过滤/排序后的结果），methods 特性全选也基于它
      function visibleRowsOf(data: any[]): any[] {
        let rows = Array.isArray(data) ? [...data] : []
        for (const hook of flattenHooks(states, 'tableRows')) {
          rows = hook(rows, latestColumns, resolved)
        }
        return rows
      }
      Object.assign(state, { visibleRowsOf })

      // 渲染用行结果 memo：管线 O(N)（tree 建 metaMap、排序等）只随数据/排序/列槽位变化重跑，
      // 虚拟滚动下每个滚动帧都触发渲染，不 memo 会把成本摊到滚动帧上
      const pipelineRows = computed(() => {
        void slots.default
        return visibleRowsOf(resolved.data)
      })

      // 合计按「数据引用 + 列签名」缓存：滚动帧只换滚动位置，不重算全表；数据/列变化才更新
      function summaryCellsOf(columns: TableColumn[], rows: any[]): any[][] {
        const scrolling = scrollActive || scrollFrame !== 0
        if (scrolling && summaryCache && summaryCache.key === latestColumnsKey && summaryCache.rows === rows) {
          return summaryCache.cells
        }
        const cells: any[][] = []
        for (const hook of summaryHooks) {
          const result = hook(columns, rows)
          if (Array.isArray(result) && result.length) {
            cells.push(result)
          }
        }
        summaryCache = { key: latestColumnsKey, rows, cells }
        return cells
      }

      // 行高实测值（按 rowKey），虚拟滚动撑占位高度用；未测到的行用回退行高
      const measuredRowHeights = shallowRef<Map<any, number>>(new Map())

      // 未测行回退高：用已测行的中位数。均值会被个别超高行带偏——一行 1600px 在
      // 几十个样本里就能把全体未测行估算抬高几十 px、总高虚增百万级，拇指和锚点
      // 跟着大幅漂移；中位数对极端值零影响。首行只采样一次会远低于变量行高的真实
      // 分布，总滚动高被严重低估，拖滚动条时每次实测顶高总高、浏览器又按拇指位重算
      // scrollTop，互相喂成无限更新；首窗实测后中位数即贴近真实分布，总高一次到位
      const fallbackRowHeight = computed(() => {
        const heights = measuredRowHeights.value
        if (!heights.size) {
          return measuredRowHeight.value || VIRTUAL_FALLBACK_ROW_HEIGHT
        }
        const samples = [...heights.values()].sort((a, b) => a - b)
        const mid = samples.length >> 1
        return samples.length % 2 ? samples[mid] : (samples[mid - 1] + samples[mid]) / 2
      })

      // 每行顶部偏移前缀和：高度表变化时重算一次 O(N)，滚动帧只读不算
      const rowMetrics = computed(() => {
        const list = pipelineRows.value
        const heights = measuredRowHeights.value
        const fallback = fallbackRowHeight.value
        const offsets = new Float64Array(list.length + 1)
        let total = 0
        for (let index = 0; index < list.length; index += 1) {
          offsets[index] = total
          total += heights.get(rowKeyOf(list[index])) ?? fallback
        }
        offsets[list.length] = total
        return { offsets, total }
      })

      interface SpanAnchor {
        row: number
        rowspan: number
      }

      interface FakeSpanCell {
        startRow: number
        endRow: number
        columnIndex: number
        colspan: number
        contentRow: number
      }

      interface SpanPlan {
        spans: Map<number, Map<number, { rowspan: number; colspan: number }>>
        covered: Map<number, Set<number>>
        fakeCells: Map<number, Map<number, FakeSpanCell>>
        anchors: SpanAnchor[]
      }

      // 合并单元格计划：virtual 下大 rowspan 不整块扩窗，改为逐行续接单元格；
      // 有 spanMethod 时替代渲染期的逐格 hook 调用，结果随数据/列变化一次算清
      const spanPlan = computed<SpanPlan | null>(() => {
        if (typeof resolved.spanMethod !== 'function') {
          return null
        }
        const list = pipelineRows.value
        const columns = latestColumns
        const spanHooks = flattenHooks(states, 'tableSpan')
        const spans: SpanPlan['spans'] = new Map()
        const covered: SpanPlan['covered'] = new Map()
        const fakeCells: SpanPlan['fakeCells'] = new Map()
        const anchors: SpanAnchor[] = []
        const fakeRowspan = Boolean(
          resolved.virtual && resolved.tableLayout !== 'auto' && list.length && (resolved.height || resolved.maxHeight)
        )
        for (let rowIndex = 0; rowIndex < list.length; rowIndex += 1) {
          const row = list[rowIndex]
          for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
            if (covered.get(rowIndex)?.has(columnIndex)) {
              continue
            }
            let span: { rowspan?: number; colspan?: number } | null = null
            for (const hook of spanHooks) {
              const result = hook({ row, column: columns[columnIndex], rowIndex, columnIndex, columns })
              if (Array.isArray(result)) {
                span = { rowspan: result[0], colspan: result[1] }
              } else if (result) {
                span = result
              }
            }
            const rowspan = Math.max(1, Math.min(Number(span?.rowspan) || 1, list.length - rowIndex))
            const colspan = Math.max(1, Math.min(Number(span?.colspan) || 1, columns.length - columnIndex))
            if (rowspan <= 1 && colspan <= 1) {
              continue
            }
            if (rowspan > 1 && fakeRowspan) {
              const offsets = rowMetrics.value.offsets
              const middle = ((offsets[rowIndex] ?? 0) + (offsets[rowIndex + rowspan] ?? 0)) / 2
              const contentRow = Math.min(rowIndex + rowspan - 1, Math.max(rowIndex, findRowAtOffset(offsets, middle)))
              for (let spanRow = rowIndex; spanRow < rowIndex + rowspan; spanRow += 1) {
                if (!fakeCells.has(spanRow)) {
                  fakeCells.set(spanRow, new Map())
                }
                fakeCells.get(spanRow)!.set(columnIndex, {
                  startRow: rowIndex,
                  endRow: rowIndex + rowspan - 1,
                  columnIndex,
                  colspan,
                  contentRow
                })
                for (let spanColumn = columnIndex + 1; spanColumn < columnIndex + colspan; spanColumn += 1) {
                  if (!covered.has(spanRow)) {
                    covered.set(spanRow, new Set())
                  }
                  covered.get(spanRow)!.add(spanColumn)
                }
              }
              continue
            }
            if (!spans.has(rowIndex)) {
              spans.set(rowIndex, new Map())
            }
            spans.get(rowIndex)!.set(columnIndex, { rowspan, colspan })
            for (let spanRow = rowIndex; spanRow < rowIndex + rowspan; spanRow += 1) {
              for (let spanColumn = columnIndex; spanColumn < columnIndex + colspan; spanColumn += 1) {
                if (spanRow === rowIndex && spanColumn === columnIndex) {
                  continue
                }
                if (!covered.has(spanRow)) {
                  covered.set(spanRow, new Set())
                }
                covered.get(spanRow)!.add(spanColumn)
              }
            }
            if (rowspan > 1) {
              anchors.push({ row: rowIndex, rowspan })
            }
          }
        }
        return { spans, covered, fakeCells, anchors }
      })

      // 最后一个偏移 <= y 的行下标，二分 O(logN)
      function findRowAtOffset(offsets: Float64Array, y: number): number {
        let low = 0
        let high = offsets.length - 1
        while (low < high) {
          const mid = (low + high + 1) >> 1
          if (offsets[mid] <= y) {
            low = mid
          } else {
            high = mid - 1
          }
        }
        return low
      }

      function measureAvailableWidth() {
        const element = wrapper.value
        if (!element) {
          return
        }
        const width = element.clientWidth
        contentWidth = element.scrollWidth
        // 容器宽度可能由表格自身撑出（flex 居中 / fit-content）：铺满分摊改表宽会改变下一次测得的
        // 可用宽度，1px 内只可能是自己上一轮布局的回显，重算会让列宽逐帧生长或来回抖动
        if (Math.abs(availableWidth.value - width) > 1) {
          availableWidth.value = width
        }
        // 列宽或容器宽变化后立即按新内容宽重算阴影，不必等下一次滚动或渲染
        updateScrollState(lastScrollLeft)
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
        // 列宽/结构变了之后头尾视口的 scrollLeft 可能被浏览器重新钳制，下次同步按实际重写一遍
        appliedSectionsLeft = null
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

      function updateScrollState(left: number) {
        const leftEdge = left > 0
        const rightEdge = left + availableWidth.value < contentWidth - 1
        if (leftEdge !== scrollState.value.left || rightEdge !== scrollState.value.right) {
          scrollState.value = { left: leftEdge, right: rightEdge }
        }
      }

      // 头/尾视口只被动跟随表体：读回 scrollLeft 会在 DOM 刚 patch 后强制同步布局，
      // 每帧两次读回的代价顶得上一轮完整布局；只记录自己写进去的值，变化才下发
      let appliedSectionsLeft: number | null = null
      function syncFixedSections(left: number) {
        if (left === appliedSectionsLeft) {
          return
        }
        appliedSectionsLeft = left
        for (const view of [headerView.value, footerView.value]) {
          if (view) {
            view.scrollLeft = left
          }
        }
      }

      function applyScrollSections(left: number) {
        updateScrollState(left)
        syncFixedSections(left)
      }

      function measureRowHeight() {
        // 首窗实测前的临时回退高只采样一次：变量行高场景下首行高会随窗口变化，
        // 每次更新都重采样会让总滚动高跟着跳；有实测值后回退高走 fallbackRowHeight 中位数
        if (!resolved.virtual || typeof window === 'undefined' || measuredRowHeight.value) {
          return
        }
        const row = wrapper.value?.querySelector('.ui-table__body tr:not(.ui-table__spacer)')
        if (row instanceof HTMLElement && row.offsetHeight > 0) {
          measuredRowHeight.value = row.offsetHeight
        }
      }

      // 变量行高实测：读取窗口内每行实际高度回填高度表，前缀和变了会顶起/压低后续行，
      // 用窗口首行的偏移增量锚住 scrollTop，滚动位置不跳。
      // 滚动进行中暂停提交：拖滚动条时每次提交都会触发 O(N) 前缀和重算 + 全量重渲染 +
      // scrollTop 回改，滚动事件被放大、主线程被喂满，表现为内容不跟随且拖动时大片空白；
      // 停稳后再统一实测回填，拖动全程按现有估算渲染，滚动条总高稳定、拇指自然跟随
      const SCROLL_SETTLE_MS = 120
      let rowMeasureFrame = 0
      let scrollSettleTimer: ReturnType<typeof setTimeout> | undefined
      let scrollActive = false
      // 贴底锁：滚到最底部后锁定尾部窗口。实测提交会让总高收缩，锚定回写把 scrollTop
      // 顶离底部、尾部钳制随之失效（最后几行闪现后消失）；锁定后用户向上滚动超过一个
      // 视口才解锁，提交引起的微小位移不解锁。
      // 必须是响应式：解锁发生在 flushScrollState 里，而此刻 bodyScrollTop 往往已同步
      // 过同值，普通变量解锁不会触发重渲染，窗口会永远卡在钳制态（一次性跳顶复现）
      const stickToBottom = shallowRef(false)
      function scheduleRowMeasure() {
        if (!resolved.virtual || typeof window === 'undefined' || rowMeasureFrame) {
          return
        }
        rowMeasureFrame = window.requestAnimationFrame(() => {
          rowMeasureFrame = 0
          flushRowMeasure()
        })
      }

      // 实测值先攒到 pending 再分批合并进正式高度表：每次停稳都提交会让总高被反复
      // 修正、拇指跟着微跳；修正幅度不足总高 0.3% 时继续攒，静止 800ms 或攒够幅度才
      // 一次合并，把一串微小抖动聚成一次稀有修正
      const PENDING_COMMIT_IDLE_MS = 800
      const PENDING_COMMIT_MIN_RATIO = 0.003
      let pendingRowHeights: Map<any, number> | null = null
      let pendingCommitTimer: ReturnType<typeof setTimeout> | undefined

      // 行身份键随数据替换不断新增，不清掉已移除行的高度表会无限增长（分页/搜索换数据场景）
      watch([() => flatRowGraph.value.rows, () => resolved.rowKey], ([rows]) => {
        const live = new Set(rows.map((row) => rowKeyOf(row)))
        const committed = measuredRowHeights.value
        let removed = false
        for (const key of committed.keys()) {
          if (!live.has(key)) {
            committed.delete(key)
            removed = true
          }
        }
        if (removed) {
          measuredRowHeights.value = new Map(committed)
        }
        if (pendingRowHeights) {
          for (const key of pendingRowHeights.keys()) {
            if (!live.has(key)) {
              pendingRowHeights.delete(key)
            }
          }
        }
      })

      function pendingTotalDelta(next: Map<any, number>): number {
        const list = pipelineRows.value
        const committed = measuredRowHeights.value
        const fallback = fallbackRowHeight.value
        let delta = 0
        for (let index = 0; index < list.length; index += 1) {
          const key = rowKeyOf(list[index])
          delta += (next.get(key) ?? committed.get(key) ?? fallback) - (committed.get(key) ?? fallback)
        }
        return delta
      }

      function captureViewportAnchors(element: HTMLElement): Array<{ index: number; viewTop: number }> {
        const wrapperTop = element.getBoundingClientRect().top
        const anchors: Array<{ index: number; viewTop: number }> = []
        for (const row of element.querySelectorAll<HTMLElement>('tr[data-row-index]')) {
          const index = Number(row.getAttribute('data-row-index'))
          if (!Number.isInteger(index)) {
            continue
          }
          anchors.push({ index, viewTop: row.getBoundingClientRect().top - wrapperTop })
        }
        return anchors
      }

      function commitPendingRowHeights() {
        if (pendingCommitTimer) {
          clearTimeout(pendingCommitTimer)
          pendingCommitTimer = undefined
        }
        const pending = pendingRowHeights
        if (!pending) {
          return
        }
        // 只在顶部/底部提交实测：中途提交会改动未测行的估算前缀和，滚动位置没动内容却整体跳
        const element = wrapper.value
        const atTop = !element || element.scrollTop <= 1
        const atBottom = element ? element.scrollTop + element.clientHeight >= element.scrollHeight - 1 : false
        if (!atTop && !atBottom) {
          return
        }
        pendingRowHeights = null
        const list = pipelineRows.value
        const wrapperEl = wrapper.value
        const viewH = wrapperEl?.clientHeight ?? 0
        const oldTotal = rowMetrics.value.offsets[list.length] ?? 0
        // 提交前已贴底：修正总高后把滚动位置钉到新底部并上锁；否则锚点回写
        // 可能把 scrollTop 顶离底部，尾部钳制随之失效（最后几行闪现后消失）；
        // 在提交点判定，两个总高和滚动位置都是现值，不依赖 rAF 时序
        const wasAtBottom = wrapperEl ? wrapperEl.scrollTop >= oldTotal - viewH - 1 : false
        // 锚点必须取渲染后真正位于视口顶部的行：窗口内实际行高与估算不同，按估算偏移会锚到相邻行
        const anchors = wrapperEl ? captureViewportAnchors(wrapperEl) : []
        measuredRowHeights.value = pending
        if (wasAtBottom) {
          const newTotal = rowMetrics.value.offsets[list.length] ?? 0
          stickToBottom.value = true
          if (wrapperEl) {
            wrapperEl.scrollTop = Math.max(0, newTotal - viewH)
            bodyScrollTop.value = wrapperEl.scrollTop
          }
          return
        }
        if (!wrapperEl || stickToBottom.value || !anchors.length) {
          return
        }
        // 提交会先按旧 scrollTop 重排窗口；等 DOM 落地后取仍然存在的最高锚点行回写真实位移
        nextTick(() => {
          let delta: number | null = null
          for (const anchor of anchors) {
            const row = wrapperEl.querySelector<HTMLElement>(`tr[data-row-index="${anchor.index}"]`)
            if (!row) {
              continue
            }
            delta = row.getBoundingClientRect().top - wrapperEl.getBoundingClientRect().top - anchor.viewTop
            break
          }
          if (delta !== null && Math.abs(delta) > 0.5) {
            wrapperEl.scrollTop += delta
          }
          bodyScrollTop.value = wrapperEl.scrollTop
        })
      }

      function flushRowMeasure() {
        if (scrollActive) {
          return
        }
        // 中途不实测：实测值一旦提交就会改变窗口定位，用户停在中途时画面会从 y 行跳到 x 行
        const wrapperEl = wrapper.value
        if (wrapperEl) {
          const atTop = wrapperEl.scrollTop <= 1
          const atBottom = wrapperEl.scrollTop + wrapperEl.clientHeight >= wrapperEl.scrollHeight - 1
          if (!atTop && !atBottom) {
            return
          }
        }
        const list = pipelineRows.value
        const bodyEl = tableRef.value?.querySelector(':scope > tbody.ui-table__body')
        if (!bodyEl) {
          return
        }
        const next = new Map(pendingRowHeights ?? measuredRowHeights.value)
        const trs = bodyEl.querySelectorAll(':scope > tr[data-row-index]')
        let changed = false
        for (const tr of Array.from(trs)) {
          const index = Number(tr.getAttribute('data-row-index'))
          if (!Number.isInteger(index) || index < 0 || index >= list.length) {
            continue
          }
          const key = rowKeyOf(list[index])
          const height = (tr as HTMLElement).getBoundingClientRect().height
          if (Math.abs((next.get(key) ?? 0) - height) > 0.5) {
            next.set(key, height)
            changed = true
          }
        }
        if (!changed) {
          return
        }
        pendingRowHeights = next
        const total = rowMetrics.value.offsets[list.length] || 1
        if (Math.abs(pendingTotalDelta(next)) < total * PENDING_COMMIT_MIN_RATIO) {
          if (!pendingCommitTimer) {
            pendingCommitTimer = setTimeout(function idleCommit() {
              pendingCommitTimer = undefined
              if (scrollActive) {
                pendingCommitTimer = setTimeout(idleCommit, PENDING_COMMIT_IDLE_MS)
                return
              }
              commitPendingRowHeights()
            }, PENDING_COMMIT_IDLE_MS)
          }
          return
        }
        commitPendingRowHeights()
      }

      // 滚动事件在拖动原生滚动条时频率高于屏幕刷新率（实测 >100Hz），
      // 每个事件都同步读布局 + 触发窗口重渲染会让每帧跑两轮以上渲染管线，
      // 主线程吃紧时浏览器合并丢弃鼠标位移，拇指表现为不跟手；
      // 全部合并进 rAF，每帧最多一轮：状态同步 + 固定区对齐 + 窗口推进一次完成
      let scrollFrame = 0
      let lastMaxScrollTop = 0
      // 几何在 scroll 事件里读：此刻上一帧布局已提交，读值不会强制回流。
      // 放到 rAF 里读会落在本帧 DOM patch 之后，每帧多付一次强制同步布局
      let pendingScrollLeft = 0
      let pendingScrollTop = 0
      let pendingMaxTop = 0
      let pendingClientHeight = 0
      function flushScrollState() {
        scrollFrame = 0
        const element = wrapper.value
        if (!element) {
          return
        }
        lastScrollLeft = pendingScrollLeft
        applyScrollSections(lastScrollLeft)
        if (resolved.virtual) {
          const maxTop = pendingMaxTop
          const top = pendingScrollTop
          if (top >= maxTop - 1) {
            stickToBottom.value = true
          } else if (stickToBottom.value) {
            // 用户上滚：scrollTop 退了一个视口以上且总高没变才解锁；
            // 总高变高是实测提交扩的，把滚动位置钉回新底部，锁不丢
            if (maxTop - top > pendingClientHeight && maxTop <= lastMaxScrollTop + 0.5) {
              stickToBottom.value = false
            } else if (maxTop > lastMaxScrollTop + 0.5 && top < maxTop - 1) {
              element.scrollTop = maxTop
              pendingScrollTop = maxTop
            }
          }
          lastMaxScrollTop = maxTop
          bodyScrollTop.value = pendingScrollTop
        }
      }

      function handleScroll() {
        const element = wrapper.value
        if (!element) {
          return
        }
        // 偏移每个事件都取：拖动原生滚动条时一帧内会到多个 scroll 事件，
        // 只留帧内第一个事件的偏移会让窗口落后最新位置一个事件位移，快拖时视口露白
        pendingScrollLeft = element.scrollLeft
        pendingScrollTop = element.scrollTop
        if (!scrollFrame) {
          // 尺寸随内容与容器变，帧内不会变，一帧读一次就够
          pendingMaxTop = element.scrollHeight - element.clientHeight
          pendingClientHeight = element.clientHeight
        }
        if (resolved.virtual) {
          scrollActive = true
          if (scrollSettleTimer) {
            clearTimeout(scrollSettleTimer)
          }
          scrollSettleTimer = setTimeout(() => {
            scrollActive = false
            scheduleRowMeasure()
          }, SCROLL_SETTLE_MS)
          // 窗口推进同步做：scroll 事件到 rAF 回调之间内容会滞后拇指约一帧，
          // 快速拖动时拇指与内容暂时错位；bodyScrollTop 写入交给 Vue 调度器
          // 去重（同一渲染 effect 一帧只跑一次），不会恢复成每事件一渲染；
          // 帧内后续事件的偏移由 rAF 兜一次，布局读写与贴底判定仍每帧一轮
          if (!scrollFrame) {
            bodyScrollTop.value = pendingScrollTop
          }
        }
        if (scrollFrame || typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
          if (!scrollFrame) {
            flushScrollState()
          }
          return
        }
        scrollFrame = window.requestAnimationFrame(flushScrollState)
      }

      onMounted(() => {
        wrapper.value?.addEventListener('scroll', handleScroll, { passive: true })
        measureColumns()
        measuredColumnsKey = latestColumnsKey
        measureRowHeight()
        lastScrollLeft = wrapper.value?.scrollLeft ?? 0
        applyScrollSections(lastScrollLeft)
        scheduleMeasure()
        scheduleRowMeasure()
        if (typeof ResizeObserver !== 'undefined' && wrapper.value) {
          resizeObserver = new ResizeObserver(() => scheduleMeasure())
          resizeObserver.observe(wrapper.value)
        }
      })

      onUpdated(() => {
        measureRowHeight()
        if (latestColumnsKey !== measuredColumnsKey) {
          measuredColumnsKey = latestColumnsKey
          scheduleMeasure()
        }
        scheduleRowMeasure()
        applyScrollSections(lastScrollLeft)
      })

      onBeforeUnmount(() => {
        wrapper.value?.removeEventListener('scroll', handleScroll)
        resizeObserver?.disconnect()
        if (measureFrame && typeof window !== 'undefined') {
          window.cancelAnimationFrame(measureFrame)
        }
        measureFrame = 0
        if (rowMeasureFrame && typeof window !== 'undefined') {
          window.cancelAnimationFrame(rowMeasureFrame)
        }
        rowMeasureFrame = 0
        if (scrollFrame && typeof window !== 'undefined') {
          window.cancelAnimationFrame(scrollFrame)
        }
        scrollFrame = 0
        if (scrollSettleTimer) {
          clearTimeout(scrollSettleTimer)
        }
        scrollSettleTimer = undefined
        if (pendingCommitTimer) {
          clearTimeout(pendingCommitTimer)
        }
        pendingCommitTimer = undefined
        pendingRowHeights = null
      })

      interface CellOptions {
        column: TableColumn
        row: any
        rowIndex: number
        columnIndex: number
        meta: Record<string, any>
        prependHooks: ((...args: any[]) => any)[]
        contentHooks: ((...args: any[]) => any)[]
        // 合并单元格的续格只是占位，内容列才拿得到真实行数据
        merged?: boolean
      }

      // 半选只落在原生 indeterminate property 上时选择器观测不到，统一补 is-* 状态类
      function tableCheckboxClass(indeterminate: boolean) {
        return indeterminate ? 'ui-table__checkbox is-indeterminate' : 'ui-table__checkbox'
      }

      function renderCell(options: CellOptions): VNodeChild {
        const { column, row, rowIndex, meta, prependHooks, contentHooks, merged } = options
        if (column.type === 'selection') {
          if (!checkboxVisibleOf(column, row)) {
            return null
          }
          const key = rowKeyOf(row)
          const childState = checkStrictlyOf([column]) ? 0 : descendantCheckState(row, column)
          return h(TableCheckbox, {
            class: tableCheckboxClass(childState === 1),
            modelValue: selectedKeys.value.has(key) || childState === 2,
            indeterminate: childState === 1,
            disabled: !selectableOf(row),
            onClick: (event: Event) => event.stopPropagation(),
            'onUpdate:modelValue': (checked: boolean) => toggleRow(row, checked, [column])
          })
        }
        if (column.type === 'index') {
          const value = typeof column.index === 'function' ? column.index(rowIndex) : rowIndex + 1
          return typeof column.index === 'number' ? rowIndex + column.index : value
        }
        if (column.type === 'expand') {
          const key = rowKeyOf(row)
          const expanded = expandedKeys.value.has(key)
          return h(
            'button',
            {
              type: 'button',
              class: ['ui-table__expand', expanded ? 'is-expanded' : ''],
              'aria-label': expanded ? locale.value.collapseRow : locale.value.expandRow,
              'aria-expanded': expanded ? 'true' : 'false',
              onClick: (event: Event) => {
                event.stopPropagation()
                toggleExpand(row)
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
          const fragment = hook(scope, latestColumns)
          if (fragment !== undefined && fragment !== null) {
            prepend.push(fragment)
          }
        }
        // 内容挂点只包业务内容（缩进/箭头等前置节点保持可点、不被裁切）
        for (const hook of contentHooks) {
          content = hook(content, { ...scope, merged: Boolean(merged) })
        }
        return prepend.length ? [...prepend, content] : content
      }

      return function render() {
        const columns = readColumns(slots)
        latestColumns = columns
        const rows = pipelineRows.value

        const widthHooks = flattenHooks(states, 'tableColumnWidth')
        const userWidthHooks = flattenHooks(states, 'tableColumnUserWidth')
        const spanHooks = flattenHooks(states, 'tableSpan')
        const prependHooks = flattenHooks(states, 'tableCellPrepend')
        const attrsHooks = flattenHooks(states, 'tableCellAttrs')
        const contentHooks = flattenHooks(states, 'tableCellContent')
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
          if (hasUserWidth(column)) {
            return effective as string | number
          }
          // 用户拖过列宽后其余列按上次渲染宽度钉住：否则会退回声明宽度重新分摊，拖一列牵动所有列
          if (hasUserWidths) {
            const rendered = renderedColumnWidths.get(column.key)
            if (rendered !== undefined) {
              return rendered
            }
          }
          if (effective === undefined || effective === null || effective === '') {
            return column.minWidth
          }
          return effective
        }

        // 拖拽覆盖的列宽视为用户钉死，不再参与剩余空间分摊
        function hasUserWidth(column: TableColumn): boolean {
          for (const hook of userWidthHooks) {
            const value = hook(column)
            if (value !== undefined && value !== null && value !== '') {
              return true
            }
          }
          return false
        }

        const hasUserWidths = columns.some((column) => hasUserWidth(column))
        const overriddenKeys = new Set(columns.filter((column) => hasUserWidth(column)).map((column) => column.key))
        // 双击复位会撤掉覆盖：这一列要回到声明宽度，不能沿用复位前的渲染宽度
        overriddenColumnKeys.forEach((key) => {
          if (!overriddenKeys.has(key)) {
            renderedColumnWidths.delete(key)
          }
        })
        overriddenColumnKeys = overriddenKeys

        function layoutColumnWidths(columns: TableColumn[]): Array<number | string> {
          const widths = columns.map((column) => columnColWidth(column))
          const numeric = widths.map((width) => numericWidth(width))
          if (numeric.some((width) => width === null)) {
            return widths
          }
          const numbers = numeric as number[]
          const total = numbers.reduce((sum, width) => sum + width, 0)
          const available = availableWidth.value
          if (resolved.fit === false || !available || total > available) {
            return numbers
          }
          const flexible: number[] = []
          columns.forEach((column, index) => {
            const width = effectiveWidthOf(column)
            if (width === undefined || width === null || width === '') {
              flexible.push(index)
            }
          })
          // 所有列都写死宽度时，剩余空间也要分摊，否则宽容器里右侧会留白；
          // 用户拖过列宽后只给真正的弹性列补余量，其余列保持钉住的宽度
          const targets = (flexible.length || hasUserWidths ? flexible : columns.map((_column, index) => index)).filter(
            (index) => !hasUserWidth(columns[index])
          )
          if (!targets.length) {
            return numbers
          }
          if (total === available) {
            const last = targets[targets.length - 1]
            numbers[last] = Math.max(1, numbers[last] - 1)
            return numbers
          }
          // 留 1px 余量：浏览器缩放时小数像素会把 scrollWidth 向上取整，Chrome/Firefox 会因此露出横向滚动条
          const extra = available - total - 1
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
        const nextRenderedWidths = new Map<string, number>()
        columns.forEach((column, index) => {
          const width = layoutWidths[index]
          if (typeof width === 'number') {
            nextRenderedWidths.set(column.key, width)
          }
        })
        renderedColumnWidths = nextRenderedWidths
        latestColumnsKey = columns
          .map(
            (column, index) =>
              `${column.prop ?? ''}:${column.type ?? ''}:${column.label ?? ''}:${String(layoutWidths[index] ?? '')}`
          )
          .join('|')
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

        const fixedClasses = columns.map((_column, index) => fixedCellClass(index))
        const fixedStyles = columns.map((_column, index) => fixedCellStyle(index))

        const headerClick = (column: TableColumn) => {
          for (const hook of flattenHooks(states, 'tableHeaderClick')) {
            hook(column, columns, resolved)
          }
        }

        const selection = selectionSummaryOf(rows, columns)

        const featureClasses = collectFeatureClasses(states)
        const rootClass = [
          attrs.class,
          'ui-table',
          resolved.fit === false ? 'ui-table--auto-fit' : '',
          resolved.stripe ? 'ui-table--striped' : '',
          resolved.border ? 'ui-table--bordered' : '',
          resolved.size ? `ui-table--size-${resolved.size}` : '',
          hasFixedLeft ? 'has-fixed-left' : '',
          hasFixedRight ? 'has-fixed-right' : '',
          hasFixedLeft && scrollState.value.left ? 'is-scrolled-left' : '',
          hasFixedRight && scrollState.value.right ? 'is-scrolled-right' : '',
          ...featureClasses
        ]
        const rootStyle = mergeStyles(attrs.style, collectFeatureStyles(states)) as CSSProperties
        const rootHeight = sizeValue(resolved.height)
        if (rootHeight) {
          rootStyle.height = rootHeight
        }
        const rootMaxHeight = sizeValue(resolved.maxHeight)
        if (rootMaxHeight) {
          rootStyle.maxHeight = rootMaxHeight
        }
        // 冻结列阴影由根节点一条 overlay 贯穿表头/表体/合计，逐单元格阴影会在分表边界断开
        if (hasFixedLeft) {
          ;(rootStyle as Record<string, string>)['--ui-table-fixed-left'] = `${leftOffset}px`
        }
        if (hasFixedRight) {
          ;(rootStyle as Record<string, string>)['--ui-table-fixed-right'] = `${rightOffset}px`
        }
        // 冻结列贴住视口右缘时会左移一个滚动条槽宽，列宽手柄按这个值挪开才不被盖住
        if (scrollbarGutter.value) {
          ;(rootStyle as Record<string, string>)['--ui-table-scrollbar-gutter'] = `${scrollbarGutter.value}px`
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
                    let headerContent: VNodeChild = label
                    for (const hook of contentHooks) {
                      headerContent = hook(headerContent, { ...scope, header: true })
                    }
                    return h(
                      'th',
                      {
                        ...mergeHookResults(attrsHooks, [{ ...scope, header: true }]),
                        class: [
                          column.labelClassName,
                          column.headerAlign || column.align ? `is-${column.headerAlign || column.align}` : '',
                          sortable ? 'is-sortable' : '',
                          sortState.order ? `is-${sortState.order}` : '',
                          ...(fixedClasses[index] ?? []),
                          // 紧挨右冻结列的滚动列：右冻结列左移了滚动条槽宽，列宽手柄要跟着左移才不被盖住
                          index === offsets.firstRight - 1 && fixedSideOf(column) !== 'right'
                            ? 'is-before-fixed-right'
                            : ''
                        ],
                        style: fixedStyles[index],
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
                              class: tableCheckboxClass(selection.selectedCount > 0 && !selection.allSelected),
                              modelValue: selection.allSelected,
                              indeterminate: selection.selectedCount > 0 && !selection.allSelected,
                              disabled: !selection.selectableCount,
                              'onUpdate:modelValue': (checked: boolean) => toggleAll(checked, columns, rows)
                            }),
                            ...extras
                          ]
                        : [headerContent, ...extras]
                    )
                  })
                )
              ])

        const bodyRows: VNode[] = []
        const occupied = new Map<number, Set<number>>()
        // 虚拟滚动：按滚动位置只渲染可视窗口 + 上下 overscan 行，首尾占位行撑开总高；
        // 行高用实测值的前缀和定位，未测行回退默认行高；auto 布局行高不可预知不启用；
        // 合并块整体纳入窗口（扩到锚点行边界），rowspan 的所有行都在 DOM 里才能正确渲染
        const virtualActive =
          resolved.virtual &&
          resolved.tableLayout !== 'auto' &&
          rows.length > 0 &&
          Boolean(resolved.height || resolved.maxHeight)
        const plan = virtualActive ? spanPlan.value : null
        let windowStart = 0
        let windowEnd = rows.length
        let rowOffsets: Float64Array | null = null
        if (virtualActive) {
          rowOffsets = rowMetrics.value.offsets
          const viewHeight = wrapper.value?.clientHeight || 320
          const top = bodyScrollTop.value
          // 滚动进行中用更小 overscan：拖动时每帧窗口都从最新 scrollTop 重新推导，
          // overscan 的防空白价值很小，而重组件单元格下 16 行 overscan 占窗口八成渲染量，
          // 压到 3 行让拇指跟随不掉帧；停稳后测量提交会带完整 overscan 重新渲染
          const overscan = scrollActive ? 3 : VIRTUAL_OVERSCAN
          windowStart = Math.max(0, findRowAtOffset(rowOffsets, top) - overscan)
          windowEnd = Math.min(rows.length, findRowAtOffset(rowOffsets, top + viewHeight) + 1 + overscan)
          // 贴底钳制：总滚动高是实测+均值估算，直接映射可能到不了最后一行
          // （尾部未测行的估算高度变成永远够不着的空白占位），滚动贴底时
          // 把窗口尾部钳到真实末行、底部占位清零，保证最后几行可见可测
          if (stickToBottom.value || top + viewHeight >= rowOffsets[rows.length] - 1) {
            windowEnd = rows.length
            const tailCount = Math.ceil(viewHeight / fallbackRowHeight.value) + overscan
            windowStart = Math.max(0, rows.length - tailCount)
          }
          if (plan) {
            // 合并块 [row, row+rowspan) 与渲染窗口 [start, end) 相交才扩窗（end 为开区间）；
            // overscan 先算好再扩，保证块内不会有"锚点出窗"的覆盖空洞
            for (const anchor of plan.anchors) {
              if (anchor.row + anchor.rowspan <= windowStart) {
                continue
              }
              if (anchor.row >= windowEnd) {
                break
              }
              windowStart = Math.min(windowStart, anchor.row)
              windowEnd = Math.max(windowEnd, anchor.row + anchor.rowspan)
            }
          }
        }
        const spacerRow = (height: number): VNode | null =>
          height > 0
            ? h('tr', { class: 'ui-table__spacer', 'aria-hidden': 'true' }, [
                h('td', { colspan: Math.max(1, columns.length), style: { height: `${height}px` } })
              ])
            : null
        const topSpacer = virtualActive && rowOffsets ? spacerRow(rowOffsets[windowStart]) : null
        if (topSpacer) {
          bodyRows.push(topSpacer)
        }
        // 滚动帧复用未变化行的 VNode：父级每帧重渲染时，只有进入窗口的新行需要建树与 patch
        const scrolling = scrollActive || scrollFrame !== 0
        const nextRowCache = new Map<string, VNode>()
        for (let rowIndex = windowStart; rowIndex < windowEnd; rowIndex += 1) {
          const row = rows[rowIndex]
          const key = rowKeyOf(row)
          const isExpanded = expandedKeys.value.has(key)
          const cacheKey = String(key)
          const cached = scrolling && !isExpanded ? rowVNodeCache.get(cacheKey) : undefined
          if (cached) {
            bodyRows.push(cached)
            nextRowCache.set(cacheKey, cached)
            continue
          }
          const rowClass =
            typeof resolved.rowClassName === 'function'
              ? resolved.rowClassName({ row, rowIndex })
              : resolved.rowClassName
          const rowStyle =
            typeof resolved.rowStyle === 'function' ? resolved.rowStyle({ row, rowIndex }) : resolved.rowStyle
          const meta = mergeHookResults(rowMetaHooks, [row, rowIndex, columns])
          const cells: VNode[] = []
          for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
            if (plan ? plan.covered.get(rowIndex)?.has(columnIndex) : occupied.get(rowIndex)?.has(columnIndex)) {
              continue
            }
            const column = columns[columnIndex]
            const fake = plan?.fakeCells.get(rowIndex)?.get(columnIndex)
            if (fake) {
              const isContent = rowIndex === fake.contentRow
              const cellRow = isContent ? rows[fake.startRow] : row
              const cellMeta = isContent ? mergeHookResults(rowMetaHooks, [cellRow, fake.startRow, columns]) : undefined
              cells.push(
                h(
                  'td',
                  {
                    ...(isContent
                      ? mergeHookResults(attrsHooks, [
                          {
                            column,
                            row: cellRow,
                            rowIndex: fake.startRow,
                            columnIndex,
                            meta: cellMeta ?? {},
                            merged: true
                          }
                        ])
                      : {}),
                    class: [
                      column.className,
                      column.align ? `is-${column.align}` : '',
                      ...(fixedClasses[columnIndex] ?? []),
                      'is-span-continuation',
                      rowIndex === fake.startRow ? 'is-span-start' : '',
                      rowIndex === fake.endRow ? 'is-span-end' : '',
                      isContent ? 'is-span-content' : ''
                    ],
                    style: fixedStyles[columnIndex],
                    colspan: fake.colspan > 1 ? fake.colspan : undefined,
                    'aria-hidden': isContent ? undefined : 'true'
                  },
                  isContent
                    ? [
                        renderCell({
                          column,
                          row: cellRow,
                          rowIndex: fake.startRow,
                          columnIndex,
                          meta: cellMeta ?? {},
                          prependHooks,
                          contentHooks,
                          merged: true
                        })
                      ]
                    : []
                )
              )
              continue
            }
            let rowspan = 1
            let colspan = 1
            const planned = plan?.spans.get(rowIndex)?.get(columnIndex)
            if (planned) {
              rowspan = planned.rowspan
              colspan = planned.colspan
            } else if (!plan) {
              let span: { rowspan?: number; colspan?: number } | null = null
              for (const hook of spanHooks) {
                const result = hook({ row, column, rowIndex, columnIndex, columns })
                if (Array.isArray(result)) {
                  span = { rowspan: result[0], colspan: result[1] }
                } else if (result) {
                  span = result
                }
              }
              rowspan = Math.max(1, Math.min(Number(span?.rowspan) || 1, rows.length - rowIndex))
              colspan = Math.max(1, Math.min(Number(span?.colspan) || 1, columns.length - columnIndex))
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
            }
            cells.push(
              h(
                'td',
                {
                  ...mergeHookResults(attrsHooks, [{ column, row, rowIndex, columnIndex, meta, merged: false }]),
                  class: [
                    column.className,
                    column.align ? `is-${column.align}` : '',
                    ...(fixedClasses[columnIndex] ?? [])
                  ],
                  style: fixedStyles[columnIndex],
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
                    prependHooks,
                    contentHooks
                  })
                ]
              )
            )
          }
          const rowNode = h(
            'tr',
            {
              key: String(key),
              class: [
                rowClass,
                resolved.stripe && rowIndex % 2 === 1 ? 'is-striped' : '',
                resolved.highlightCurrentRow && currentKey.value === key ? 'current-row' : ''
              ],
              style: rowStyle,
              'data-row-index': virtualActive ? rowIndex : undefined,
              onClick: () => handleRowClick(row)
            },
            cells
          )
          bodyRows.push(rowNode)
          if (scrolling && !isExpanded) {
            nextRowCache.set(cacheKey, rowNode)
          }
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
        }
        if (scrolling) {
          rowVNodeCache = nextRowCache
        } else {
          rowVNodeCache.clear()
        }
        const bottomSpacer =
          virtualActive && rowOffsets ? spacerRow(rowOffsets[rows.length] - rowOffsets[windowEnd]) : null
        if (bottomSpacer) {
          bodyRows.push(bottomSpacer)
        }

        if (!rows.length) {
          bodyRows.push(
            h('tr', { class: 'ui-table__empty-row' }, [
              h('td', { colspan: Math.max(1, columns.length) }, [
                slots.empty ? slots.empty() : resolved.emptyText || locale.value.emptyText
              ])
            ])
          )
        }

        const body = h('tbody', { class: 'ui-table__body' }, bodyRows)

        const summaryNodes: VNodeChild[] = []
        for (const cells of summaryCellsOf(columns, rows)) {
          summaryNodes.push(
            h(
              'tr',
              { class: 'ui-table__summary-row' },
              groupSummaryCells(cells, columns).map((group) => {
                const column = columns[group.index]
                const classes = [column?.align ? `is-${column.align}` : '', ...(fixedClasses[group.index] ?? [])]
                if (group.span > 1 && group.index + group.span - 1 === offsets.lastLeft) {
                  classes.push('is-fixed-left-edge')
                }
                return h(
                  'td',
                  {
                    class: classes,
                    style: fixedStyles[group.index],
                    colspan: group.span > 1 ? group.span : undefined
                  },
                  group.cell
                )
              })
            )
          )
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
          { ref: wrapper, class: 'ui-table__wrapper', tabindex: '0' },
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
