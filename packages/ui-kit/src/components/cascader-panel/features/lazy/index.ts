import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const cascaderPanelLazyFeature = createClassFeature({
  id: 'cascader-panel.lazy',
  props: {
    lazy: { type: null },
  },
  className: () => 'ui-cascader-panel--lazy'
})
