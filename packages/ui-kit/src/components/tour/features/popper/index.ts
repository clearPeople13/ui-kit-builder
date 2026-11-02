import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const tourPopperFeature = createClassFeature({
  id: 'tour.popper',
  props: {
    appendTo: { type: [String, Object], default: 'body' },
    placement: { type: String, default: 'bottom' },
    offset: { type: Number, default: 10 },
    showArrow: { type: Boolean, default: true }
  },
  className: () => 'ui-tour--popper'
})
