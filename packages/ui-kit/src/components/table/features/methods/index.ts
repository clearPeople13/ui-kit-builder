import { toRaw } from 'vue'
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

    // 调用方手里的行引用与组件内部渲染行，可能一个是原始对象、一个是 reactive 代理，
    // 直接 indexOf 会比不相等并静默放弃操作；先按 toRaw 身份匹配，再按 rowKey 兜底
    function indexOfRow(list: any[], row: any): number {
      const direct = list.findIndex((item) => item === row || toRaw(item) === toRaw(row))
      if (direct >= 0 || !row || typeof row !== 'object') {
        return direct
      }
      const key = props.rowKey
      if (typeof key !== 'string' && typeof key !== 'function') {
        return -1
      }
      const raw = toRaw(row)
      const target = typeof key === 'function' ? key(raw) : raw[key]
      if (target === undefined) {
        return -1
      }
      return list.findIndex((item) => {
        const itemRaw = toRaw(item)
        return (typeof key === 'function' ? key(itemRaw) : itemRaw?.[key]) === target
      })
    }

    function toggleRowSelection(row: any, selected?: boolean) {
      const visible = state.visibleRowsOf ? state.visibleRowsOf(data()) : data()
      const index = indexOfRow(visible, row)
      if (index < 0) {
        return
      }
      // 用列表内的那一份继续走勾选，树形联动与祖先回溯依赖同一对象图
      const target = visible[index]
      const key = state.rowKeyOf(target, index)
      state.toggleRow(
        target,
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
