import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const splitterLazyFeature = createClassFeature({
  id: 'splitter.lazy',
  props: {
    lazy: { type: Boolean }
  },
  className: () => 'ui-splitter--lazy'
})
