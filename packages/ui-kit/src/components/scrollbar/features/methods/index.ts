import type { UiFeature } from '../../../../shared/feature'

export const scrollbarMethodsFeature: UiFeature = {
  id: 'scrollbar.methods',
  expose({ state }) {
    return {
      update: state.update,
      handleScroll: state.handleScroll,
      setScrollTop: state.setScrollTop,
      setScrollLeft: state.setScrollLeft
    }
  }
}
