import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { textConfig } from '../../shared/behavior'
import './core.css'

const textBaseProps = {
  type: { type: String, default: '' },
  size: { type: String, default: '' },
  truncated: { type: Boolean },
  lineClamp: { type: [String, Number] },
  tag: { type: String, default: 'span' }
}

export function createText(features: UiFeature[] = []) {
  const base = textConfig({
    name: 'UiText',
    baseClass: 'ui-text',
    props: textBaseProps,
    defaultTag: 'span'
  })
  return createUiComponent(
    {
      ...base,
      classes: (props, state) => {
        const classes = base.classes?.(props, state) ?? []
        if (props.lineClamp) {
          classes.push('is-line-clamp')
        } else if (props.truncated) {
          classes.push('is-truncated')
        }
        return classes
      },
      styles: (props) => {
        if (!props.lineClamp) {
          return {}
        }
        return {
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: String(props.lineClamp),
          overflow: 'hidden'
        }
      }
    },
    features
  )
}
