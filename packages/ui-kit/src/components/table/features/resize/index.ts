import { h, onBeforeUnmount, ref } from 'vue'
import type { UiFeature } from '../../../../shared/feature'
import './style.css'

interface ResizeSession {
  key: string
  startX: number
  startWidth: number
  edge: 'left' | 'right'
}

export function resolveColumnWidth(startWidth: number, delta: number, minColumnWidth: unknown): number | null {
  // 点按或 1px 内的微抖不落地覆盖：序号列宽 56 小于 minColumnWidth 60，
  // 不拦截的话点按手柄就会被钳制逻辑顶宽
  if (Math.abs(delta) < 2) {
    return null
  }
  // 下限不能高于起始宽：多选列 48 / 序号列 56 本来就窄于 minColumnWidth，按配置值兜底会把它们一拖就撑宽
  const minimum = Math.min(Number(minColumnWidth) || 40, Math.round(startWidth))
  return Math.max(minimum, Math.round(startWidth + delta))
}

export const tableResizeFeature: UiFeature = {
  id: 'table.resize',
  props: {
    resizable: { type: Boolean },
    minColumnWidth: { type: Number, default: 60 }
  },
  setup(props, { emit }) {
    const overrides = ref(new Map<string, number>())
    let session: ResizeSession | null = null

    function stopSession() {
      if (typeof window === 'undefined') {
        return
      }
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      session = null
    }

    function handlePointerMove(event: PointerEvent) {
      if (!session) {
        return
      }
      const raw = session.edge === 'left' ? session.startX - event.clientX : event.clientX - session.startX
      const width = resolveColumnWidth(session.startWidth, raw, props.minColumnWidth)
      if (width === null) {
        return
      }
      const next = new Map(overrides.value)
      next.set(session.key, width)
      overrides.value = next
    }

    function handlePointerUp() {
      if (!session) {
        stopSession()
        return
      }
      const key = session.key
      const width = overrides.value.get(key)
      stopSession()
      if (width) {
        emit('resize-change', { key, width })
      }
    }

    function startResize(event: PointerEvent, column: Record<string, any>, edge: 'left' | 'right') {
      if (!props.resizable || event.button !== 0) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      const cell = (event.currentTarget as HTMLElement).parentElement
      session = {
        key: column.key,
        startX: event.clientX,
        startWidth: cell?.getBoundingClientRect().width ?? 0,
        edge
      }
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
    }

    function resetWidth(event: MouseEvent, column: Record<string, any>) {
      event.stopPropagation()
      const next = new Map(overrides.value)
      if (next.delete(column.key)) {
        overrides.value = next
        emit('resize-change', { key: column.key, width: null })
      }
    }

    function tableColumnWidth(column: Record<string, any>) {
      return overrides.value.get(column.key)
    }

    // 标记该列宽来自拖拽覆盖：布局分摊剩余空间时跳过，防止点按手柄列宽被二次撑大
    function tableColumnUserWidth(column: Record<string, any>) {
      return overrides.value.has(column.key) ? overrides.value.get(column.key) : undefined
    }

    function tableHeaderExtra({ column }: { column: Record<string, any> }) {
      if (!props.resizable) {
        return null
      }
      // 右冻结列贴着滚动视口右缘，右缘手柄会被纵向滚动条遮住，改放到左缘
      const edge = column.fixed === 'right' ? 'left' : 'right'
      return h('span', {
        class: ['ui-table__resizer', edge === 'left' ? 'is-left' : ''],
        'aria-hidden': 'true',
        onClick: (event: MouseEvent) => event.stopPropagation(),
        onPointerdown: (event: PointerEvent) => startResize(event, column, edge),
        onDblclick: (event: MouseEvent) => resetWidth(event, column)
      })
    }

    onBeforeUnmount(stopSession)

    return {
      hooks: { tableColumnWidth, tableColumnUserWidth, tableHeaderExtra }
    }
  }
}
