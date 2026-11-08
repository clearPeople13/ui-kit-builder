import { h, onBeforeUnmount, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { formatLocale, useLocale } from '../../shared/config'
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
  // 条目未传 name 时用的是自动生成的随机名，不能对外暴露（指示器 aria-label、v-model 值都跳过它）
  autoName: boolean
}

const CAROUSEL_CONTEXT = Symbol('ui-carousel-context')

// 指示点读屏文案：优先 label，其次用户显式传入的 name，两者都没有时给可读兜底
function indicatorLabel(item: CarouselItemMeta, index: number, slideFormat: string): string {
  const label = String(item.label || '')
  if (label) {
    return label
  }
  if (!item.autoName && item.name) {
    return item.name
  }
  return formatLocale(slideFormat, { index: index + 1 })
}

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
  modelValue: { type: [String, Number] }
}

export function createCarousel(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiCarousel',
      baseClass: 'ui-carousel',
      props: carouselBaseProps,
      emits: ['update:modelValue', 'change'],
      setup(props, { provide, emit }) {
        const locale = useLocale('carousel')
        const active = ref(0)
        const items = ref<CarouselItemMeta[]>([])
        let timer: ReturnType<typeof setInterval> | null = null

        // v-model 值优先取条目 name，其次 label，都没有时退到序号
        function modelValueOf(index: number): string | number {
          const item = items.value[index]
          if (!item) {
            return index
          }
          if (!item.autoName && item.name) {
            return item.name
          }
          return item.label ? item.label : index
        }

        function indexOfModel(value: unknown): number {
          const list = items.value
          if (value === undefined || value === null || value === '' || !list.length) {
            return -1
          }
          const text = String(value)
          // 空文案不能参与匹配，否则会命中还没写 label 的条目
          if (!text) {
            return -1
          }
          const byName = list.findIndex((item) => item.name === text)
          if (byName >= 0) {
            return byName
          }
          const byLabel = list.findIndex((item) => item.label === text)
          if (byLabel >= 0) {
            return byLabel
          }
          const numeric = Number(value)
          if (!Number.isFinite(numeric)) {
            return -1
          }
          const length = list.length
          return ((Math.trunc(numeric) % length) + length) % length
        }

        function applyModel(silent = false) {
          const index = indexOfModel(props.modelValue)
          if (index < 0 || index === active.value) {
            return
          }
          if (silent) {
            active.value = index
            return
          }
          go(index)
        }

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
          const previous = active.value
          active.value = next
          if (previous === next) {
            return
          }
          emit('update:modelValue', modelValueOf(next))
          emit('change', modelValueOf(next), modelValueOf(previous))
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
          // 条目注册晚于首次渲染，受控初值要在注册后静默对齐一次
          applyModel(true)
          return items.value.length - 1
        }

        provide(CAROUSEL_CONTEXT, {
          active: () => active.value,
          length: () => items.value.length,
          direction: () => props.direction,
          register
        })

        // 外部改 modelValue 直接驱动切换
        watch(
          () => props.modelValue,
          () => applyModel()
        )

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
          locale,
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
                  'aria-label': indicatorLabel(item, index, state.locale.value.slideFormat),
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
          h(
            'button',
            {
              class: 'ui-carousel__arrow is-left',
              type: 'button',
              'aria-label': 'Previous slide',
              onClick: () => state.prev()
            },
            [renderIcon(ChevronLeft)]
          ),
          h(
            'button',
            {
              class: 'ui-carousel__arrow is-right',
              type: 'button',
              'aria-label': 'Next slide',
              onClick: () => state.next()
            },
            [renderIcon(ChevronRight)]
          ),
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
        const index =
          context?.register({
            name,
            label: String(props.label || props.name || ''),
            autoName: !props.name
          }) ?? 0
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
        state.slide !== null && !state.active
          ? ({ transform: `translateY(${state.slide * 100}%)` } as Record<string, string>)
          : {},
      content: ({ props, slots }) =>
        h('div', { class: 'ui-carousel-item__inner' }, [slots.default?.() ?? props.label ?? null])
    },
    features
  )
}
