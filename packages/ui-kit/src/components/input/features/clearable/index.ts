import type { UiFeature } from '../../../../shared/feature'
import { createInputClearableFeature } from '../../../../shared/input-actions'

export const inputClearableFeature: UiFeature = createInputClearableFeature({
  id: 'input.clearable',
  baseClass: 'ui-input'
})
