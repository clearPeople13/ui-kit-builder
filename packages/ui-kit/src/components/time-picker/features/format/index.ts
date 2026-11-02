import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const timePickerFormatFeature = createClassFeature({
  id: 'time-picker.format',
  props: {
    valueFormat: { type: String },
    valueOnClear: { type: [String, Number, Boolean, Function], default: undefined }
  },
  className: () => 'ui-time-picker--format'
})
