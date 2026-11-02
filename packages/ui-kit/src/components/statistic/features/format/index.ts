import type { UiFeature } from '../../../../shared/feature'

export const statisticFormatFeature: UiFeature = {
  id: 'statistic.format',
  props: {
    formatter: { type: Function }
  }
}
