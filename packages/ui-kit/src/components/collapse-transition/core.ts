import { Transition, defineComponent, h } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { mergeFeatureProps } from '../../shared/feature'
import './core.css'

const collapseTransitionBaseProps = {
  name: { type: String, default: 'ui-collapse-transition' }
}

const TRANSITION = 'height 0.28s cubic-bezier(0.4, 0, 0.2, 1)'

function startHeight(el: HTMLElement) {
  el.style.height = `${el.scrollHeight}px`
}

function clearStyle(el: HTMLElement) {
  el.style.height = ''
  el.style.overflow = ''
  el.style.paddingTop = ''
  el.style.paddingBottom = ''
  el.style.marginTop = ''
  el.style.marginBottom = ''
  el.style.transition = ''
}

function beforeEnter(el: Element) {
  const node = el as HTMLElement
  node.style.height = '0'
  node.style.overflow = 'hidden'
  node.style.paddingTop = '0'
  node.style.paddingBottom = '0'
  node.style.marginTop = '0'
  node.style.marginBottom = '0'
  node.style.transition = TRANSITION
  void node.offsetHeight
}

function enter(el: Element) {
  const node = el as HTMLElement
  node.style.height = `${node.scrollHeight}px`
}

function afterEnter(el: Element) {
  clearStyle(el as HTMLElement)
}

function beforeLeave(el: Element) {
  const node = el as HTMLElement
  startHeight(node)
  node.style.overflow = 'hidden'
  node.style.transition = TRANSITION
  void node.offsetHeight
}

function leave(el: Element) {
  const node = el as HTMLElement
  node.style.height = '0'
  node.style.paddingTop = '0'
  node.style.paddingBottom = '0'
  node.style.marginTop = '0'
  node.style.marginBottom = '0'
}

function afterLeave(el: Element) {
  clearStyle(el as HTMLElement)
}

export function createCollapseTransition(features: UiFeature[] = []) {
  return defineComponent({
    name: 'UiCollapseTransition',
    props: { ...collapseTransitionBaseProps, ...mergeFeatureProps(features) },
    setup(props, { slots }) {
      return () =>
        h(
          Transition,
          {
            name: props.name,
            onBeforeEnter: beforeEnter,
            onEnter: enter,
            onAfterEnter: afterEnter,
            onBeforeLeave: beforeLeave,
            onLeave: leave,
            onAfterLeave: afterLeave
          },
          slots.default
        )
    }
  })
}
