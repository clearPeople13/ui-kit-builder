import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const badgePopperFeature = createClassFeature({
  id: 'badge.popper',
  props: {
    offset: { type: Array, default: () => [] }
  },
  className: () => 'ui-badge--popper'
})
