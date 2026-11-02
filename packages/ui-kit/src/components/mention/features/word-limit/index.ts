import type { UiFeature } from '../../../../shared/feature'
import { createInputWordLimitFeature } from '../../../../shared/input-word-limit'

export const mentionWordLimitFeature: UiFeature = createInputWordLimitFeature({
  id: 'mention.word-limit',
  baseClass: 'ui-mention'
})
