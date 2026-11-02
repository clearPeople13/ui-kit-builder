import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { wrapperConfig } from '../../shared/behavior'
import { ROW_GUTTER } from '../../shared/layout'
import { colPopperFeature } from './features/popper/index'
import './core.css'

const colBaseProps = {
  tag: { type: String, default: 'div' },
  span: { type: Number, default: 24 },
  pull: { type: Number, default: 0 },
  push: { type: Number, default: 0 },
}

export function createCol(features: UiFeature[] = []) {
  return createUiComponent(
    {
      ...wrapperConfig({
        name: 'UiCol',
        baseClass: 'ui-col',
        props: colBaseProps,
        defaultTag: 'div'
      }),
      setup(_props, { inject }) {
        return { gutter: inject(ROW_GUTTER, () => [0, 0] as [number, number]) }
      },
      styles: (props, state) => {
        const span = Number(props.span ?? 24)
        const pull = Number(props.pull ?? 0)
        const push = Number(props.push ?? 0)
        const offset = Number(props.offset ?? 0)
        const gutter = Number(state.gutter?.()?.[0] ?? 0)
        return {
          flex: `0 0 ${(span / 24) * 100}%`,
          maxWidth: `${(span / 24) * 100}%`,
          marginLeft: offset ? `${(offset / 24) * 100}%` : undefined,
          paddingLeft: gutter ? `${gutter / 2}px` : undefined,
          paddingRight: gutter ? `${gutter / 2}px` : undefined,
          position: pull || push ? 'relative' : undefined,
          right: pull ? `${(pull / 24) * 100}%` : undefined,
          left: push ? `${(push / 24) * 100}%` : undefined
        }
      }
    },
    features
  )
}
