import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const timePickerEditableFeature = createClassFeature({
  id: 'time-picker.editable',
  props: {
    editable: { type: Boolean, default: true }
  },
  className: (props) => (props.editable || props.addable || props.beforeLeave ? 'ui-time-picker--editable' : undefined)
})
