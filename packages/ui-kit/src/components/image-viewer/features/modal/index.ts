import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const imageViewerModalFeature = createClassFeature({
  id: 'image-viewer.modal',
  props: {
    lockScroll: { type: Boolean, default: true },
    closeOnPressEscape: { type: Boolean, default: true }
  },
  className: () => 'ui-image-viewer--modal'
})
