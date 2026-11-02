import type { UiFeature } from '../../../../shared/feature'
import { createInputWordLimitFeature } from '../../../../shared/input-word-limit'

export const autocompleteWordLimitFeature: UiFeature = createInputWordLimitFeature({
  id: 'autocomplete.word-limit',
  baseClass: 'ui-autocomplete'
})
