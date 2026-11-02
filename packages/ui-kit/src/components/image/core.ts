import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { imageConfig } from '../../shared/behavior'
import { imageLoadingFeature } from './features/loading/index'
import { imageLazyFeature } from './features/lazy/index'
import { imagePreviewFeature } from './features/preview/index'
import './core.css'

const imageBaseProps = {
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  fit: { type: String, default: '' },
  zIndex: { type: Number },
  crossorigin: { type: String }
}

export function createImage(features: UiFeature[] = []) {
  return createUiComponent(
    imageConfig({
      name: 'UiImage',
      baseClass: 'ui-image',
      props: imageBaseProps
    }),
    features
  )
}
