import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { wrapperConfig } from '../../shared/behavior'
import { ROW_GUTTER } from '../../shared/layout'
import type { RowGutter } from '../../shared/layout'
import './core.css'

const rowBaseProps = {
  tag: { type: String, default: 'div' },
  gutter: { type: [Number, Array], default: 0 },
  justify: { type: String, default: 'start' },
  align: { type: String }
}

function normalizeGutter(value: unknown): RowGutter {
  if (Array.isArray(value)) {
    return [Number(value[0] ?? 0), Number(value[1] ?? 0)]
  }
  return [Number(value ?? 0), 0]
}

export function createRow(features: UiFeature[] = []) {
  return createUiComponent(
    {
      ...wrapperConfig({
        name: 'UiRow',
        baseClass: 'ui-row',
        props: rowBaseProps,
        defaultTag: 'div'
      }),
      setup(props, { provide }) {
        provide(ROW_GUTTER, () => normalizeGutter(props.gutter))
        return {}
      },
      classes: (props) => [
        props.justify ? `is-justify-${props.justify}` : '',
        props.align ? `is-align-${props.align}` : ''
      ],
      styles: (props) => {
        const [horizontal, vertical] = normalizeGutter(props.gutter)
        return {
          display: 'flex',
          flexWrap: 'wrap',
          marginLeft: horizontal ? `${-horizontal / 2}px` : undefined,
          marginRight: horizontal ? `${-horizontal / 2}px` : undefined,
          rowGap: vertical ? `${vertical}px` : undefined
        }
      }
    },
    features
  )
}
