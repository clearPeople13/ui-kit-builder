import { h } from 'vue'
import type { UiFeature, UiFeatureRuntime } from '../../../../shared/feature'
import { X } from '../../../../shared/icons'
import { renderIcon } from '../../../../shared/icon'
import './style.css'

function tagsOf(props: Record<string, any>): unknown[] {
  return Array.isArray(props.modelValue) ? props.modelValue : []
}

function clearTags(
  props: Record<string, any>,
  emit: (event: string, ...args: any[]) => void,
  root: { value?: any } | undefined
): void {
  if (props.disabled || props.readonly || !tagsOf(props).length) {
    return
  }
  emit('update:modelValue', [])
  emit('change', [])
  emit('clear')
  const input = root?.value?.querySelector?.('.ui-input-tag__input') as HTMLInputElement | null
  input?.focus()
}

export const inputTagClearableFeature: UiFeature = {
  id: 'input-tag.clearable',
  props: {
    clearable: { type: Boolean },
    clearIcon: { type: [String, Object, Function] }
  },
  setup(props, { emit, root }) {
    return {
      class: () => (props.clearable ? 'ui-input-tag--clearable' : undefined),
      suffix: () => {
        if (!props.clearable || props.disabled || props.readonly) {
          return null
        }
        if (!tagsOf(props).length) {
          return null
        }
        return h(
          'button',
          {
            type: 'button',
            class: 'ui-input-tag__clear',
            'aria-label': '清空',
            tabindex: -1,
            onClick: () => clearTags(props, emit, root)
          },
          [renderIcon(props.clearIcon ?? X, { class: 'ui-input-tag__clear-icon' })]
        )
      }
    }
  },
  expose(runtime: UiFeatureRuntime) {
    return { clear: () => clearTags(runtime.props, runtime.emit, runtime.root) }
  }
}
