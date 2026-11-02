import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { inputConfig } from '../../shared/behavior'
import { inputClearableFeature } from './features/clearable/index'
import { inputPasswordFeature } from './features/password/index'
import { inputWordLimitFeature } from './features/word-limit/index'
import { inputIconsFeature } from './features/icons/index'
import './core.css'

const inputBaseProps = {
  size: { type: String },
  disabled: { type: Boolean },
  modelValue: { type: [String, Number, Object], default: '' },
  type: { type: String, default: 'text' },
  id: { type: String },
  maxlength: { type: [String, Number] },
  minlength: { type: [String, Number] },
  resize: { type: String },
  autocomplete: { type: String, default: 'off' },
  placeholder: { type: String },
  readonly: { type: Boolean },
  tabindex: { type: [String, Number], default: 0 },
  inputStyle: { type: [Object, Array, String, Boolean], default: () => [] },
  countGraphemes: { type: Function },
  autofocus: { type: Boolean },
  rows: { type: Number, default: 2 },
  name: { type: String }
}

export function createInput(features: UiFeature[] = []) {
  return createUiComponent(
    inputConfig({
      name: 'UiInput',
      baseClass: 'ui-input',
      props: inputBaseProps
    }),
    features
  )
}
