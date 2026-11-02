import type { UiFeature } from '../../../../shared/feature'

function fieldOf(root: { value: any }): HTMLInputElement | null {
  return root.value?.querySelector?.('input') ?? null
}

export const inputNumberMethodsFeature: UiFeature = {
  id: 'input-number.methods',
  expose({ root }) {
    return {
      focus: () => fieldOf(root)?.focus(),
      blur: () => fieldOf(root)?.blur()
    }
  }
}
