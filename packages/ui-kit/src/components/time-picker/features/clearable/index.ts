import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const timePickerClearableFeature = createClassFeature({
  id: 'time-picker.clearable',
  props: {
    clearable: { type: Boolean, default: true },
    clearIcon: { type: [String, Object], default: () => ({ name: 'CircleClose', __name: 'circle-close' }) }
  },
  className: (props) => (props.clearable || props.clearIcon ? 'ui-time-picker--clearable' : undefined)
})
