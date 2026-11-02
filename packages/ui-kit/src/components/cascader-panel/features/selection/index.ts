import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const cascaderPanelSelectionFeature = createClassFeature({
  id: 'cascader-panel.selection',
  props: {
    checkStrictly: { type: null },
    checkOnClickLeaf: { type: null }
  },
  className: (props) =>
    props.highlightCurrentRow || props.currentRowKey || props.checkStrictly || props.checkOnClickLeaf
      ? 'ui-cascader-panel--selection'
      : undefined
})
