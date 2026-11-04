import { h, onBeforeUnmount, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { sizeValue } from '../../shared/behavior'
import { renderIcon } from '../../shared/icon'
import './core.css'

interface CarouselContext {
  active: () => number
  length: () => number
  direction: () => string
  register: (item: CarouselItemMeta) => number
}
interface CarouselItemMeta {
  name: string
  label: string
}

const CAROUSEL_CONTEXT = Symbol('ui-carousel-context')

const carouselBaseProps = {
  type: { type: String, default: '' },
  height: { type: String, default: '' },
  trigger: { type: String, default: 'hover' },
  autoplay: { type: Boolean, default: true },
  interval: { type: Number, default: 3000 },
  indicatorPosition: { type: String, default: '' },
  arrow: { type: String, default: 'hover' },
  direction: { type: String, default: 'horizontal' },
  pauseOnHover: { type: Boolean, default: true },
}

export function createCarousel(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiCarousel',
      baseClass: 'ui-carousel',
      props: carouselBaseProps,
      setup(props, { provide }) {
        const active = ref(0)
        const items = ref<CarouselItemMeta[]>([])
        let timer: ReturnType<typeof setInterval> | null = null

        function go(index: number) {
          const length = items.value.length
          if (!length) {
            return
          }
          let next = index
          if (next < 0) {
            next = length - 1
          }
          if (next >= length) {
            next = 0
          }
          active.value = next
        }

        function next() {
          go(active.value + 1)
        }

        function prev() {
          go(active.value - 1)
        }

        function register(item: CarouselItemMeta): number {
          const index = items.value.findIndex((entry) => entry.name === item.name)
          if (index >= 0) {
            return index
          }
          items.value = [...items.value, item]
          return items.value.length - 1
        }

        provide(CAROUSEL_CONTEXT, {
          active: () => active.value,
          length: () => items.value.length,
          direction: () => props.direction,
          register
        })

        function startTimer() {
          stopTimer()
          if (!props.autoplay) {
            return
          }
          timer = setInterval(next, Math.max(500, Number(props.interval || 3000)))
        }

        function stopTimer() {
          if (timer) {
            clearInterval(timer)
          }
          timer = null
        }

        watch(() => props.autoplay, startTimer, { immediate: true })
        onBeforeUnmount(stopTimer)

        return {
          get active() {
            return active.value
          },
          next,
          prev,
          go,
          register,
          startTimer,
          stopTimer,
          get items(): CarouselItemMeta[] {
            return items.value
          }
        }
      },
      classes: (props) => [
        props.indicatorPosition ? `is-indicator-${props.indicatorPosition}` : '',
        props.direction ? `is-${props.direction}` : '',
        props.arrow && props.arrow !== 'hover' ? `is-arrow-${props.arrow}` : '',
        props.type === 'card' ? 'is-card' : ''
      ],
      styles: (props) => ({ height: sizeValue(props.height) }),
      attrs: () => ({
        onMouseenter: undefined
      }),
      content: ({ props, slots, state }) => {
        const indicators = state.items.length
          ? h(
              'div',
              { class: 'ui-carousel__indicators' },
              state.items.map((item: CarouselItemMeta, index: number) =>
                h('button', {
                  key: item.name,
                  type: 'button',
                  class: ['ui-carousel__indicator', index === state.active ? 'is-active' : ''],
                  'aria-label': String(item.label || item.name || index + 1),
                  'aria-current': index === state.active ? 'true' : undefined,
                  onMouseenter: () => {
                    if (props.trigger === 'hover') {
                      state.go(index)
                    }
                  },
                  onClick: () => state.go(index)
                })
              )
            )
          : null
        return [
          h(
            'div',
            {
              class: 'ui-carousel__track',
              onMouseenter: () => {
                if (props.pauseOnHover) {
                  state.stopTimer()
                }
              },
              onMouseleave: () => {
                if (props.pauseOnHover) {
                  state.startTimer()
                }
              }
            },
            [slots.default?.() ?? null]
          ),
          h('button', { class: 'ui-carousel__arrow is-left', type: 'button', onClick: () => state.prev() }, [
            renderIcon(ChevronLeft)
          ]),
          h('button', { class: 'ui-carousel__arrow is-right', type: 'button', onClick: () => state.next() }, [
            renderIcon(ChevronRight)
          ]),
          indicators
        ]
      }
    },
    features
  )
}

const carouselItemBaseProps = {
  name: { type: String, default: '' },
  label: { type: [String, Number], default: '' }
}

export function createCarouselItem(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiCarouselItem',
      baseClass: 'ui-carousel-item',
      props: carouselItemBaseProps,
      setup(props, { inject }) {
        const context = inject(CAROUSEL_CONTEXT, null) as CarouselContext | null
        const seed = Math.random().toString(36).slice(2, 8)
        const name = props.name || `item-${seed}`
        const index = context?.register({ name, label: String(props.label || props.name || '') }) ?? 0
        const relation = () => {
          if (!context) {
            return 'active'
          }
          const length = context.length()
          if (length < 2) {
            return 'active'
          }
          const active = context.active()
          if (active === index) {
            return 'active'
          }
          if ((active - 1 + length) % length === index) {
            return 'prev'
          }
          if ((active + 1) % length === index) {
            return 'next'
          }
          return 'rest'
        }
        return {
          itemName: name,
          get active() {
            if (!context) {
              return true
            }
            return context.active() === index
          },
          get relation() {
            return relation()
          },
          get slide() {
            if (!context || context.direction() !== 'vertical') {
              return null
            }
            const length = context.length()
            if (length < 2 || context.active() === index) {
              return 0
            }
            const forward = (index - context.active() + length) % length
            return forward <= length / 2 ? forward : forward - length
          }
        }
      },
      classes: (_props, state) => [
        state.active ? 'is-active' : '',
        state.relation === 'prev' ? 'is-prev' : '',
        state.relation === 'next' ? 'is-next' : '',
        state.relation === 'rest' ? 'is-rest' : '',
        state.slide !== null ? 'is-slide' : ''
      ],
      styles: (_props, state) =>
        state.slide !== null && !state.active ? ({ transform: `translateY(${state.slide * 100}%)` } as Record<string, string>) : {},
      content: ({ props, slots }) =>
        h('div', { class: 'ui-carousel-item__inner' }, [slots.default?.() ?? props.label ?? null])
    },
    features
  )
}
