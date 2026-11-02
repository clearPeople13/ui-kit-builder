import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const drawerFullscreenFeature = createClassFeature({
  id: 'drawer.fullscreen',
  props: {
    fullscreen: { type: Boolean }
  },
  className: (props) => (props.fullscreen ? 'ui-drawer--fullscreen' : undefined)
})
