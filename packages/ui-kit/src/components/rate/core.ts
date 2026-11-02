import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { rateConfig } from '../../shared/behavior'
import { rateClearableFeature } from './features/clearable/index'
import './core.css'

const rateBaseProps = {
  modelValue: { type: Number, default: 0 },
  disabled: { type: Boolean },
  size: { type: String },
  id: { type: String },
  max: { type: Number, default: 5 },
  lowThreshold: { type: Number, default: 2 },
  highThreshold: { type: Number, default: 4 },
  colors: { type: [Array, Object], default: () => [] },
  voidColor: { type: String, default: '' },
  disabledVoidColor: { type: String, default: '' },
  icons: { type: [Array, Object], default: () => [] },
  voidIcon: { type: [String, Object, Function], default: () => ({}) },
  disabledVoidIcon: { type: [String, Object, Function], default: () => ({}) },
  allowHalf: { type: Boolean },
  showText: { type: Boolean },
  showScore: { type: Boolean },
  textColor: { type: String, default: '' },
  texts: { type: Array, default: () => [] },
  scoreTemplate: { type: String, default: '{value}' },
  ariaLabel: { type: String },
}

export function createRate(features: UiFeature[] = []) {
  return createUiComponent(
    rateConfig({
      name: 'UiRate',
      baseClass: 'ui-rate',
      props: rateBaseProps
    }),
    features
  )
}
