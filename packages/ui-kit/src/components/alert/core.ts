import type { VNodeChild } from 'vue'
import type { UiFeature } from '../../shared/feature'
import type { UiComponentContext } from '../../shared/component'
import { h } from 'vue'
import { createUiComponent } from '../../shared/component'
import { isNil } from '../../shared/utils'
import './core.css'

const alertBaseProps = {
  type: { type: String, default: 'info' },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  center: { type: Boolean },
  effect: { type: String, default: 'light' }
}

function renderAlertContent(context: UiComponentContext): VNodeChild {
  const { props, slots } = context
  const title = slots.title?.() ?? props.title
  const description = slots.default?.() ?? props.description
  const hasTitle = title !== '' && !isNil(title)
  const hasDescription = description !== '' && !isNil(description)
  if (!hasTitle && !hasDescription) {
    return null
  }
  return h('div', { class: 'ui-alert__content' }, [
    hasTitle ? h('div', { class: 'ui-alert__title' }, title) : null,
    hasDescription ? h('div', { class: 'ui-alert__description' }, description) : null
  ])
}

export function createAlert(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiAlert',
      baseClass: 'ui-alert',
      props: alertBaseProps,
      tag: (props) => (props.tag as string) || 'div',
      classes: (props) => {
        const classes: string[] = []
        for (const key of ['type', 'effect']) {
          if (typeof props[key] === 'string' && props[key]) {
            classes.push(`ui-alert--${props[key]}`)
          }
        }
        if (props.center) {
          classes.push('is-center')
        }
        return classes
      },
      content: renderAlertContent
    },
    features
  )
}
