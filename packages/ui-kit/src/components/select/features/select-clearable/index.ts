import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const selectClearableFeature = createClassFeature({
  id: 'select.select-clearable',
  props: {
    clearable: { type: Boolean },
    clearIcon: { type: [String, Object, Function], default: '' }
  },
  className: (props) => (props.clearable || props.clearIcon ? 'ui-select--clearable' : undefined)
})
