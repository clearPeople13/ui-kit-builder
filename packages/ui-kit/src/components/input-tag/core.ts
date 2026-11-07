import { h, ref } from 'vue'
import { X } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { inputTagClearableFeature } from './features/clearable/index'
import { inputTagDraggableFeature } from './features/draggable/index'
import { inputTagSeparatorFeature } from './features/separator/index'
import './core.css'

const TRIGGER_KEY_MAP: Record<string, string | null> = {
  Enter: 'Enter',
  Space: ' ',
  Both: null
}

const inputTagBaseProps = {
  modelValue: { type: Array, default: () => [] },
  size: { type: String },
  disabled: { type: Boolean },
  max: { type: Number },
  effect: { type: String, default: 'light' },
  tagType: { type: String, default: 'primary' },
  trigger: { type: String, default: 'Enter' },
  readonly: { type: Boolean },
  id: { type: String },
  tabindex: { type: [String, Number], default: 0 },
  maxlength: { type: [String, Number] },
  minlength: { type: [String, Number] },
  placeholder: { type: String },
  autocomplete: { type: String, default: 'off' },
  saveOnBlur: { type: Boolean, default: true },
  ariaLabel: { type: String }
}

export function createInputTag(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiInputTag',
      baseClass: 'ui-input-tag',
      props: inputTagBaseProps,
      classes: (props) => {
        const classes: string[] = []
        if (props.disabled) {
          classes.push('is-disabled')
        }
        if (props.size) {
          classes.push(`is-size-${props.size}`)
        }
        return classes
      },
      setup(props, { emit }) {
        const draft = ref('')
        const inputRef = ref<HTMLInputElement | null>(null)
        const tags = () => (Array.isArray(props.modelValue) ? props.modelValue : [])

        function isTriggerKey(key: string): boolean {
          const trigger = String(props.trigger || 'Enter')
          // Both 在映射表里的值是 null，不能用 ?? 兜底，否则 null 会被当成缺省 'Enter'
          const expected = trigger in TRIGGER_KEY_MAP ? TRIGGER_KEY_MAP[trigger] : 'Enter'
          if (expected === null) {
            return key === 'Enter' || key === ' '
          }
          return key === expected
        }

        function canAccept(count = 1): boolean {
          if (props.max === undefined) {
            return true
          }
          return tags().length + count <= Number(props.max)
        }

        function commit() {
          const value = draft.value.trim()
          if (!value) {
            return
          }
          if (!canAccept()) {
            return
          }
          if (tags().includes(value)) {
            draft.value = ''
            return
          }
          const next = [...tags(), value]
          draft.value = ''
          emit('update:modelValue', next)
          emit('change', next)
          emit('add-tag', value)
        }

        function remove(index: number) {
          if (props.disabled) {
            return
          }
          const removed = tags()[index]
          const next = tags().filter((_, itemIndex) => itemIndex !== index)
          emit('remove-tag', removed)
          emit('update:modelValue', next)
          emit('change', next)
        }

        function handleKeydown(event: KeyboardEvent) {
          if (isTriggerKey(event.key)) {
            event.preventDefault()
            commit()
          } else if (event.key === 'Backspace' && !draft.value && tags().length) {
            remove(tags().length - 1)
          }
        }

        function focusInput() {
          inputRef.value?.focus()
        }

        return { draft, inputRef, tags, commit, remove, handleKeydown, focusInput, canAccept }
      },
      attrs: (_props, state) => ({
        onClick: (event: MouseEvent) => {
          const target = event.target as HTMLElement | null
          if (target?.closest('.ui-input-tag__tag, .ui-input-tag__clear')) {
            return
          }
          state.focusInput()
        }
      }),
      content: ({ props, state, emit }) => [
        ...state.tags().map((tag: string, index: number) =>
          h(
            'span',
            {
              class: [
                'ui-input-tag__tag',
                props.effect ? `is-${props.effect}` : '',
                props.tagType ? `is-${props.tagType}` : ''
              ],
              key: `${tag}-${index}`
            },
            [
              h('span', { class: 'ui-input-tag__text' }, String(tag)),
              props.disabled
                ? null
                : h(
                    'button',
                    {
                      class: 'ui-input-tag__close',
                      type: 'button',
                      'aria-label': `移除 ${String(tag)}`,
                      onClick: () => state.remove(index)
                    },
                    [renderIcon(X)]
                  )
            ]
          )
        ),
        h('input', {
          class: 'ui-input-tag__input',
          ref: state.inputRef,
          value: state.draft.value,
          type: 'text',
          id: props.id,
          disabled: Boolean(props.disabled),
          readonly: Boolean(props.readonly),
          tabindex: props.disabled ? undefined : props.tabindex,
          'aria-label': props.ariaLabel,
          placeholder: state.tags().length ? '' : props.placeholder || '请输入后回车',
          autocomplete: props.autocomplete,
          maxlength: props.maxlength,
          minlength: props.minlength,
          onInput: (event: Event) => {
            state.draft.value = (event.target as HTMLInputElement).value
            emit('input', state.draft.value)
          },
          onKeydown: (event: KeyboardEvent) => state.handleKeydown(event),
          onFocus: () => emit('focus'),
          onBlur: () => {
            emit('blur')
            if (props.saveOnBlur) {
              state.commit()
            }
          }
        })
      ]
    },
    features
  )
}
