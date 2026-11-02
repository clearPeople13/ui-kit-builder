import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const treeSelectionFeature = createClassFeature({
  id: 'tree.selection',
  props: {
    checkStrictly: { type: Boolean },
    checkOnClickLeaf: { type: Boolean, default: true }
  },
  className: (props) =>
    props.highlightCurrentRow || props.currentRowKey || props.checkStrictly || props.checkOnClickLeaf
      ? 'ui-tree--selection'
      : undefined
})
