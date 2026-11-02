import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const datePickerPanelAppearanceFeature = createClassFeature({
  id: 'date-picker-panel.appearance',
  props: {
    border: { type: Boolean, default: true }
  },
  className: (props) => (props.border ? 'ui-date-picker-panel--appearance' : undefined)
})
