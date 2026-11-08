import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { overlayConfig } from '../../shared/behavior'
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
      defaultVisible: false,
      focusLoop: true
    }),
    features
  )
}
