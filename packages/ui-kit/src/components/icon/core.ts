import type { Component } from 'vue'
import { h } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { sizeValue } from '../../shared/behavior'
import { DEFAULT_ICON_SIZE, DEFAULT_ICON_STROKE_WIDTH, resolveIcon } from '../../shared/icons'

const iconBaseProps = {
  icon: { type: [String, Object, Function] },
  name: { type: String, default: '' },
  size: { type: [Number, String] },
  color: { type: String, default: '' },
  spinning: { type: Boolean, default: false },
  strokeWidth: { type: Number, default: DEFAULT_ICON_STROKE_WIDTH }
}

export function createIcon(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiIcon',
      baseClass: 'ui-icon',
      props: iconBaseProps,
      tag: (props) => (props.tag as string) || 'i',
      classes: (props) => [props.spinning ? 'is-loading' : ''],
      styles: (props) => {
        const style: Record<string, string> = {}
        const size = sizeValue(props.size)
        if (size) {
          style.width = size
          style.height = size
          style.fontSize = size
        }
        if (props.color) {
          style.color = props.color
        }
        return style
      },
      attrs: (props) => (props.ariaLabel ? {} : { 'aria-hidden': 'true' }),
      content: ({ props, slots }) => {
        const slotted = slots.default?.()
        if (slotted) {
          return slotted
        }
        const icon = resolveIcon((props.icon as Component | string | undefined) ?? (props.name as string))
        return icon
          ? h(icon, {
              size: DEFAULT_ICON_SIZE,
              'stroke-width': props.strokeWidth ?? DEFAULT_ICON_STROKE_WIDTH
            })
          : null
      }
    },
    features
  )
}
