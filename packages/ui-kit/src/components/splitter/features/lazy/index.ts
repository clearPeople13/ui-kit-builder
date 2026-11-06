import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const splitterLazyFeature = createClassFeature({
  id: 'splitter.lazy',
  props: {
    lazy: { type: Boolean }
  },
  className: (props) => (props.lazy ? 'ui-splitter--lazy' : undefined)
})
