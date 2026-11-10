import {
  computed,
  defineComponent,
  h,
  ref,
  shallowRef,
  watch,
  type Component,
  type PropType,
  type VNodeChild
} from 'vue'
import { HEAVY_GROUP_SIZE, TABLE_BIG_ROWS, makeHeavyRows, type TableEditRow } from './table-data'

type KitResolver = (name: string) => Component
type CellScope = Record<string, any>

interface TableColumnSpec {
  type?: string
  prop?: string
  label?: string
  width?: number
  minWidth?: number
  fixed?: 'left' | 'right'
  align?: string
  headerAlign?: string
  className?: string
  labelClassName?: string
  sortable?: boolean
  sortOrders?: Array<'ascending' | 'descending'>
  sortMethod?: 'name-length'
  showOverflowTooltip?: boolean | { lineClamp?: number }
  selectable?: 'active-only'
  showCheckbox?: 'hide-planning'
  indexMethod?: 'sequence'
  formatter?: 'amount'
  cell?:
    | 'tag'
    | 'progress'
    | 'amount'
    | 'actions'
    | 'expand'
    | 'desc'
    | 'edit-input'
    | 'edit-select'
    | 'edit-number'
    | 'edit-date'
    | 'edit-slider'
    | 'edit-actions'
  headerExtra?: 'core'
}

interface TableEditState {
  update: (row: TableEditRow, field: string, value: unknown) => void
  save: (row: TableEditRow) => void
  reset: (row: TableEditRow) => void
}

interface DemoColumn {
  key: string
  props: Record<string, any>
  cell?: (scope: CellScope) => VNodeChild
  header?: (scope: CellScope) => VNodeChild
}

interface TableDemoRowLike {
  id: number | string
  status?: string
}

const STATUS_TAG_TYPE: Record<string, string> = {
  稳定: 'success',
  内测: 'warning',
  规划: 'info'
}

const EDIT_CITY_OPTIONS = ['上海', '杭州', '成都', '深圳', '北京', '武汉', '南京', '西安', '苏州', '广州'].map(
  (city) => ({ label: city, value: city })
)
const EDIT_STATUS_OPTIONS = ['稳定', '内测', '规划'].map((status) => ({ label: status, value: status }))
const EDIT_SELECT_OPTIONS: Record<string, Array<{ label: string; value: string }>> = {
  city: EDIT_CITY_OPTIONS,
  status: EDIT_STATUS_OPTIONS
}

const COLUMN: Record<string, TableColumnSpec> = {
  index: { type: 'index', label: '#', width: 56, align: 'center' },
  sequence: { type: 'index', label: '序号', width: 80, align: 'center', indexMethod: 'sequence' },
  selection: { type: 'selection', width: 48, align: 'center' },
  name: { prop: 'name', label: '组件', width: 160, showOverflowTooltip: true },
  treeName: { prop: 'name', label: '团队 / 项目', minWidth: 220, showOverflowTooltip: true },
  city: { prop: 'city', label: '城市', width: 90 },
  owner: { prop: 'owner', label: '负责人', width: 90 },
  status: { prop: 'status', label: '状态', width: 100, cell: 'tag' },
  progress: { prop: 'progress', label: '进度', width: 130, cell: 'progress' },
  orders: { prop: 'orders', label: '需求数', width: 100, align: 'right' },
  amount: { prop: 'amount', label: '预算', width: 120, align: 'right', cell: 'amount' },
  formattedAmount: { prop: 'amount', label: '预算（formatter）', width: 180, align: 'right', formatter: 'amount' },
  date: { prop: 'date', label: '更新日期', width: 120 },
  remark: { prop: 'remark', label: '说明', width: 320, showOverflowTooltip: true },
  desc: { prop: 'desc', label: '详细说明', minWidth: 260, cell: 'desc' },
  actions: { label: '操作', width: 168, align: 'center', cell: 'actions' },
  expand: { type: 'expand', width: 52, align: 'center', cell: 'expand' },
  editName: { prop: 'name', label: '模块', width: 180, cell: 'edit-input' },
  editCity: { prop: 'city', label: '城市', width: 140, cell: 'edit-select' },
  editOwner: { prop: 'owner', label: '负责人', width: 140, cell: 'edit-input' },
  editStatus: { prop: 'status', label: '状态', width: 132, cell: 'edit-select' },
  editProgress: { prop: 'progress', label: '进度', width: 150, cell: 'edit-slider' },
  editOrders: { prop: 'orders', label: '需求数', width: 128, cell: 'edit-number' },
  editAmount: { prop: 'amount', label: '预算', width: 156, cell: 'edit-number' },
  editDate: { prop: 'date', label: '更新日期', width: 168, cell: 'edit-date' },
  editRemark: { prop: 'remark', label: '说明', width: 220, cell: 'edit-input' },
  editActions: { label: '操作', width: 140, align: 'center', cell: 'edit-actions' },
  classedName: {
    prop: 'name',
    label: '组件（列类名）',
    width: 200,
    showOverflowTooltip: true,
    className: 'pg-table-cell--accent',
    labelClassName: 'pg-table-head--accent'
  },
  centeredStatus: { prop: 'status', label: '状态（居中）', width: 120, align: 'center', headerAlign: 'center' },
  sortByNameLength: {
    prop: 'name',
    label: '模块（自定义比较）',
    width: 220,
    sortable: true,
    sortMethod: 'name-length'
  },
  sortByNameOnly: {
    prop: 'name',
    label: '模块（升降序）',
    width: 220,
    sortable: true,
    sortOrders: ['ascending', 'descending']
  }
}

