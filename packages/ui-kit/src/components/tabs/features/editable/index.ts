import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const tabPaneEditableFeature = createClassFeature({
  id: 'tabs.editable',
  props: {
    editable: { type: Boolean }
  },
  className: (props) => (props.editable || props.addable || props.beforeLeave ? 'ui-tabs--editable' : undefined)
})
