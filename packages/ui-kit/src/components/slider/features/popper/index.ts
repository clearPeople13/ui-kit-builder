import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const sliderPopperFeature = createClassFeature({
  id: 'slider.popper',
  props: {
    persistent: { type: Boolean, default: true },
    placement: { type: String }
  },
  className: () => 'ui-slider--popper'
})
