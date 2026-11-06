import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { overlayConfig } from '../../shared/behavior'
import { notificationIconsFeature } from './features/icons/index'
import { notificationClosableFeature } from './features/closable/index'
import { notificationPopperFeature } from './features/popper/index'
import './core.css'

const notificationBaseProps = {
  type: { type: String, default: '' },
  id: { type: String, default: '' },
  message: { type: [String, Object, Function], default: '' },
  onClick: { type: Function },
  position: { type: String, default: 'top-right' },
  title: { type: String, default: '' },
  zIndex: { type: Number }
}

export function createNotification(features: UiFeature[] = []) {
  return createUiComponent(
    {
      ...overlayConfig({
        name: 'UiNotification',
        baseClass: 'ui-notification',
        props: notificationBaseProps,
        panelClass: 'ui-notification__panel',
        iconKey: 'icon',
        visibleKey: 'modelValue',
        useMask: false,
        defaultVisible: true
      }),
      // id 在 props 里声明过就不会再走 attrs 透传，必须显式落盘，否则宿主传 id 会静默丢失
      attrs: (props) => ({ id: props.id || undefined })
    },
    features
  )
}
