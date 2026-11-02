import { createClassFeature } from '../../../../shared/component'
import { panelScrollProp } from '../../../../shared/panel'
import './style.css'

export const datePickerPopperFeature = createClassFeature({
  id: 'date-picker.popper',
  props: {
    popperClass: { type: [String, Array, Object, Boolean] },
    popperStyle: { type: [String, Array, Object, Boolean] },
    placement: { type: String, default: 'bottom' },
    fallbackPlacements: { type: Array, default: () => ['bottom', 'top', 'right', 'left'] },
    panelScroll: panelScrollProp
  },
  className: () => 'ui-date-picker--popper'
})
