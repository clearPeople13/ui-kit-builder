import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const dialogModalFeature = createClassFeature({
  id: 'dialog.modal',
  props: {
    modal: { type: Boolean, default: true },
    lockScroll: { type: Boolean, default: true },
    closeOnClickModal: { type: Boolean, default: true },
    closeOnPressEscape: { type: Boolean, default: true }
  },
  // 类名要跟 modal 取值联动：遮罩节点在 core 里已按 modal 关闭，
  // 类名恒定会让挂在该类名上的主题样式在无遮罩时误命中
  className: (props) => (props.modal === false ? undefined : 'ui-dialog--modal')
})
