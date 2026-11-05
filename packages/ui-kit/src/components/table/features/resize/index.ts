import { h, onBeforeUnmount, ref } from 'vue'
import type { UiFeature } from '../../../../shared/feature'
import './style.css'

interface ResizeSession {
  key: string
  startX: number
  startWidth: number
  edge: 'left' | 'right'
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
      const minimum = Number(props.minColumnWidth) || 40
      const delta = session.edge === 'left' ? session.startX - event.clientX : event.clientX - session.startX
      const width = Math.max(minimum, Math.round(session.startWidth + delta))
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
      hooks: { tableColumnWidth, tableHeaderExtra }
    }
  }
}
