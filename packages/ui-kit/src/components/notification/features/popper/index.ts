import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const notificationPopperFeature = createClassFeature({
  id: 'notification.popper',
  props: {
    offset: { type: Number, default: 0 }
  },
  className: () => 'ui-notification--popper',
  style: (props) => ({ '--ui-notification-offset': `${Number(props.offset) || 0}px` })
})
