import type { Ref } from 'vue'
import { h, ref, watch } from 'vue'
import type { UiFeature, UiFeatureRuntime } from './feature'
import { Eye, EyeOff, X } from './icons'
import { renderIcon } from './icon'
import './input-actions.css'

type FeatureProps = Record<string, any>
type FeatureEmit = (event: string, ...args: any[]) => void
type FeatureRoot = Ref<any> | undefined

function queryInput(root: FeatureRoot): HTMLInputElement | null {
  return (root?.value?.querySelector?.('input') as HTMLInputElement | null) ?? null
}

function clearValue(props: FeatureProps, emit: FeatureEmit, root: FeatureRoot): void {
  if (props.disabled || props.readonly) {
    return
  }
  emit('update:modelValue', '')
  emit('input', '')
  emit('change', '')
  emit('clear')
  root?.value?.querySelector?.('input, textarea')?.focus()
}

export function createInputClearableFeature(options: { id: string; baseClass: string }): UiFeature {
  return {
    id: options.id,
    props: {
      clearable: { type: Boolean },
      clearIcon: { type: [String, Object, Function] }
    },
    setup(props, { emit, root }) {
      return {
        class: () => (props.clearable ? `${options.baseClass}--clearable` : undefined),
        suffix: () => {
          if (!props.clearable || props.disabled || props.readonly) {
            return null
          }
          if (props.modelValue === undefined || props.modelValue === null || props.modelValue === '') {
            return null
          }
          return h(
            'button',
            {
              type: 'button',
              class: `${options.baseClass}__clear`,
              'aria-label': 'Clear',
              tabindex: -1,
              onClick: () => clearValue(props, emit, root)
            },
            [renderIcon(props.clearIcon ?? X, { class: `${options.baseClass}__clear-icon` })]
          )
        }
      }
    },
    expose(runtime: UiFeatureRuntime) {
      return { clear: () => clearValue(runtime.props, runtime.emit, runtime.root) }
    }
  }
}

export function createInputPasswordFeature(options: { id: string; baseClass: string }): UiFeature {
  return {
    id: options.id,
    props: {
      showPassword: { type: Boolean }
    },
    setup(props, { root }) {
      const visible = ref(false)

      function apply(): void {
        const input = queryInput(root)
        if (input) {
          input.type = visible.value ? 'text' : 'password'
        }
      }

      watch(
        () => [props.showPassword, props.type],
        () => {
          if (props.showPassword && props.type === 'password') {
            return
          }
          visible.value = false
          const input = queryInput(root)
          if (input) {
            input.type = props.type || 'text'
          }
        }
      )

      return {
        suffix: () => {
          if (!props.showPassword || props.disabled || props.type !== 'password') {
            return null
          }
          return h(
            'button',
            {
              type: 'button',
              class: `${options.baseClass}__password`,
              'aria-label': visible.value ? 'Hide password' : 'Show password',
              'aria-pressed': visible.value,
              tabindex: -1,
              onClick: () => {
                visible.value = !visible.value
                apply()
              }
            },
            [renderIcon(visible.value ? EyeOff : Eye, { class: `${options.baseClass}__password-icon` })]
          )
        }
      }
    }
  }
}
