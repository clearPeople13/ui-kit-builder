import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { switchConfig } from '../../shared/behavior'
import './core.css'

const switchBaseProps = {
  modelValue: { type: [Boolean, String, Number], default: false },
  disabled: { type: Boolean },
  size: { type: String },
  width: { type: [String, Number], default: '' },
  inlinePrompt: { type: Boolean },
  activeText: { type: String, default: '' },
  inactiveText: { type: String, default: '' },
  activeValue: { type: [Boolean, String, Number], default: true },
  inactiveValue: { type: [Boolean, String, Number], default: false },
  name: { type: String, default: '' },
  id: { type: String },
  tabindex: { type: [String, Number] },
  ariaLabel: { type: String }
}

export function createSwitch(features: UiFeature[] = []) {
  return createUiComponent(
    switchConfig({
      name: 'UiSwitch',
      baseClass: 'ui-switch',
      props: switchBaseProps
    }),
    features
  )
}
