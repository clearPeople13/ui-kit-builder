import { createClassFeature } from '../../../../shared/component'
import { panelScrollProp } from '../../../../shared/panel'
import './style.css'

export const timeSelectPopperFeature = createClassFeature({
  id: 'time-select.popper',
  props: {
    popperClass: { type: [String, Array, Object, Boolean], default: '' },
    popperStyle: { type: [String, Array, Object, Boolean] },
    panelScroll: panelScrollProp
  },
  className: () => 'ui-time-select--popper'
})