const SEQUENCE_INDEX = (index: number) => (index + 1) * 10

function formatAmount(value: unknown): string {
  const amount = Number(value)
  return Number.isFinite(amount) ? `¥${amount.toLocaleString('zh-CN')}` : ''
}

function amountFormatter(_row: unknown, _column: unknown, value: unknown): string {
  return formatAmount(value)
}

function nameLengthCompare(
  left: TableDemoRowLike & { name?: string; id?: number },
  right: TableDemoRowLike & { name?: string; id?: number }
): number {
  return (
    String(left.name ?? '').length - String(right.name ?? '').length || Number(left.id ?? 0) - Number(right.id ?? 0)
  )
}

function selectActiveOnly(row: TableDemoRowLike): boolean {
  return row.status !== '规划'
}

function hidePlanningCheckbox(row: TableDemoRowLike): boolean {
  return row.status !== '规划'
}

function rowClassOf({ row }: { row: TableDemoRowLike }): string {
  return row.status === '规划' ? 'pg-table-row--muted' : ''
}

function rowStyleOf({ row }: { row: TableDemoRowLike & { orders?: number } }): Record<string, string> | undefined {
  return Number(row.orders) >= 100 ? { fontWeight: '600' } : undefined
}

function sortable(spec: TableColumnSpec): TableColumnSpec {
  return { ...spec, sortable: true }
}

function fixedLeft(spec: TableColumnSpec): TableColumnSpec {
  return { ...spec, fixed: 'left' }
}

function fixedRight(spec: TableColumnSpec): TableColumnSpec {
  return { ...spec, fixed: 'right' }
}

const BASE_BLUEPRINT: TableColumnSpec[] = [
  COLUMN.index,
  COLUMN.name,
  COLUMN.city,
  COLUMN.owner,
  COLUMN.status,
  COLUMN.amount,
  COLUMN.date
]

const SORT_BLUEPRINT: TableColumnSpec[] = [
  COLUMN.index,
  sortable(COLUMN.name),
  sortable(COLUMN.city),
  sortable(COLUMN.status),
  sortable(COLUMN.amount),
  sortable(COLUMN.date)
]

const WIDE_TAIL: TableColumnSpec[] = [
  COLUMN.city,
  COLUMN.owner,
  COLUMN.status,
  COLUMN.progress,
  COLUMN.amount,
  COLUMN.date,
  COLUMN.remark
]

const EDIT_TAIL: TableColumnSpec[] = [
  COLUMN.editCity,
  COLUMN.editOwner,
  COLUMN.editStatus,
  COLUMN.editProgress,
  COLUMN.editOrders,
  COLUMN.editAmount,
  COLUMN.editDate,
  COLUMN.editRemark
]

const COMPREHENSIVE_TAIL: TableColumnSpec[] = [
  sortable(COLUMN.city),
  COLUMN.owner,
  COLUMN.status,
  COLUMN.progress,
  sortable(COLUMN.amount),
  sortable(COLUMN.date),
  COLUMN.remark
]

const EDITABLE_BLUEPRINT: TableColumnSpec[] = [
  fixedLeft(COLUMN.selection),
  fixedLeft(COLUMN.index),
  fixedLeft(COLUMN.editName),
  ...EDIT_TAIL,
  fixedRight(COLUMN.editActions)
]

