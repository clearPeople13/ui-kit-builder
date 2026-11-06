import type { VNode, VNodeChild } from 'vue'
import { Fragment, h, isVNode, onBeforeUnmount, ref } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { sizeValue, wrapperConfig } from '../../shared/behavior'
import { clamp } from '../../shared/utils'
import { splitterLazyFeature } from './features/lazy/index'
import { splitterPanelDraggableFeature } from './features/splitter-panel-draggable/index'
import './core.css'

interface SplitterPanelMeta {
  min: () => unknown
  max: () => unknown
}

interface SplitterContext {
  register: (meta: SplitterPanelMeta) => number
  sizeAt: (index: number) => number | undefined
}

const SPLITTER_CONTEXT = Symbol('ui-splitter-context')
const PANEL_CLASS = 'ui-splitter-panel'
const KEYBOARD_STEP = 16
const CLICK_TOLERANCE = 4

const splitterBaseProps = {
  layout: { type: String, default: 'horizontal' }
}

function flattenVNodes(nodes: unknown, out: VNode[] = []): VNode[] {
  if (Array.isArray(nodes)) {
    for (const node of nodes) {
      flattenVNodes(node, out)
    }
    return out
  }
  if (!isVNode(nodes)) {
    return out
  }
  if (nodes.type === Fragment) {
    flattenVNodes(nodes.children as any, out)
    return out
  }
  out.push(nodes)
  return out
}

function panelElementsOf(container: Element | null): HTMLElement[] {
  if (!container) {
    return []
  }
  return Array.from(container.children).filter((child) => child.classList.contains(PANEL_CLASS)) as HTMLElement[]
}

