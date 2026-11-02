function underlineClass(value: unknown): string | undefined {
  if (value === true || value === 'always') {
    return 'ui-link--underline'
  }
  if (value === 'hover') {
    return 'ui-link--underline-hover'
  }
  return undefined
}

export const linkAppearanceFeature = {
  id: 'link.appearance',
  props: {
    underline: { type: [Boolean, String], default: false }
  },
  setup(props: { underline?: boolean | string }) {
    return {
      class: () => underlineClass(props.underline)
    }
  }
}
