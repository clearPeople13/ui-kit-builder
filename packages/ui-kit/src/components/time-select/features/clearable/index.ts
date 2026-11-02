import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const timeSelectClearableFeature = createClassFeature({
  id: 'time-select.clearable',
  props: {
    clearable: { type: Boolean, default: true },
    clearIcon: { type: [String, Object] }
  },
  className: (props) => (props.clearable || props.clearIcon ? 'ui-time-select--clearable' : undefined)
})
