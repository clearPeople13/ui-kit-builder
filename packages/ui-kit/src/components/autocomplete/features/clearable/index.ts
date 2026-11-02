import type { UiFeature } from '../../../../shared/feature'
import { createInputClearableFeature } from '../../../../shared/input-actions'

export const autocompleteClearableFeature: UiFeature = createInputClearableFeature({
  id: 'autocomplete.clearable',
  baseClass: 'ui-autocomplete'
})
