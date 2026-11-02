import { createClassFeature } from '../../../../shared/component'
import { panelScrollProp } from '../../../../shared/panel'

export const selectV2PopperFeature = createClassFeature({
  id: 'select-v2.popper',
  props: {
    teleported: { type: Boolean, default: true },
    popperClass: { type: [String, Array, Object], default: '' },
    popperStyle: { type: [String, Object, Array], default: '' },
    placement: { type: String, default: 'bottom-start' },
    effect: { type: String, default: 'light' },
    props: { type: Object, default: () => ({}) },
    panelScroll: panelScrollProp
  },
  className: () => undefined
})
