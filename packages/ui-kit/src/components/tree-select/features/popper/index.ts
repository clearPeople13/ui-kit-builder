import { createClassFeature } from '../../../../shared/component'
import { panelScrollProp } from '../../../../shared/panel'

export const treeSelectPopperFeature = createClassFeature({
  id: 'tree-select.popper',
  props: {
    teleported: { type: Boolean, default: true },
    popperClass: { type: [String, Array, Object], default: '' },
    popperStyle: { type: [String, Object, Array], default: '' },
    placement: { type: String, default: 'bottom-start' },
    effect: { type: String, default: 'light' },
    panelScroll: panelScrollProp
  },
  className: () => undefined
})
