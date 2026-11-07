import { h } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { normalizeOptions } from '../../shared/options'
import './core.css'

const segmentedBaseProps = {
  disabled: { type: Boolean },
  options: { type: Array, default: () => [] },
  // Boolean 联合类型不写 default 会被 Vue 归一成 false，未受控时 value:false 的选项一上来就高亮；
  // 与 F-2 / F-4 / F-13 / F-14 同一口径：显式 default: undefined 保住"没传就是没传"
  modelValue: { type: [String, Number, Boolean], default: undefined },
  size: { type: String },
  label: { type: null },
  direction: { type: String, default: 'horizontal' },
  props: { type: Object, default: () => ({}) },
  block: { type: Boolean },
  id: { type: String }
}

export function createSegmented(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiSegmented',
      baseClass: 'ui-segmented',
      props: segmentedBaseProps,
      classes: (props) => [
        props.size ? `--size-${props.size}` : '',
        props.block ? 'is-block' : '',
        props.direction ? `is-${props.direction}` : '',
        props.disabled ? 'is-disabled' : ''
      ],
      attrs: (props) => ({ id: props.id || undefined }),
      content: ({ props, emit }) =>
        h(
          'div',
          {
            class: 'ui-segmented__group',
            role: 'radiogroup',
            'aria-label': props.label || undefined
          },
          normalizeOptions(props.options, props.props).map((option) =>
            h(
              'button',
              {
                key: String(option.value),
                type: 'button',
                role: 'radio',
                class: ['ui-segmented__item', String(props.modelValue) === String(option.value) ? 'is-active' : ''],
                disabled: Boolean(props.disabled) || option.disabled,
                'aria-checked': String(props.modelValue) === String(option.value),
                onClick: () => {
                  if (option.disabled) {
                    return
                  }
                  emit('update:modelValue', option.value)
                  emit('change', option.value)
                }
              },
              option.label
            )
          )
        )
    },
    features
  )
}
