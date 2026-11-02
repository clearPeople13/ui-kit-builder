import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const datePickerFormatFeature = createClassFeature({
  id: 'date-picker.format',
  props: {
    valueFormat: { type: String },
    valueOnClear: { type: [String, Number, Boolean, Function], default: undefined }
  },
  className: () => 'ui-date-picker--format'
})
