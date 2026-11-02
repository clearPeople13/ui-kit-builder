import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const messageAppearanceFeature = createClassFeature({
  id: 'message.appearance',
  props: {
    plain: { type: Boolean }
  },
  className: (props) => (props.plain ? 'ui-message--plain' : undefined)
})
