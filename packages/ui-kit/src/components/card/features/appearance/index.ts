import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const cardAppearanceFeature = createClassFeature({
  id: 'card.appearance',
  props: {
    shadow: { type: String }
  },
  className: (props) =>
    props.shadow === 'always' ? 'is-always-shadow' : props.shadow === 'hover' ? 'is-hover-shadow' : undefined
})
