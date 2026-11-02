import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const cascaderPanelMultipleFeature = createClassFeature({
  id: 'cascader-panel.multiple',
  props: {
    multiple: { type: null }
  },
  className: () => 'ui-cascader-panel--multiple'
})
