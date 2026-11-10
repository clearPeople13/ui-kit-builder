import { h, ref } from 'vue'
import type { UiFeature } from '../../../../shared/feature'
import './style.css'

interface TreeConfig {
  children?: string
  hasChildren?: string | ((row: any) => boolean)
}

interface TreeRowMeta {
  level: number
  hasChildren: boolean
}

// 勾选/序号/展开列由 core 自己渲染内容，树形缩进与箭头只能落在首个内容列
const NON_CONTENT_COLUMN_TYPES = new Set(['selection', 'index', 'expand'])

function readTreeConfig(value: unknown): Required<Pick<TreeConfig, 'children'>> & TreeConfig {
  const config = value && typeof value === 'object' ? (value as TreeConfig) : {}
  return {
    children: typeof config.children === 'string' && config.children ? config.children : 'children',
    hasChildren: config.hasChildren
  }
}

export const tableTreeFeature: UiFeature = {
  id: 'table.tree',
  props: {
    treeProps: { type: Object, default: () => ({ children: 'children' }) },
    defaultExpandAll: { type: Boolean },
    treeIndent: { type: Number, default: 16 }
  },
  setup(props, { emit, state }) {
    const expandedKeys = ref(new Set<any>())
    const collapsedKeys = ref(new Set<any>())
    let metaMap = new WeakMap<object, TreeRowMeta>()
    // 行键与 core 的选中/展开共用一个出口，缺 rowKey 时两边才不会各算一套身份
    const rowKeyOf = state!.rowKeyOf as (row: any) => any

    function childrenOf(row: any): any[] {
      const config = readTreeConfig(props.treeProps)
      const children = row?.[config.children]
      return Array.isArray(children) ? children : []
    }

    function hasChildrenOf(row: any): boolean {
      const config = readTreeConfig(props.treeProps)
      if (typeof config.hasChildren === 'function') {
        return Boolean(config.hasChildren(row))
      }
      if (typeof config.hasChildren === 'string') {
        return Boolean(row?.[config.hasChildren])
      }
      return childrenOf(row).length > 0
    }

    function isExpanded(row: any) {
      const key = rowKeyOf(row)
      if (expandedKeys.value.has(key)) {
        return true
      }
      if (collapsedKeys.value.has(key)) {
        return false
      }
      return Boolean(props.defaultExpandAll)
    }

    function setExpansion(rows: any[], expanded: boolean) {
      if (expanded) {
        const nextExpanded = new Set(expandedKeys.value)
        const nextCollapsed = new Set(collapsedKeys.value)
        for (const row of rows) {
          const key = rowKeyOf(row)
          nextExpanded.add(key)
          nextCollapsed.delete(key)
        }
        expandedKeys.value = nextExpanded
        collapsedKeys.value = nextCollapsed
      } else {
        const nextCollapsed = new Set(collapsedKeys.value)
        const nextExpanded = new Set(expandedKeys.value)
        for (const row of rows) {
          const key = rowKeyOf(row)
          nextCollapsed.add(key)
          nextExpanded.delete(key)
        }
        collapsedKeys.value = nextCollapsed
        expandedKeys.value = nextExpanded
      }
    }

    function toggleTreeExpand(row: any, expanded?: boolean) {
      const nextExpanded = expanded === undefined ? !isExpanded(row) : Boolean(expanded)
      setExpansion([row], nextExpanded)
      emit('tree-expand', { row, expanded: nextExpanded })
      return nextExpanded
    }

    function collectParentRows(rows: any[], out: any[] = []) {
      for (const row of rows) {
        if (!row || typeof row !== 'object') {
          continue
        }
        const children = childrenOf(row)
        if (children.length || hasChildrenOf(row)) {
          out.push(row)
        }
        collectParentRows(children, out)
      }
      return out
    }

    function setAllTreeExpansion(expanded: boolean) {
      const data = Array.isArray(props.data) ? props.data : []
      setExpansion(collectParentRows(data), expanded)
    }

    function tableRows(rows: any[]) {
      // 普通 flat 数据短路：避免每次渲染都为全量行重建 metaMap（10 万行虚拟滚动时每次滚动帧都跑）
      if (!rows.some((row) => hasChildrenOf(row))) {
        // 树形变平铺后旧 meta 会让已无子级的行继续挂着展开箭头
        metaMap = new WeakMap()
        return rows
      }
      const output: any[] = []
      function walk(list: any[], level: number) {
        for (const row of list) {
          output.push(row)
          if (row && typeof row === 'object') {
            metaMap.set(row, { level, hasChildren: hasChildrenOf(row) })
          }
          if (hasChildrenOf(row) && isExpanded(row)) {
            walk(childrenOf(row), level + 1)
          }
        }
      }
      walk(rows, 0)
      return output
    }

    function tableRowMeta(row: any) {
      if (!row || typeof row !== 'object') {
        return null
      }
      const meta = metaMap.get(row)
      if (!meta) {
        return null
      }
      return {
        treeLevel: meta.level,
        treeHasChildren: meta.hasChildren,
        treeExpanded: isExpanded(row)
      }
    }

    let contentColumnCache: { columns: Record<string, any>[]; index: number } | null = null

    // 同一轮渲染里所有单元格共用一份列数组，按引用缓存避免每格都扫一遍列
    function contentColumnIndexOf(columns: Record<string, any>[]) {
      if (contentColumnCache && contentColumnCache.columns === columns) {
        return contentColumnCache.index
      }
      const index = columns.findIndex((column) => !NON_CONTENT_COLUMN_TYPES.has(column.type))
      contentColumnCache = { columns, index }
      return index
    }

    function tableCellPrepend(scope: Record<string, any>, columns: Record<string, any>[]) {
      if (scope.columnIndex !== contentColumnIndexOf(columns)) {
        return null
      }
      const row = scope.row
      if (!row || typeof row !== 'object') {
        return null
      }
      const meta = metaMap.get(row)
      if (!meta) {
        return null
      }
      const indentSize = Number(props.treeIndent) || 0
      const indent = h('span', {
        class: 'ui-table__tree-indent',
        style: { width: `${meta.level * indentSize}px` }
      })
      if (!meta.hasChildren) {
        return [indent, h('span', { class: 'ui-table__tree-leaf' })]
      }
      const expanded = isExpanded(row)
      const toggle = h(
        'button',
        {
          type: 'button',
          class: ['ui-table__tree-toggle', expanded ? 'is-expanded' : ''],
          'aria-label': expanded ? '收起子级' : '展开子级',
          'aria-expanded': expanded ? 'true' : 'false',
          onClick: (event: Event) => {
            event.stopPropagation()
            toggleTreeExpand(row)
          }
        },
        [h('span', { class: 'ui-table__tree-arrow' })]
      )
      return [indent, toggle]
    }

    if (state) {
      state.tree = { toggleTreeExpand, setAllTreeExpansion }
    }

    return {
      hooks: { tableRows, tableRowMeta, tableCellPrepend }
    }
  },
  expose({ state }) {
    return state?.tree ?? {}
  }
}
