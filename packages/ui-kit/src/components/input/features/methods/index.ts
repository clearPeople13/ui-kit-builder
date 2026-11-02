import type { UiFeature } from '../../../../shared/feature'

function fieldOf(root: { value: any }): HTMLInputElement | HTMLTextAreaElement | null {
  return root.value?.querySelector?.('input, textarea') ?? null
}

export const inputMethodsFeature: UiFeature = {
  id: 'input.methods',
  expose({ root }) {
    return {
      focus: () => fieldOf(root)?.focus(),
      blur: () => fieldOf(root)?.blur(),
      select: () => fieldOf(root)?.select()
    }
  }
}
