import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const imageLoadingFeature = createClassFeature({
  id: 'image.loading',
  props: {
    loading: { type: String }
  },
  className: (props) => (props.loading ? 'is-loading' : undefined)
})
