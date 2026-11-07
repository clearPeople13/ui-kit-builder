export const CATEGORY_ORDER = ['基础', '按钮', '表单', '数据展示', '反馈', '导航', '布局', '内部组件']

export const CATEGORY_FALLBACK = '其他'

const GROUPED = {
  基础: ['icon', 'text', 'link', 'space', 'divider', 'config-provider'],
  按钮: ['button'],
  表单: [
    'form',
    'input',
    'input-number',
    'input-otp',
    'input-tag',
    'autocomplete',
    'mention',
    'select',
    'cascader',
    'cascader-panel',
    'checkbox',
    'radio',
    'switch',
    'slider',
    'rate',
    'color-picker',
    'color-picker-panel',
    'date-picker',
    'date-picker-panel',
    'time-picker',
    'time-select',
    'transfer',
    'segmented',
    'upload',
    'calendar'
  ],
  数据展示: [
    'table',

    'tree',
    'tree-v2',
    'tree-select',
    'pagination',
    'tag',
    'check-tag',
    'badge',
    'avatar',
    'card',
    'collapse',
    'descriptions',
    'statistic',
    'countdown',
    'timeline',
    'image',
    'image-viewer',
    'empty',
    'skeleton',
    'progress',
    'scrollbar',
    'virtual-list',
    'carousel'
  ],
  反馈: [
    'alert',
    'message',
    'message-box',
    'notification',
    'loading',
    'dialog',
    'drawer',
    'popconfirm',
    'popover',
    'tooltip',
    'tour',
    'result'
  ],
  导航: ['menu', 'tabs', 'steps', 'breadcrumb', 'dropdown', 'page-header', 'anchor', 'affix', 'backtop'],
  布局: ['container', 'row', 'col', 'splitter', 'watermark', 'infinite-scroll'],
  内部组件: ['collapse-transition', 'collection', 'focus-trap', 'overlay', 'popper', 'roving-focus-group', 'slot']
}

export const COMPONENT_CATEGORY = Object.fromEntries(
  Object.entries(GROUPED).flatMap(([category, ids]) => ids.map((id) => [id, category]))
)

export function categoryOf(componentId) {
  return COMPONENT_CATEGORY[componentId] ?? CATEGORY_FALLBACK
}
