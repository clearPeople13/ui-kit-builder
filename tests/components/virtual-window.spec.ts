/**
 * 虚拟窗口内核（§25）：Select / Cascader / CascaderPanel / VirtualList 共用的唯一算法来源。
 *
 * 这些用例只测纯函数，不挂组件 —— 边界（空列表、不足一屏、滚到末尾、行高/可视高度未知、
 * scrollTop 越界）以前在四个组件里各写一遍 clamp，现在收敛到一处，也必须在这一处穷举。
 */
import { describe, expect, it } from 'vitest'
import {
  VIRTUAL_DEFAULT_ITEM_SIZE,
  VIRTUAL_DEFAULT_OVERSCAN,
  VIRTUAL_DEFAULT_VIEWPORT,
  alignVirtualScrollTop,
  computeVirtualRange,
  resolveVirtualItemSize,
  resolveVirtualViewport
} from '../../packages/ui-kit/src/shared/virtual-window'

describe('shared/virtual-window', () => {
  describe('computeVirtualRange', () => {
    it('空列表不进窗口化，总高为 0', () => {
      const range = computeVirtualRange({ scrollTop: 0, viewport: 274, itemSize: 34, total: 0 })
      expect(range.active).toBe(false)
      expect(range.start).toBe(0)
      expect(range.end).toBe(0)
      expect(range.totalSize).toBe(0)
    })

    it('总行数不足一屏时全量渲染，end 等于总行数', () => {
      const range = computeVirtualRange({ scrollTop: 0, viewport: 274, itemSize: 34, total: 3 })
      expect(range).toMatchObject({ active: true, start: 0, end: 3, offset: 0, totalSize: 102 })
    })

    it('常规滚动：上下各多渲染 overscan 行', () => {
      const range = computeVirtualRange({ scrollTop: 1020, viewport: 274, itemSize: 34, total: 1000 })
      // 1020 / 34 = 30，减 4 行缓冲 → 26；ceil(1294 / 34) = 39，加缓冲 → 43
      expect(range.start).toBe(26)
      expect(range.end).toBe(43)
      expect(range.offset).toBe(26 * 34)
      expect(range.totalSize).toBe(34000)
    })

    it('scrollTop 越界（列表变短后未重置）夹到末行，不会算出空窗口', () => {
      const range = computeVirtualRange({ scrollTop: 999999, viewport: 274, itemSize: 34, total: 100 })
      expect(range.start).toBeLessThan(range.end)
      expect(range.end).toBe(100)
      expect(range.start).toBeGreaterThanOrEqual(0)
    })

    it('负数 scrollTop 从 0 起算', () => {
      const range = computeVirtualRange({ scrollTop: -500, viewport: 274, itemSize: 34, total: 100 })
      expect(range.start).toBe(0)
      expect(range.end).toBe(13)
    })

    it('行高与可视高度未知时退回默认值', () => {
      const zero = computeVirtualRange({ scrollTop: 0, viewport: 0, itemSize: 0, total: 100 })
      expect(zero.itemSize).toBe(VIRTUAL_DEFAULT_ITEM_SIZE)
      expect(zero.viewport).toBe(VIRTUAL_DEFAULT_VIEWPORT)
      const fallback = computeVirtualRange({
        scrollTop: 0,
        viewport: 0,
        itemSize: 0,
        total: 100,
        fallbackItemSize: 40,
        fallbackViewport: 300
      })
      expect(fallback.itemSize).toBe(40)
      expect(fallback.viewport).toBe(300)
    })

    it('overscan 可调，默认值固定为 4', () => {
      const none = computeVirtualRange({ scrollTop: 340, viewport: 340, itemSize: 34, total: 100, overscan: 0 })
      expect(none.start).toBe(10)
      const wide = computeVirtualRange({ scrollTop: 340, viewport: 340, itemSize: 34, total: 100, overscan: 10 })
      expect(wide.start).toBe(0)
      // ceil(680 / 34) = 20，加 10 行缓冲 → 30
      expect(wide.end).toBe(30)
      const fallback = computeVirtualRange({ scrollTop: 340, viewport: 340, itemSize: 34, total: 100 })
      expect(fallback.start).toBe(10 - VIRTUAL_DEFAULT_OVERSCAN)
    })

    it('小数与字符串行高统一归一，不会出现 NaN 区间', () => {
      const range = computeVirtualRange({ scrollTop: 100.6, viewport: 200.2, itemSize: 33.9, total: 50 })
      expect(Number.isFinite(range.start)).toBe(true)
      expect(Number.isFinite(range.end)).toBe(true)
      expect(Number.isInteger(range.start)).toBe(true)
      expect(Number.isInteger(range.end)).toBe(true)
    })
  })

  describe('alignVirtualScrollTop', () => {
    it('活动行在可视区上方时回到行首', () => {
      expect(alignVirtualScrollTop(5, 1000, 34, 274, 100)).toBe(170)
    })

    it('活动行在可视区下方时贴到行尾', () => {
      // 行 40 底边 1394，视口 274 → 需要 1120
      expect(alignVirtualScrollTop(40, 0, 34, 274, 100)).toBe(1120)
    })

    it('活动行已可见时不改变滚动位置', () => {
      expect(alignVirtualScrollTop(10, 340, 34, 274, 100)).toBe(340)
    })

    it('末尾不会被滚过总高减视口', () => {
      const total = 100
      const size = 34
      const viewport = 274
      expect(alignVirtualScrollTop(99, 0, size, viewport, total)).toBe(total * size - viewport)
    })

    it('索引越界夹到有效范围', () => {
      expect(alignVirtualScrollTop(-5, 200, 34, 274, 100)).toBe(200)
      expect(alignVirtualScrollTop(999, 0, 34, 274, 100)).toBe(100 * 34 - 274)
    })
  })

  describe('默认值解析', () => {
    it('非法值一律退回兜底', () => {
      expect(resolveVirtualItemSize(undefined)).toBe(VIRTUAL_DEFAULT_ITEM_SIZE)
      expect(resolveVirtualItemSize(-1)).toBe(VIRTUAL_DEFAULT_ITEM_SIZE)
      expect(resolveVirtualViewport(Number.NaN)).toBe(VIRTUAL_DEFAULT_VIEWPORT)
      expect(resolveVirtualViewport(0, 200)).toBe(200)
    })
  })
})
