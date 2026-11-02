import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const cascaderVirtualizedFeature = createClassFeature({
  id: 'cascader.virtualized',
  props: {
    itemSize: { type: Number, default: 34 }
  },
  className: (props) =>
    props.virtualized || props.estimatedItemSize || props.itemSize ? 'ui-cascader--virtualized' : undefined
})
