import type { UiFeature } from '../../../../shared/feature'

export const tableMethodsFeature: UiFeature = {
  id: 'table.methods',
  expose({ props, emit, state }) {
    function data(): any[] {
      return Array.isArray(props.data) ? props.data : []
    }

    function clearSelection() {
      state.selectedKeys.value = new Set()
      emit('selection-change', [])
    }

    function getSelectionRows() {
      return data().filter((row: any, index: number) => {
        return state.selectedKeys.value.has(state.rowKeyOf(row, index))
      })
    }

    function toggleRowSelection(row: any, selected?: boolean) {
      const index = data().indexOf(row)
      if (index < 0) {
        return
      }
      const key = state.rowKeyOf(row, index)
      state.toggleRow(
        row,
        index,
        selected === undefined ? !state.selectedKeys.value.has(key) : Boolean(selected),
        state.latestColumns()
      )
    }

    function toggleAllSelection() {
      const rows = data()
      const columns = state.latestColumns()
      const selectable = rows
        .map((row: any, index: number) => ({ row, index }))
        .filter(({ row, index }) => state.selectableOf(columns, row, index))
      const allSelected =
        selectable.length > 0 &&
        selectable.every(({ row, index }) => state.selectedKeys.value.has(state.rowKeyOf(row, index)))
      state.toggleAll(!allSelected, columns)
    }

    return { clearSelection, getSelectionRows, toggleRowSelection, toggleAllSelection }
  }
}
