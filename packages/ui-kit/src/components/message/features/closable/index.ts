import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const messageClosableFeature = createClassFeature({
  id: 'message.closable',
  props: {
    showClose: { type: Boolean, default: false }
  },
  className: (props) =>
    props.closable || props.closeable || props.showClose || props.closeText || props.beforeClose || props.closeIcon
      ? 'is-closable'
      : undefined
})
