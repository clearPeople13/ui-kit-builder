import { createClassFeature } from '../../../../shared/component'

export const selectLoadingFeature = createClassFeature({
  id: 'select.select-loading',
  props: {
    loading: { type: Boolean },
    loadingText: { type: String }
  },
  className: (props) => (props.loading || props.loadingText ? 'is-loading' : undefined)
})
