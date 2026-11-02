import { createClassFeature } from '../../../../shared/component'
import { panelScrollProp } from '../../../../shared/panel'
import './style.css'

export const popconfirmPopperFeature = createClassFeature({
  id: 'popconfirm.popper',
  props: {
    teleported: { type: Boolean, default: true },
    persistent: { type: Boolean },
    placement: { type: String, default: 'bottom' },
    fallbackPlacements: { type: Array },
    offset: { type: Number },
    panelScroll: panelScrollProp
  },
  className: () => 'ui-popconfirm--popper'
})
