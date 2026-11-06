import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const drawerPopperFeature = createClassFeature({
  id: 'drawer.popper',
  props: {
    appendTo: { type: [String, Object], default: 'body' },
    appendToBody: { type: Boolean }
  },
  className: () => 'ui-drawer--popper'
})
