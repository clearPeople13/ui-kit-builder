import { h } from 'vue'
import { Check } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { stepIconsFeature } from './features/icons/index'
import './core.css'

interface StepsContext {
  active: () => number
  finishStatus: () => string
  processStatus: () => string
  nextIndex: () => number
}

const STEPS_CONTEXT = Symbol('ui-steps-context')

const stepBaseProps = {
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  status: { type: String, default: '' },
  icon: { type: [String, Object, Function] }
}

export function createStep(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiStep',
      baseClass: 'ui-step',
      props: stepBaseProps,
      setup(props, { inject }) {
        const context = inject(STEPS_CONTEXT, null) as StepsContext | null
        const index = context ? context.nextIndex() : 0
        return {
          stepIndex: index,
          get status() {
            if (props.status) {
              return props.status
            }
            if (!context) {
              return 'wait'
            }
            const active = context.active()
            if (index < active) {
              return context.finishStatus()
            }
            if (index === active) {
              return context.processStatus()
            }
            return 'wait'
          }
        }
      },
      classes: (_props, state) => [`is-${state.status}`],
      content: ({ props, slots, state }) => [
        h('div', { class: 'ui-step__head' }, [
          props.icon
            ? renderIcon(props.icon, { class: 'ui-step__icon' })
            : state.status === 'finish'
              ? renderIcon(Check, { class: 'ui-step__icon' })
              : h('span', { class: 'ui-step__icon' }, String(state.stepIndex + 1)),
          h('span', { class: 'ui-step__line' })
        ]),
        h('div', { class: 'ui-step__main' }, [
          h('div', { class: 'ui-step__title' }, [slots.title?.() ?? props.title]),
          h('div', { class: 'ui-step__description' }, [slots.description?.() ?? props.description])
        ])
      ]
    },
    features
  )
}

const stepsBaseProps = {
  space: { type: [Number, String], default: '' },
  active: { type: Number, default: 0 },
  direction: { type: String, default: 'horizontal' },
  alignCenter: { type: Boolean },
  simple: { type: Boolean },
  finishStatus: { type: String, default: 'finish' },
  processStatus: { type: String, default: 'process' }
}

export function createSteps(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiSteps',
      baseClass: 'ui-steps',
      props: stepsBaseProps,
      setup(props, { provide }) {
        let seed = 0
        provide(STEPS_CONTEXT, {
          active: () => Number(props.active ?? 0),
          finishStatus: () => String(props.finishStatus || 'finish'),
          processStatus: () => String(props.processStatus || 'process'),
          nextIndex: () => seed++
        })
        return {
          get direction() {
            return props.direction || 'horizontal'
          }
        }
      },
      classes: (props) => [
        props.direction ? `is-${props.direction}` : '',
        props.simple ? 'is-simple' : '',
        props.alignCenter ? 'is-align-center' : ''
      ],
      styles: (props) =>
        props.space ? { gap: typeof props.space === 'number' ? `${props.space}px` : props.space } : {},
      content: ({ slots }) => h('div', { class: 'ui-steps__list' }, [slots.default?.() ?? null])
    },
    features
  )
}
