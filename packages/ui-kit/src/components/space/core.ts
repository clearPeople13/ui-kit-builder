import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { wrapperConfig } from '../../shared/behavior'
import './core.css'

const spaceBaseProps = {
  size: { type: [String, Array, Number] },
  direction: { type: String, default: 'horizontal' },
  alignment: { type: String, default: 'center' },
  wrap: { type: Boolean },
  fill: { type: Boolean }
}

function gapValue(size: unknown): string | undefined {
  if (size === undefined || size === null || size === '') {
    return undefined
  }
  if (Array.isArray(size)) {
    return `${Number(size[0] ?? 0)}px ${Number(size[1] ?? size[0] ?? 0)}px`
  }
  if (typeof size === 'number') {
    return `${size}px`
  }
  return String(size)
}

export function createSpace(features: UiFeature[] = []) {
  return createUiComponent(
    {
      ...wrapperConfig({
        name: 'UiSpace',
        baseClass: 'ui-space',
        props: spaceBaseProps,
        defaultTag: 'div'
      }),
      classes: (props) => [
        props.direction ? `is-${props.direction}` : '',
        props.wrap ? 'is-wrap' : '',
        props.fill ? 'is-fill' : ''
      ],
      styles: (props) => ({
        display: 'inline-flex',
        flexDirection: props.direction === 'vertical' ? 'column' : 'row',
        alignItems: props.alignment === 'start' ? 'flex-start' : props.alignment === 'end' ? 'flex-end' : 'center',
        gap: gapValue(props.size ?? 8),
        flexWrap: props.wrap ? 'wrap' : undefined
      }),
      content: ({ slots }) => slots.default?.() ?? null
    },
    features
  )
}
