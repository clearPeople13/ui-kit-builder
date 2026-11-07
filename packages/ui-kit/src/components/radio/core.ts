import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { radioButtonConfig, radioConfig, radioGroupConfig } from '../../shared/behavior'
import './core.css'

const radioBaseProps = {
  // value / label / modelValue 的类型联合含 Boolean：Vue 会把缺省的键归一化为 false，
  // 既挡住了 ownValue() 的 value ?? label 回退，也让"未选中"与"选中 false"无法区分
  value: { type: [String, Number, Boolean], default: undefined },
  disabled: { type: Boolean },
  modelValue: { type: [String, Number, Boolean], default: undefined },
  size: { type: String },
  label: { type: [String, Number, Boolean], default: undefined },
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
  modelValue: { type: [String, Number, Boolean], default: undefined },
  size: { type: String },
  disabled: { type: Boolean },
  value: { type: [String, Number, Boolean], default: undefined },
  label: { type: [String, Number, Boolean], default: undefined },
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
  modelValue: { type: [String, Number, Boolean], default: undefined },
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
