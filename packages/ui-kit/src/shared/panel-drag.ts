import { clamp } from './utils'

const VIEWPORT_MARGIN = 8

export interface PanelDragOptions {
  handle: HTMLElement
  enabled: () => boolean
  ignore?: (target: EventTarget | null) => boolean
}

function resolveRange(min: number, max: number, fallback: number): [number, number] {
  return max >= min ? [min, max] : [fallback, fallback]
}

export function enablePanelDrag(panel: HTMLElement, options: PanelDragOptions): () => void {
  let offsetX = 0
  let offsetY = 0
  let stopGesture: (() => void) | null = null

  function apply(nextX: number, nextY: number): void {
    offsetX = nextX
    offsetY = nextY
    panel.style.transform = `translate3d(${Math.round(nextX)}px, ${Math.round(nextY)}px, 0)`
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || !options.enabled()) {
      return
    }
    if (options.ignore?.(event.target)) {
      return
    }
    event.preventDefault()
    const rect = panel.getBoundingClientRect()
    const startX = event.clientX
    const startY = event.clientY
    const startOffsetX = offsetX
    const startOffsetY = offsetY
    const [minX, maxX] = resolveRange(
      startOffsetX + VIEWPORT_MARGIN - rect.left,
      startOffsetX + window.innerWidth - VIEWPORT_MARGIN - rect.right,
      startOffsetX
    )
    const [minY, maxY] = resolveRange(
      startOffsetY + VIEWPORT_MARGIN - rect.top,
      startOffsetY + window.innerHeight - VIEWPORT_MARGIN - rect.bottom,
      startOffsetY
    )
    const body = document.body
    const previousCursor = body.style.cursor
    const previousUserSelect = body.style.userSelect
    body.style.cursor = 'move'
    body.style.userSelect = 'none'

    function onPointerMove(moveEvent: PointerEvent): void {
      apply(
        clamp(startOffsetX + moveEvent.clientX - startX, minX, maxX),
        clamp(startOffsetY + moveEvent.clientY - startY, minY, maxY)
      )
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

  options.handle.addEventListener('pointerdown', onPointerDown)

  return () => {
    stopGesture?.()
    options.handle.removeEventListener('pointerdown', onPointerDown)
    panel.style.transform = ''
    offsetX = 0
    offsetY = 0
  }
}
