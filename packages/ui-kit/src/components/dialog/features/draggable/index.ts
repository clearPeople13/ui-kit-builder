import type { UiFeature } from '../../../../shared/feature'
import { enablePanelDrag } from '../../../../shared/panel-drag'
import './style.css'

export const dialogDraggableFeature: UiFeature = {
  id: 'dialog.draggable',
  props: {
    draggable: { type: Boolean }
  },
  setup(props) {
    let dispose: (() => void) | null = null
    return {
      class: () => (props.draggable && !props.fullscreen ? 'ui-dialog--draggable' : undefined),
      hooks: {
        overlayPanel(panel: HTMLElement | null) {
          dispose?.()
          dispose = null
          if (!panel) {
            return
          }
          const header = panel.querySelector<HTMLElement>(':scope > header')
          if (!header) {
            return
          }
          dispose = enablePanelDrag(panel, {
            handle: header,
            enabled: () => Boolean(props.draggable) && !props.fullscreen,
            ignore: (target) => target instanceof Element && Boolean(target.closest('button'))
          })
        }
      }
    }
  }
}
