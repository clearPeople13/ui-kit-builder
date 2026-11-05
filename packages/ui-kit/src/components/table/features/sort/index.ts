import { h, ref } from 'vue'
import type { VNodeChild } from 'vue'
import type { UiFeature } from '../../../../shared/feature'
import './style.css'

interface SortState {
  prop: string
  order: string
}

function compareValues(left: any, right: any): number {
  if (left === right) {
    return 0
  }
  if (left === undefined || left === null) {
    return -1
  }
  if (right === undefined || right === null) {
    return 1
  }
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right
  }
  return String(left).localeCompare(String(right), 'zh-Hans-CN')
}

function normalizeDefaultSort(value: unknown): SortState[] {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item && typeof item === 'object' && typeof item.prop === 'string' && item.prop)
      .map((item) => ({ prop: item.prop, order: item.order ?? 'ascending' }))
  }
  if (value && typeof value === 'object') {
    const item = value as { prop?: string; order?: string }
    if (typeof item.prop === 'string' && item.prop) {
      return [{ prop: item.prop, order: item.order ?? 'ascending' }]
    }
  }
  return []
}

export const tableSortFeature: UiFeature = {
  id: 'table.sort',
  props: {
    defaultSort: { type: [Object, Array], default: () => ({}) },
    multiSort: { type: Boolean }
  },
  setup(props, { emit }) {
    const sorts = ref<SortState[]>(normalizeDefaultSort(props.defaultSort))

    function tableSortState(column: { prop?: string }) {
      const index = sorts.value.findIndex((item) => item.prop && item.prop === column.prop)
      if (index < 0) {
        return {}
      }
      return { prop: column.prop, order: sorts.value[index].order, index }
    }

    function emitChange(next: SortState[], column?: Record<string, any>) {
      const primary = next.find((item) => item.order)
      emit('sort-change', {
        column,
        prop: primary?.prop ?? '',
        order: primary?.order ?? '',
        sorts: next.map((item) => ({ prop: item.prop, order: item.order }))
      })
    }

    function tableHeaderClick(column: Record<string, any>) {
      if (!column.sortable) {
        return
      }
      const orders =
        Array.isArray(column.sortOrders) && column.sortOrders.length
          ? column.sortOrders
          : ['ascending', 'descending', null]
      const existingIndex = sorts.value.findIndex((item) => item.prop === column.prop)
      const current = existingIndex >= 0 ? sorts.value[existingIndex].order : ''
      const nextOrder: string | null = orders[(orders.indexOf(current) + 1) % orders.length] ?? null
      let next: SortState[]
      if (props.multiSort) {
        next = sorts.value.map((item) => ({ ...item }))
        if (existingIndex >= 0) {
          if (nextOrder) {
            next[existingIndex] = { prop: column.prop, order: nextOrder }
          } else {
            next.splice(existingIndex, 1)
          }
        } else if (nextOrder) {
          next.push({ prop: column.prop, order: nextOrder })
        }
      } else {
        next = nextOrder ? [{ prop: column.prop, order: nextOrder }] : []
      }
      sorts.value = next
      emitChange(next, column)
    }

    function tableRows(rows: any[], columns: Array<Record<string, any>>) {
      const active = sorts.value.filter((item) => item.prop && item.order)
      if (!active.length) {
        return rows
      }
      const comparators: ((left: any, right: any) => number)[] = []
      for (const item of active) {
        const column = columns.find((entry) => entry.prop === item.prop)
        if (!column) {
          continue
        }
        const direction = item.order === 'descending' ? -1 : 1
        const compare =
          typeof column.sortMethod === 'function'
            ? (left: any, right: any) => column.sortMethod(left, right)
            : (left: any, right: any) => compareValues(left?.[item.prop], right?.[item.prop])
        comparators.push((left, right) => compare(left, right) * direction)
      }
      if (!comparators.length) {
        return rows
      }
      return [...rows].sort((left, right) => {
        for (const comparator of comparators) {
          const result = comparator(left, right)
          if (result) {
            return result
          }
        }
        return 0
      })
    }

    function tableHeaderExtra({ column }: { column: Record<string, any> }) {
      const extras: VNodeChild[] = []
      if (column.sortable) {
        const active = sorts.value.find((item) => item.prop === column.prop)
        extras.push(
          h('span', {
            class: ['ui-table__sort-caret', active?.order ? `is-${active.order}` : ''],
            'aria-hidden': 'true'
          })
        )
      }
      if (props.multiSort) {
        const active = sorts.value.filter((item) => item.order)
        if (active.length >= 2) {
          const index = active.findIndex((item) => item.prop === column.prop)
          if (index >= 0) {
            extras.push(h('span', { class: 'ui-table__sort-index' }, String(index + 1)))
          }
        }
      }
      return extras.length ? extras : null
    }

    return {
      hooks: { tableRows, tableHeaderClick, tableSortState, tableHeaderExtra }
    }
  }
}
