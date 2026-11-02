import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { overlayConfig } from '../../shared/behavior'
import { drawerClosableFeature } from './features/closable/index'
import { drawerPopperFeature } from './features/popper/index'
import { drawerDraggableFeature } from './features/draggable/index'
import { drawerModalFeature } from './features/modal/index'
import { drawerFullscreenFeature } from './features/fullscreen/index'
import './core.css'

const drawerBaseProps = {
  modelValue: { type: Boolean },
  size: { type: [String, Number], default: '30%' },
  center: { type: Boolean },
  alignCenter: { type: Boolean },
  overflow: { type: Boolean },
  title: { type: String, default: '' },
  top: { type: String },
  width: { type: [String, Number] },
  zIndex: { type: Number },
  direction: { type: String, default: 'rtl' },
}

export function createDrawer(features: UiFeature[] = []) {
  return createUiComponent(
    overlayConfig({
      name: 'UiDrawer',
      baseClass: 'ui-drawer',
      props: drawerBaseProps,
      panelClass: 'ui-drawer__panel',
      visibleKey: 'modelValue',
      useMask: true,
      defaultVisible: false
    }),
    features
  )
}
