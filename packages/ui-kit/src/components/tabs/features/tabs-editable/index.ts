import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const tabsEditableFeature = createClassFeature({
  id: 'tabs.tabs-editable',
  props: {
    editable: { type: Boolean },
    addable: { type: Boolean },
    beforeLeave: { type: Function }
  },
  className: (props) => (props.editable || props.addable || props.beforeLeave ? 'ui-tabs--editable' : undefined)
})
