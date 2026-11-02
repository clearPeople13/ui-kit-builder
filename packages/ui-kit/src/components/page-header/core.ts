import { h } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { baseAttrs, dimensionStyles } from '../../shared/behavior'
import { renderIcon } from '../../shared/icon'
import './core.css'

const pageHeaderBaseProps = {
  title: { type: String, default: '' },
  content: { type: String, default: '' }
}

export function createPageHeader(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiPageHeader',
      baseClass: 'ui-page-header',
      props: pageHeaderBaseProps,
      tag: () => 'div',
      attrs: (props) => baseAttrs(props),
      styles: (props) => dimensionStyles(props),
      content: ({ props, slots, emit }) => [
        h('div', { class: 'ui-page-header__main' }, [
          props.icon
            ? h(
                'button',
                {
                  class: 'ui-page-header__back',
                  type: 'button',
                  'aria-label': '返回',
                  onClick: () => emit('back')
                },
                [renderIcon(props.icon, { class: 'ui-page-header__back-icon' })]
              )
            : null,
          h('div', { class: 'ui-page-header__heading' }, [
            props.title || slots.title
              ? h('div', { class: 'ui-page-header__title' }, [slots.title?.() ?? props.title])
              : null,
            props.content || slots.content
              ? h('div', { class: 'ui-page-header__content' }, [slots.content?.() ?? props.content])
              : null
          ]),
          slots.extra ? h('div', { class: 'ui-page-header__extra' }, [slots.extra()]) : null
        ]),
        slots.default ? h('div', { class: 'ui-page-header__body' }, [slots.default()]) : null
      ]
    },
    features
  )
}
