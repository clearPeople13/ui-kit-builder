import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { radioButtonConfig, radioConfig, radioGroupConfig } from '../../shared/behavior'
import { radioAppearanceFeature } from './features/appearance/index'
import './core.css'

const radioBaseProps = {
  value: { type: [String, Number, Boolean] },
  disabled: { type: Boolean },
  modelValue: { type: [String, Number, Boolean] },
  size: { type: String },
  label: { type: [String, Number, Boolean] },
  name: { type: String }
}

export function createRadio(features: UiFeature[] = []) {
  return createUiComponent(
    radioConfig({
      name: 'UiRadio',
      baseClass: 'ui-radio',
      props: radioBaseProps
    }),
    features
  )
}

const radioButtonBaseProps = {
  modelValue: { type: [String, Number, Boolean] },
  size: { type: String },
  disabled: { type: Boolean },
  value: { type: [String, Number, Boolean] },
  label: { type: [String, Number, Boolean] },
  name: { type: String }
}

export function createRadioButton(features: UiFeature[] = []) {
  return createUiComponent(
    radioButtonConfig({
      name: 'UiRadioButton',
      baseClass: 'ui-radio-button',
      props: radioButtonBaseProps
    }),
    features
  )
}

const radioGroupBaseProps = {
  size: { type: String },
  disabled: { type: Boolean },
  modelValue: { type: [String, Number, Boolean] },
  options: { type: Array },
  type: { type: String, default: 'radio' },
  id: { type: String },
  fill: { type: String, default: '' },
  textColor: { type: String, default: '' },
  name: { type: String },
  props: { type: Object, default: () => ({}) },
  ariaLabel: { type: String }
}

export function createRadioGroup(features: UiFeature[] = []) {
  return createUiComponent(
    radioGroupConfig({
      name: 'UiRadioGroup',
      baseClass: 'ui-radio-group',
      props: radioGroupBaseProps
    }),
    features
  )
}
