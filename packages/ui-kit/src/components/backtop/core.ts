import type { CSSProperties } from 'vue'
import { h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { useLocale } from '../../shared/config'
import { sizeValue } from '../../shared/behavior'
import { ChevronUp } from '../../shared/icons'
import { renderIcon } from '../../shared/icon'
import './core.css'

const backtopBaseProps = {
  target: { type: String, default: '' },
  right: { type: [Number, String], default: 40 },
  bottom: { type: [Number, String], default: 40 },
  visibilityHeight: { type: Number, default: 200 }
}

function offsetStyle(shift: number, value: number | string): string | undefined {
  const base = sizeValue(value)
  if (!shift) {
    return base
  }
  return base ? `calc(${shift}px + ${base})` : `${shift}px`
}

export function createBacktop(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiBacktop',
      baseClass: 'ui-backtop',
      props: backtopBaseProps,
      setup(props) {
        const locale = useLocale('backtop')
        const visible = ref(false)
        // target 容器可视区域相对视口右下方向的缺口，叠加 props 偏移即为按钮位置
        const shift = ref({ right: 0, bottom: 0 })
        let container: HTMLElement | null = null

        function readScrollTop(): number {
          if (container) {
            return container.scrollTop
          }
          return window.scrollY || document.documentElement.scrollTop || 0
        }

        function sync() {
          const rect = container?.getBoundingClientRect()
          // fixed 的包含块是布局视口，clientWidth/Height 已排除经典滚动条占位
          const next = {
            right: rect ? Math.max(0, document.documentElement.clientWidth - rect.right) : 0,
            bottom: rect ? Math.max(0, document.documentElement.clientHeight - rect.bottom) : 0
          }
          if (next.right !== shift.value.right || next.bottom !== shift.value.bottom) {
            shift.value = next
          }
          visible.value = readScrollTop() >= (Number(props.visibilityHeight) || 0)
        }

        function bindContainer() {
          const element = props.target ? document.querySelector(props.target) : null
          container = element instanceof HTMLElement ? element : null
          sync()
        }

        function scrollToTop() {
          const target = container ?? window
          target.scrollTo({ top: 0, behavior: 'smooth' })
        }

        function handleKeydown(event: KeyboardEvent) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            scrollToTop()
          }
        }

        onMounted(() => {
          bindContainer()
          // 捕获阶段监听 window：既收到容器自身的 scroll，也收到祖先滚动造成的容器位移
          window.addEventListener('scroll', sync, { capture: true, passive: true })
          window.addEventListener('resize', sync)
        })
        onBeforeUnmount(() => {
          window.removeEventListener('scroll', sync, { capture: true })
          window.removeEventListener('resize', sync)
        })
        watch(() => [props.target, props.visibilityHeight], bindContainer)

        return {
          locale,
          get visible() {
            return visible.value
          },
          get shift() {
            return shift.value
          },
          scrollToTop,
          handleKeydown
        }
      },
      classes: (_props, state) => [state.visible ? 'is-visible' : 'is-hidden'],
      styles: (props, state) => {
        const { right, bottom } = state.shift as { right: number; bottom: number }
        return {
          right: offsetStyle(right, props.right),
          bottom: offsetStyle(bottom, props.bottom)
        } as CSSProperties
      },
      content: ({ state, slots }) =>
        h(
          'div',
          {
            class: 'ui-backtop__button',
            role: 'button',
            tabindex: 0,
            'aria-label': state.locale.value.label,
            onClick: state.scrollToTop,
            onKeydown: state.handleKeydown
          },
          slots.default?.() ?? renderIcon(ChevronUp, { size: 20 })
        )
    },
    features
  )
}
