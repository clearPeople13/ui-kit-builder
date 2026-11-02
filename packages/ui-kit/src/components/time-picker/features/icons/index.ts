import { createClassFeature } from '../../../../shared/component'
import { hasIconProp } from '../../../../shared/icon'
import './style.css'

export const timePickerIconsFeature = createClassFeature({
  id: 'time-picker.icons',
  props: {
    prefixIcon: { type: [String, Object], default: '' }
  },
  className: (props) => (hasIconProp(props) ? 'ui-time-picker--icons' : undefined)
})
