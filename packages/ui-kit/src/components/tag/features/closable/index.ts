import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const tagClosableFeature = createClassFeature({
  id: 'tag.closable',
  props: {
    closable: { type: Boolean }
  },
  className: (props) =>
    props.closable || props.closeable || props.showClose || props.closeText || props.beforeClose || props.closeIcon
      ? 'is-closable'
      : undefined
})
