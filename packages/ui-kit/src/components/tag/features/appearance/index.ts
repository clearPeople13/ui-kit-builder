import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const tagAppearanceFeature = createClassFeature({
  id: 'tag.appearance',
  props: {
    round: { type: Boolean },
    hit: { type: Boolean }
  },
  className: (props) =>
    [props.round ? 'is-round' : '', props.hit ? 'is-hit' : ''].filter(Boolean).join(' ') || undefined
})
