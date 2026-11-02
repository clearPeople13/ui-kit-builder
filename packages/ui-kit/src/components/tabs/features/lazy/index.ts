import type { UiFeature } from '../../../../shared/feature'

export const tabPaneLazyFeature: UiFeature = {
  id: 'tabs.lazy',
  props: {
    lazy: { type: Boolean, default: false }
  }
}
