import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const cascaderLazyFeature = createClassFeature({
  id: 'cascader.lazy',
  props: {
    lazy: { type: Boolean },
    lazyLoad: { type: Function }
  },
  className: (props) => (props.lazy ? 'ui-cascader--lazy' : undefined)
})
