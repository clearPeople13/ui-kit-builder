import { computed, h, inject, nextTick, ref, watch } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { sizeValue } from '../../shared/behavior'
import { CircleCheck, CircleX } from '../../shared/icons'
import {
  FORM_CONTEXT_KEY,
  getFieldValue,
  isEmptyFieldValue,
  normalizeFieldPath,
  resolveRuleMessage,
  toRuleList,
  type FormContext,
  type FormRules
} from './context'
import './core.css'

const formBaseProps = {
  size: { type: String },
  disabled: { type: Boolean },
  model: { type: Object },
  labelPosition: { type: String, default: 'right' },
  labelWidth: { type: [String, Number], default: '' },
  inline: { type: Boolean }
}

export function createForm(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiForm',
      baseClass: 'ui-form',
      props: formBaseProps,
      setup(props, { provide }) {
        const errors = ref<Record<string, string>>({})
        const formRef = ref<HTMLElement>()

        const context: FormContext = {
          get model() {
            return props.model as Record<string, any> | undefined
          },
          get rules() {
            return props.rules as FormRules | undefined
          },
          get errors() {
            return errors.value
          },
          get disabled() {
            return Boolean(props.disabled)
          },
          get labelWidth() {
            return props.labelWidth as string | number | undefined
          },
          get labelPosition() {
            return String(props.labelPosition || '')
          },
          get size() {
            return props.size as string | undefined
          },
          get showMessage() {
            return props.showMessage !== false
          },
          get inlineMessage() {
            return Boolean(props.inlineMessage)
          },
          get statusIcon() {
            return Boolean(props.statusIcon)
          },
          get requireAsteriskPosition() {
            return String(props.requireAsteriskPosition || 'left')
          },
          get hideRequiredAsterisk() {
            return Boolean(props.hideRequiredAsterisk)
          },
          get labelSuffix() {
            return String(props.labelSuffix || '')
          }
        }

        provide(FORM_CONTEXT_KEY, context)

        function scrollToFirstError(): void {
          const container = formRef.value
          if (!container) {
            return
          }
          const target = container.querySelector('.ui-form-item.is-error')
          if (!target) {
            return
          }
          const option = props.scrollIntoViewOptions
          if (option === false) {
            return
          }
          const config: ScrollIntoViewOptions =
            typeof option === 'object' && option ? option : { block: 'center', behavior: 'smooth' }
          target.scrollIntoView(config)
        }

        function validateFields(): void {
          const rules = props.rules as FormRules | undefined
          const model = props.model as Record<string, any> | undefined
          const next: Record<string, string> = {}
          if (rules && model) {
            for (const path of Object.keys(rules)) {
              const message = resolveRuleMessage(getFieldValue(model, path), rules[path])
              if (message) {
                next[path] = message
              }
            }
          }
          const hadErrors = Object.keys(errors.value).length > 0
          errors.value = next
          if (!hadErrors && Object.keys(next).length > 0 && props.scrollToError) {
            nextTick(scrollToFirstError)
          }
        }

        watch(() => props.model, validateFields, { deep: true, immediate: true })
        watch(
          () => props.rules,
          () => {
            if (props.validateOnRuleChange !== false) {
              validateFields()
            }
          },
          { deep: true }
        )

        return {
          get formRef() {
            return formRef
          }
        }
      },
      classes: (props) => [
        props.inline ? 'is-inline' : '',
        props.labelPosition ? `is-label-${props.labelPosition}` : '',
        props.size ? `is-size-${props.size}` : '',
        props.disabled ? 'is-disabled' : ''
      ],
      styles: (props) => ({ '--ui-form-label-width': sizeValue(props.labelWidth) || '96px' }),
      content: ({ props, state, slots }) =>
        h('form', { ref: state.formRef, class: 'ui-form__inner', onSubmit: (event: Event) => event.preventDefault() }, [
          slots.default?.({
            model: props.model,
            disabled: Boolean(props.disabled),
            size: props.size,
            labelWidth: props.labelWidth,
            labelPosition: props.labelPosition
          }) ?? null
        ])
    },
    features
  )
}

const formItemBaseProps = {
  size: { type: String },
  label: { type: String },
  labelWidth: { type: [String, Number] },
  labelPosition: { type: String, default: '' },
  prop: { type: [String, Array] },
  required: { type: Boolean, default: null },
  error: { type: String },
  validateStatus: { type: String },
  for: { type: String }
}

