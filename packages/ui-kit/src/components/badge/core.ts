import { h } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import './core.css'

const badgeBaseProps = {
  value: { type: [String, Number], default: '' },
  type: { type: String, default: 'danger' },
  max: { type: Number, default: 99 },
  isDot: { type: Boolean },
  hidden: { type: Boolean },
  showZero: { type: Boolean, default: true },
  color: { type: String }
}

function displayValue(value: string | number, max: number): string {
  if (typeof value === 'number' && Number.isFinite(max) && value > max) {
    return `${max}+`
  }
  return String(value)
}

export function createBadge(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiBadge',
      baseClass: 'ui-badge',
      props: badgeBaseProps,
      tag: (props) => (props.tag as string) || 'span',
      classes: (props) => [
        props.type ? `ui-badge--${props.type}` : '',
        props.isDot ? 'is-dot' : '',
        props.hidden ? 'is-hidden' : ''
      ],
      content: ({ props, slots }) => {
        const hasValue = props.value !== '' && props.value !== undefined && props.value !== null
        const visible =
          !props.hidden && (props.isDot || hasValue) && (props.showZero !== false || String(props.value) !== '0')
        const offset = Array.isArray(props.offset) ? props.offset : []
        const offsetX = Number(offset[0]) || 0
        const offsetY = Number(offset[1]) || 0
        return [
          slots.default?.() ?? null,
          visible
            ? h(
                'sup',
                {
                  class: 'ui-badge__content',
                  style: {
                    backgroundColor: props.color,
                    right: offsetX ? `${-offsetX}px` : undefined,
                    marginTop: offsetY ? `${offsetY}px` : undefined
                  }
                },
                props.isDot ? '' : displayValue(props.value, Number(props.max ?? 99))
              )
            : null
        ]
      }
    },
    features
  )
}
