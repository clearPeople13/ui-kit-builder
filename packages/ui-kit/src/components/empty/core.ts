import { h } from 'vue'
import { Inbox } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { sizeValue } from '../../shared/behavior'
import './core.css'

const emptyBaseProps = {
  image: { type: String, default: '' },
  imageSize: { type: Number },
  description: { type: String, default: '' }
}

export function createEmpty(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiEmpty',
      baseClass: 'ui-empty',
      props: emptyBaseProps,
      tag: (props) => (props.tag as string) || 'div',
      content: ({ props, slots }) =>
        h('div', { class: 'ui-empty__inner' }, [
          props.image
            ? h('img', { class: 'ui-empty__image', src: props.image, style: { width: sizeValue(props.imageSize) } })
            : renderIcon(Inbox, {
                class: 'ui-empty__icon',
                attrs: {
                  style: props.imageSize
                    ? `width:${sizeValue(props.imageSize)};height:${sizeValue(props.imageSize)};font-size:${Math.round((Number(props.imageSize) * 26) / 64)}px`
                    : undefined
                }
              }),
          h('div', { class: 'ui-empty__description' }, [props.description || '暂无数据']),
          slots.default ? h('div', { class: 'ui-empty__footer' }, [slots.default()]) : null
        ])
    },
    features
  )
}
