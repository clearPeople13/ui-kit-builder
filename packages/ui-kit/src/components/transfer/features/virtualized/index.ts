import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const transferVirtualizedFeature = createClassFeature({
  id: 'transfer.virtualized',
  props: {
    itemSize: { type: Number, default: 30 }
  },
  className: (props) =>
    props.virtualized || props.estimatedItemSize || props.itemSize ? 'ui-transfer--virtualized' : undefined
})
