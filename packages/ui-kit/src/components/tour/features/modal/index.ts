import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const tourModalFeature = createClassFeature({
  id: 'tour.modal',
  props: {
    closeOnPressEscape: { type: Boolean, default: true }
  },
  className: () => 'ui-tour--modal'
})
