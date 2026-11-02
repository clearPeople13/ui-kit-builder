import { h, ref } from 'vue'
import { X } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { inputTagClearableFeature } from './features/clearable/index'
import { inputTagDraggableFeature } from './features/draggable/index'
import './core.css'

const inputTagBaseProps = {
  modelValue: { type: Array, default: () => [] },
  size: { type: String },
  disabled: { type: Boolean },
  max: { type: Number },
  effect: { type: String, default: 'light' },
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
        const tags = () => (Array.isArray(props.modelValue) ? props.modelValue : [])

        function commit() {
          const value = draft.value.trim()
          if (!value) {
            return
          }
          if (props.max !== undefined && tags().length >= Number(props.max)) {
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
        }

        function remove(index: number) {
          if (props.disabled) {
            return
          }
          const next = tags().filter((_, itemIndex) => itemIndex !== index)
          emit('update:modelValue', next)
          emit('change', next)
          emit('remove-tag', tags()[index])
        }

        function handleKeydown(event: KeyboardEvent) {
          if (event.key === (props.trigger || 'Enter')) {
            event.preventDefault()
            commit()
          } else if (event.key === 'Backspace' && !draft.value && tags().length) {
            remove(tags().length - 1)
          }
        }

        return { draft, tags, commit, remove, handleKeydown }
      },
      content: ({ props, state }) => [
        ...state.tags().map((tag: string, index: number) =>
          h(
            'span',
            {
              class: ['ui-input-tag__tag', props.effect ? `is-${props.effect}` : ''],
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
                      onClick: () => state.remove(index)
                    },
                    [renderIcon(X)]
                  )
            ]
          )
        ),
        h('input', {
          class: 'ui-input-tag__input',
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
          },
          onKeydown: (event: KeyboardEvent) => state.handleKeydown(event),
          onBlur: () => {
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
