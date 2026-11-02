import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const colorPickerFormatFeature = createClassFeature({
  id: 'color-picker.format',
  props: {
    valueOnClear: { type: [String, Number, Boolean, Function], default: undefined }
  },
  className: () => 'ui-color-picker--format'
})
