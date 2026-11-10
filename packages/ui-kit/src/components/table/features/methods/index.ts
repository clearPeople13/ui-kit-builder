import { toRaw } from 'vue'
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
      return state.flatRows().filter((row: any) => state.selectedKeys.value.has(state.rowKeyOf(row)))
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
      // 在全量 DFS 行里定位：折叠态的子行不在可见行里，按可见行找会静默放弃操作
      const flat = state.flatRows()
      const index = indexOfRow(flat, row)
      if (index < 0) {
        return
      }
      // 用列表内的那一份继续走勾选，树形联动与祖先回溯依赖同一对象图
      const target = flat[index]
      const key = state.rowKeyOf(target)
      state.toggleRow(
        target,
        selected === undefined ? !state.selectedKeys.value.has(key) : Boolean(selected),
        state.latestColumns()
      )
    }

    function toggleAllSelection() {
      const rows = state.visibleRowsOf(data())
      const columns = state.latestColumns()
      // 与表头全选框共用同一份判定，否则 showCheckbox 隐藏的行会被这里重新选进来
      state.toggleAll(!state.selectionSummaryOf(rows, columns).allSelected, columns, rows)
    }

    return { clearSelection, getSelectionRows, toggleRowSelection, toggleAllSelection }
  }
}
