import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { inputNumberConfig } from '../../shared/behavior'
import './core.css'

const inputNumberBaseProps = {
  modelValue: { type: Number },
  disabled: { type: Boolean },
  size: { type: String },
  id: { type: String },
  step: { type: Number, default: 1 },
  max: { type: Number, default: 9007199254740991 },
  min: { type: Number, default: -9007199254740991 },
  readonly: { type: Boolean },
  controls: { type: Boolean, default: true },
  controlsPosition: { type: String, default: '' },
  name: { type: String },
  placeholder: { type: String },
  precision: { type: Number },
  align: { type: String, default: 'center' },
  tabindex: { type: [String, Number], default: 0 }
}

export function createInputNumber(features: UiFeature[] = []) {
  return createUiComponent(
    inputNumberConfig({
      name: 'UiInputNumber',
      baseClass: 'ui-input-number',
      props: inputNumberBaseProps
    }),
    features
  )
}
