import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const drawerClosableFeature = createClassFeature({
  id: 'drawer.closable',
  props: {
    showClose: { type: Boolean, default: true },
    beforeClose: { type: Function },
    closeIcon: { type: [String, Object, Function] }
  },
  className: (props) =>
    props.closable || props.closeable || props.showClose || props.closeText || props.beforeClose || props.closeIcon
      ? 'ui-drawer--closable'
      : undefined
})
