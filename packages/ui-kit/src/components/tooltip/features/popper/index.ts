import { createClassFeature } from '../../../../shared/component'
import { panelScrollProp } from '../../../../shared/panel'

export const tooltipPopperFeature = createClassFeature({
  id: 'tooltip.popper',
  props: {
    appendTo: { type: [String, Object], default: 'body' },
    popperClass: { type: [String, Array, Object], default: '' },
    popperStyle: { type: [String, Object, Array], default: '' },
    persistent: { type: Boolean, default: true },
    panelScroll: panelScrollProp
  },
  className: () => undefined
})
