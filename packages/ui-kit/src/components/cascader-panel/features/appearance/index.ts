import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const cascaderPanelAppearanceFeature = createClassFeature({
  id: 'cascader-panel.appearance',
  props: {
    border: { type: Boolean, default: true }
  },
  className: (props) => (props.border ? 'ui-cascader-panel--border' : 'ui-cascader-panel--plain')
})
