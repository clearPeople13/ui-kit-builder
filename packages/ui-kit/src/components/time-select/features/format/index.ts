import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const timeSelectFormatFeature = createClassFeature({
  id: 'time-select.format',
  props: {
    valueOnClear: { type: [String, Number, Boolean, Function], default: undefined }
  },
  className: () => 'ui-time-select--format'
})
