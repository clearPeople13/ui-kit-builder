import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { uploadConfig } from '../../shared/behavior'
import { uploadMultipleFeature } from './features/multiple/index'
import './core.css'

const uploadBaseProps = {
  fileList: { type: Array, default: () => [] },
  disabled: { type: Boolean },
  listType: { type: String, default: 'text' },
  limit: { type: Number },
  drag: { type: Boolean },
  showFileList: { type: Boolean, default: true },
  accept: { type: String, default: '' },
  beforeUpload: { type: Function },
  onRemove: { type: Function },
  onExceed: { type: Function },
  beforeRemove: { type: Function },
}

export function createUpload(features: UiFeature[] = []) {
  return createUiComponent(
    uploadConfig({
      name: 'UiUpload',
      baseClass: 'ui-upload',
      props: uploadBaseProps
    }),
    features
  )
}
