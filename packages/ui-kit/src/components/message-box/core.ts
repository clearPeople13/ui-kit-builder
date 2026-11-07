import type { VNodeChild } from 'vue'
import { Teleport, computed, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { X } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { useScrollLock } from '../../shared/scroll-lock'
import { nextZIndex } from '../../shared/z-index'
import './core.css'

const messageBoxBaseProps = {
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  type: { type: String, default: '' },
  showClose: { type: Boolean, default: true },
  showCancelButton: Boolean,
  confirmButtonText: { type: String, default: '确定' },
  cancelButtonText: { type: String, default: '取消' },
  closeOnClickModal: { type: Boolean, default: true },
  closeOnPressEscape: { type: Boolean, default: true },
  lockScroll: { type: Boolean, default: true },
  center: Boolean,
  overflow: Boolean,
  customClass: { type: String, default: '' },
  confirmButtonClass: { type: String, default: '' },
  cancelButtonClass: { type: String, default: '' },
  teleported: { type: Boolean, default: true },
  appendTo: { type: String, default: 'body' }
}

export function createMessageBox(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiMessageBox',
      baseClass: 'ui-message-box',
      props: messageBoxBaseProps,
      setup(props, { emit }) {
        const inputError = ref('')
        const zIndex = ref(0)

        const visible = computed(() => Boolean(props.modelValue))

        watch(
          visible,
          (value) => {
            if (value) {
              zIndex.value = nextZIndex()
            }
          },
          { immediate: true }
        )

        useScrollLock(() => visible.value && props.lockScroll === true)

        function finish(action: 'confirm' | 'cancel' | 'close') {
          if (typeof props.beforeClose === 'function') {
            props.beforeClose(action, { close: () => emit('update:modelValue', false) }, () => {
              emit('update:modelValue', false)
              emit('close', action)
              emit(action)
            })
            return
          }
          emit('update:modelValue', false)
          emit('close', action)
          emit(action)
        }

        function confirm() {
          if (props.showInput && typeof props.inputValidator === 'function') {
            const result = props.inputValidator(props.inputValue)
            if (result !== true && result !== undefined && result !== '') {
              inputError.value = typeof result === 'string' ? result : props.inputErrorMessage || '输入不合法'
              return
            }
          }
          inputError.value = ''
          finish('confirm')
        }

        function cancel() {
          finish('cancel')
        }

        function close() {
          finish('close')
        }

        function handleKeydown(event: KeyboardEvent) {
          if (event.key === 'Escape' && visible.value && props.closeOnPressEscape) {
            event.preventDefault()
            close()
          }
        }

        onMounted(() => document.addEventListener('keydown', handleKeydown))
        onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown))

        function renderPanel(): VNodeChild {
          if (!visible.value) {
            return null
          }
          const header =
            props.title || props.showClose
              ? h('header', { class: 'ui-message-box__header' }, [
                  h('span', { class: 'ui-message-box__title' }, props.title),
                  props.showClose
                    ? h(
                        'button',
                        {
                          class: 'ui-message-box__close',
                          type: 'button',
                          'aria-label': 'Close',
                          onClick: close
                        },
                        [renderIcon(X)]
                      )
                    : null
                ])
              : null
          const bodyChildren: VNodeChild[] = []
          bodyChildren.push(h('div', { class: 'ui-message-box__message' }, props.message))
          if (props.showInput) {
            bodyChildren.push(
              h('div', { class: 'ui-message-box__input' }, [
                h('input', {
                  class: ['ui-message-box__input-inner', inputError.value ? 'is-error' : ''],
                  type: props.inputType || 'text',
                  value: props.inputValue ?? '',
                  placeholder: props.inputPlaceholder ?? '',
                  onInput: (event: Event) => {
                    const value = (event.target as HTMLInputElement).value
                    emit('input-value-change', value)
                    inputError.value = ''
                  }
                }),
                inputError.value ? h('div', { class: 'ui-message-box__input-error' }, inputError.value) : null
              ])
            )
          }
          const footer = h('footer', { class: 'ui-message-box__footer' }, [
            props.showCancelButton
              ? h(
                  'button',
                  {
                    class: ['ui-message-box__button', 'is-cancel', props.cancelButtonClass],
                    type: 'button',
                    onClick: cancel
                  },
                  props.cancelButtonText
                )
              : null,
            h(
              'button',
              {
                class: ['ui-message-box__button', 'is-primary', props.confirmButtonClass],
                type: 'button',
                onClick: confirm
              },
              props.confirmButtonText
            )
          ])
          const panel = h(
            'section',
            {
              class: [
                'ui-message-box__panel',
                props.customClass,
                props.overflow ? 'is-overflow' : '',
                props.type ? `ui-message-box__panel--${props.type}` : ''
              ],
              role: 'dialog',
              'aria-modal': 'true',
              style: zIndex.value ? { zIndex: zIndex.value + 1 } : undefined
            },
            [header, h('div', { class: 'ui-message-box__body' }, bodyChildren), footer]
          )
          const mask = h('div', {
            class: 'ui-message-box__mask',
            style: zIndex.value ? { zIndex: zIndex.value } : undefined,
            onClick: () => {
              if (props.closeOnClickModal) {
                close()
              }
            }
          })
          const nodes = [mask, panel]
          return props.teleported ? h(Teleport, { to: props.appendTo || 'body' }, nodes) : nodes
        }

        return {
          renderPanel
        }
      },
      classes: (props) => (props.center ? ['is-center'] : []),
      content: ({ state }) => state.renderPanel()
    },
    features
  )
}
