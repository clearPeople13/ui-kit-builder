import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const sliderRangeFeature = createClassFeature({
  id: 'slider.range',
  props: {
    range: { type: Boolean }
  },
  className: () => 'ui-slider--range'
})
