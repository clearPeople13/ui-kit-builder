import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const colorPickerClearableFeature = createClassFeature({
  id: 'color-picker.clearable',
  props: {
    clearable: { type: Boolean, default: true }
  },
  className: (props) => (props.clearable || props.clearIcon ? 'ui-color-picker--clearable' : undefined)
})
