import { createClassFeature } from '../../../../shared/component'

export const selectV2ClearableFeature = createClassFeature({
  id: 'select-v2.clearable',
  props: {
    clearable: Boolean
  },
  className: (props) => (props.clearable ? 'is-clearable' : undefined)
})
