import { createClassFeature } from '../../../../shared/component'
import { panelScrollProp } from '../../../../shared/panel'
import './style.css'

export const selectPopperFeature = createClassFeature({
  id: 'select.select-popper',
  props: {
    teleported: { type: Boolean, default: true },
    appendTo: { type: [String, Object] },
    persistent: { type: Boolean, default: true },
    popperClass: { type: [String, Array, Object, Boolean], default: '' },
    popperStyle: { type: [String, Array, Object, Boolean] },
    placement: { type: String, default: 'bottom-start' },
    fallbackPlacements: { type: Array, default: () => ['bottom-start', 'top-start', 'right', 'left'] },
    offset: { type: Number, default: 12 },
    showArrow: { type: Boolean, default: true },
    panelScroll: panelScrollProp
  },
  className: () => 'ui-select--popper'
})
