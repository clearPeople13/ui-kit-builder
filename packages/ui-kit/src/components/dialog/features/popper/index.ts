import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const dialogPopperFeature = createClassFeature({
  id: 'dialog.popper',
  props: {
    appendTo: { type: [String, Object], default: 'body' },
    appendToBody: { type: Boolean }
  },
  className: () => 'ui-dialog--popper'
})
