import { h } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { wrapperConfig } from '../../shared/behavior'
import { descriptionsAppearanceFeature } from './features/appearance/index'
import './core.css'

const descriptionsBaseProps = {
  size: { type: String },
  label: { type: String, default: '' },
  span: { type: Number, default: 1 },
  width: { type: [String, Number], default: '' },
  minWidth: { type: [String, Number], default: '' },
  labelWidth: { type: [String, Number] },
  align: { type: String, default: 'left' },
  labelAlign: { type: String },
  className: { type: String, default: '' },
  labelClassName: { type: String, default: '' },
  column: { type: Number, default: 3 },
  title: { type: String, default: '' },
  extra: { type: String, default: '' }
}

export function createDescriptions(features: UiFeature[] = []) {
  return createUiComponent(
    {
      ...wrapperConfig({
        name: 'UiDescriptions',
        baseClass: 'ui-descriptions',
        props: descriptionsBaseProps,
        defaultTag: 'div'
      }),
      styles: (props) => ({
        display: 'grid',
        gridTemplateColumns: `repeat(${Number(props.column) || 3}, minmax(0, 1fr))`
      }),
      content: ({ props, slots }) => {
        const header =
          props.title || props.extra
            ? h('div', { class: 'ui-descriptions__header' }, [
                h('span', { class: 'ui-descriptions__title' }, props.title as string),
                props.extra ? h('span', { class: 'ui-descriptions__extra' }, props.extra as string) : null
              ])
            : null
        return [header, slots.default?.() ?? null]
      }
    },
    features
  )
}

const descriptionsItemBaseProps = {
  label: { type: String, default: '' },
  span: { type: Number, default: 1 },
  width: { type: [String, Number], default: '' },
  minWidth: { type: [String, Number], default: '' },
  labelWidth: { type: [String, Number], default: '' },
  align: { type: String, default: 'left' },
  labelAlign: { type: String, default: 'right' },
  className: { type: String, default: '' },
  labelClassName: { type: String, default: '' }
}

function toSize(value: unknown): string | undefined {
  if (value === '' || value === undefined || value === null) {
    return undefined
  }
  return typeof value === 'number' ? `${value}px` : String(value)
}

export function createDescriptionsItem(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiDescriptionsItem',
      baseClass: 'ui-descriptions-item',
      props: descriptionsItemBaseProps,
      tag: () => 'div',
      classes: (props) => [
        props.className,
        `is-align-${props.align || 'left'}`,
        `is-label-align-${props.labelAlign || 'right'}`
      ],
      styles: (props) => ({
        width: toSize(props.width),
        minWidth: toSize(props.minWidth),
        gridColumn: Number(props.span) > 1 ? `span ${Number(props.span)}` : undefined
      }),
      content: ({ props, slots }) => {
        const label = h(
          'span',
          {
            class: ['ui-descriptions-item__label', props.labelClassName],
            style: { width: toSize(props.labelWidth) }
          },
          props.label
        )
        return [label, h('span', { class: 'ui-descriptions-item__content' }, [slots.default?.() ?? null])]
      }
    },
    features
  )
}
