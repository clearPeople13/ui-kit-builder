import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const switchLoadingFeature = createClassFeature({
  id: 'switch.loading',
  props: {
    loading: { type: Boolean }
  },
  className: (props) => (props.loading ? 'ui-switch--loading' : undefined)
})
