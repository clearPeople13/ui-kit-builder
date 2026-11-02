import type { UiFeature } from '../../../../shared/feature'

export const datePickerPanelFormatFeature: UiFeature = {
  id: 'date-picker-panel.format',
  props: {
    valueFormat: { type: String }
  }
}
