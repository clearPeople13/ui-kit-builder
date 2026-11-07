import type { PropType } from 'vue'
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import './core.css'

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

type FocusStart = HTMLElement | 'container' | 'first' | 'last' | undefined

const focusTrapBaseProps = {
  loop: Boolean,
  trapped: Boolean,
  focusTrapEl: { type: Object as PropType<HTMLElement> },
  focusStartEl: {
    type: [Object, String] as PropType<FocusStart>,
    default: 'first'
  }
}

function isVisible(element: HTMLElement) {
  return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => isVisible(element))
}

export function createFocusTrap(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiFocusTrap',
      baseClass: 'ui-focus-trap',
      props: focusTrapBaseProps,
      emits: ['blur'],
      attrs: () => ({ tabindex: -1 }),
      classes: (props) => [props.trapped ? 'is-trapped' : ''],
      setup(props, { emit, root }) {
        const rootRef = root

        function getContainer(): HTMLElement | undefined {
          return props.focusTrapEl || rootRef.value
        }

        function resolveStartTarget(container: HTMLElement): HTMLElement | undefined {
          if (props.focusStartEl instanceof HTMLElement) {
            return props.focusStartEl
          }
          if (props.focusStartEl === 'container') {
            return container
          }
          const focusable = getFocusableElements(container)
          if (!focusable.length) {
            return container
          }
          return props.focusStartEl === 'last' ? focusable[focusable.length - 1] : focusable[0]
        }

        function focusStart() {
          const container = getContainer()
          if (!container) {
            return
          }
          const target = resolveStartTarget(container)
          target?.focus({ preventScroll: true })
        }

        function handleKeydown(event: KeyboardEvent) {
          if (!props.trapped || event.key !== 'Tab') {
            return
          }
          const container = getContainer()
          if (!container) {
            return
          }
          const focusable = getFocusableElements(container)
          if (!focusable.length) {
            event.preventDefault()
            container.focus({ preventScroll: true })
            return
          }
          const first = focusable[0]
          const last = focusable[focusable.length - 1]
          const active = document.activeElement as HTMLElement | null
          const outside = !active || !container.contains(active)

          if (event.shiftKey) {
            if (outside || active === first) {
              event.preventDefault()
              if (props.loop || outside) {
                last.focus({ preventScroll: true })
              }
            }
            return
          }

          if (outside || active === last) {
            event.preventDefault()
            if (props.loop || outside) {
              first.focus({ preventScroll: true })
            }
          }
        }

        function handleFocusOut(event: FocusEvent) {
          if (!props.trapped) {
            return
          }
          const container = getContainer()
          if (!container) {
            return
          }
          const nextTarget = event.relatedTarget as Node | null
          if (nextTarget && container.contains(nextTarget)) {
            return
          }
          emit('blur', event)
          nextTick(focusStart)
        }

        watch(
          () => props.trapped,
          (trapped) => {
            if (trapped) {
              addListeners()
              nextTick(focusStart)
            } else {
              removeListeners()
            }
          }
        )

        function addListeners() {
          window.addEventListener('keydown', handleKeydown, true)
          window.addEventListener('focusout', handleFocusOut, true)
        }

        function removeListeners() {
          window.removeEventListener('keydown', handleKeydown, true)
          window.removeEventListener('focusout', handleFocusOut, true)
        }

        onMounted(() => {
          if (props.trapped) {
            addListeners()
            nextTick(focusStart)
          }
        })

        onBeforeUnmount(() => {
          removeListeners()
          rootRef.value = undefined
        })

        return { focusStart }
      },
      expose: ({ state }) => ({ focusStart: state.focusStart })
    },
    features
  )
}
