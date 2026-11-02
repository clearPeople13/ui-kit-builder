import { createClassFeature } from '../../../../shared/component'
import { panelScrollProp } from '../../../../shared/panel'
import './style.css'

export const autocompletePopperFeature = createClassFeature({
  id: 'autocomplete.popper',
  props: {
    teleported: { type: Boolean, default: true },
    appendTo: { type: [String, Object] },
    popperClass: { type: [String, Array, Object, Boolean] },
    popperStyle: { type: [String, Array, Object, Boolean] },
    placement: { type: String, default: 'bottom-start' },
    fallbackPlacements: { type: Array },
    offset: { type: Number, default: 6 },
    showArrow: { type: Boolean, default: true },
    panelScroll: panelScrollProp
  },
  className: () => 'ui-autocomplete--popper'
})
