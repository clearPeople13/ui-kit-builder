import type { CSSProperties } from 'vue'
import { computed, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { baseAttrs } from '../../shared/behavior'
import './core.css'

const affixBaseProps = {
  zIndex: { type: [Number, String], default: 100 },
  target: { type: String, default: '' },
  position: { type: String, default: 'top' },
  offset: { type: Number, default: 0 }
}

export function createAffix(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiAffix',
      baseClass: 'ui-affix',
      props: affixBaseProps,
      setup(props) {
        const sentinelRef = ref<HTMLElement>()
        const innerRef = ref<HTMLElement>()
        const fixed = ref(false)
        const size = ref({ width: 0, height: 0 })
        const placement = ref({ top: 0, bottom: 0, left: 0 })
        let frame = 0
        let autoContainer: HTMLElement | null = null

        function nearestScrollParent(element: HTMLElement | null): HTMLElement | null {
          let node = element?.parentElement ?? null
          while (node && node !== document.body && node !== document.documentElement) {
            const style = getComputedStyle(node)
            if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
              return node
            }
            node = node.parentElement
          }
          return null
        }

        function scrollContainer(): HTMLElement | null {
          if (!props.target) {
            return autoContainer
          }
          const element = document.querySelector(props.target)
          return element instanceof HTMLElement ? element : null
        }

        function frameRect(): { top: number; bottom: number } {
          const container = scrollContainer()
          if (!container) {
            return { top: 0, bottom: window.innerHeight }
          }
          const rect = container.getBoundingClientRect()
          return { top: rect.top, bottom: rect.bottom }
        }

        function update() {
          frame = 0
          const sentinel = sentinelRef.value
          const inner = innerRef.value
          if (!sentinel || !inner) {
            return
          }
          const viewport = frameRect()
          const sentinelRect = sentinel.getBoundingClientRect()
          const innerRect = inner.getBoundingClientRect()
          const offset = Number(props.offset) || 0
          const naturalHeight = fixed.value ? size.value.height : innerRect.height
          const naturalBottom = sentinelRect.top + naturalHeight
          const nextFixed =
            props.position === 'bottom'
              ? naturalBottom >= viewport.bottom - offset
              : sentinelRect.top <= viewport.top + offset
          if (nextFixed && !fixed.value) {
            size.value = {
              width: innerRect.width || inner.offsetWidth,
              height: innerRect.height || inner.offsetHeight
            }
            placement.value = {
              top: viewport.top + offset,
              bottom: window.innerHeight - viewport.bottom + offset,
              left: sentinelRect.left
            }
          }
          fixed.value = nextFixed
        }

        function schedule() {
          if (frame) {
            return
          }
          frame = requestAnimationFrame(update)
        }

        function bind() {
          autoContainer = props.target ? null : nearestScrollParent(sentinelRef.value ?? null)
          scrollContainer()?.addEventListener('scroll', schedule, { passive: true })
          window.addEventListener('scroll', schedule, { passive: true })
          window.addEventListener('resize', schedule)
          schedule()
        }

        function unbind() {
          scrollContainer()?.removeEventListener('scroll', schedule)
          window.removeEventListener('scroll', schedule)
          window.removeEventListener('resize', schedule)
          if (frame) {
            cancelAnimationFrame(frame)
            frame = 0
          }
        }

        onMounted(bind)
        watch(
          () => [props.target, props.position, props.offset],
          () => {
            unbind()
            fixed.value = false
            bind()
          }
        )
        onBeforeUnmount(unbind)

        const rootStyle = computed<CSSProperties>(() =>
          fixed.value
            ? {
                width: `${size.value.width}px`,
                height: `${size.value.height}px`
              }
            : {}
        )

        const innerStyle = computed<CSSProperties>(() => {
          if (!fixed.value) {
            return {}
          }
          const style: CSSProperties = {
            position: 'fixed',
            left: `${placement.value.left}px`,
            width: `${size.value.width}px`,
            zIndex: Number(props.zIndex) || 100
          }
          if (props.position === 'bottom') {
            style.bottom = `${placement.value.bottom}px`
          } else {
            style.top = `${placement.value.top}px`
          }
          return style
        })

        return {
          sentinelRef,
          innerRef,
          get fixed() {
            return fixed.value
          },
          get rootStyle() {
            return rootStyle.value
          },
          get innerStyle() {
            return innerStyle.value
          }
        }
      },
      classes: (props, state) => [
        state.fixed ? 'is-fixed' : '',
        `is-${props.position || 'top'}`
      ],
      styles: (_props, state) => state.rootStyle,
      attrs: (props) => baseAttrs(props),
      content: ({ slots, state }) => [
        h('span', {
          ref: state.sentinelRef,
          class: 'ui-affix__sentinel',
          'aria-hidden': 'true'
        }),
        h(
          'div',
          {
            ref: state.innerRef,
            class: 'ui-affix__inner',
            style: state.innerStyle
          },
          [slots.default?.() ?? null]
        )
      ]
    },
    features
  )
}
