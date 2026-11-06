import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { overlayConfig } from '../../shared/behavior'
import { dialogClosableFeature } from './features/closable/index'
import { dialogPopperFeature } from './features/popper/index'
import { dialogDraggableFeature } from './features/draggable/index'
import { dialogModalFeature } from './features/modal/index'
import { dialogFullscreenFeature } from './features/fullscreen/index'
import './core.css'

const dialogBaseProps = {
  modelValue: { type: Boolean },
  center: { type: Boolean },
  alignCenter: { type: Boolean },
  overflow: { type: Boolean },
  title: { type: String, default: '' },
  top: { type: String },
  width: { type: [String, Number] },
  zIndex: { type: Number }
}

export function createDialog(features: UiFeature[] = []) {
  return createUiComponent(
    overlayConfig({
      name: 'UiDialog',
      baseClass: 'ui-dialog',
      props: dialogBaseProps,
      panelClass: 'ui-dialog__panel',
      visibleKey: 'modelValue',
      useMask: true,
      defaultVisible: false
    }),
    features
  )
}
