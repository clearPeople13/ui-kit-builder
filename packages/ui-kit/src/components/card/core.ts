import { h } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { cardAppearanceFeature } from './features/appearance/index'
import './core.css'

const cardBaseProps = {
  header: { type: String, default: '' },
  footer: { type: String, default: '' },
  cover: { type: String, default: '' },
  bodyStyle: { type: [String, Object, Array, Boolean], default: '' },
  headerClass: { type: [String, Array, Object, Boolean] },
  bodyClass: { type: [String, Array, Object, Boolean] },
  footerClass: { type: [String, Array, Object, Boolean] }
}

export function createCard(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiCard',
      baseClass: 'ui-card',
      props: cardBaseProps,
      tag: (props) => (props.tag as string) || 'div',
      content: ({ props, slots }) => {
        const header = slots.header?.() ?? props.header
        const footer = slots.footer?.() ?? props.footer
        const cover =
          slots.cover?.() ?? (props.cover ? h('img', { class: 'ui-card__cover', src: props.cover, alt: '' }) : null)
        return [
          cover ? h('div', { class: 'ui-card__cover-wrap' }, [cover]) : null,
          header ? h('div', { class: ['ui-card__header', props.headerClass] }, [header]) : null,
          h('div', { class: ['ui-card__body', props.bodyClass], style: props.bodyStyle as any }, [
            slots.default?.() ?? null
          ]),
          footer ? h('div', { class: ['ui-card__footer', props.footerClass] }, [footer]) : null
        ]
      }
    },
    features
  )
}
