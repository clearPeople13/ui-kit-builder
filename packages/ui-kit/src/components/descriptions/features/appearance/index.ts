import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const descriptionsAppearanceFeature = createClassFeature({
  id: 'descriptions.appearance',
  props: {
    border: { type: Boolean }
  },
  className: (props) => (props.border ? 'is-bordered' : undefined)
})
