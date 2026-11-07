/**
 * 组件分类的唯一来源（C5）。
 *
 * 构建器（configurator/main.js）与调试台（scripts/generate-demo-meta.mjs）都从这里读，
 * 不再各维护一份 ids 数组；新增组件或调整归属只改这一个文件。
 * 约束：每组至少一个组件、全量组件恰好归属一组，由 tests/build/category-groups.spec.ts 守住。
 */
export const CATEGORY_GROUPS = [
  {
    id: '基础',
    title: '基础元件',
    hint: '图标、文字、链接、间距与分隔',
    ids: ['icon', 'text', 'link', 'space', 'divider', 'config-provider']
  },
  {
    id: '按钮',
    title: '按钮',
    hint: '外观、图标、加载与渐变',
    ids: ['button']
  },
  {
    id: '表单',
    title: '表单输入',
    hint: '输入、选择、日期、上传与校验',
    ids: [
      'form',
      'input',
      'input-number',
      'input-otp',
      'input-tag',
      'autocomplete',
      'mention',
      'select',
      'select-v2',
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
    ]
  },
  {
    id: '数据展示',
    title: '数据展示',
    hint: '表格、树、分页、卡片与图片',
    ids: [
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
    ]
  },
  {
    id: '反馈',
    title: '反馈提示',
    hint: '提示、消息、弹窗、加载与引导',
    ids: [
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
    ]
  },
  {
    id: '导航',
    title: '导航',
    hint: '菜单、标签页、步骤、面包屑与锚点',
    ids: ['menu', 'tabs', 'steps', 'breadcrumb', 'dropdown', 'page-header', 'anchor', 'affix', 'backtop']
  },
  {
    id: '布局',
    title: '布局与容器',
    hint: '栅格、容器、分割、水印与无限滚动',
    ids: ['container', 'row', 'col', 'splitter', 'watermark', 'infinite-scroll']
  },
  {
    id: '内部组件',
    title: '内部组件',
    hint: '过渡、集合、焦点管理与浮层根',
    ids: ['collapse-transition', 'collection', 'focus-trap', 'overlay', 'popper', 'roving-focus-group', 'slot']
  }
]

export const CATEGORY_ORDER = CATEGORY_GROUPS.map((group) => group.id)

export const CATEGORY_FALLBACK = '其他'

export const COMPONENT_CATEGORY = Object.fromEntries(
  CATEGORY_GROUPS.flatMap((group) => group.ids.map((id) => [id, group.id]))
)

export function categoryOf(componentId) {
  return COMPONENT_CATEGORY[componentId] ?? CATEGORY_FALLBACK
}
