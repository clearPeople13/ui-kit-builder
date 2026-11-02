import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const tourStepValidateFeature = createClassFeature({
  id: 'tour.tour-step-validate',
  props: {
    scrollIntoViewOptions: { type: [Boolean, Object], default: undefined }
  },
  className: () => 'ui-tour-step--validate'
})
