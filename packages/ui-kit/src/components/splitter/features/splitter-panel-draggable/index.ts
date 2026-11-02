import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const splitterPanelDraggableFeature = createClassFeature({
  id: 'splitter.splitter-panel-draggable',
  props: {
    resizable: { type: Boolean, default: true }
  },
  className: (props) =>
    props.draggable || props.allowDrag || props.allowDrop || props.resizable
      ? 'ui-splitter-panel--draggable'
      : undefined
})