function resolveLimit(value: unknown, total: number, fallback: number): number {
  if (value === undefined || value === null || value === '') {
    return fallback
  }
  if (typeof value === 'number') {
    return value
  }
  const text = String(value)
  if (text.endsWith('%')) {
    return (Number.parseFloat(text) / 100) * total
  }
  const parsed = Number.parseFloat(text)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function createSplitter(features: UiFeature[] = []) {
  return createUiComponent(
    {
      ...wrapperConfig({
        name: 'UiSplitter',
        baseClass: 'ui-splitter',
        props: splitterBaseProps,
        defaultTag: 'div'
      }),
      classes: (props) => [props.layout === 'vertical' ? 'is-vertical' : 'is-horizontal'],
      setup(props, { provide }) {
        const sizes = ref<number[] | null>(null)
        const pending = ref<number[] | null>(null)
        const lastSizes = ref<number[]>([])
        const dragging = ref(false)
        const metas: SplitterPanelMeta[] = []
        let stopDrag: (() => void) | null = null

        function register(meta: SplitterPanelMeta): number {
          const index = metas.length
          metas.push(meta)
          return index
        }

        function context(): SplitterContext {
          return {
            register,
            sizeAt: (index: number) => sizes.value?.[index]
          }
        }

        provide(SPLITTER_CONTEXT, context())

        function isHorizontal(): boolean {
          return props.layout !== 'vertical'
        }

        function limitPair(index: number, container: HTMLElement, startSizes: number[]) {
          const horizontal = isHorizontal()
          const total = horizontal ? container.clientWidth : container.clientHeight
          const minA = resolveLimit(metas[index]?.min(), total, 0)
          const minB = resolveLimit(metas[index + 1]?.min(), total, 0)
          const maxA = resolveLimit(metas[index]?.max(), total, Number.POSITIVE_INFINITY)
          const maxB = resolveLimit(metas[index + 1]?.max(), total, Number.POSITIVE_INFINITY)
          const minDelta = Math.max(minA - startSizes[index], startSizes[index + 1] - maxB)
          const maxDelta = Math.min(maxA - startSizes[index], startSizes[index + 1] - minB)
          return { minDelta, maxDelta }
        }

        function restoreCollapsed(index: number, container: HTMLElement, startSizes: number[]) {
          const horizontal = isHorizontal()
          const total = horizontal ? container.clientWidth : container.clientHeight
          const next = [...startSizes]
          for (const side of [index, index + 1] as const) {
            if (next[side] > 0 || !(lastSizes.value[side] > 0)) {
              continue
            }
            const other = side === index ? index + 1 : index
            const minOther = resolveLimit(metas[other]?.min(), total, 0)
            const expanded = Math.min(lastSizes.value[side], next[other] - minOther)
            if (expanded <= 0) {
              continue
            }
            next[side] = expanded
            next[other] = next[other] - expanded
          }
          if (next[index] !== startSizes[index] || next[index + 1] !== startSizes[index + 1]) {
            sizes.value = next
          }
        }

        function applyPending(index: number, container: HTMLElement, delta: number) {
          const panels = panelElementsOf(container)
          const horizontal = isHorizontal()
          const startSizes = panels.map((panel) =>
            horizontal ? panel.getBoundingClientRect().width : panel.getBoundingClientRect().height
          )
          const { minDelta, maxDelta } = limitPair(index, container, startSizes)
          const clamped = clamp(delta, minDelta, maxDelta)
          const next = [...startSizes]
          next[index] = startSizes[index] + clamped
          next[index + 1] = startSizes[index + 1] - clamped
          lastSizes.value[index] = next[index] > 0 ? next[index] : (lastSizes.value[index] ?? 0)
          lastSizes.value[index + 1] = next[index + 1] > 0 ? next[index + 1] : (lastSizes.value[index + 1] ?? 0)
          sizes.value = next
        }

        function startDrag(index: number, event: PointerEvent) {
          if (event.button !== 0) {
            return
          }
          const container = (event.currentTarget as HTMLElement | null)?.parentElement
          if (!container) {
            return
          }
          // TS 不会把 const 的收窄带进嵌套闭包，finish 里需要非空类型
          const containerEl = container
          const panels = panelElementsOf(container)
          if (panels.length < 2) {
            return
          }
          event.preventDefault()
          const horizontal = isHorizontal()
          const startSizes = panels.map((panel) =>
            horizontal ? panel.getBoundingClientRect().width : panel.getBoundingClientRect().height
          )
          sizes.value = startSizes
          // 单次 move 就把面板拖到 0 时 onMove 记不到正值，先以起点宽度作基线
          lastSizes.value = startSizes.map((size, i) => (size > 0 ? size : (lastSizes.value[i] ?? 0)))
          const startPos = horizontal ? event.clientX : event.clientY
          const { minDelta, maxDelta } = limitPair(index, container, startSizes)

          function onMove(moveEvent: PointerEvent) {
            const raw = (horizontal ? moveEvent.clientX : moveEvent.clientY) - startPos
            const clamped = clamp(raw, minDelta, maxDelta)
            const next = [...startSizes]
            next[index] = startSizes[index] + clamped
            next[index + 1] = startSizes[index + 1] - clamped
            lastSizes.value[index] = next[index] > 0 ? next[index] : (lastSizes.value[index] ?? 0)
            lastSizes.value[index + 1] = next[index + 1] > 0 ? next[index + 1] : (lastSizes.value[index + 1] ?? 0)
            if (props.lazy) {
              pending.value = next
            } else {
              sizes.value = next
            }
          }

          function finish(endEvent?: PointerEvent) {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', finish)
            window.removeEventListener('pointercancel', finish)
            document.body.style.userSelect = ''
            document.body.style.cursor = ''
            dragging.value = false
            if (pending.value) {
              sizes.value = pending.value
              pending.value = null
            }
            // 点击收起边缘（几乎未拖动）时，把收起的面板恢复到收起前的宽度
            if (endEvent?.type === 'pointerup' && lastSizes.value.length) {
              const endPos = horizontal ? endEvent.clientX : endEvent.clientY
              if (Math.abs(endPos - startPos) < CLICK_TOLERANCE) {
                restoreCollapsed(index, containerEl, startSizes)
              }
            }
            stopDrag = null
          }

          dragging.value = true
          document.body.style.userSelect = 'none'
          document.body.style.cursor = horizontal ? 'col-resize' : 'row-resize'
          window.addEventListener('pointermove', onMove)
          window.addEventListener('pointerup', finish)
          window.addEventListener('pointercancel', finish)
          stopDrag = finish
        }

        function handleKeydown(index: number, event: KeyboardEvent) {
          const horizontal = isHorizontal()
          let delta = 0
          if (horizontal && event.key === 'ArrowLeft') {
            delta = -KEYBOARD_STEP
          } else if (horizontal && event.key === 'ArrowRight') {
            delta = KEYBOARD_STEP
          } else if (!horizontal && event.key === 'ArrowUp') {
            delta = -KEYBOARD_STEP
          } else if (!horizontal && event.key === 'ArrowDown') {
            delta = KEYBOARD_STEP
          }
          if (!delta) {
            return
          }
          event.preventDefault()
          const container = (event.currentTarget as HTMLElement | null)?.parentElement
          if (container) {
            applyPending(index, container, delta)
          }
        }

        onBeforeUnmount(() => {
          stopDrag?.()
        })

        return {
          startDrag,
          handleKeydown,
          get dragging() {
            return dragging.value
          },
          get collapsed() {
            const list = sizes.value
            if (!list) {
              return []
            }
            return list.map((size) => size <= 0)
          }
        }
      },
      content: ({ slots, state, props }) => {
        const panels = flattenVNodes(slots.default?.() ?? [])
        if (!panels.length) {
          return null
        }
        const layout = state.dragging ? ' is-dragging' : ''
        const separatorOrientation = props.layout === 'vertical' ? 'horizontal' : 'vertical'
        return panels.flatMap((panel, index) => {
          if (index === panels.length - 1) {
            return [panel]
          }
          const collapsed = state.collapsed ?? []
          const isCollapsed = Boolean(collapsed[index]) || Boolean(collapsed[index + 1])
          return [
            panel,
            h('div', {
              key: `ui-splitter-bar-${index}`,
              class: ['ui-splitter__bar', layout, isCollapsed ? 'is-collapsed' : ''],
              role: 'separator',
              tabindex: 0,
              'aria-orientation': separatorOrientation,
              onPointerdown: (event: PointerEvent) => state.startDrag(index, event),
              onKeydown: (event: KeyboardEvent) => state.handleKeydown(index, event)
            })
          ]
        }) as VNodeChild[]
      }
    },
    features
  )
}

const splitterPanelBaseProps = {
  size: { type: [String, Number] },
  min: { type: [String, Number] },
  max: { type: [String, Number] }
}

export function createSplitterPanel(features: UiFeature[] = []) {
  return createUiComponent(
    {
      ...wrapperConfig({
        name: 'UiSplitterPanel',
        baseClass: 'ui-splitter-panel',
        props: splitterPanelBaseProps,
        defaultTag: 'div'
      }),
      setup(props, { inject }) {
        const context = inject(SPLITTER_CONTEXT, null) as SplitterContext | null
        const index =
          context?.register({
            min: () => props.min,
            max: () => props.max
          }) ?? 0
        return {
          get size() {
            return context?.sizeAt(index)
          },
          get initialSize() {
            return sizeValue(props.size)
          }
        }
      },
      styles: (_props, state) => {
        const px = state.size
        if (px !== undefined) {
          // 拖拽收起到 0 时 padding 仍会占位（content 最小为 0 但 padding 不可压缩），需一并置零隐藏
          if (px <= 0) {
            return { flex: '0 0 0px', padding: '0', visibility: 'hidden' }
          }
          return { flex: `0 0 ${px}px` }
        }
        const initial = state.initialSize
        if (initial) {
          return { flex: `0 0 ${initial}` }
        }
        return { flex: '1 1 0' }
      }
    },
    features
  )
}
