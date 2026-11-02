import { createClassFeature } from '../../../../shared/component'
import { panelScrollProp } from '../../../../shared/panel'
import './style.css'

export const popoverPopperFeature = createClassFeature({
  id: 'popover.popper',
  props: {
    teleported: { type: Boolean, default: true },
    appendTo: { type: [String, Object] },
    persistent: { type: Boolean, default: true },
    popperClass: { type: [String, Array, Object, Boolean] },
    popperStyle: { type: [String, Array, Object, Boolean] },
    showArrow: { type: Boolean, default: true },
    placement: { type: String, default: 'bottom' },
    fallbackPlacements: { type: Array },
    offset: { type: Number },
    panelScroll: panelScrollProp
  },
  className: () => 'ui-popover--popper'
})