const HEAVY_BLUEPRINT: TableColumnSpec[] = [
  COLUMN.index,
  COLUMN.name,
  COLUMN.city,
  COLUMN.owner,
  COLUMN.status,
  COLUMN.orders,
  COLUMN.amount,
  COLUMN.date
]

const HEAVY_VARIABLE_BLUEPRINT: TableColumnSpec[] = [
  COLUMN.index,
  COLUMN.name,
  COLUMN.city,
  COLUMN.owner,
  COLUMN.status,
  COLUMN.desc
]

const BLUEPRINTS: Record<string, TableColumnSpec[]> = {
  'fixed-left': [fixedLeft(COLUMN.selection), fixedLeft(COLUMN.name), ...WIDE_TAIL, COLUMN.actions],
  'fixed-right': [COLUMN.index, COLUMN.name, ...WIDE_TAIL, fixedRight(COLUMN.actions)],
  'fixed-both': [fixedLeft(COLUMN.selection), fixedLeft(COLUMN.name), ...WIDE_TAIL, fixedRight(COLUMN.actions)],
  comprehensive: [
    fixedLeft(COLUMN.selection),
    fixedLeft(COLUMN.index),
    fixedLeft(sortable(COLUMN.name)),
    ...COMPREHENSIVE_TAIL,
    fixedRight(COLUMN.actions)
  ],
  editable: EDITABLE_BLUEPRINT,
  'editable-heavy': EDITABLE_BLUEPRINT,
  'heavy-data': HEAVY_BLUEPRINT,
  'heavy-data-20k': HEAVY_BLUEPRINT,
  'heavy-data-100k': HEAVY_BLUEPRINT,
  'heavy-variable': HEAVY_VARIABLE_BLUEPRINT,
  'heavy-tree': [COLUMN.treeName, COLUMN.city, COLUMN.owner, COLUMN.status, COLUMN.desc],
  sort: SORT_BLUEPRINT,
  'multi-sort': SORT_BLUEPRINT,
  'sort-method': [COLUMN.index, COLUMN.sortByNameLength, COLUMN.city, COLUMN.status, COLUMN.amount],
  'sort-orders': [COLUMN.index, COLUMN.sortByNameOnly, COLUMN.city, COLUMN.status, COLUMN.date],
  selection: [COLUMN.selection, COLUMN.index, COLUMN.name, COLUMN.city, COLUMN.owner, COLUMN.status, COLUMN.amount],
  selectable: [
    { ...COLUMN.selection, selectable: 'active-only' },
    COLUMN.index,
    COLUMN.name,
    COLUMN.city,
    COLUMN.owner,
    COLUMN.status,
    COLUMN.amount
  ],
  expand: [COLUMN.expand, COLUMN.index, COLUMN.name, COLUMN.city, COLUMN.owner, COLUMN.status, COLUMN.amount],
  span: [
    { prop: 'group', label: '批次（合并 5 行）', width: 180 },
    { prop: 'name', label: '模块', width: 220, showOverflowTooltip: true },
    { prop: 'city', label: '城市', width: 120 },
    { prop: 'owner', label: '负责人', width: 120 },
    { prop: 'orders', label: '需求数', width: 120, align: 'right' },
    { prop: 'amount', label: '预算', width: 140, align: 'right', cell: 'amount' }
  ],
  tree: [COLUMN.treeName, COLUMN.city, COLUMN.owner, COLUMN.status, COLUMN.amount, COLUMN.date],
  'tree-expanded': [COLUMN.treeName, COLUMN.city, COLUMN.owner, COLUMN.status, COLUMN.amount, COLUMN.date],
  'tree-props': [COLUMN.treeName, COLUMN.city, COLUMN.owner, COLUMN.status, COLUMN.amount],
  'tree-indent': [COLUMN.treeName, COLUMN.city, COLUMN.owner, COLUMN.status, COLUMN.amount],
  'tree-select': [COLUMN.treeName, COLUMN.selection, COLUMN.city, COLUMN.owner, COLUMN.status, COLUMN.amount],
  'tree-select-strict': [COLUMN.treeName, COLUMN.selection, COLUMN.city, COLUMN.owner, COLUMN.status, COLUMN.amount],
  'checkbox-hidden': [
    { ...COLUMN.selection, showCheckbox: 'hide-planning' },
    COLUMN.index,
    COLUMN.name,
    COLUMN.city,
    COLUMN.owner,
    COLUMN.status,
    COLUMN.amount
  ],
  fit: [
    COLUMN.index,
    { prop: 'name', label: '组件', minWidth: 220, showOverflowTooltip: true },
    COLUMN.city,
    { prop: 'owner', label: '负责人', minWidth: 80 }
  ],
  'fit-false': [
    COLUMN.index,
    { prop: 'name', label: '组件', width: 160 },
    { prop: 'city', label: '城市', width: 100 },
    { prop: 'owner', label: '负责人', width: 100 }
  ],
  summary: [COLUMN.index, COLUMN.name, COLUMN.city, COLUMN.owner, COLUMN.status, COLUMN.orders, COLUMN.amount],
  'summary-method': [COLUMN.index, COLUMN.name, COLUMN.city, COLUMN.orders, COLUMN.amount],
  overflow: [COLUMN.index, COLUMN.name, COLUMN.city, COLUMN.owner, COLUMN.status, COLUMN.remark],
  // 名称列显式单行，说明列不声明、继承表格级两行
  'line-clamp': [
    COLUMN.index,
    COLUMN.name,
    COLUMN.city,
    COLUMN.owner,
    COLUMN.status,
    { prop: 'remark', label: '说明', width: 320 }
  ],
  'row-style': [COLUMN.index, COLUMN.name, COLUMN.city, COLUMN.owner, COLUMN.status, COLUMN.orders, COLUMN.amount],
  methods: [COLUMN.selection, COLUMN.index, COLUMN.name, COLUMN.city, COLUMN.owner, COLUMN.status, COLUMN.amount],
  events: [
    COLUMN.selection,
    COLUMN.index,
    sortable(COLUMN.name),
    sortable(COLUMN.city),
    sortable(COLUMN.amount),
    COLUMN.owner
  ],
  'auto-layout': [COLUMN.index, COLUMN.name, COLUMN.city, COLUMN.status],
  'empty-text': BASE_BLUEPRINT,
  empty: BASE_BLUEPRINT,
  'empty-slot': BASE_BLUEPRINT,
  'index-method': [COLUMN.sequence, COLUMN.name, COLUMN.city, COLUMN.status, COLUMN.amount],
  formatter: [COLUMN.index, COLUMN.name, COLUMN.city, COLUMN.status, COLUMN.formattedAmount],
  'column-class': [COLUMN.index, COLUMN.classedName, COLUMN.city, COLUMN.status, COLUMN.amount],
  align: [COLUMN.index, COLUMN.name, COLUMN.centeredStatus, COLUMN.orders, COLUMN.amount],
  custom: [
    COLUMN.index,
    { ...COLUMN.name, headerExtra: 'core' },
    COLUMN.city,
    COLUMN.owner,
    COLUMN.status,
    COLUMN.progress,
    COLUMN.actions
  ]
}

