import { createClassFeature } from '../../../../shared/component'
import { panelScrollProp } from '../../../../shared/panel'
import './style.css'

export const cascaderPopperFeature = createClassFeature({
  id: 'cascader.popper',
  props: {
    teleported: { type: Boolean, default: true },
    persistent: { type: Boolean, default: true },
    popperClass: { type: [String, Array, Object, Boolean] },
    popperStyle: { type: [String, Array, Object, Boolean] },
    placement: { type: String, default: 'bottom-start' },
    fallbackPlacements: { type: Array, default: () => ['bottom-start', 'bottom', 'top-start', 'top', 'right', 'left'] },
    panelScroll: panelScrollProp
  },
  className: () => 'ui-cascader--popper'
})