export function createFormItem(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiFormItem',
      baseClass: 'ui-form-item',
      props: formItemBaseProps,
      setup(props) {
        const form = inject(FORM_CONTEXT_KEY, undefined)
        const path = computed(() => normalizeFieldPath(props.prop))
        const itemRules = computed(() => toRuleList(props.rules as FormRules[string] | undefined))
        const fieldValue = computed(() => getFieldValue(form?.model, path.value))
        const itemRuleError = computed(() => {
          if (!form?.model) {
            return ''
          }
          return resolveRuleMessage(fieldValue.value, itemRules.value)
        })
        const inheritedError = computed(() => {
          if (!form?.model || !path.value || itemRules.value.length) {
            return ''
          }
          return form.errors[path.value] ?? ''
        })
        const rawError = computed(() => {
          return String(props.error || '') || inheritedError.value || itemRuleError.value
        })
        const showMessage = computed(() => {
          if (props.showMessage === null || props.showMessage === undefined) {
            return form?.showMessage !== false
          }
          return Boolean(props.showMessage)
        })
        const fieldRequired = computed(() => {
          if (props.required === true) {
            return true
          }
          if (props.required === false) {
            return false
          }
          const rules = itemRules.value.length
            ? itemRules.value
            : toRuleList(form?.rules?.[path.value] as FormRules[string] | undefined)
          return rules.some((rule) => rule.required === true)
        })
        const hasFieldRules = computed(() => {
          if (!form?.model) {
            return false
          }
          if (itemRules.value.length) {
            return true
          }
          return toRuleList(form?.rules?.[path.value] as FormRules[string] | undefined).length > 0
        })
        const showStatusIcon = computed(() => Boolean(form?.statusIcon))
        const effectiveStatus = computed(() => {
          if (props.validateStatus) {
            return String(props.validateStatus)
          }
          if (rawError.value) {
            return 'error'
          }
          if (showStatusIcon.value && hasFieldRules.value && !isEmptyFieldValue(fieldValue.value)) {
            return 'success'
          }
          return ''
        })

        return {
          get fieldRequired() {
            return fieldRequired.value
          },
          get effectiveLabelPosition() {
            return String(props.labelPosition || form?.labelPosition || '')
          },
          get effectiveLabelWidth() {
            return props.labelWidth !== undefined && props.labelWidth !== null && props.labelWidth !== ''
              ? props.labelWidth
              : form?.labelWidth
          },
          get effectiveSize() {
            return String(props.size || form?.size || '')
          },
          get effectiveStatus() {
            return effectiveStatus.value
          },
          get showStatusIcon() {
            return showStatusIcon.value && Boolean(effectiveStatus.value)
          },
          get errorMessage() {
            return showMessage.value ? rawError.value : ''
          },
          get inlineMessage() {
            return props.inlineMessage === null || props.inlineMessage === undefined
              ? Boolean(form?.inlineMessage)
              : Boolean(props.inlineMessage)
          },
          get asteriskPosition() {
            return form?.requireAsteriskPosition === 'right' ? 'right' : 'left'
          },
          get hideAsterisk() {
            return Boolean(form?.hideRequiredAsterisk)
          },
          get labelSuffix() {
            return String(form?.labelSuffix || '')
          },
          get formDisabled() {
            return Boolean(form?.disabled)
          }
        }
      },
      classes: (_props, state) => [
        state.effectiveLabelPosition ? `is-label-${state.effectiveLabelPosition}` : '',
        state.fieldRequired ? 'is-required' : '',
        state.asteriskPosition === 'right' ? 'is-asterisk-right' : '',
        state.hideAsterisk ? 'is-hide-asterisk' : '',
        state.effectiveStatus ? `is-${state.effectiveStatus}` : '',
        state.inlineMessage ? 'is-inline-message' : '',
        state.showStatusIcon ? 'is-status-icon' : '',
        state.effectiveSize ? `is-size-${state.effectiveSize}` : '',
        state.formDisabled ? 'is-disabled' : ''
      ],
      styles: (_props, state) => ({ '--ui-form-item-label-width': sizeValue(state.effectiveLabelWidth) || undefined }),
      content: ({ props, slots, state }) => [
        props.label || slots.label
          ? h(
              'label',
              {
                class: 'ui-form-item__label',
                for: props.for
              },
              [
                slots.label?.() ?? props.label,
                state.labelSuffix ? h('span', { class: 'ui-form-item__label-suffix' }, state.labelSuffix) : null
              ]
            )
          : null,
        h('div', { class: 'ui-form-item__content' }, [
          slots.default?.() ?? null,
          state.showStatusIcon
            ? h('span', { class: ['ui-form-item__status', `is-${state.effectiveStatus}`] }, [
                renderIcon(state.effectiveStatus === 'success' ? CircleCheck : CircleX)
              ])
            : null,
          state.errorMessage ? h('div', { class: 'ui-form-item__error' }, state.errorMessage) : null
        ])
      ]
    },
    features
  )
}
