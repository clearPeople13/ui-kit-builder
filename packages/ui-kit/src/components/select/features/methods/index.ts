import type { UiFeature } from '../../../../shared/feature'

function fieldOf(root: { value: any }): HTMLSelectElement | null {
  return root.value?.querySelector?.('select') ?? null
}

export const selectMethodsFeature: UiFeature = {
  id: 'select.methods',
  expose({ root }) {
    return {
      focus: () => fieldOf(root)?.focus(),
      blur: () => fieldOf(root)?.blur()
    }
  }
}
