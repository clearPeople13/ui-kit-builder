import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { overlayConfig } from '../../shared/behavior'
import './core.css'

const imageViewerBaseProps = {
  modelValue: { type: Boolean },
  zIndex: { type: Number }
}

export function createImageViewer(features: UiFeature[] = []) {
  return createUiComponent(
    overlayConfig({
      name: 'UiImageViewer',
      baseClass: 'ui-image-viewer',
      props: imageViewerBaseProps,
      panelClass: 'ui-image-viewer__panel',
      visibleKey: 'modelValue',
      useMask: true,
      defaultVisible: false
    }),
    features
  )
}
