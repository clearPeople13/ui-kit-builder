import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const tourStepPopperFeature = createClassFeature({
  id: 'tour.tour-step-popper',
  props: {
    placement: { type: String, default: undefined },
    showArrow: { type: Boolean, default: undefined }
  },
  className: () => 'ui-tour-step--popper'
})
