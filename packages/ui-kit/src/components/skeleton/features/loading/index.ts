import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const skeletonLoadingFeature = createClassFeature({
  id: 'skeleton.loading',
  props: {
    loading: { type: Boolean, default: true }
  },
  className: (props) => (props.loading || props.loadingText ? 'is-loading' : undefined)
})
