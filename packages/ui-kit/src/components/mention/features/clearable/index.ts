import type { UiFeature } from '../../../../shared/feature'
import { createInputClearableFeature } from '../../../../shared/input-actions'

export const mentionClearableFeature: UiFeature = createInputClearableFeature({
  id: 'mention.clearable',
  baseClass: 'ui-mention'
})
