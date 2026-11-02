import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const colorPickerPanelAppearanceFeature = createClassFeature({
  id: 'color-picker-panel.appearance',
  props: {
    border: { type: Boolean, default: true }
  },
  className: (props) => (props.border ? 'ui-color-picker-panel--appearance' : undefined)
})
