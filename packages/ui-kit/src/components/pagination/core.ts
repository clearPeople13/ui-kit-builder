import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { paginationConfig } from '../../shared/behavior'
import './core.css'

const paginationBaseProps = {
  size: { type: String },
  disabled: { type: Boolean },
  pageSize: { type: Number },
  total: { type: Number },
  pageCount: { type: Number },
  pagerCount: { type: Number, default: 7 },
  currentPage: { type: Number },
  prevText: { type: String, default: '' },
  nextText: { type: String, default: '' },
  background: { type: Boolean, default: false },
  hideOnSinglePage: { type: Boolean, default: false }
}

export function createPagination(features: UiFeature[] = []) {
  return createUiComponent(
    paginationConfig({
      name: 'UiPagination',
      baseClass: 'ui-pagination',
      props: paginationBaseProps
    }),
    features
  )
}
