import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const imageLazyFeature = createClassFeature({
  id: 'image.lazy',
  props: {
    lazy: { type: Boolean }
  },
  className: (props) => (props.lazy ? 'ui-image--lazy' : undefined)
})
