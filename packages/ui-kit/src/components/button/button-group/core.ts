import type { UiFeature } from '../../../shared/feature'
import { createUiComponent } from '../../../shared/component'
import './button-group.css'

export interface ButtonGroupContext {
  size: () => string
  type: () => string
}

export const BUTTON_GROUP_CONTEXT = Symbol('ui-button-group-context')

const buttonGroupBaseProps = {
  size: { type: String, default: '' },
  type: { type: String, default: '' },
  tag: { type: String, default: 'div' },
  dir: { type: String, default: '' }
}

export function createButtonGroup(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiButtonGroup',
      baseClass: 'ui-button-group',
      props: buttonGroupBaseProps,
      tag: (props) => (props.tag as string) || 'div',
      attrs: (props) => (props.dir ? { dir: props.dir } : {}),
      setup(props, { provide: provideContext }) {
        provideContext(BUTTON_GROUP_CONTEXT, {
          size: () => props.size,
          type: () => props.type
        })
        return {}
      },
      content: ({ slots }) => slots.default?.() ?? null
    },
    features
  )
}
