import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const avatarGroupPopperFeature = createClassFeature({
  id: 'avatar.avatar-group-popper',
  props: {
    teleported: { type: Boolean, default: true },
    appendTo: { type: [String, Object] },
    popperClass: { type: [String, Array, Object, Boolean] },
    popperStyle: { type: [String, Array, Object, Boolean] },
    offset: { type: Number, default: 8 },
    showArrow: { type: Boolean, default: true },
    placement: {
      type: String,
      default: 'top',
      validator: (value: any) =>
        [
          'top',
          'top-start',
          'top-end',
          'bottom',
          'bottom-start',
          'bottom-end',
          'right',
          'right-start',
          'right-end',
          'left',
          'left-start',
          'left-end',
          'auto',
          'auto-start',
          'auto-end'
        ].includes(value)
    }
  },
  className: () => 'ui-avatar-group--popper'
})
