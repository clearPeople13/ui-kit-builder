import type { CSSProperties, Ref } from 'vue'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { clamp } from './utils'
import { nextZIndex, resolveZIndex } from './z-index'

export type PanelScroll = 'follow' | 'close'

export const panelScrollProp = {
  type: String,
  default: 'follow'
}

export interface FloatingPanelOptions {
  props: Record<string, any>
  open: () => boolean
  close: () => void
  trigger: Ref<HTMLElement | undefined>
  panel: Ref<HTMLElement | undefined>
  placement?: () => string
  offset?: () => number
  arrowOffset?: () => number
  matchWidth?: () => boolean
  fixedWidth?: () => boolean
  fallbackPlacements?: () => string[] | undefined
}

const VIEWPORT_MARGIN = 8
const HOVER_BRIDGE_SIZE = 10
const SIDES = ['top', 'bottom', 'left', 'right']
const OPPOSITE: Record<string, string> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left'
}

export interface Placement {
  side: string
  align: string
}

export function parsePlacement(placement: string): Placement {
  const [rawSide, align] = String(placement || 'bottom-start').split('-')
  return {
    side: SIDES.includes(rawSide) ? rawSide : 'bottom',
    align: align || 'start'
  }
}

function hoverBridge(
  side: string,
  box: { left: number; top: number; width: number; height: number }
): Record<string, string> {
  const { left, top, width, height } = box
  let x = left
  let y = top
  let bridgeWidth = width
  let bridgeHeight = HOVER_BRIDGE_SIZE
  if (side === 'bottom') {
    y = top - HOVER_BRIDGE_SIZE
  } else if (side === 'top') {
    y = top + height
  } else if (side === 'left') {
    x = left + width
    bridgeWidth = HOVER_BRIDGE_SIZE
    bridgeHeight = height
  } else {
    x = left - HOVER_BRIDGE_SIZE
    bridgeWidth = HOVER_BRIDGE_SIZE
    bridgeHeight = height
  }
  return {
    '--ui-floating-bridge-left': `${Math.round(x)}px`,
    '--ui-floating-bridge-top': `${Math.round(y)}px`,
    '--ui-floating-bridge-width': `${Math.round(bridgeWidth)}px`,
    '--ui-floating-bridge-height': `${Math.round(bridgeHeight)}px`
  }
}

function fitsViewport(side: string, rect: DOMRect, width: number, height: number, vw: number, vh: number, gap: number) {
  if (side === 'top') {
    return rect.top - gap - height >= VIEWPORT_MARGIN
  }
  if (side === 'bottom') {
    return rect.bottom + gap + height <= vh - VIEWPORT_MARGIN
  }
  if (side === 'left') {
    return rect.left - gap - width >= VIEWPORT_MARGIN
  }
  return rect.right + gap + width <= vw - VIEWPORT_MARGIN
}

function availableSpace(side: string, rect: DOMRect, vw: number, vh: number, gap: number): number {
  if (side === 'top') {
    return rect.top - gap - VIEWPORT_MARGIN
  }
  if (side === 'bottom') {
    return vh - rect.bottom - gap - VIEWPORT_MARGIN
  }
  if (side === 'left') {
    return rect.left - gap - VIEWPORT_MARGIN
  }
  return vw - rect.right - gap - VIEWPORT_MARGIN
}

