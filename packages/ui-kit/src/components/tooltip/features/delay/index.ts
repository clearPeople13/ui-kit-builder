import { createClassFeature } from '../../../../shared/component'

export const tooltipDelayFeature = createClassFeature({
  id: 'tooltip.delay',
  props: {
    showAfter: { type: Number, default: 0 },
    hideAfter: { type: Number, default: 200 },
    enterable: { type: Boolean, default: true },
    autoClose: { type: Number, default: 0 }
  },
  className: () => undefined
})
