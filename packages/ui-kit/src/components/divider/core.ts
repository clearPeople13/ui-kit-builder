import { h } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { wrapperConfig } from '../../shared/behavior'
import './core.css'

const dividerBaseProps = {
  direction: { type: String, default: 'horizontal' },
  contentPosition: { type: String, default: 'center' },
  borderStyle: { type: String, default: 'solid' },
  content: { type: String, default: '' }
}

export function createDivider(features: UiFeature[] = []) {
  return createUiComponent(
    {
      ...wrapperConfig({
        name: 'UiDivider',
        baseClass: 'ui-divider',
        props: dividerBaseProps,
        defaultTag: 'div'
      }),
      classes: (props) => [`is-${props.direction || 'horizontal'}`, `is-content-${props.contentPosition || 'center'}`],
      styles: (props) => ({ '--ui-divider-border-style': props.borderStyle || 'solid' }),
      content: ({ props, slots }) => {
        const content = slots.default?.() ?? (props.content ? props.content : null)
        return content ? h('span', { class: 'ui-divider__text' }, [content]) : null
      }
    },
    features
  )
}
