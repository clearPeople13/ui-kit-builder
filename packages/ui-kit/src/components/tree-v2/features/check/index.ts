import { createClassFeature } from '../../../../shared/component'

export const treeV2CheckFeature = createClassFeature({
  id: 'tree-v2.check',
  props: {
    showCheckbox: Boolean,
    defaultCheckedKeys: { type: Array, default: () => [] },
    checkStrictly: Boolean,
    checkOnClickNode: Boolean
  },
  className: (props) => (props.showCheckbox ? 'is-checkable' : undefined)
})
