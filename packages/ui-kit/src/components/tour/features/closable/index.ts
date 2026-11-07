import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const tourClosableFeature = createClassFeature({
  id: 'tour.closable',
  props: {
    showClose: { type: Boolean, default: true },
    closeIcon: { type: [String, Object, Function] }
  },
  className: (props) =>
    props.closable || props.closeable || props.showClose || props.closeText || props.beforeClose || props.closeIcon
      ? 'is-closable'
      : undefined
})
