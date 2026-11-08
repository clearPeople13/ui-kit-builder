import { h, ref, watch } from 'vue'
import { ChevronRight } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { createCollapseTransition } from '../collapse-transition/core'
import './core.css'

const CollapseTransition = createCollapseTransition([])

interface CollapseContext {
  isExpanded: (name: string | number) => boolean
  toggle: (name: string | number) => void
}

const COLLAPSE_CONTEXT = Symbol('ui-collapse-context')
let collapseSeed = 0

const collapseBaseProps = {
  modelValue: { type: [Array, String, Number], default: () => [] },
  accordion: { type: Boolean },
  expandIconPosition: { type: String, default: 'right' },
  beforeCollapse: { type: Function }
}

function normalizeExpanded(value: unknown, accordion: boolean): Array<string | number> {
  if (Array.isArray(value)) {
    return value as Array<string | number>
  }
  if (value === undefined || value === null || value === '') {
    return []
  }
  return accordion ? [value as string | number] : [value as string | number]
}

export function createCollapse(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiCollapse',
      baseClass: 'ui-collapse',
      props: collapseBaseProps,
      setup(props, { emit, provide }) {
        const expanded = ref<Array<string | number>>(normalizeExpanded(props.modelValue, Boolean(props.accordion)))

        watch(
          () => props.modelValue,
          (value) => {
            expanded.value = normalizeExpanded(value, Boolean(props.accordion))
          }
        )

        function isExpanded(name: string | number) {
          return expanded.value.some((item) => String(item) === String(name))
        }

        function toggle(name: string | number) {
          if (props.beforeCollapse && props.beforeCollapse(name) === false) {
            return
          }
          const opened = isExpanded(name)
          let next: Array<string | number>
          if (props.accordion) {
            next = opened ? [] : [name]
          } else {
            next = opened ? expanded.value.filter((item) => String(item) !== String(name)) : [...expanded.value, name]
          }
          expanded.value = next
          emit('update:modelValue', props.accordion ? (next[0] ?? '') : next)
          emit('change', props.accordion ? (next[0] ?? '') : next)
        }

        provide(COLLAPSE_CONTEXT, { isExpanded, toggle })

        return { isExpanded, toggle }
      },
      classes: (props) => [props.expandIconPosition ? `is-icon-${props.expandIconPosition}` : ''],
      content: ({ slots }) => h('div', { class: 'ui-collapse__list' }, [slots.default?.() ?? null])
    },
    features
  )
}

const collapseItemBaseProps = {
  disabled: { type: Boolean },
  title: { type: String, default: '' },
  name: { type: [String, Number] }
}

export function createCollapseItem(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiCollapseItem',
      baseClass: 'ui-collapse-item',
      props: collapseItemBaseProps,
      setup(props, { inject }) {
        const context = inject(COLLAPSE_CONTEXT, null) as CollapseContext | null
        const fallbackName = `collapse-${(collapseSeed += 1)}`
        const name = props.name ?? fallbackName
        return {
          itemName: name,
          get expanded() {
            return context ? context.isExpanded(name) : false
          },
          toggle() {
            if (props.disabled) {
              return
            }
            context?.toggle(name)
          }
        }
      },
      classes: (props, state) => [state.expanded ? 'is-active' : '', props.disabled ? 'is-disabled' : ''],
      content: ({ props, slots, state }) => [
        h(
          'button',
          {
            class: 'ui-collapse-item__header',
            type: 'button',
            'aria-label': props.title ? undefined : 'Collapse item',
            disabled: Boolean(props.disabled),
            onClick: () => state.toggle()
          },
          [
            renderIcon(props.icon || ChevronRight, { class: 'ui-collapse-item__arrow' }),
            h('span', { class: 'ui-collapse-item__title' }, props.title || '')
          ]
        ),
        h(CollapseTransition, null, {
          default: () =>
            state.expanded
              ? h('div', { class: 'ui-collapse-item__content' }, [
                  h('div', { class: 'ui-collapse-item__body' }, [slots.default?.() ?? null])
                ])
              : null
        })
      ]
    },
    features
  )
}
