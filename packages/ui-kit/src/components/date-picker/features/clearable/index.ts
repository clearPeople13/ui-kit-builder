import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const datePickerClearableFeature = createClassFeature({
  id: 'date-picker.clearable',
  props: {
    clearable: { type: Boolean, default: true },
    clearIcon: { type: [String, Object], default: '' }
  },
  className: (props) => (props.clearable || props.clearIcon ? 'ui-date-picker--clearable' : undefined)
})
