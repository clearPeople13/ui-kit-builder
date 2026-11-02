import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { progressConfig } from '../../shared/behavior'
import './core.css'

const progressBaseProps = {
  type: { type: String, default: 'line' },
  percentage: { type: Number, default: 0 },
  status: { type: String, default: '' },
  indeterminate: { type: Boolean },
  strokeWidth: { type: Number, default: 6 },
  width: { type: Number, default: 126 },
  showText: { type: Boolean, default: true },
  color: { type: [String, Array, Function], default: '' },
}

export function createProgress(features: UiFeature[] = []) {
  return createUiComponent(
    progressConfig({
      name: 'UiProgress',
      baseClass: 'ui-progress',
      props: progressBaseProps
    }),
    features
  )
}
