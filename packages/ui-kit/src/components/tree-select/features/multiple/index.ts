import { createClassFeature } from '../../../../shared/component'

export const treeSelectMultipleFeature = createClassFeature({
  id: 'tree-select.multiple',
  props: {
    multiple: Boolean,
    collapseTags: Boolean,
    maxCollapseTags: { type: Number, default: 1 }
  },
  className: (props) => (props.multiple ? 'is-multiple' : undefined)
})
