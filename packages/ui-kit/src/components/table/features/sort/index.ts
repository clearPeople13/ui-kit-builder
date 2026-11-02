import { ref } from 'vue'

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

export const tableSortFeature = {
  id: 'table.sort',
  props: {
    defaultSort: { type: Object, default: () => ({}) }
  },
  setup(props: { defaultSort?: { prop?: string; order?: string } }) {
    const initial = props.defaultSort ?? {}
    const state = ref({ prop: initial.prop ?? '', order: initial.prop ? (initial.order ?? 'ascending') : '' })

    function tableSortState(column: { prop?: string }) {
      return state.value.prop && state.value.prop === column.prop ? state.value : {}
    }

    function tableHeaderClick(column: Record<string, any>) {
      if (!column.sortable) {
        return
      }
      const orders =
        Array.isArray(column.sortOrders) && column.sortOrders.length
          ? column.sortOrders
          : ['ascending', 'descending', null]
      const current = state.value.prop === column.prop ? state.value.order : ''
      const next = orders[(orders.indexOf(current) + 1) % orders.length]
      state.value = next ? { prop: column.prop, order: next } : { prop: '', order: '' }
    }

    function tableRows(rows: any[], columns: Array<Record<string, any>>) {
      const active = state.value
      if (!active.prop) {
        return rows
      }
      const column = columns.find((item) => item.prop === active.prop)
      if (!column) {
        return rows
      }
      const direction = active.order === 'descending' ? -1 : 1
      const comparator =
        typeof column.sortMethod === 'function'
          ? (left: any, right: any) => column.sortMethod(left, right)
          : (left: any, right: any) => compareValues(left?.[active.prop], right?.[active.prop])
      return [...rows].sort((left, right) => comparator(left, right) * direction)
    }

    return {
      hooks: { tableRows, tableHeaderClick, tableSortState }
    }
  }
}
