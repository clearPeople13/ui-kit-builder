import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const timePickerClearableFeature = createClassFeature({
  id: 'time-picker.clearable',
  props: {
    clearable: { type: Boolean, default: true },
    clearIcon: { type: [String, Object], default: () => ({ name: 'CircleClose', __name: 'circle-close' }) }
  },
  // clearIcon 有恒真的默认对象，原先把它一起判进去会让 clearable:false 时类名仍然挂着。
  // F-11 的口径是"布尔开关对应的特性类名要跟随 props"，这里只认 clearable。
  className: (props) => (props.clearable ? 'ui-time-picker--clearable' : undefined)
})
