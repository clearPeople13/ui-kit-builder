import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const imageViewerPopperFeature = createClassFeature({
  id: 'image-viewer.popper',
  props: {
    teleported: { type: Boolean }
  },
  className: () => 'ui-image-viewer--popper'
})