function tableSceneBlueprint(sceneId: string): TableColumnSpec[] {
  return BLUEPRINTS[sceneId] ?? BASE_BLUEPRINT
}

function specProps(spec: TableColumnSpec): Record<string, any> {
  const props: Record<string, any> = {}
  if (spec.type) {
    props.type = spec.type
  }
  if (spec.prop) {
    props.prop = spec.prop
  }
  if (spec.label !== undefined) {
    props.label = spec.label
  }
  if (spec.width !== undefined) {
    props.width = spec.width
  }
  if (spec.minWidth !== undefined) {
    props.minWidth = spec.minWidth
  }
  if (spec.fixed) {
    props.fixed = spec.fixed
  }
  if (spec.align) {
    props.align = spec.align
  }
  if (spec.headerAlign) {
    props.headerAlign = spec.headerAlign
  }
  if (spec.className) {
    props.className = spec.className
  }
  if (spec.labelClassName) {
    props.labelClassName = spec.labelClassName
  }
  if (spec.sortable) {
    props.sortable = true
  }
  if (spec.sortOrders) {
    props.sortOrders = spec.sortOrders
  }
  if (spec.sortMethod === 'name-length') {
    props.sortMethod = nameLengthCompare
  }
  if (spec.indexMethod === 'sequence') {
    props.index = SEQUENCE_INDEX
  }
  if (spec.formatter === 'amount') {
    props.formatter = amountFormatter
  }
  if (spec.showOverflowTooltip) {
    props.showOverflowTooltip = spec.showOverflowTooltip
  }
  if (spec.selectable === 'active-only') {
    props.selectable = selectActiveOnly
  }
  if (spec.showCheckbox === 'hide-planning') {
    props.showCheckbox = hidePlanningCheckbox
  }
  return props
}

