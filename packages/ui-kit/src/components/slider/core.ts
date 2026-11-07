import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { sliderConfig } from '../../shared/behavior'
import './core.css'

const sliderBaseProps = {
  modelValue: { type: [Number, Array], default: 0 },
  size: { type: String },
  disabled: { type: Boolean },
  id: { type: String },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: [Number, String], default: 1 },
  showInput: { type: Boolean },
  showInputControls: { type: Boolean, default: true },
  inputSize: { type: String },
  showStops: { type: Boolean },
  showTooltip: { type: Boolean, default: true },
  vertical: { type: Boolean },
  height: { type: String },
  tooltipClass: { type: [String, Array, Object, Boolean] },
  marks: { type: Object },
  ariaLabel: { type: String }
}

export function createSlider(features: UiFeature[] = []) {
  return createUiComponent(
    sliderConfig({
      name: 'UiSlider',
      baseClass: 'ui-slider',
      props: sliderBaseProps
    }),
    features
  )
}
