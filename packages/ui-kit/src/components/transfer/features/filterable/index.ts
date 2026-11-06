import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const transferFilterableFeature = createClassFeature({
  id: 'transfer.filterable',
  props: {
    filterable: { type: Boolean }
  },
  className: (props) => (props.filterable ? 'ui-transfer--filterable' : undefined)
})
