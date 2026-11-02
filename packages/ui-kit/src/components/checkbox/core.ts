import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { checkboxConfig } from '../../shared/behavior'
import { checkboxGroupConfig } from '../../shared/behavior'
import { checkboxAppearanceFeature } from './features/appearance/index'
import './core.css'

const checkboxBaseProps = {
  value: { type: [String, Boolean, Number, Object] },
  disabled: { type: Boolean },
  modelValue: { type: [Number, String, Boolean] },
  size: { type: String },
  label: { type: [String, Boolean, Number, Object] },
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
  value: { type: [String, Boolean, Number, Object] },
  disabled: { type: Boolean },
  modelValue: { type: [Number, String, Boolean] },
  size: { type: String },
  label: { type: [String, Boolean, Number, Object] },
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
