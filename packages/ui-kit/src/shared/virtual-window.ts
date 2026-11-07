/**
 * 虚拟窗口的唯一算法来源（§25 起）。
 *
 * 背景：Select / Cascader / CascaderPanel / Table / VirtualList 各自手写了一套
 * `scrollTop + itemHeight + overscan` 的算术，overscan 分别是 5 / 4 / 4 / 不同、
 * 边界 clamp 写法也各不一样。同一类「滚到末尾时渲染区间算错一屏」的问题在
 * 不同组件里会重复出现，修一处不修其余。
 *
 * 这里只放纯函数：不碰 DOM、不碰 Vue，任何组件都能引用，也便于单测穷举边界。
 */

/** 未声明 overscan 时的默认上下缓冲行数 */
export const VIRTUAL_DEFAULT_OVERSCAN = 4

/** 行高未知时的兜底值，与各组件既有默认值保持一致 */
export const VIRTUAL_DEFAULT_ITEM_SIZE = 34

/** 可视高度未知时的兜底值，与既有浮层面板默认最大高度一致 */
export const VIRTUAL_DEFAULT_VIEWPORT = 274

export interface VirtualRangeInput {
  /** 当前滚动位置（px） */
  scrollTop: number
  /** 可视区高度（px）；传 0 / 负数时退回 fallbackViewport */
  viewport: number
  /** 行高（px）；传 0 / 负数时退回 fallbackItemSize */
  itemSize: number
  /** 总行数 */
  total: number
  /** 上下各多渲染几行，默认 VIRTUAL_DEFAULT_OVERSCAN */
  overscan?: number
  fallbackItemSize?: number
  fallbackViewport?: number
}

export interface VirtualRange {
  /** 是否进入窗口化（总行数为 0 时为 false，调用方应回退空态） */
  active: boolean
  /** 实际采用的行高 */
  itemSize: number
  /** 实际采用的可视高度 */
  viewport: number
  /** 渲染区间起始下标（含） */
  start: number
  /** 渲染区间结束下标（不含） */
  end: number
  /** 区间起始行对应的像素偏移，等价于 start * itemSize */
  offset: number
  /** 全部行数撑开的总高度，用于占位层 */
  totalSize: number
}

function positive(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : 0
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}

/** 解析行高：显式值优先，其次兜底值，最后 VIRTUAL_DEFAULT_ITEM_SIZE */
export function resolveVirtualItemSize(itemSize?: number, fallback = VIRTUAL_DEFAULT_ITEM_SIZE): number {
  return positive(itemSize) || positive(fallback) || VIRTUAL_DEFAULT_ITEM_SIZE
}

/** 解析可视高度：显式值优先，其次兜底值，最后 VIRTUAL_DEFAULT_VIEWPORT */
export function resolveVirtualViewport(viewport?: number, fallback = VIRTUAL_DEFAULT_VIEWPORT): number {
  return positive(viewport) || positive(fallback) || VIRTUAL_DEFAULT_VIEWPORT
}

/**
 * 计算窗口区间。所有边界（空列表、滚动越界、总行数不足一屏、行高/可视高度未知）
 * 都收敛在这里，调用方不再各自 clamp。
 */
export function computeVirtualRange(input: VirtualRangeInput): VirtualRange {
  const total = Math.max(0, Math.floor(Number(input.total) || 0))
  const itemSize = resolveVirtualItemSize(input.itemSize, input.fallbackItemSize)
  const viewport = resolveVirtualViewport(input.viewport, input.fallbackViewport)
  const overscan = Math.max(0, Math.floor(Number(input.overscan ?? VIRTUAL_DEFAULT_OVERSCAN) || 0))
  const totalSize = total * itemSize
  if (!total) {
    return { active: false, itemSize, viewport, start: 0, end: 0, offset: 0, totalSize: 0 }
  }
  // 滚动位置可能来自旧内容（列表变短后未重置），先夹到有效范围再算区间
  const scrollTop = clamp(Number(input.scrollTop) || 0, 0, Math.max(0, totalSize - itemSize))
  const start = clamp(Math.floor(scrollTop / itemSize) - overscan, 0, total - 1)
  const end = clamp(Math.ceil((scrollTop + viewport) / itemSize) + overscan, start + 1, total)
  return { active: true, itemSize, viewport, start, end, offset: start * itemSize, totalSize }
}

/** 把活动行滚进可视区所需的 scrollTop（已夹在有效范围内） */
export function alignVirtualScrollTop(
  index: number,
  scrollTop: number,
  itemSize: number,
  viewport: number,
  total: number
): number {
  const count = Math.max(0, Math.floor(Number(total) || 0))
  const size = resolveVirtualItemSize(itemSize)
  const view = resolveVirtualViewport(viewport)
  if (!count || index < 0) {
    return clamp(Number(scrollTop) || 0, 0, Math.max(0, count * size - size))
  }
  const maxScrollTop = Math.max(0, count * size - view)
  const top = clamp(index, 0, count - 1) * size
  const current = clamp(Number(scrollTop) || 0, 0, maxScrollTop)
  if (top < current) {
    return top
  }
  if (top + size > current + view) {
    return clamp(top + size - view, 0, maxScrollTop)
  }
  return current
}
