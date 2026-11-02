import type { CSSProperties, VNodeChild } from 'vue'
import { defineComponent, h, ref } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { collectFeatureClasses, mergeFeatureProps, resolveFeatureStates } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { wrapperConfig } from '../../shared/behavior'
import { tableV2SortableFeature } from './features/table-v2-sortable/index'
import './core.css'

const autoResizerBaseProps = {
}

export function createAutoResizer(features: UiFeature[] = []) {
  return createUiComponent(
    wrapperConfig({
      name: 'UiAutoResizer',
      baseClass: 'ui-table-v2',
      props: autoResizerBaseProps,
      defaultTag: 'div'
    }),
    features
  )
}

const tableV2BaseProps = {
  columns: { type: Array },
  data: { type: Array },
  width: { type: Number },
  height: { type: Number },
  cache: { type: Number, default: 2 },
  rowKey: { type: [String, Number], default: 'id' },
  headerClass: { type: [String, Function] },
  headerHeight: { type: [Number, Array], default: 50 },
  rowClass: { type: [String, Function] },
  rowProps: { type: [Object, Function] },
  rowHeight: { type: Number, default: 50 },
  dataGetter: { type: Function },
  class: { type: String },
  fixed: { type: Boolean },
  style: { type: Object },
  maxHeight: { type: Number },
  onColumnSort: { type: Function },
  onScroll: { type: Function },
}

interface TableV2Column {
  key?: string
  dataKey?: string
  title?: string
  label?: string
  width?: number | string
  align?: string
  flexGrow?: number
  sortable?: boolean
  class?: string
  cellRenderer?: (options: { rowData: any; rowIndex: number; column: TableV2Column }) => VNodeChild
  formatter?: (value: any, row: any, index: number) => VNodeChild
  [key: string]: any
}

function columnId(column: TableV2Column, index: number): string {
  return String(column.key ?? column.dataKey ?? index)
}

function columnTitle(column: TableV2Column): string {
  return String(column.title ?? column.label ?? column.dataKey ?? '')
}

function toSize(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  return typeof value === 'number' ? `${value}px` : String(value)
}

function cellContent(column: TableV2Column, row: any, index: number): VNodeChild {
  if (typeof column.cellRenderer === 'function') {
    return column.cellRenderer({ rowData: row, rowIndex: index, column })
  }
  const value = column.dataKey ? row?.[column.dataKey] : undefined
  if (typeof column.formatter === 'function') {
    return column.formatter(value, row, index)
  }
  return value === undefined || value === null ? '' : String(value)
}

