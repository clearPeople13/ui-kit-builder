import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const timePickerRangeFeature = createClassFeature({
  id: 'time-picker.range',
  props: {
    rangeSeparator: { type: String, default: '-' },
    startPlaceholder: { type: String },
    endPlaceholder: { type: String },
  },
  className: () => 'ui-time-picker--range'
})
