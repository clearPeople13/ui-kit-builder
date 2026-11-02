import type { UiFeature } from '../../../../shared/feature'
import { enablePanelDrag } from '../../../../shared/panel-drag'
import { enableDrawerResize } from './resize'
import './style.css'

export const drawerDraggableFeature: UiFeature = {
  id: 'drawer.draggable',
  props: {
    draggable: { type: Boolean },
    resizable: { type: Boolean }
  },
  setup(props) {
    let dispose: (() => void) | null = null
    return {
      class: () => {
        const classes: string[] = []
        if (props.draggable && !props.fullscreen) {
          classes.push('ui-drawer--draggable')
        }
        if (props.resizable && !props.fullscreen) {
          classes.push('ui-drawer--resizable')
        }
        return classes.length ? classes.join(' ') : undefined
      },
      hooks: {
        overlayPanel(panel: HTMLElement | null) {
          dispose?.()
          dispose = null
          if (!panel) {
            return
          }
          const disposers: (() => void)[] = []
          const header = panel.querySelector<HTMLElement>(':scope > header')
          if (header) {
            disposers.push(
              enablePanelDrag(panel, {
                handle: header,
                enabled: () => Boolean(props.draggable) && !props.fullscreen,
                ignore: (target) => target instanceof Element && Boolean(target.closest('button'))
              })
            )
          }
          disposers.push(
            enableDrawerResize(panel, {
              enabled: () => Boolean(props.resizable) && !props.fullscreen,
              direction: () => String(props.direction ?? 'rtl')
            })
          )
          dispose = () => disposers.forEach((fn) => fn())
        }
      }
    }
  }
}
