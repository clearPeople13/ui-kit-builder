import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const sliderFormatFeature = createClassFeature({
  id: 'slider.format',
  props: {
    formatTooltip: { type: Function },
  },
  className: () => 'ui-slider--format'
})
