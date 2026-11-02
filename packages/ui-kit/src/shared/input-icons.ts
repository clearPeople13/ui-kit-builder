import type { Component } from 'vue'
import type { UiFeature } from './feature'
import { renderIcon } from './icon'

const iconProp = { type: [String, Object, Function] }

export function createInputIconsFeature(options: { id: string; baseClass: string }): UiFeature {
  return {
    id: options.id,
    props: {
      prefixIcon: { ...iconProp },
      suffixIcon: { ...iconProp }
    },
    setup(props: { prefixIcon?: Component | string; suffixIcon?: Component | string }) {
      return {
        class: () => (props.prefixIcon || props.suffixIcon ? `${options.baseClass}--icons` : undefined),
        prefix: () =>
          props.prefixIcon ? renderIcon(props.prefixIcon, { class: `${options.baseClass}__prefix` }) : null,
        suffix: () =>
          props.suffixIcon ? renderIcon(props.suffixIcon, { class: `${options.baseClass}__suffix` }) : null
      }
    }
  }
}
