import { createClassFeature } from '../../../../shared/component'
import { hasIconProp } from '../../../../shared/icon'
import './style.css'

export const datePickerIconsFeature = createClassFeature({
  id: 'date-picker.icons',
  props: {
    prefixIcon: { type: [String, Object], default: '' }
  },
  className: (props) => (hasIconProp(props) ? 'ui-date-picker--icons' : undefined)
})
