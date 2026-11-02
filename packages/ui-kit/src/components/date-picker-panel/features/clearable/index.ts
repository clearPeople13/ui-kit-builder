import type { UiFeature } from '../../../../shared/feature'

export const datePickerPanelClearableFeature: UiFeature = {
  id: 'date-picker-panel.clearable',
  props: {
    clearable: { type: Boolean, default: true }
  }
}
