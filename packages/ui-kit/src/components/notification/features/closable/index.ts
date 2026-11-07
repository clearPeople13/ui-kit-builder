import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const notificationClosableFeature = createClassFeature({
  id: 'notification.closable',
  props: {
    showClose: { type: Boolean, default: true },
    closeIcon: { type: [String, Object, Function], default: () => ({ name: 'Close', __name: 'close' }) }
  },
  className: (props) =>
    props.closable || props.closeable || props.showClose || props.closeText || props.beforeClose || props.closeIcon
      ? 'is-closable'
      : undefined
})