export function useFloatingPanel(options: FloatingPanelOptions) {
  const position = ref<CSSProperties>({})
  const arrowStyle = ref<CSSProperties>({})
  const actualSide = ref('bottom')
  const actualAlign = ref('start')
  const zIndex = ref(0)
  let bound = false
  let resizeObserver: ResizeObserver | null = null
  let cappedHeight = 0

  function panelScroll(): PanelScroll {
    return options.props.panelScroll === 'close' ? 'close' : 'follow'
  }

  function update() {
    const trigger = options.trigger.value
    if (!trigger || typeof window === 'undefined') {
      return
    }
    const rect = trigger.getBoundingClientRect()
    const el = options.panel.value
    const targetWidth = `${Math.round(rect.width)}px`
    const matchedWidth = Boolean(options.matchWidth?.())
    const fixedWidth = Boolean(options.fixedWidth?.())
    // 面板宽度/高度会被上一次定位写入的 minWidth、maxHeight 影响，测量前先还原
    if (el && cappedHeight) {
      el.style.maxHeight = ''
      cappedHeight = 0
    }
    if (el && matchedWidth && el.style.minWidth !== targetWidth) {
      el.style.minWidth = ''
    }
    if (el && !fixedWidth && el.style.maxWidth) {
      el.style.maxWidth = ''
    }
    const naturalWidth = el?.offsetWidth ?? 0
    // matchWidth 面板首帧尚未写入 minWidth，测量宽度会偏小导致误判方位，按目标宽度参与计算
    const width = fixedWidth ? rect.width : matchedWidth ? Math.max(naturalWidth, rect.width) : naturalWidth
    const height = el?.offsetHeight ?? 0
    const gap = Number(options.offset?.() ?? 4)
    const vw = window.innerWidth
    const vh = window.innerHeight
    const initial = parsePlacement(options.placement?.() ?? 'bottom-start')
    const fallbacks = (options.fallbackPlacements?.() ?? []).map(parsePlacement)
    const candidates = fallbacks.length
      ? [initial, ...fallbacks]
      : [initial, { side: OPPOSITE[initial.side] ?? initial.side, align: initial.align }]
    const matched = candidates.find((candidate) => fitsViewport(candidate.side, rect, width, height, vw, vh, gap))
    const triggerVisible = rect.bottom > 0 && rect.top < vh && rect.right > 0 && rect.left < vw
    let side = initial.side
    let align = initial.align
    let maxHeight = 0
    if (matched) {
      side = matched.side
      align = matched.align
    } else if (triggerVisible) {
      // 都放不下时把面板限高在可用空间内，避免压住触发器；初始方位剩余空间不足一半时再考虑对侧
      const vertical = initial.side === 'top' || initial.side === 'bottom'
      const sameAxis = candidates.filter((candidate) =>
        vertical
          ? candidate.side === 'top' || candidate.side === 'bottom'
          : candidate.side === 'left' || candidate.side === 'right'
      )
      const pool = sameAxis.length ? sameAxis : candidates
      const spaceOf = (candidate: Placement) => availableSpace(candidate.side, rect, vw, vh, gap)
      const preferred: Placement = pool.find((candidate) => candidate.side === initial.side) ?? initial
      const others = pool.filter((candidate) => candidate !== preferred)
      const maxBySpace = (list: Placement[]) =>
        list.reduce((current, candidate) => (spaceOf(candidate) > spaceOf(current) ? candidate : current))
      const enough = spaceOf(preferred) >= (vertical ? height : width) / 2
      const pickOther = others.find((candidate) => spaceOf(candidate) > 0)
      const widest = others.length ? maxBySpace(others) : preferred
      const best = enough ? preferred : (pickOther ?? (spaceOf(preferred) > 0 ? preferred : widest))
      if (spaceOf(best) > 0) {
        side = best.side
        align = best.align
        if (vertical) {
          maxHeight = Math.round(spaceOf(best))
        }
      }
    }
    const panelHeight = maxHeight > 0 ? Math.min(height, maxHeight) : height

    let left = rect.left
    let top = rect.bottom + gap
    if (side === 'top') {
      top = rect.top - gap - panelHeight
    } else if (side === 'left' || side === 'right') {
      left = side === 'left' ? rect.left - gap - width : rect.right + gap
      if (align === 'center') {
        top = rect.top + rect.height / 2 - panelHeight / 2
      } else if (align === 'end') {
        top = rect.bottom - panelHeight
      } else {
        top = rect.top
      }
    } else if (align === 'center') {
      left = rect.left + rect.width / 2 - width / 2
    } else if (align === 'end') {
      left = rect.right - width
    }

    if (triggerVisible) {
      left = clamp(left, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, vw - width - VIEWPORT_MARGIN))
      top = clamp(top, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, vh - panelHeight - VIEWPORT_MARGIN))
    }

    actualSide.value = side
    actualAlign.value = align
    const style = {
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
      zIndex: zIndex.value,
      ...hoverBridge(side, { left, top, width, height: panelHeight })
    } as CSSProperties
    if (maxHeight > 0 && maxHeight < height) {
      style.maxHeight = `${maxHeight}px`
      cappedHeight = maxHeight
    }
    if (matchedWidth || fixedWidth) {
      style.minWidth = targetWidth
    }
    if (fixedWidth) {
      style.maxWidth = targetWidth
    }
    position.value = style

    // fixed 坐标，避免被面板自身 overflow 裁剪
    const rawArrowOffset = Number(options.arrowOffset?.() ?? VIEWPORT_MARGIN)
    const arrowMargin = Number.isFinite(rawArrowOffset) ? Math.max(0, rawArrowOffset) : VIEWPORT_MARGIN
    const arrow: CSSProperties = {}
    if (side === 'top' || side === 'bottom') {
      const offsetX = clamp(rect.left + rect.width / 2 - left, arrowMargin, Math.max(arrowMargin, width - arrowMargin))
      arrow.left = `${Math.round(left + offsetX)}px`
      arrow.top = `${Math.round(side === 'bottom' ? top - 4 : top + panelHeight - 4)}px`
    } else {
      const offsetY = clamp(
        rect.top + rect.height / 2 - top,
        arrowMargin,
        Math.max(arrowMargin, panelHeight - arrowMargin)
      )
      arrow.top = `${Math.round(top + offsetY)}px`
      arrow.left = `${Math.round(side === 'right' ? left - 4 : left + width - 4)}px`
    }
    arrowStyle.value = arrow
  }

  function observePanel() {
    if (typeof ResizeObserver === 'undefined') {
      return
    }
    resizeObserver?.disconnect()
    const panel = options.panel.value
    if (!panel) {
      return
    }
    resizeObserver = new ResizeObserver(() => {
      if (options.open()) {
        update()
      }
    })
    resizeObserver.observe(panel)
  }

  function refresh() {
    nextTick(() => {
      update()
      observePanel()
    })
  }

  function handleScroll(event: Event) {
    if (!options.open()) {
      return
    }
    const target = event.target
    if (target instanceof Node && options.panel.value?.contains(target)) {
      return
    }
    if (panelScroll() === 'close') {
      options.close()
      return
    }
    update()
  }

  function handleResize() {
    if (options.open()) {
      update()
    }
  }

  function bind() {
    if (bound || typeof window === 'undefined') {
      return
    }
    bound = true
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)
  }

  function unbind() {
    if (!bound || typeof window === 'undefined') {
      return
    }
    bound = false
    window.removeEventListener('scroll', handleScroll, true)
    window.removeEventListener('resize', handleResize)
    resizeObserver?.disconnect()
    resizeObserver = null
  }

  watch(
    options.open,
    (value) => {
      if (value) {
        zIndex.value = resolveZIndex(options.props.zIndex, nextZIndex())
        bind()
        refresh()
        return
      }
      unbind()
    },
    { immediate: true }
  )

  watch(
    () => [
      options.placement?.(),
      options.offset?.(),
      options.arrowOffset?.(),
      options.matchWidth?.(),
      options.fixedWidth?.(),
      options.fallbackPlacements?.()
    ],
    () => {
      if (options.open()) {
        refresh()
      }
    }
  )

  onBeforeUnmount(unbind)

  return {
    position,
    arrowStyle,
    actualSide,
    actualAlign,
    zIndex,
    update,
    refresh
  }
}
