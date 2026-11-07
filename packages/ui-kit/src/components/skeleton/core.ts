import { h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ImageIcon } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import './core.css'

const skeletonBaseProps = {
  animated: { type: Boolean },
  count: { type: Number, default: 1 },
  rows: { type: Number, default: 3 },
  throttle: { type: [Number, Object], default: 0 },
  loading: { type: Boolean, default: true }
}

export function createSkeleton(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiSkeleton',
      baseClass: 'ui-skeleton',
      props: skeletonBaseProps,
      setup(props) {
        function throttleDelay(): number {
          const value = props.throttle
          if (typeof value === 'number') {
            return Math.max(0, value)
          }
          if (value && typeof value === 'object') {
            const record = value as Record<string, unknown>
            const trailing = Number(record.trailing)
            if (Number.isFinite(trailing)) {
              return Math.max(0, trailing)
            }
            const leading = Number(record.leading)
            return Number.isFinite(leading) ? Math.max(0, leading) : 0
          }
          return 0
        }

        const initialDelay = throttleDelay()
        const renderedRows = ref(initialDelay ? 0 : Math.max(1, Number(props.rows ?? 3)))
        const renderedCount = ref(initialDelay ? 0 : Math.max(1, Number(props.count ?? 1)))
        let timer: ReturnType<typeof setTimeout> | null = null

        function clearTimer() {
          if (timer) {
            clearTimeout(timer)
            timer = null
          }
        }

        function apply() {
          renderedRows.value = Math.max(1, Number(props.rows ?? 3))
          renderedCount.value = Math.max(1, Number(props.count ?? 1))
        }

        function sync() {
          clearTimer()
          const delay = throttleDelay()
          if (!delay) {
            apply()
            return
          }
          timer = setTimeout(() => {
            timer = null
            apply()
          }, delay)
        }

        onMounted(() => {
          if (initialDelay) {
            sync()
          }
        })
        watch(() => [props.rows, props.count, props.throttle], sync)
        onBeforeUnmount(clearTimer)

        return { renderedRows, renderedCount }
      },
      classes: (props) => [props.animated ? 'is-animated' : ''],
      content: ({ props, slots, state }) => {
        if (props.loading === false) {
          return slots.default?.() ?? null
        }
        if (slots.default) {
          return slots.default()
        }
        const rows = state.renderedRows.value
        const groups = Array.from({ length: state.renderedCount.value }, (_item, groupIndex) =>
          h(
            'div',
            {
              class: 'ui-skeleton__group',
              key: groupIndex
            },
            Array.from({ length: rows }, (_, rowIndex) =>
              h('div', {
                class: ['ui-skeleton__item', 'is-text', rowIndex === rows - 1 ? 'is-last' : ''],
                key: rowIndex
              })
            )
          )
        )
        return groups
      }
    },
    features
  )
}

const skeletonItemBaseProps = {
  variant: { type: String, default: 'text' }
}

export function createSkeletonItem(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiSkeletonItem',
      baseClass: 'ui-skeleton-item',
      props: skeletonItemBaseProps,
      classes: (props) => [`is-${props.variant || 'text'}`],
      content: ({ props }) =>
        props.variant === 'image' ? renderIcon(ImageIcon, { class: 'ui-skeleton-item__icon' }) : null
    },
    features
  )
}
