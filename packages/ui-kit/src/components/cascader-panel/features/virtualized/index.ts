import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const cascaderPanelVirtualizedFeature = createClassFeature({
  id: 'cascader-panel.virtualized',
  props: {
    itemSize: { type: Number, default: 34 }
  },
  className: (props) =>
    props.virtualized || props.estimatedItemSize || props.itemSize ? 'ui-cascader-panel--virtualized' : undefined
})
