import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { wrapperConfig } from '../../shared/behavior'
import './core.css'

const overlayBaseProps = {
  zIndex: { type: [String, Number] }
}

export function createOverlay(features: UiFeature[] = []) {
  return createUiComponent(
    wrapperConfig({
      name: 'UiOverlay',
      baseClass: 'ui-overlay',
      props: overlayBaseProps,
      defaultTag: 'div'
    }),
    features
  )
}
