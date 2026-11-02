import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const uploadMultipleFeature = createClassFeature({
  id: 'upload.multiple',
  props: {
    multiple: { type: Boolean }
  },
  className: () => 'ui-upload--multiple'
})
