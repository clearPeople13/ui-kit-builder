import type { UiFeature } from '../../../../shared/feature'

export const carouselMethodsFeature: UiFeature = {
  id: 'carousel.methods',
  expose({ state }) {
    return {
      next: state.next,
      prev: state.prev,
      setActiveItem: state.go
    }
  }
}
