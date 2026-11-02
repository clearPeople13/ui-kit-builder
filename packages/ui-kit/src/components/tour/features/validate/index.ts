import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const tourValidateFeature = createClassFeature({
  id: 'tour.validate',
  props: {
    scrollIntoViewOptions: { type: [Boolean, Object], default: () => ({}) }
  },
  className: () => 'ui-tour--validate'
})
