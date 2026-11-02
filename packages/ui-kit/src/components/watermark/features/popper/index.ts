import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const watermarkPopperFeature = createClassFeature({
  id: 'watermark.popper',
  props: {
    offset: { type: Array }
  },
  className: () => 'ui-watermark--popper'
})
