import { createClassFeature } from '../../../../shared/component'

export const selectV2MultipleFeature = createClassFeature({
  id: 'select-v2.multiple',
  props: {
    multiple: Boolean,
    collapseTags: Boolean,
    maxCollapseTags: { type: Number, default: 1 }
  },
  className: (props) => (props.multiple ? 'is-multiple' : undefined)
})
