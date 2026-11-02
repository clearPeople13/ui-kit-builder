import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const datePickerEditableFeature = createClassFeature({
  id: 'date-picker.editable',
  props: {
    editable: { type: Boolean, default: true }
  },
  className: () => 'ui-date-picker--editable'
})
