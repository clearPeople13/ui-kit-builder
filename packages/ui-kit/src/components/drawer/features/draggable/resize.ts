import { clamp } from '../../../../shared/utils'

const VIEWPORT_MARGIN = 8
const MIN_SIZE = 200

export interface DrawerResizeOptions {
  enabled: () => boolean
  direction: () => string
}

export function enableDrawerResize(panel: HTMLElement, options: DrawerResizeOptions): () => void {
  const handle = document.createElement('div')
  handle.className = 'ui-drawer__resizer'
  handle.setAttribute('aria-hidden', 'true')
  panel.appendChild(handle)
  const initialWidth = panel.style.width
  const initialHeight = panel.style.height
  let stopGesture: (() => void) | null = null

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || !options.enabled()) {
      return
    }
    event.preventDefault()
    const direction = options.direction()
    const horizontal = direction === 'rtl' || direction === 'ltr'
    const rect = panel.getBoundingClientRect()
    const startX = event.clientX
    const startY = event.clientY
    const startSize = horizontal ? rect.width : rect.height
    const viewportSize = horizontal ? window.innerWidth : window.innerHeight
    const maxSize = Math.max(MIN_SIZE, viewportSize - VIEWPORT_MARGIN * 2)
    const sign = direction === 'rtl' || direction === 'btt' ? -1 : 1
    const body = document.body
    const previousCursor = body.style.cursor
    const previousUserSelect = body.style.userSelect
    body.style.cursor = horizontal ? 'col-resize' : 'row-resize'
    body.style.userSelect = 'none'

    function onPointerMove(moveEvent: PointerEvent): void {
      const delta = horizontal ? moveEvent.clientX - startX : moveEvent.clientY - startY
      const size = clamp(startSize + delta * sign, MIN_SIZE, maxSize)
      if (horizontal) {
        panel.style.width = `${Math.round(size)}px`
      } else {
        panel.style.height = `${Math.round(size)}px`
      }
    }

    function stop(): void {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      body.style.cursor = previousCursor
      body.style.userSelect = previousUserSelect
      stopGesture = null
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    stopGesture = stop
  }

  handle.addEventListener('pointerdown', onPointerDown)

  return () => {
    stopGesture?.()
    handle.removeEventListener('pointerdown', onPointerDown)
    handle.remove()
    panel.style.width = initialWidth
    panel.style.height = initialHeight
  }
}
