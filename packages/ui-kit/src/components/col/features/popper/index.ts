import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const colPopperFeature = createClassFeature({
  id: 'col.popper',
  props: {
    offset: { type: Number, default: 0 }
  },
  className: () => 'ui-col--popper'
})
