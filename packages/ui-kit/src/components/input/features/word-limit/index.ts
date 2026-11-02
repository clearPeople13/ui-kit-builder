import type { UiFeature } from '../../../../shared/feature'
import { createInputWordLimitFeature } from '../../../../shared/input-word-limit'

export const inputWordLimitFeature: UiFeature = createInputWordLimitFeature({
  id: 'input.word-limit',
  baseClass: 'ui-input'
})
