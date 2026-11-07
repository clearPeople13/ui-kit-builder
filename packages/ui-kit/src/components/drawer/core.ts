import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { overlayConfig } from '../../shared/behavior'
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
  direction: { type: String, default: 'rtl' }
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
