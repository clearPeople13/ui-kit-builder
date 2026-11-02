import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const messagePopperFeature = createClassFeature({
  id: 'message.popper',
  props: {
    placement: { type: String },
    offset: { type: Number, default: 16 }
  },
  className: () => 'ui-message--popper'
})
