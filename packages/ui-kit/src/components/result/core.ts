import type { Component } from 'vue'
import { h } from 'vue'
import { CircleCheck, CircleX, Info, TriangleAlert } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { resultIconsFeature } from './features/icons/index'
import './core.css'

const resultBaseProps = {
  title: { type: String, default: '' },
  subTitle: { type: String, default: '' },
  tag: { type: String }
}

const RESULT_ICONS: Record<string, Component> = {
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
  info: Info
}

export function createResult(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiResult',
      baseClass: 'ui-result',
      props: resultBaseProps,
      tag: (props) => (props.tag as string) || 'div',
      classes: (props) => [RESULT_ICONS[String(props.icon)] ? `is-${props.icon}` : 'is-info'],
      content: ({ props, slots }) =>
        h('div', { class: 'ui-result__inner' }, [
          slots.icon
            ? slots.icon()
            : renderIcon(RESULT_ICONS[String(props.icon)] ?? Info, { class: 'ui-result__icon' }),
          h('div', { class: 'ui-result__title' }, props.title || ''),
          props.subTitle ? h('div', { class: 'ui-result__subtitle' }, props.subTitle) : null,
          slots.default ? h('div', { class: 'ui-result__extra' }, [slots.default()]) : null
        ])
    },
    features
  )
}
