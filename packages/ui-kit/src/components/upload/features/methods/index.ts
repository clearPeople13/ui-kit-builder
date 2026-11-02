import type { UiFeature } from '../../../../shared/feature'

export const uploadMethodsFeature: UiFeature = {
  id: 'upload.methods',
  expose({ emit }) {
    return {
      clearFiles: () => emit('update:file-list', [])
    }
  }
}
