import { ref, watch } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { wrapperConfig } from '../../shared/behavior'
import './core.css'

const checkTagBaseProps = {
  disabled: { type: Boolean },
  type: { type: String, default: 'primary' },
  checked: { type: Boolean }
}

export function createCheckTag(features: UiFeature[] = []) {
  return createUiComponent(
    {
      ...wrapperConfig({
        name: 'UiCheckTag',
        baseClass: 'ui-check-tag',
        props: checkTagBaseProps,
        defaultTag: 'div'
      }),
      setup(props, { emit }) {
        const checked = ref(Boolean(props.checked))
        watch(
          () => props.checked,
          (value) => {
            checked.value = Boolean(value)
          }
        )
        return {
          get checked() {
            return checked.value
          },
          toggle() {
            if (props.disabled) {
              return
            }
            checked.value = !checked.value
            emit('change', checked.value)
            emit('update:checked', checked.value)
          }
        }
      },
      classes: (props, state) => [state.checked ? 'is-checked' : '', props.disabled ? 'is-disabled' : ''],
      attrs: (_props, state) => ({ onClick: () => state.toggle() }),
      content: ({ slots }) => slots.default?.() ?? null
    },
    features
  )
}
