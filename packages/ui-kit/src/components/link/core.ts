import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { textConfig } from '../../shared/behavior'
import { linkIconsFeature } from './features/icons/index'
import { linkAppearanceFeature } from './features/appearance/index'
import './core.css'

const linkBaseProps = {
  type: { type: String },
  disabled: { type: Boolean },
  href: { type: String, default: '' },
  target: { type: String, default: '_self' }
}

export function createLink(features: UiFeature[] = []) {
  const base = textConfig({
    name: 'UiLink',
    baseClass: 'ui-link',
    props: linkBaseProps,
    defaultTag: 'a'
  })
  return createUiComponent(
    {
      ...base,
      attrs: (props, state) => {
        const attrs = base.attrs?.(props, state) ?? {}
        if (!props.disabled) {
          return attrs
        }
        return {
          ...attrs,
          tabindex: -1,
          'aria-disabled': 'true',
          onClick: (event: MouseEvent) => event.preventDefault()
        }
      }
    },
    features
  )
}
