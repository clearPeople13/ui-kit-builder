import type { VNodeChild } from 'vue'
import { h, ref } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import './core.css'

const inputOtpBaseProps = {
  modelValue: { type: [String, Number], default: '' },
  length: { type: Number, default: 6 },
  size: { type: String, default: '' },
  type: { type: String, default: 'text' },
  disabled: Boolean,
  separator: { type: String, default: '' },
  mask: Boolean,
  pattern: { type: String, default: '' },
  ariaLabel: { type: String }
}

export function createInputOtp(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiInputOtp',
      baseClass: 'ui-input-otp',
      props: inputOtpBaseProps,
      setup(props, { emit }) {
        const inputs = ref<HTMLInputElement[]>([])
        const focusedIndex = ref(-1)

        function currentChars(): string[] {
          const length = Math.max(1, Number(props.length) || 6)
          return Array.from({ length }, (_, index) => {
            const value = String(props.modelValue ?? '')
            return value[index] ?? ''
          })
        }

        function commit(chars: string[]) {
          const value = chars.join('').replace(/\s+$/, '')
          emit('update:modelValue', value)
          emit('change', value)
        }

        function focusInput(index: number) {
          const target = inputs.value[index]
          target?.focus()
          target?.select()
        }

        function handleInput(index: number, event: Event) {
          const input = event.target as HTMLInputElement
          const raw = input.value
          const chars = currentChars()
          const char = raw.slice(-1)
          chars[index] = char
          commit(chars)
          input.value = char
          if (char && index < chars.length - 1) {
            focusInput(index + 1)
          }
        }

        function handleKeydown(index: number, event: KeyboardEvent) {
          const chars = currentChars()
          if (event.key === 'Backspace') {
            event.preventDefault()
            if (chars[index]) {
              chars[index] = ''
              commit(chars)
              return
            }
            if (index > 0) {
              chars[index - 1] = ''
              commit(chars)
              focusInput(index - 1)
            }
            return
          }
          if (event.key === 'Delete') {
            event.preventDefault()
            chars[index] = ''
            commit(chars)
            return
          }
          if (event.key === 'ArrowLeft' && index > 0) {
            event.preventDefault()
            focusInput(index - 1)
          }
          if (event.key === 'ArrowRight' && index < chars.length - 1) {
            event.preventDefault()
            focusInput(index + 1)
          }
        }

        function handlePaste(index: number, event: ClipboardEvent) {
          const text = event.clipboardData?.getData('text') ?? ''
          if (!text) {
            return
          }
          event.preventDefault()
          const chars = currentChars()
          const digits = Array.from(text.replace(/\s/g, ''))
          for (let offset = 0; index + offset < chars.length && offset < digits.length; offset += 1) {
            chars[index + offset] = digits[offset]
          }
          commit(chars)
          focusInput(Math.min(index + digits.length, chars.length - 1))
        }

        return {
          setInput(index: number, element: Element | null) {
            if (element) {
              inputs.value[index] = element as HTMLInputElement
            }
          },
          handleInput,
          handleKeydown,
          handlePaste,
          handleFocus(index: number) {
            focusedIndex.value = index
          },
          handleBlur() {
            focusedIndex.value = -1
          },
          get focusedIndex() {
            return focusedIndex.value
          }
        }
      },
      classes: (props) => [props.size ? `ui-input-otp--size-${props.size}` : '', props.disabled ? 'is-disabled' : ''],
      content: ({ props, state }) => {
        const length = Math.max(1, Number(props.length) || 6)
        const value = String(props.modelValue ?? '')
        const nodes: VNodeChild[] = []
        for (let index = 0; index < length; index += 1) {
          if (props.separator && index > 0) {
            nodes.push(h('span', { class: 'ui-input-otp__separator' }, props.separator))
          }
          nodes.push(
            h('input', {
              key: index,
              ref: (element: any) => {
                state.setInput(index, element)
              },
              class: ['ui-input-otp__input', state.focusedIndex === index ? 'is-focused' : ''],
              type: props.mask ? 'password' : props.type || 'text',
              inputmode: 'numeric',
              maxlength: 1,
              value: value[index] ?? '',
              disabled: Boolean(props.disabled),
              pattern: props.pattern || undefined,
              'aria-label': props.ariaLabel ? `${props.ariaLabel} ${index + 1}` : undefined,
              onInput: (event: Event) => state.handleInput(index, event),
              onKeydown: (event: KeyboardEvent) => state.handleKeydown(index, event),
              onPaste: (event: ClipboardEvent) => state.handlePaste(index, event),
              onFocus: () => state.handleFocus(index),
              onBlur: state.handleBlur
            })
          )
        }
        return nodes
      }
    },
    features
  )
}
