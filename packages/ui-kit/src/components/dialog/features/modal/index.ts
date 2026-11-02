import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const dialogModalFeature = createClassFeature({
  id: 'dialog.modal',
  props: {
    modal: { type: Boolean, default: true },
    lockScroll: { type: Boolean, default: true },
    closeOnClickModal: { type: Boolean, default: true },
    closeOnPressEscape: { type: Boolean, default: true }
  },
  className: () => 'ui-dialog--modal'
})
