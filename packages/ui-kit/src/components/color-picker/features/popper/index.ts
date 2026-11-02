import { createClassFeature } from '../../../../shared/component'
import { panelScrollProp } from '../../../../shared/panel'
import './style.css'

export const colorPickerPopperFeature = createClassFeature({
  id: 'color-picker.popper',
  props: {
    teleported: { type: Boolean, default: true },
    appendTo: { type: [String, Object] },
    persistent: { type: Boolean, default: true },
    popperClass: { type: [String, Array, Object, Boolean] },
    popperStyle: { type: [String, Array, Object, Boolean] },
    panelScroll: panelScrollProp
  },
  className: () => 'ui-color-picker--popper'
})
