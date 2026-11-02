import { createInputPasswordFeature } from '../../../../shared/input-actions'

export const autocompletePasswordFeature = createInputPasswordFeature({
  id: 'autocomplete.password',
  baseClass: 'ui-autocomplete'
})
