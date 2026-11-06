import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const drawerModalFeature = createClassFeature({
  id: 'drawer.modal',
  props: {
    modal: { type: Boolean, default: true },
    lockScroll: { type: Boolean, default: true },
    closeOnClickModal: { type: Boolean, default: true },
    closeOnPressEscape: { type: Boolean, default: true }
  },
  className: (props) => (props.modal ? 'ui-drawer--modal' : undefined)
})