function editCellOf(
  kind: NonNullable<TableColumnSpec['cell']>,
  kit: KitResolver,
  editState: TableEditState
): (scope: CellScope) => VNodeChild {
  const fieldOf = (scope: CellScope) => String(scope.column.prop ?? '')
  const update = (scope: CellScope, value: unknown) => editState.update(scope.row, fieldOf(scope), value)
  if (kind === 'edit-input') {
    return (scope) =>
      h('div', { class: 'pg-table-edit' }, [
        h(kit('Input'), {
          modelValue: String(scope.row[fieldOf(scope)] ?? ''),
          placeholder: '请输入',
          'onUpdate:modelValue': (value: unknown) => update(scope, value)
        })
      ])
  }
  if (kind === 'edit-select') {
    return (scope) =>
      h('div', { class: 'pg-table-edit' }, [
        h(kit('Select'), {
          modelValue: scope.row[fieldOf(scope)],
          options: EDIT_SELECT_OPTIONS[fieldOf(scope)] ?? [],
          placeholder: '请选择',
          'onUpdate:modelValue': (value: unknown) => update(scope, value)
        })
      ])
  }
  if (kind === 'edit-number') {
    return (scope) =>
      h('div', { class: 'pg-table-edit' }, [
        h(kit('InputNumber'), {
          modelValue: Number(scope.row[fieldOf(scope)]) || 0,
          min: 0,
          max: fieldOf(scope) === 'amount' ? 1000000 : 9999,
          step: fieldOf(scope) === 'amount' ? 100 : 1,
          'onUpdate:modelValue': (value: unknown) => update(scope, value)
        })
      ])
  }
  if (kind === 'edit-date') {
    return (scope) =>
      h('div', { class: 'pg-table-edit' }, [
        h(kit('DatePicker'), {
          modelValue: String(scope.row[fieldOf(scope)] ?? ''),
          placeholder: '选择日期',
          'onUpdate:modelValue': (value: unknown) => update(scope, value)
        })
      ])
  }
  if (kind === 'edit-slider') {
    return (scope) =>
      h('div', { class: 'pg-table-edit' }, [
        h(kit('Slider'), {
          modelValue: Number(scope.row[fieldOf(scope)]) || 0,
          showTooltip: false,
          'onUpdate:modelValue': (value: unknown) => update(scope, value)
        })
      ])
  }
  return (scope) =>
    h('span', { class: 'pg-table-edit-actions' }, [
      h(
        kit('Button'),
        {
          link: true,
          type: 'primary',
          size: 'small',
          disabled: !scope.row.dirty,
          onClick: () => editState.save(scope.row)
        },
        () => '保存'
      ),
      h(
        kit('Button'),
        {
          link: true,
          size: 'small',
          disabled: !scope.row.dirty,
          onClick: () => editState.reset(scope.row)
        },
        () => '重置'
      )
    ])
}

function cellOf(
  kind: NonNullable<TableColumnSpec['cell']>,
  kit: KitResolver,
  editState?: TableEditState
): (scope: CellScope) => VNodeChild {
  if (kind.startsWith('edit-') && editState) {
    return editCellOf(kind, kit, editState)
  }
  if (kind === 'tag') {
    return (scope) =>
      h(kit('Tag'), { type: STATUS_TAG_TYPE[String(scope.row.status)] ?? 'info', size: 'small', effect: 'light' }, () =>
        String(scope.row.status ?? '')
      )
  }
  if (kind === 'progress') {
    return (scope) =>
      h(kit('Progress'), {
        percentage: Number(scope.row.progress) || 0,
        width: 96,
        strokeWidth: 6
      })
  }
  if (kind === 'amount') {
    return (scope) => formatAmount(scope.row.amount)
  }
  if (kind === 'actions') {
    return () =>
      h('span', { class: 'pg-table-actions' }, [
        h(kit('Button'), { link: true, type: 'primary', size: 'small' }, () => '查看'),
        h(kit('Button'), { link: true, size: 'small' }, () => '编辑')
      ])
  }
  if (kind === 'desc') {
    return (scope) => h('div', { class: 'pg-table-desc' }, String(scope.row.desc ?? ''))
  }
  return (scope) =>
    h('div', { class: 'pg-table-expand' }, [
      h('div', { class: 'pg-table-expand__item' }, [
        h('span', { class: 'pg-table-expand__label' }, '负责人'),
        h('span', null, String(scope.row.owner ?? '-'))
      ]),
      h('div', { class: 'pg-table-expand__item' }, [
        h('span', { class: 'pg-table-expand__label' }, '需求数'),
        h('span', null, String(scope.row.orders ?? '-'))
      ]),
      h('div', { class: 'pg-table-expand__item' }, [
        h('span', { class: 'pg-table-expand__label' }, '进度'),
        h('span', null, `${String(scope.row.progress ?? 0)}%`)
      ]),
      h('div', { class: 'pg-table-expand__remark' }, [
        h('span', { class: 'pg-table-expand__label' }, '说明'),
        h('span', null, String(scope.row.remark ?? '-'))
      ])
    ])
}

