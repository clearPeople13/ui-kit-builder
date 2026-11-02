import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const dialogFullscreenFeature = createClassFeature({
  id: 'dialog.fullscreen',
  props: {
    fullscreen: { type: Boolean }
  },
  className: (props) => (props.fullscreen ? 'ui-dialog--fullscreen' : undefined)
})
