import type { CSSProperties } from 'vue'
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { collectFeatureExposed } from '../../shared/feature'
import { sizeValue } from '../../shared/behavior'
import { clamp } from '../../shared/utils'
import './core.css'

interface BarState {
  ratio: number
  size: number
  move: number
}

const MIN_THUMB_SIZE = 20
const EDGE_OFFSET = 2

function toBarState(clientSize: number, scrollSize: number, scrollOffset: number, minSize: number): BarState {
  const ratio = clientSize / scrollSize
  return {
    ratio,
    size: clamp(ratio * 100, (minSize / clientSize) * 100, 100),
    move: (scrollOffset / scrollSize) * 100
  }
}

export function createScrollbar(features: UiFeature[] = []) {
  return defineComponent({
    name: 'UiScrollbar',
    inheritAttrs: false,
    props: {
      distance: { type: Number, default: 0 },
      height: { type: [String, Number], default: '' },
      maxHeight: { type: [String, Number], default: '' },
      native: Boolean,
      wrapStyle: { type: [String, Object, Array], default: '' },
      wrapClass: { type: [String, Array, Object], default: '' },
      viewClass: { type: [String, Array, Object], default: '' },
      viewStyle: { type: [String, Object, Array], default: '' },
      noresize: Boolean,
      tag: { type: String, default: 'div' },
      always: Boolean,
      minSize: { type: Number, default: MIN_THUMB_SIZE },
      tabindex: { type: [String, Number], default: undefined },
      id: String,
      role: String,
      ariaLabel: String,
      ariaOrientation: { type: String, validator: (value: string) => ['horizontal', 'vertical'].includes(value) }
    },
    emits: ['scroll'],
    setup(props, { attrs, slots, expose, emit }) {
      const scrollbarRef = ref<HTMLElement>()
      const wrapRef = ref<HTMLElement>()
      const viewRef = ref<HTMLElement>()
      const verticalBar = ref<BarState>({ ratio: 1, size: 0, move: 0 })
      const horizontalBar = ref<BarState>({ ratio: 1, size: 0, move: 0 })
      const dragging = ref<'vertical' | 'horizontal' | null>(null)
      let resizeObserver: ResizeObserver | null = null
      let stopDrag: (() => void) | null = null

      const viewTag = computed(() => props.tag || 'div')

      function update() {
        const wrap = wrapRef.value
        if (!wrap) {
          return
        }
        const { clientHeight, scrollHeight, clientWidth, scrollWidth } = wrap
        if (clientHeight > 0) {
          verticalBar.value = toBarState(clientHeight, scrollHeight, wrap.scrollTop, props.minSize)
        }
        if (clientWidth > 0) {
          horizontalBar.value = toBarState(clientWidth, scrollWidth, wrap.scrollLeft, props.minSize)
        }
      }

      function handleScroll() {
        const wrap = wrapRef.value
        if (!wrap) {
          return
        }
        update()
        emit('scroll', { scrollTop: wrap.scrollTop, scrollLeft: wrap.scrollLeft })
      }

      function setScrollTop(value: number) {
        const wrap = wrapRef.value
        if (!wrap) {
          return
        }
        wrap.scrollTop = value
        update()
      }

      function setScrollLeft(value: number) {
        const wrap = wrapRef.value
        if (!wrap) {
          return
        }
        wrap.scrollLeft = value
        update()
      }

      function startDrag(event: PointerEvent, axis: 'vertical' | 'horizontal') {
        const wrap = wrapRef.value
        if (!wrap || event.button !== 0) {
          return
        }
        event.preventDefault()
        event.stopPropagation()
        const clientSize = axis === 'vertical' ? wrap.clientHeight : wrap.clientWidth
        const scrollSize = axis === 'vertical' ? wrap.scrollHeight : wrap.scrollWidth
        const thumbSize = axis === 'vertical' ? verticalBar.value.size : horizontalBar.value.size
        const trackSize = Math.max(clientSize * (1 - thumbSize / 100), 1)
        const scrollRange = Math.max(scrollSize - clientSize, 0)

        if (event.target === event.currentTarget) {
          const bar = event.currentTarget as HTMLElement
          const rect = bar.getBoundingClientRect()
          const barSize = axis === 'vertical' ? rect.height : rect.width
          const pointer =
            (axis === 'vertical' ? event.clientY : event.clientX) - (axis === 'vertical' ? rect.top : rect.left)
          const thumbPx = (barSize * thumbSize) / 100
          const thumbStart = clamp(pointer - thumbPx / 2, 0, Math.max(barSize - thumbPx, 0))
          const next = barSize > thumbPx ? (thumbStart / (barSize - thumbPx)) * scrollRange : 0
          if (axis === 'vertical') {
            wrap.scrollTop = next
          } else {
            wrap.scrollLeft = next
          }
          update()
        }

        const startPointer = axis === 'vertical' ? event.clientY : event.clientX
        const startScroll = axis === 'vertical' ? wrap.scrollTop : wrap.scrollLeft
        dragging.value = axis

        function onPointerMove(moveEvent: PointerEvent) {
          const current = axis === 'vertical' ? moveEvent.clientY : moveEvent.clientX
          const offset = ((current - startPointer) / trackSize) * scrollRange
          const next = clamp(startScroll + offset, 0, scrollRange)
          if (axis === 'vertical') {
            wrap!.scrollTop = next
          } else {
            wrap!.scrollLeft = next
          }
          update()
        }

        function onPointerUp() {
          dragging.value = null
          stopDrag = null
          window.removeEventListener('pointermove', onPointerMove)
          window.removeEventListener('pointerup', onPointerUp)
          window.removeEventListener('pointercancel', onPointerUp)
        }

        stopDrag = onPointerUp
        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', onPointerUp)
        window.addEventListener('pointercancel', onPointerUp)
      }

      function thumbStyle(axis: 'vertical' | 'horizontal', bar: BarState): CSSProperties {
        const move = bar.size > 0 ? (bar.move * 100) / bar.size : 0
        return axis === 'vertical'
          ? { height: `${bar.size}%`, transform: `translateY(${move}%)` }
          : { width: `${bar.size}%`, transform: `translateX(${move}%)` }
      }

      function renderBar(axis: 'vertical' | 'horizontal', bar: BarState) {
        const isVertical = axis === 'vertical'
        return h(
          'div',
          {
            class: [
              'ui-scrollbar__bar',
              `is-${axis}`,
              {
                'is-always': props.always,
                'is-hidden': bar.ratio >= 1,
                'is-dragging': dragging.value === axis
              }
            ],
            style: isVertical
              ? { top: `${EDGE_OFFSET}px`, right: `${EDGE_OFFSET + props.distance}px` }
              : { left: `${EDGE_OFFSET}px`, bottom: `${EDGE_OFFSET + props.distance}px` },
            onPointerdown: (event: PointerEvent) => startDrag(event, axis)
          },
          [
            h('div', {
              class: 'ui-scrollbar__thumb',
              style: thumbStyle(axis, bar)
            })
          ]
        )
      }

      onMounted(() => {
        nextTick(update)
        if (!props.noresize && typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(update)
          if (wrapRef.value) {
            resizeObserver.observe(wrapRef.value)
          }
          if (viewRef.value) {
            resizeObserver.observe(viewRef.value)
          }
        }
      })

      onBeforeUnmount(() => {
        resizeObserver?.disconnect()
        stopDrag?.()
      })

      const exposed = collectFeatureExposed(features, {
        props,
        attrs,
        slots,
        emit: emit as any,
        root: scrollbarRef,
        state: { update, handleScroll, setScrollTop, setScrollLeft }
      })
      if (Object.keys(exposed).length) {
        expose(exposed)
      }

      return function render() {
        const rootStyle = {
          '--ui-scrollbar-distance': `${props.distance}px`
        } as CSSProperties

        return h(
          'div',
          {
            ...attrs,
            ref: scrollbarRef,
            id: props.id,
            role: props.role,
            tabindex: props.tabindex,
            'aria-label': props.ariaLabel,
            'aria-orientation': props.ariaOrientation,
            class: [attrs.class, 'ui-scrollbar', { 'ui-scrollbar--native': props.native }],
            style: { ...(attrs.style as CSSProperties), ...rootStyle }
          },
          [
            h(
              'div',
              {
                ref: wrapRef,
                class: ['ui-scrollbar__wrap', { 'ui-scrollbar__wrap--hidden-default': !props.native }, props.wrapClass],
                style: [
                  props.wrapStyle,
                  {
                    height: sizeValue(props.height),
                    maxHeight: sizeValue(props.maxHeight)
                  }
                ],
                onScroll: handleScroll
              },
              [
                h(
                  viewTag.value,
                  {
                    ref: viewRef,
                    class: ['ui-scrollbar__view', props.viewClass],
                    style: props.viewStyle
                  },
                  slots.default?.()
                )
              ]
            ),
            props.native ? null : renderBar('vertical', verticalBar.value),
            props.native ? null : renderBar('horizontal', horizontalBar.value)
          ]
        )
      }
    }
  })
}
