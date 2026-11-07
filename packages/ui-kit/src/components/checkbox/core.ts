import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { checkboxConfig } from '../../shared/behavior'
import { checkboxGroupConfig } from '../../shared/behavior'
import './core.css'

const checkboxBaseProps = {
  // value / label / modelValue 的类型联合含 Boolean：Vue 会把缺省的键归一化为 false，
  // 既挡住了 resolveCheckedValue 的 value ?? label 回退，也让"未选中"与"选中 false"无法区分
  value: { type: [String, Boolean, Number, Object], default: undefined },
  disabled: { type: Boolean },
  modelValue: { type: [Number, String, Boolean, Array], default: undefined },
  size: { type: String },
  label: { type: [String, Boolean, Number, Object], default: undefined },
  indeterminate: { type: Boolean },
  checked: { type: Boolean },
  name: { type: String },
  trueValue: { type: [String, Number] },
  falseValue: { type: [String, Number] },
  trueLabel: { type: [String, Number] },
  falseLabel: { type: [String, Number] },
  id: { type: String },
  tabindex: { type: [String, Number] },
  ariaLabel: { type: String },
  ariaControls: { type: String }
}

export function createCheckbox(features: UiFeature[] = []) {
  return createUiComponent(
    checkboxConfig({
      name: 'UiCheckbox',
      baseClass: 'ui-checkbox',
      props: checkboxBaseProps
    }),
    features
  )
}

const checkboxButtonBaseProps = {
  value: { type: [String, Boolean, Number, Object], default: undefined },
  disabled: { type: Boolean },
  modelValue: { type: [Number, String, Boolean, Array], default: undefined },
  size: { type: String },
  label: { type: [String, Boolean, Number, Object], default: undefined },
  checked: { type: Boolean },
  name: { type: String },
  trueValue: { type: [String, Number] },
  falseValue: { type: [String, Number] },
  trueLabel: { type: [String, Number] },
  falseLabel: { type: [String, Number] },
  id: { type: String },
  tabindex: { type: [String, Number] },
  ariaLabel: { type: String },
  ariaControls: { type: String }
}

export function createCheckboxButton(features: UiFeature[] = []) {
  return createUiComponent(
    {
      ...checkboxConfig({
        name: 'UiCheckboxButton',
        baseClass: 'ui-checkbox-button',
        props: checkboxButtonBaseProps
      }),
      classes: (props, _state) => [
        'ui-checkbox-button',
        props.disabled ? 'is-disabled' : '',
        props.size ? `ui-checkbox-button--${props.size}` : ''
      ],
      tag: () => 'label'
    },
    features
  )
}

const checkboxGroupBaseProps = {
  modelValue: { type: Array, default: () => [] },
  disabled: { type: Boolean },
  size: { type: String },
  options: { type: Array },
  type: { type: String, default: 'checkbox' },
  min: { type: Number },
  max: { type: Number },
  tag: { type: String, default: 'div' },
  props: { type: Object, default: () => ({}) },
  ariaLabel: { type: String }
}

export function createCheckboxGroup(features: UiFeature[] = []) {
  return createUiComponent(
    checkboxGroupConfig({
      name: 'UiCheckboxGroup',
      baseClass: 'ui-checkbox-group',
      props: checkboxGroupBaseProps
    }),
    features
  )
}
