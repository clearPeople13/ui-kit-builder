import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const autocompleteFilterableFeature = createClassFeature({
  id: 'autocomplete.filterable',
  props: {
    debounce: { type: Number, default: 300 },
    fitInputWidth: { type: Boolean }
  },
  className: () => 'ui-autocomplete--filterable'
})
