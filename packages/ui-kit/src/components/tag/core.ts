import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { wrapperConfig } from '../../shared/behavior'
import { tagClosableFeature } from './features/closable/index'
import { tagAppearanceFeature } from './features/appearance/index'
import './core.css'

const tagBaseProps = {
  type: { type: String, default: 'primary' },
  size: { type: String },
  color: { type: String },
  effect: { type: String, default: 'light' }
}

export function createTag(features: UiFeature[] = []) {
  return createUiComponent(
    {
      ...wrapperConfig({
        name: 'UiTag',
        baseClass: 'ui-tag',
        props: tagBaseProps,
        defaultTag: 'span'
      }),
      styles: (props) =>
        props.color
          ? { backgroundColor: props.color, borderColor: props.color, color: '#ffffff' }
          : {}
    },
    features
  )
}