function headerOf(
  kind: NonNullable<TableColumnSpec['headerExtra']>,
  kit: KitResolver
): (scope: CellScope) => VNodeChild {
  return (scope) =>
    h('span', { class: 'pg-table-header' }, [
      String(scope.column.label ?? (kind === 'core' ? '组件' : '')),
      h(kit('Tag'), { size: 'small', type: 'info', effect: 'plain' }, () => '核心')
    ])
}

function buildTableSceneColumns(kit: KitResolver, sceneId: string, editState?: TableEditState): DemoColumn[] {
  return tableSceneBlueprint(sceneId).map((spec, index) => {
    const column: DemoColumn = { key: `col-${index}`, props: specProps(spec) }
    if (spec.cell) {
      column.cell = cellOf(spec.cell, kit, editState)
    }
    if (spec.headerExtra) {
      column.header = headerOf(spec.headerExtra, kit)
    }
    return column
  })
}

// 大表合并：group 列（columnIndex 0）每 size 行合并为一个块
function makeGroupSpanMethod(total: number, size: number) {
  return function groupSpanMethod(scope: { rowIndex: number; columnIndex: number }) {
    if (scope.columnIndex !== 0) {
      return undefined
    }
    if (scope.rowIndex % size !== 0) {
      return [0, 0]
    }
    return [Math.min(size, total - scope.rowIndex), 1]
  }
}

// 大表合并：editName 列（columnIndex 2）每 size 行合并为一个块
function makeHeavySpanMethod(total: number, size: number) {
  return function heavySpanMethod(scope: { rowIndex: number; columnIndex: number }) {
    if (scope.columnIndex !== 2) {
      return undefined
    }
    if (scope.rowIndex % size !== 0) {
      return [0, 0]
    }
    return [Math.min(size, total - scope.rowIndex), 1]
  }
}

function makeCustomSummaryMethod() {
  return function customSummary({ columns, data }: { columns: Array<Record<string, any>>; data: any[] }) {
    return columns.map((column, index) => {
      if (index === 0) {
        return `统计（${data.length} 行）`
      }
      if (column.prop === 'orders') {
        return data.reduce((sum, row) => sum + (Number(row.orders) || 0), 0)
      }
      if (column.prop === 'amount') {
        const total = data.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
        return data.length ? Math.round(total / data.length) : 0
      }
      return ''
    })
  }
}

function renderColumn(columnComponent: Component, column: DemoColumn) {
  const slots: Record<string, (scope: CellScope) => VNodeChild> = {}
  if (column.cell) {
    slots.default = column.cell
  }
  if (column.header) {
    slots.header = column.header
  }
  return h(columnComponent, { key: column.key, ...column.props }, Object.keys(slots).length ? slots : undefined)
}

function renderEmptyState(kit: KitResolver): VNodeChild {
  return h('div', { class: 'pg-table-empty' }, [
    h(kit('Empty'), { description: '没有匹配的项目，试试调整筛选条件' }, () =>
      h(kit('Button'), { type: 'primary', size: 'small' }, () => '重置筛选')
    )
  ])
}

const EMPTY_SCENES = new Set(['empty', 'empty-text', 'empty-slot'])
const DEFAULT_EMPTY_QUERY = '不存在的关键字'
const SUBS_TREE_PROPS = { children: 'subs' }

