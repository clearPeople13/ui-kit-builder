import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const tabPaneClosableFeature = createClassFeature({
  id: 'tabs.closable',
  props: {
    closable: { type: Boolean }
  },
  className: (props) =>
    props.closable || props.closeable || props.showClose || props.closeText || props.beforeClose || props.closeIcon
      ? 'ui-tabs--closable'
      : undefined
})
