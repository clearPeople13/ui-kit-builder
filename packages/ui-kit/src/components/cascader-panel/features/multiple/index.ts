import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const cascaderPanelMultipleFeature = createClassFeature({
  id: 'cascader-panel.multiple',
  props: {
    multiple: { type: null }
  },
  className: (props) => (props.multiple ? 'ui-cascader-panel--multiple' : undefined)
})
