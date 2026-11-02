import type { CSSProperties, VNode, VNodeChild } from 'vue'
import { Fragment, defineComponent, h, isVNode, ref, shallowRef } from 'vue'
import type { UiFeature, UiFeatureState } from '../../shared/feature'
import {
  collectFeatureClasses,
  collectFeatureExposed,
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
  emptyText: { type: String },
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

function readProp(raw: Record<string, any>, name: string) {
  if (raw[name] !== undefined) {
    return raw[name]
  }
  return raw[name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)]
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
  key: string
  [key: string]: any
}

function readColumns(slots: Record<string, any>): TableColumn[] {
  return flattenVNodes(slots.default?.() ?? [])
    .filter((node) => Boolean((node.type as any)?.[tableColumnMarker]))
    .map((node) => {
      const raw = (node.props ?? {}) as Record<string, any>
      const column = { key: String(raw.key ?? raw.prop ?? raw.type ?? '') } as TableColumn
      for (const name of Object.keys(columnDefaults)) {
        const value = readProp(raw, name)
        column[name] = value === undefined ? columnDefaults[name] : value
      }
      return column
    })
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

export function createTable(features: UiFeature[] = []) {
  return defineComponent({
    name: 'UiTable',
    inheritAttrs: false,
    props: { ...tableBaseProps, ...mergeFeatureProps(features) },
    emits: ['row-click', 'selection-change', 'current-change', 'sort-change'],
    setup(props, { attrs, slots, emit, expose }) {
      const resolved = props as Record<string, any>
      const root = shallowRef<HTMLElement | null>(null)
      const selectedKeys = ref(new Set<any>())
      const expandedKeys = ref(new Set<any>())
      const currentKey = ref<any>(null)
      let latestColumns: TableColumn[] = []

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
      const states = resolveFeatureStates(features, resolved, {
        attrs,
        slots,
        emit: emit as any,
        root,
        state
      })
      const exposed = collectFeatureExposed(features, {
        props: resolved,
        attrs,
        slots,
        emit: emit as any,
        root,
        state
      })
      if (Object.keys(exposed).length) {
        expose(exposed)
      }

      function renderCell(column: TableColumn, row: any, index: number): VNodeChild {
        if (column.type === 'selection') {
          const key = rowKeyOf(row, index)
          return h(TableCheckbox, {
            class: 'ui-table__checkbox',
            modelValue: selectedKeys.value.has(key),
            disabled: !selectableOf([column], row, index),
            onClick: (event: Event) => event.stopPropagation(),
            'onUpdate:modelValue': (checked: boolean) => toggleRow(row, index, checked, [column])
          })
        }
        if (column.type === 'index') {
          const value = typeof column.index === 'function' ? column.index(index) : index + 1
          return typeof column.index === 'number' ? index + column.index : value
        }
        if (column.type === 'expand') {
          const key = rowKeyOf(row, index)
          return h(
            'button',
            {
              type: 'button',
              class: ['ui-table__expand', expandedKeys.value.has(key) ? 'is-expanded' : ''],
              'aria-label': 'Expand row',
              onClick: () => toggleExpand(row, index)
            },
            expandedKeys.value.has(key) ? '−' : '+'
          )
        }
        const value = column.prop ? row?.[column.prop] : undefined
        if (typeof column.formatter === 'function') {
          return column.formatter(row, column, value, index)
        }
        return value === undefined || value === null ? '' : String(value)
      }

      return function render() {
        const columns = readColumns(slots)
        latestColumns = columns
        let rows: any[] = Array.isArray(resolved.data) ? [...resolved.data] : []
        for (const hook of flattenHooks(states, 'tableRows')) {
          rows = hook(rows, columns, resolved)
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
          ...featureClasses
        ]
        const rootStyle: CSSProperties = {
          ...(attrs.style as Record<string, any>),
          ...(resolved.tableLayout ? { tableLayout: resolved.tableLayout } : {}),
          ...collectFeatureStyles(states)
        }

        const colgroup = h(
          'colgroup',
          columns.map((column) =>
            h('col', {
              style: {
                width: sizeValue(column.width),
                minWidth: sizeValue(column.minWidth)
              }
            })
          )
        )

        const header =
          resolved.showHeader === false
            ? null
            : h('thead', { class: 'ui-table__header' }, [
                h(
                  'tr',
                  columns.map((column) => {
                    const sortState = flattenHooks(states, 'tableSortState').reduce<Record<string, any>>(
                      (state, hook) => hook(column) ?? state,
                      {}
                    )
                    const sortable = Boolean(column.sortable)
                    return h(
                      'th',
                      {
                        class: [
                          column.labelClassName,
                          column.align ? `is-${column.align}` : '',
                          sortable ? 'is-sortable' : '',
                          sortState.order ? `is-${sortState.order}` : ''
                        ],
                        'aria-sort':
                          sortState.order === 'ascending'
                            ? 'ascending'
                            : sortState.order === 'descending'
                              ? 'descending'
                              : undefined,
                        onClick: sortable ? () => headerClick(column) : undefined
                      },
                      column.type === 'selection'
                        ? h(TableCheckbox, {
                            class: 'ui-table__checkbox',
                            modelValue: allSelected,
                            indeterminate: selectedCount > 0 && !allSelected,
                            disabled: !selectableKeys.length,
                            'onUpdate:modelValue': (checked: boolean) => toggleAll(checked, columns)
                          })
                        : column.label
                    )
                  })
                )
              ])

        const body = h(
          'tbody',
          { class: 'ui-table__body' },
          rows.length
            ? rows.flatMap((row, index) => {
                const rowClass =
                  typeof resolved.rowClassName === 'function'
                    ? resolved.rowClassName({ row, rowIndex: index })
                    : resolved.rowClassName
                const rowStyle =
                  typeof resolved.rowStyle === 'function'
                    ? resolved.rowStyle({ row, rowIndex: index })
                    : resolved.rowStyle
                const key = rowKeyOf(row, index)
                const isExpanded = expandedKeys.value.has(key)
                const nodes = [
                  h(
                    'tr',
                    {
                      key: String(key),
                      class: [
                        rowClass,
                        resolved.stripe && index % 2 === 1 ? 'is-striped' : '',
                        resolved.highlightCurrentRow && currentKey.value === key ? 'current-row' : ''
                      ],
                      style: rowStyle,
                      onClick: () => handleRowClick(row, index)
                    },
                    columns.map((column) =>
                      h(
                        'td',
                        {
                          class: [column.className, column.align ? `is-${column.align}` : '']
                        },
                        [renderCell(column, row, index)]
                      )
                    )
                  )
                ]
                if (isExpanded) {
                  const expandColumn = columns.find((column) => column.type === 'expand')
                  nodes.push(
                    h('tr', { key: `expand-${key}`, class: 'ui-table__expanded-row' }, [
                      h('td', { colspan: Math.max(1, columns.length) }, [expandColumn?.defaultSlot?.() ?? null])
                    ])
                  )
                }
                return nodes
              })
            : [
                h('tr', { class: 'ui-table__empty-row' }, [
                  h('td', { colspan: Math.max(1, columns.length) }, resolved.emptyText ?? 'No Data')
                ])
              ]
        )

        const summaryNodes: VNodeChild[] = []
        for (const hook of flattenHooks(states, 'tableSummary')) {
          const cells = hook(columns, rows)
          if (Array.isArray(cells) && cells.length) {
            summaryNodes.push(
              h(
                'tr',
                { class: 'ui-table__summary-row' },
                cells.map((cell: any) => h('td', null, cell))
              )
            )
          }
        }
        const footer = summaryNodes.length ? h('tfoot', { class: 'ui-table__footer' }, summaryNodes) : null

        const wrapperStyle: CSSProperties = {
          height: sizeValue(resolved.height),
          maxHeight: sizeValue(resolved.maxHeight)
        }
        const table = h(
          'table',
          {
            class: 'ui-table__inner',
            cellspacing: '0',
            cellpadding: '0',
            border: '0',
            style: resolved.fit === false ? { width: 'auto' } : undefined
          },
          [colgroup, header, body, footer]
        )

        return h(
          'div',
          {
            ...attrs,
            ref: root,
            class: rootClass,
            style: rootStyle
          },
          [h('div', { class: 'ui-table__wrapper', style: wrapperStyle }, table)]
        )
      }
    }
  })
}

export function createTableColumn(features: UiFeature[] = []) {
  const component = defineComponent({
    name: 'UiTableColumn',
    props: { ...tableColumnBaseProps, ...mergeFeatureProps(features) },
    setup(props, { slots }) {
      return function render() {
        return h('div', { class: 'ui-table-column', style: { display: 'none' } }, [slots.default?.() ?? null])
      }
    }
  })
  ;(component as any)[tableColumnMarker] = true
  return component
}
