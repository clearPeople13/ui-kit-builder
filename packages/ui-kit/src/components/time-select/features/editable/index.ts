import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const timeSelectEditableFeature = createClassFeature({
  id: 'time-select.editable',
  props: {
    editable: { type: Boolean, default: true }
  },
  className: (props) => (props.editable || props.addable || props.beforeLeave ? 'ui-time-select--editable' : undefined)
})
