import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const tourStepClosableFeature = createClassFeature({
  id: 'tour.tour-step-closable',
  props: {
    showClose: { type: Boolean, default: undefined },
    closeIcon: { type: [String, Object, Function] }
  },
  className: (props) =>
    props.closable || props.closeable || props.showClose || props.closeText || props.beforeClose || props.closeIcon
      ? 'ui-tour-step--closable'
      : undefined
})