function eventDetail(name: string, payload: any): string {
  if (name === 'selection-change') {
    return `${Array.isArray(payload) ? payload.length : 0} 行`
  }
  if (name === 'sort-change') {
    return `${payload?.prop ?? '-'} ${payload?.order ?? '取消'}`
  }
  if (name === 'resize-change') {
    return `${payload?.key ?? '-'} → ${Math.round(Number(payload?.width) || 0)}px`
  }
  if (name === 'tree-expand') {
    return `${payload?.row?.name ?? '-'} ${payload?.expanded ? '展开' : '收起'}`
  }
  return `#${payload?.id ?? '-'} ${payload?.name ?? ''}`.trim()
}

const TableSceneDemo = defineComponent({
  name: 'TableSceneDemo',
  props: {
    table: { type: Object as PropType<Component>, required: true },
    column: { type: Object as PropType<Component>, required: true },
    kit: { type: Function as PropType<KitResolver>, required: true },
    values: { type: Object as PropType<Record<string, unknown>>, required: true },
    sceneId: { type: String, required: true }
  },
  setup(props) {
    const tableApi = shallowRef<any>(null)
    const selectedCount = ref(0)
    const editableScene = props.sceneId === 'editable' || props.sceneId === 'editable-heavy'
    const emptyScene = EMPTY_SCENES.has(props.sceneId)
    const eventsScene = props.sceneId === 'events'
    const heavyCount = computed(() => (typeof props.values.heavyRows === 'number' ? props.values.heavyRows : 5000))
    const editRows = ref<TableEditRow[]>([])
    const editSnapshot = new Map<number, TableEditRow>()
    const emptyQuery = ref(DEFAULT_EMPTY_QUERY)
    const eventLog = ref<Array<{ name: string; detail: string }>>([])
    const sourceRows = computed(() => (Array.isArray(props.values.data) ? (props.values.data as any[]) : []))
    const filteredRows = computed(() => {
      if (!emptyScene) {
        return sourceRows.value
      }
      const query = emptyQuery.value.trim()
      return query ? sourceRows.value.filter((row) => String(row?.name ?? '').includes(query)) : sourceRows.value
    })

    function resetEditRows(rows: TableEditRow[]): void {
      editRows.value = rows
      editSnapshot.clear()
      for (const row of rows) {
        editSnapshot.set(row.id, { ...row })
      }
    }
    // 属性面板改 heavyRows 行数时重建大表编辑数据（含重置快照），不再只在挂载时生成一次
    watch(
      heavyCount,
      (count) => {
        if (!editableScene) {
          return
        }
        resetEditRows(makeHeavyRows(count).map((row) => ({ ...row, dirty: false })))
      },
      { immediate: true }
    )
    const editState: TableEditState = {
      update(row, field, value) {
        const record = row as unknown as Record<string, unknown>
        if (String(record[field] ?? '') === String(value ?? '')) {
          return
        }
        record[field] = value
        row.dirty = true
      },
      save(row) {
        row.dirty = false
      },
      reset(row) {
        const source = editSnapshot.get(row.id)
        if (!source) {
          return
        }
        Object.assign(row, source, { dirty: false })
      }
    }

    function pushEvent(name: string, payload: unknown) {
      const entry = { name, detail: eventDetail(name, payload) }
      eventLog.value = [entry, ...eventLog.value].slice(0, 6)
    }

    function handleSelectionChange(rows: any[]) {
      selectedCount.value = Array.isArray(rows) ? rows.length : 0
      if (eventsScene) {
        pushEvent('selection-change', rows)
      }
    }

    function selectAllRows() {
      tableApi.value?.toggleAllSelection()
    }

    function clearSelectedRows() {
      tableApi.value?.clearSelection()
    }

    function attachEventLog(attrs: Record<string, any>) {
      const wrap = (prop: string, name: string) => {
        const external = attrs[prop]
        attrs[prop] = (payload: any) => {
          pushEvent(name, payload)
          if (typeof external === 'function') {
            external(payload)
          }
        }
      }
      wrap('onRowClick', 'row-click')
      wrap('onCurrentChange', 'current-change')
      wrap('onSelectionChange', 'selection-change')
      wrap('onSortChange', 'sort-change')
      wrap('onResizeChange', 'resize-change')
      wrap('onTreeExpand', 'tree-expand')
    }

    return () => {
      const attrs: Record<string, any> = { ...props.values }
      if (props.sceneId === 'span') {
        attrs.spanMethod = makeGroupSpanMethod(sourceRows.value.length, 5)
      }
      if (props.sceneId === 'row-style') {
        attrs.rowClassName = rowClassOf
        attrs.rowStyle = rowStyleOf
      }
      if (props.sceneId === 'summary-method') {
        attrs.summaryMethod = makeCustomSummaryMethod()
      }
      if (props.sceneId === 'tree-props') {
        attrs.treeProps = SUBS_TREE_PROPS
      }
      if (emptyScene) {
        attrs.data = filteredRows.value
      }
      if (editableScene) {
        attrs.data = editRows.value
        delete attrs.heavyRows
      }
      if (props.sceneId === 'editable-heavy') {
        attrs.spanMethod = makeHeavySpanMethod(editRows.value.length, HEAVY_GROUP_SIZE)
      }
      if (eventsScene) {
        attrs.highlightCurrentRow = true
        attachEventLog(attrs)
      }
      const columns = buildTableSceneColumns(props.kit, props.sceneId, editableScene ? editState : undefined)
      const slots: Record<string, () => VNodeChild> = {
        default: () => columns.map((column) => renderColumn(props.column, column))
      }
      if (props.sceneId === 'empty-slot') {
        slots.empty = () => renderEmptyState(props.kit)
      }
      if (props.sceneId === 'methods') {
        return h('div', { class: 'pg-table-methods' }, [
          h('div', { class: 'pg-table-methods__bar' }, [
            h(props.kit('Button'), { size: 'small', type: 'primary', onClick: selectAllRows }, () => '全选 / 取消全选'),
            h(props.kit('Button'), { size: 'small', onClick: clearSelectedRows }, () => '清空选择'),
            h('span', { class: 'pg-table-methods__count' }, `已选 ${selectedCount.value} 行`)
          ]),
          h(props.table, { ...attrs, ref: tableApi, onSelectionChange: handleSelectionChange }, slots)
        ])
      }
      if (emptyScene) {
        return h('div', { class: 'pg-table-scene' }, [
          h('div', { class: 'pg-table-scene__bar' }, [
            h(props.kit('Input'), {
              modelValue: emptyQuery.value,
              placeholder: '按模块名筛选 5000 行数据，清空显示全部',
              clearable: true,
              style: 'width: 320px',
              'onUpdate:modelValue': (value: unknown) => {
                emptyQuery.value = String(value ?? '')
              }
            }),
            h(
              'span',
              { class: 'pg-table-methods__count' },
              `命中 ${filteredRows.value.length} / ${sourceRows.value.length} 行`
            )
          ]),
          h(props.table, { ...attrs, onSelectionChange: handleSelectionChange }, slots)
        ])
      }
      if (eventsScene) {
        return h('div', { class: 'pg-table-scene' }, [
          h('div', { class: 'pg-table-scene__bar' }, [
            h('span', { class: 'pg-table-methods__count' }, '事件日志（点击行 / 表头 / 拖列宽 / 勾选）'),
            h(
              'ul',
              { class: 'pg-table-events' },
              eventLog.value.length
                ? eventLog.value.map((entry, index) =>
                    h('li', { key: `${entry.name}-${index}`, class: 'pg-table-events__item' }, [
                      h('code', null, entry.name),
                      h('span', null, entry.detail)
                    ])
                  )
                : [h('li', { class: 'pg-table-events__empty' }, '暂无事件，试试点击一行或排序表头')]
            )
          ]),
          h(props.table, { ...attrs, ref: tableApi, onSelectionChange: handleSelectionChange }, slots)
        ])
      }
      return h(props.table, attrs, slots)
    }
  }
})

const TableColumnDemo = defineComponent({
  name: 'TableColumnDemo',
  props: {
    table: { type: Object as PropType<Component>, required: true },
    column: { type: Object as PropType<Component>, required: true },
    values: { type: Object as PropType<Record<string, unknown>>, required: true }
  },
  setup(props) {
    return () => {
      const reference = h(props.column, { key: 'reference', prop: 'name', label: '组件', width: 160 })
      const target = h(props.column, { key: 'target', ...props.values })
      const tail = h(props.column, { key: 'tail', prop: 'city', label: '城市', width: 100 })
      return h(
        props.table,
        { data: TABLE_BIG_ROWS, rowKey: 'id', height: 280, virtual: true },
        {
          default: () => [reference, target, tail]
        }
      )
    }
  }
})

export { TableColumnDemo, TableSceneDemo, buildTableSceneColumns, tableSceneBlueprint }
export type { TableColumnSpec }
