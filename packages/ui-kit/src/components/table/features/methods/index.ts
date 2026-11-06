import type { UiFeature } from '../../../../shared/feature'

export const tableMethodsFeature: UiFeature = {
  id: 'table.methods',
  expose({ props, emit, state }) {
    function data(): any[] {
      return Array.isArray(props.data) ? props.data : []
    }

    function childrenKey() {
      const treeProps = props.treeProps
      if (treeProps && typeof treeProps === 'object') {
        const children = (treeProps as Record<string, unknown>).children
        if (typeof children === 'string' && children) {
          return children
        }
      }
      return 'children'
    }

    function flatData(): any[] {
      const output: any[] = []
      const collect = (list: any[]) => {
        for (const item of list) {
          output.push(item)
          const children = item?.[childrenKey()]
          if (Array.isArray(children) && children.length) {
            collect(children)
          }
        }
      }
      collect(data())
      return output
    }

    function clearSelection() {
      state.selectedKeys.value = new Set()
      emit('selection-change', [])
    }

    function getSelectionRows() {
      return flatData().filter((row: any, index: number) => {
        return state.selectedKeys.value.has(state.rowKeyOf(row, index))
      })
    }

    function toggleRowSelection(row: any, selected?: boolean) {
      const visible = state.visibleRowsOf ? state.visibleRowsOf(data()) : data()
      const index = visible.indexOf(row)
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
      const rows = state.visibleRowsOf ? state.visibleRowsOf(data()) : data()
      const columns = state.latestColumns()
      const selectable = rows
        .map((row: any, index: number) => ({ row, index }))
        .filter(({ row, index }: { row: any; index: number }) => state.selectableOf(columns, row, index))
      const allSelected =
        selectable.length > 0 &&
        selectable.every(({ row, index }: { row: any; index: number }) =>
          state.selectedKeys.value.has(state.rowKeyOf(row, index))
        )
      state.toggleAll(!allSelected, columns, rows)
    }

    return { clearSelection, getSelectionRows, toggleRowSelection, toggleAllSelection }
  }
}
