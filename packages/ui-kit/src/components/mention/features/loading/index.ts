import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const mentionLoadingFeature = createClassFeature({
  id: 'mention.loading',
  props: {
    loading: { type: Boolean }
  },
  className: (props) => (props.loading || props.loadingText ? 'is-loading' : undefined)
})
