import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const radioAppearanceFeature = createClassFeature({
  id: 'radio.appearance',
  props: {
    border: { type: Boolean }
  },
  className: (props) => (props.border ? 'ui-radio--border' : undefined)
})
