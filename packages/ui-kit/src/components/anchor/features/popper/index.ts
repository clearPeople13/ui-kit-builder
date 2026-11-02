import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const anchorPopperFeature = createClassFeature({
  id: 'anchor.popper',
  props: {
    offset: { type: Number, default: 0 }
  },
  className: () => 'ui-anchor--popper'
})