export function createTableV2(features: UiFeature[] = []) {
  return defineComponent({
    name: 'UiTableV2',
    inheritAttrs: false,
    props: { ...tableV2BaseProps, ...mergeFeatureProps(features) },
    setup(props, { attrs }) {
      const resolved = props as Record<string, any>
      const states = resolveFeatureStates(features, resolved, { attrs, slots: {}, emit: () => {} })
      const scrollTop = ref(0)
      const sortKey = ref('')
      const sortOrder = ref<'ascending' | 'descending' | null>(null)

      function handleScroll(event: Event) {
        const target = event.target as HTMLElement
        scrollTop.value = target.scrollTop
        if (typeof resolved.onScroll === 'function') {
          resolved.onScroll(event)
        }
      }

      function toggleSort(column: TableV2Column) {
        if (!column.sortable) {
          return
        }
        const id = columnId(column, 0)
        if (sortKey.value !== id) {
          sortKey.value = id
          sortOrder.value = 'ascending'
        } else if (sortOrder.value === 'ascending') {
          sortOrder.value = 'descending'
        } else if (sortOrder.value === 'descending') {
          sortKey.value = ''
          sortOrder.value = null
        } else {
          sortKey.value = id
          sortOrder.value = 'ascending'
        }
        if (typeof resolved.onColumnSort === 'function') {
          resolved.onColumnSort(sortKey.value, sortOrder.value)
        }
      }

      return function render() {
        const columns = (Array.isArray(resolved.columns) ? resolved.columns : []) as TableV2Column[]
        const source = typeof resolved.dataGetter === 'function' ? resolved.dataGetter(resolved) : resolved.data
        const rows: any[] = Array.isArray(source) ? [...source] : []
        if (sortKey.value && sortOrder.value) {
          const column = columns.find((item) => columnId(item, 0) === sortKey.value)
          const dataKey = column?.dataKey
          if (dataKey) {
            rows.sort((left, right) => {
              const a = left?.[dataKey]
              const b = right?.[dataKey]
              if (a === b) {
                return 0
              }
              const result = a > b ? 1 : -1
              return sortOrder.value === 'descending' ? -result : result
            })
          }
        }

        const rowHeight = Number(resolved.rowHeight) || 50
        const viewportHeight = Number(resolved.height) || Number(resolved.maxHeight) || 0
        const cache = Math.max(0, Number(resolved.cache) || 0)
        const start = viewportHeight ? Math.max(0, Math.floor(scrollTop.value / rowHeight) - cache) : 0
        const visibleCount = viewportHeight ? Math.ceil(viewportHeight / rowHeight) + cache * 2 : rows.length
        const end = Math.min(rows.length, start + visibleCount)
        const visibleRows = rows.slice(start, end)

        const gridTemplate = columns
          .map((column, index) => {
            if (column.width !== undefined) {
              return toSize(column.width)
            }
            if (column.flexGrow) {
              return `${column.flexGrow}fr`
            }
            return index === columns.length - 1 ? '1fr' : 'minmax(80px, 1fr)'
          })
          .join(' ')

        const header = h(
          'div',
          {
            class: ['ui-table-v2__header', resolved.headerClass],
            style: { height: toSize(resolved.headerHeight ?? 50) }
          },
          columns.map((column, index) =>
            h(
              'div',
              {
                class: [
                  'ui-table-v2__header-cell',
                  column.class,
                  column.align ? `is-${column.align}` : '',
                  column.sortable ? 'is-sortable' : '',
                  sortKey.value === columnId(column, index) && sortOrder.value ? `is-${sortOrder.value}` : ''
                ],
                onClick: column.sortable ? () => toggleSort(column) : undefined
              },
              columnTitle(column)
            )
          )
        )

        const bodyRows = visibleRows.map((row, offset) => {
          const index = start + offset
          const key = resolved.rowKey ? (row?.[resolved.rowKey] ?? index) : index
          const rowClass =
            typeof resolved.rowClass === 'function'
              ? resolved.rowClass({ rowData: row, rowIndex: index })
              : resolved.rowClass
          const rowProps =
            typeof resolved.rowProps === 'function'
              ? resolved.rowProps({ rowData: row, rowIndex: index })
              : resolved.rowProps
          return h(
            'div',
            {
              ...rowProps,
              key: String(key),
              class: ['ui-table-v2__row', rowClass, index % 2 === 1 ? 'is-even' : ''],
              style: { height: `${rowHeight}px`, gridTemplateColumns: gridTemplate }
            },
            columns.map((column, columnIndex) =>
              h(
                'div',
                {
                  class: ['ui-table-v2__cell', column.class, column.align ? `is-${column.align}` : '']
                },
                [cellContent(column, row, index)]
              )
            )
          )
        })

        const bodyStyle: CSSProperties = {}
        if (viewportHeight) {
          bodyStyle.flex = '0 0 auto'
          if (Number(resolved.height)) {
            bodyStyle.height = `${viewportHeight}px`
          }
        }
        if (resolved.maxHeight) {
          bodyStyle.maxHeight = toSize(resolved.maxHeight)
        }

        const body = h(
          'div',
          {
            class: 'ui-table-v2__body',
            style: bodyStyle,
            onScroll: handleScroll
          },
          [
            h('div', { style: { height: `${start * rowHeight}px` } }),
            ...bodyRows,
            h('div', { style: { height: `${(rows.length - end) * rowHeight}px` } }),
            rows.length === 0 ? h('div', { class: 'ui-table-v2__empty' }, 'No Data') : null
          ]
        )

        const rootStyle: CSSProperties = {
          ...(attrs.style as Record<string, any>),
          ...(resolved.style as Record<string, any>),
          width: toSize(resolved.width),
          gridTemplateColumns: gridTemplate
        }

        return h(
          'div',
          {
            ...attrs,
            class: [
              attrs.class,
              'ui-table-v2',
              resolved.class,
              resolved.fixed ? 'is-fixed' : '',
              ...collectFeatureClasses(states)
            ],
            style: rootStyle
          },
          [header, body]
        )
      }
    }
  })
}
