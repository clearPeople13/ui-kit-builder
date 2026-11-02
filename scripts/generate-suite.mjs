import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const catalog = JSON.parse(fs.readFileSync(path.join(rootDir, 'reference/element-plus-2.14.7-catalog.json'), 'utf8'))
const componentsDir = path.join(rootDir, 'packages/ui-kit/src/components')

const SKIP_DIRS = new Set(['icon', 'button'])
const CORE_PROPS = new Set([
  'modelValue',
  'modelModifiers',
  'value',
  'defaultValue',
  'fileList',
  'model',
  'data',
  'columns',
  'options',
  'disabled',
  'size',
  'type'
])

const FEATURE_GROUPS = [
  { key: 'clearable', title: '可清空', props: ['clearable', 'clearIcon'] },
  { key: 'password', title: '密码可见切换', props: ['showPassword', 'passwordIcon'] },
  { key: 'word-limit', title: '字数统计', props: ['showWordLimit', 'wordLimitPosition'] },
  {
    key: 'icons',
    title: '图标',
    props: [
      'showIcon',
      'icon',
      'prefixIcon',
      'suffixIcon',
      'loadingIcon',
      'activeIcon',
      'inactiveIcon',
      'activeActionIcon',
      'inactiveActionIcon',
      'expandCloseIcon',
      'expandOpenIcon',
      'collapseCloseIcon',
      'collapseOpenIcon',
      'ellipsisIcon',
      'prevIcon',
      'nextIcon',
      'arrowIcon',
      'checkIcon',
      'indeterminateIcon'
    ]
  },
  {
    key: 'closable',
    title: '可关闭',
    props: ['closable', 'closeable', 'showClose', 'closeText', 'beforeClose', 'closeIcon']
  },
  { key: 'loading', title: '加载状态', props: ['loading', 'loadingText'] },
  {
    key: 'multiple',
    title: '多选',
    props: [
      'multiple',
      'multipleLimit',
      'collapseTags',
      'collapseTagsTooltip',
      'maxCollapseTags',
      'tagTooltip',
      'tagType',
      'tagEffect'
    ]
  },
  {
    key: 'filterable',
    title: '筛选与远程搜索',
    props: [
      'filterable',
      'filterMethod',
      'remote',
      'remoteMethod',
      'debounce',
      'reserveKeyword',
      'defaultFirstOption',
      'allowCreate',
      'automaticDropdown',
      'noMatchText',
      'noDataText',
      'remoteShowSuffix',
      'fitInputWidth'
    ]
  },
  {
    key: 'popper',
    title: '浮层定位',
    props: [
      'teleported',
      'appendTo',
      'appendToBody',
      'persistent',
      'popperClass',
      'popperStyle',
      'popperOptions',
      'popperEffect',
      'popperOffset',
      'placement',
      'fallbackPlacements',
      'offset',
      'showArrow',
      'transition'
    ]
  },
  { key: 'draggable', title: '拖拽与缩放', props: ['draggable', 'allowDrag', 'allowDrop', 'resizable'] },
  {
    key: 'lazy',
    title: '懒加载与展开',
    props: [
      'lazy',
      'load',
      'renderAfterExpand',
      'expandOnClickNode',
      'checkOnClickNode',
      'checkDescendants',
      'autoExpandParent'
    ]
  },
  {
    key: 'validate',
    title: '表单校验',
    props: [
      'rules',
      'showMessage',
      'inlineMessage',
      'statusIcon',
      'validateOnRuleChange',
      'scrollToError',
      'scrollIntoViewOptions',
      'requireAsteriskPosition',
      'hideRequiredAsterisk',
      'labelSuffix'
    ]
  },
  { key: 'sortable', title: '排序', props: ['sortable', 'sortMethod', 'sortBy', 'sortOrders', 'defaultSort'] },
  {
    key: 'selection',
    title: '高亮与勾选',
    props: ['highlightCurrentRow', 'currentRowKey', 'checkStrictly', 'checkOnClickLeaf']
  },
  { key: 'summary', title: '合计行', props: ['showSummary', 'sumText', 'summaryMethod'] },
  { key: 'virtualized', title: '虚拟滚动', props: ['virtualized', 'estimatedItemSize', 'itemSize'] },
  { key: 'editable', title: '编辑与新增', props: ['editable', 'addable', 'beforeLeave'] },
  {
    key: 'preview',
    title: '图片预览',
    props: [
      'previewSrcList',
      'previewTeleported',
      'initialIndex',
      'infinite',
      'zoomRate',
      'minScale',
      'maxScale',
      'hideOnClickModal',
      'showProgress'
    ]
  },
  {
    key: 'modal',
    title: '遮罩与关闭行为',
    props: [
      'modal',
      'modalClass',
      'modalPenetrable',
      'lockScroll',
      'closeOnClickModal',
      'closeOnPressEscape',
      'trapFocus',
      'openDelay',
      'closeDelay',
      'destroyOnClose',
      'closeOnClickOutside'
    ]
  },
  { key: 'fullscreen', title: '全屏', props: ['fullscreen'] },
  {
    key: 'appearance',
    title: '外观变体',
    props: [
      'plain',
      'round',
      'circle',
      'border',
      'stripe',
      'dashed',
      'text',
      'bg',
      'dark',
      'shadow',
      'hit',
      'underline'
    ]
  },
  {
    key: 'format',
    title: '格式化',
    props: ['formatter', 'parser', 'valueFormat', 'valueOnClear', 'formatTooltip', 'formatValueText']
  },
  {
    key: 'range',
    title: '范围选择',
    props: ['range', 'rangeSeparator', 'startPlaceholder', 'endPlaceholder', 'unlinkPanels', 'showWeekNumber']
  }
]

const TITLES = {
  affix: 'Affix 固钉',
  alert: 'Alert 警告',
  anchor: 'Anchor 锚点',
  autocomplete: 'Autocomplete 自动补全',
  avatar: 'Avatar 头像',
  backtop: 'Backtop 回到顶部',
  badge: 'Badge 徽章',
  breadcrumb: 'Breadcrumb 面包屑',
  calendar: 'Calendar 日历',
  card: 'Card 卡片',
  carousel: 'Carousel 走马灯',
  cascader: 'Cascader 级联选择器',
  'cascader-panel': 'CascaderPanel 级联面板',
  'check-tag': 'CheckTag 可选标签',
  checkbox: 'Checkbox 多选框',
  col: 'Col 列',
  collapse: 'Collapse 折叠面板',
  'collapse-transition': 'CollapseTransition 折叠动画',
  'color-picker': 'ColorPicker 颜色选择器',
  'color-picker-panel': 'ColorPickerPanel 颜色面板',
  config: 'ConfigProvider 全局配置',
  'config-provider': 'ConfigProvider 全局配置',
  container: 'Container 布局容器',
  countdown: 'Countdown 倒计时',
  'date-picker': 'DatePicker 日期选择器',
  'date-picker-panel': 'DatePickerPanel 日期面板',
  descriptions: 'Descriptions 描述列表',
  dialog: 'Dialog 对话框',
  divider: 'Divider 分割线',
  drawer: 'Drawer 抽屉',
  dropdown: 'Dropdown 下拉菜单',
  empty: 'Empty 空状态',
  'focus-trap': 'FocusTrap 焦点陷阱',
  form: 'Form 表单',
  image: 'Image 图片',
  'image-viewer': 'ImageViewer 图片预览',
  'infinite-scroll': 'InfiniteScroll 无限滚动',
  input: 'Input 输入框',
  'input-number': 'InputNumber 数字输入框',
  'input-otp': 'InputOtp 验证码输入框',
  'input-tag': 'InputTag 标签输入框',
  link: 'Link 链接',
  loading: 'Loading 加载',
  mention: 'Mention 提及',
  menu: 'Menu 菜单',
  message: 'Message 消息提示',
  'message-box': 'MessageBox 消息框',
  notification: 'Notification 通知',
  overlay: 'Overlay 遮罩层',
  'page-header': 'PageHeader 页头',
  pagination: 'Pagination 分页',
  popconfirm: 'Popconfirm 气泡确认框',
  popover: 'Popover 弹出框',
  popper: 'Popper 弹出层',
  progress: 'Progress 进度条',
  radio: 'Radio 单选框',
  rate: 'Rate 评分',
  result: 'Result 结果',
  'roving-focus-group': 'RovingFocusGroup 焦点组',
  row: 'Row 行',
  scrollbar: 'Scrollbar 滚动条',
  segmented: 'Segmented 分段控制器',
  select: 'Select 选择器',
  'select-v2': 'SelectV2 虚拟列表选择器',
  skeleton: 'Skeleton 骨架屏',
  slider: 'Slider 滑块',
  slot: 'Slot 插槽工具',
  space: 'Space 间距',
  splitter: 'Splitter 分隔面板',
  statistic: 'Statistic 统计数值',
  steps: 'Steps 步骤条',
  switch: 'Switch 开关',
  table: 'Table 表格',
  'table-v2': 'TableV2 虚拟化表格',
  tabs: 'Tabs 标签页',
  tag: 'Tag 标签',
  text: 'Text 文本',
  'time-picker': 'TimePicker 时间选择器',
  'time-select': 'TimeSelect 时间选择',
  timeline: 'Timeline 时间线',
  tooltip: 'Tooltip 文字提示',
  tour: 'Tour 漫游式引导',
  transfer: 'Transfer 穿梭框',
  tree: 'Tree 树形控件',
  'tree-select': 'TreeSelect 树选择',
  'tree-v2': 'TreeV2 虚拟化树形控件',
  upload: 'Upload 上传',
  'virtual-list': 'VirtualList 虚拟列表',
  watermark: 'Watermark 水印'
}

const BEHAVIOR = {
  Input: 'input',
  Autocomplete: 'input',
  Mention: 'input',
  InputOtp: 'input',
  InputTag: 'input',
  InputNumber: 'inputNumber',
  Select: 'select',
  SelectV2: 'select',
  TreeSelect: 'select',
  Cascader: 'select',
  CascaderPanel: 'select',
  TimeSelect: 'select',
  Option: 'option',
  Checkbox: 'checkbox',
  CheckboxButton: 'checkbox',
  CheckboxGroup: 'checkboxGroup',
  Radio: 'radio',
  RadioButton: 'radio',
  RadioGroup: 'radioGroup',
  Switch: 'switch',
  Slider: 'slider',
  Rate: 'rate',
  Progress: 'progress',
  Image: 'image',
  Dialog: 'overlay',
  Drawer: 'overlay',
  Tooltip: 'overlay',
  Popover: 'overlay',
  Popconfirm: 'overlay',
  Dropdown: 'overlay',
  Tour: 'overlay',
  ImageViewer: 'overlay',
  MessageBox: 'overlay',
  Notification: 'overlay',
  Message: 'overlay',
  Pagination: 'pagination',
  Upload: 'upload',
  Link: 'text',
  Text: 'text'
}

const DEFAULT_TAGS = {
  link: 'a',
  text: 'span',
  tag: 'span',
  badge: 'span',
  avatar: 'span',
  divider: 'div',
  container: 'section',
  header: 'header',
  aside: 'aside',
  main: 'main',
  footer: 'footer',
  breadcrumb: 'nav',
  'timeline-item': 'li',
  'menu-item': 'li',
  'sub-menu': 'li',
  'dropdown-menu': 'ul',
  'dropdown-item': 'li',
  'form-item': 'div',
  'descriptions-item': 'div',
  'image-viewer': 'div'
}

const OVERLAY_OPTIONS = {
  Dialog: { panelClass: 'ui-dialog__panel', defaultVisible: false },
  Drawer: { panelClass: 'ui-drawer__panel', defaultVisible: false },
  Tooltip: { panelClass: 'ui-tooltip__panel', visibleKey: 'visible', defaultVisible: false, useMask: false },
  Popover: { panelClass: 'ui-popover__panel', visibleKey: 'visible', defaultVisible: false, useMask: false },
  Popconfirm: { panelClass: 'ui-popconfirm__panel', visibleKey: 'visible', defaultVisible: false, useMask: false },
  Dropdown: { panelClass: 'ui-dropdown__panel', visibleKey: 'visible', defaultVisible: false, useMask: false },
  Tour: { panelClass: 'ui-tour__panel', defaultVisible: false, useMask: false },
  ImageViewer: { panelClass: 'ui-image-viewer__panel', defaultVisible: false },
  MessageBox: { panelClass: 'ui-message-box__panel', defaultVisible: true },
  Notification: { panelClass: 'ui-notification__panel', defaultVisible: true, useMask: false },
  Message: { panelClass: 'ui-message__panel', defaultVisible: true, useMask: false }
}

const MANUAL_PROPS = {
  table: {
    data: [{ type: 'Array', default: '@factory' }],
    columns: [{ type: 'Array', default: '@factory' }],
    height: [{ type: 'String | Number' }],
    maxHeight: [{ type: 'String | Number' }],
    stripe: [{ type: 'Boolean' }],
    border: [{ type: 'Boolean' }],
    size: [{ type: 'String', default: '' }],
    fit: [{ type: 'Boolean', default: true }],
    showHeader: [{ type: 'Boolean', default: true }],
    emptyText: [{ type: 'String', default: 'No Data' }],
    rowKey: [{ type: 'String' }],
    rowClassName: [{ type: 'String | Function' }],
    rowStyle: [{ type: 'Object | Function' }],
    cellClassName: [{ type: 'String | Function' }],
    highlightCurrentRow: [{ type: 'Boolean' }],
    currentRowKey: [{ type: 'String | Number' }],
    defaultSort: [{ type: 'Object' }],
    showSummary: [{ type: 'Boolean' }],
    sumText: [{ type: 'String', default: 'Sum' }],
    summaryMethod: [{ type: 'Function' }],
    spanMethod: [{ type: 'Function' }],
    selectOnIndent: [{ type: 'Boolean' }],
    tooltipOptions: [{ type: 'Object' }],
    scrollbarAlwaysOn: [{ type: 'Boolean', default: false }],
    flexible: [{ type: 'Boolean', default: false }]
  },
  tableColumn: {
    type: [{ type: 'String', default: 'default' }],
    label: [{ type: 'String', default: '' }],
    prop: [{ type: 'String' }],
    width: [{ type: 'String | Number' }],
    minWidth: [{ type: 'String | Number' }],
    fixed: [{ type: 'String | Boolean' }],
    renderHeader: [{ type: 'Function' }],
    sortable: [{ type: 'Boolean | String', default: false }],
    sortMethod: [{ type: 'Function' }],
    sortBy: [{ type: 'String | Array | Function' }],
    sortOrders: [{ type: 'Array', default: '@factory' }],
    resizable: [{ type: 'Boolean', default: true }],
    formatter: [{ type: 'Function' }],
    showOverflowTooltip: [{ type: 'Boolean' }],
    align: [{ type: 'String', default: 'left' }],
    headerAlign: [{ type: 'String' }],
    className: [{ type: 'String' }],
    labelClassName: [{ type: 'String' }],
    selectable: [{ type: 'Boolean', default: true }],
    reserveSelection: [{ type: 'Boolean' }],
    filterMethod: [{ type: 'Function' }],
    filteredValue: [{ type: 'Array' }],
    filters: [{ type: 'Array' }],
    filterPlacement: [{ type: 'String' }],
    filterMultiple: [{ type: 'Boolean', default: true }],
    index: [{ type: 'Number | Function' }],
    columnKey: [{ type: 'String' }]
  }
}

function kebab(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase()
    .replace(/^-|-$/g, '')
}

function pascal(value) {
  return String(value)
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function camel(value) {
  return kebab(value).replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase())
}

function shortExport(name) {
  return name.startsWith('El') ? name.slice(2) : name
}

function runtimeType(type) {
  const map = {
    String: 'String',
    Number: 'Number',
    Boolean: 'Boolean',
    Object: 'Object',
    Array: 'Array',
    Function: 'Function'
  }
  const parts = String(type ?? '')
    .split('|')
    .map((part) => part.trim())
    .filter((part) => map[part])
    .map((part) => map[part])
  const unique = [...new Set(parts)]
  if (!unique.length) {
    return 'null'
  }
  return unique.length === 1 ? unique[0] : `[${unique.join(', ')}]`
}

function defaultCode(meta) {
  const value = meta?.default
  if (value === undefined || value === null || value === '@factory') {
    if (value === '@factory' && String(meta.type).includes('Array')) {
      return '() => []'
    }
    if (value === '@factory' && String(meta.type).includes('Object')) {
      return '() => ({})'
    }
    return null
  }
  if (Array.isArray(value)) {
    return `() => (${JSON.stringify(value)})`
  }
  if (typeof value === 'object') {
    return `() => (${JSON.stringify(value)})`
  }
  return JSON.stringify(value)
}

function propEntry(name, meta) {
  const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name)
  const parts = [`type: ${runtimeType(meta.type)}`]
  const defaultValue = defaultCode(meta)
  if (defaultValue !== null) {
    parts.push(`default: ${defaultValue}`)
  }
  if (Array.isArray(meta.values) && meta.values.length) {
    parts.push(`validator: (value: any) => ${JSON.stringify(meta.values)}.includes(value)`)
  }
  return `    ${key}: { ${parts.join(', ')} },`
}

function tsType(meta) {
  const map = {
    String: 'string',
    Number: 'number',
    Boolean: 'boolean',
    Object: 'Record<string, any>',
    Array: 'any[]',
    Function: '(...args: any[]) => any',
    null: 'null'
  }
  const parts = String(meta?.type ?? '')
    .split('|')
    .map((part) => part.trim())
    .map((part) => map[part] ?? 'any')
  const unique = [...new Set(parts)]
  return unique.length ? unique.join(' | ') : 'any'
}

function propMeta(name, meta) {
  return {
    name,
    type: tsType(meta),
    ...(meta.default !== undefined && meta.default !== '@factory' ? { default: meta.default } : {}),
    ...(meta.required ? { required: true } : {})
  }
}

function groupForExport(groupKey, exportName) {
  const group = camel(groupKey.replace(/Props$/, '').replace(/^use/, ''))
  const target = shortExport(exportName)
  const lowerGroup = group.toLowerCase()
  const lowerTarget = target.toLowerCase()
  let score = 0
  if (lowerGroup === lowerTarget) {
    score = 100
  } else if (lowerGroup.endsWith(lowerTarget)) {
    score = 90
  } else if (lowerGroup.startsWith(lowerTarget)) {
    score = 80
  } else if (lowerGroup.replace(/s$/, '') === lowerTarget.replace(/s$/, '')) {
    score = 70
  } else if (lowerGroup.includes(lowerTarget) || lowerTarget.includes(lowerGroup)) {
    score = 50
  }
  return score
}

function assignProps(component, exportNames) {
  const assigned = Object.fromEntries(exportNames.map((name) => [name, {}]))
  const primary = exportNames[0]

  for (const [groupKey, props] of Object.entries(component.props ?? {})) {
    if (groupKey.startsWith('use')) {
      continue
    }
    let best = primary
    let bestScore = 0
    for (const exportName of exportNames) {
      const score = groupForExport(groupKey, exportName)
      if (score > bestScore) {
        bestScore = score
        best = exportName
      }
    }
    Object.assign(assigned[best], props)
  }

  if (component.dir === 'table') {
    Object.assign(assigned.Table ?? {}, MANUAL_PROPS.table)
    Object.assign(assigned.TableColumn ?? {}, MANUAL_PROPS.tableColumn)
  }

  return assigned
}

function classifyProps(props) {
  const core = {}
  const features = {}
  const claimed = new Set()

  for (const [name, meta] of Object.entries(props)) {
    if (name.includes(':')) {
      continue
    }
    if (meta.required || CORE_PROPS.has(name)) {
      core[name] = meta
      claimed.add(name)
    }
  }

  for (const group of FEATURE_GROUPS) {
    const matched = {}
    for (const name of group.props) {
      if (claimed.has(name)) {
        continue
      }
      const meta = props[name]
      if (!meta) {
        continue
      }
      matched[name] = meta
      claimed.add(name)
    }
    if (Object.keys(matched).length) {
      features[group.key] = { group, props: matched }
    }
  }

  for (const [name, meta] of Object.entries(props)) {
    if (claimed.has(name) || name.includes(':')) {
      continue
    }
    core[name] = meta
    claimed.add(name)
  }

  return { core, features }
}

function escapeCss(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '-')
}

function featureCondition(key) {
  const group = FEATURE_GROUPS.find((item) => item.key === key)
  const names = group.props.filter((name) => !CORE_PROPS.has(name))
  return names.map((name) => `props.${name}`).join(' || ') || 'true'
}

function baseClassFor(dir, exportName, primary) {
  return exportName === primary ? `ui-${dir}` : `ui-${kebab(exportName)}`
}

function writeFeature(component, exportName, primary, key, feature, baseClass) {
  const featureDirName = exportName === primary ? key : `${kebab(exportName)}-${key}`
  const featureDir = path.join(componentsDir, component.dir, 'features', featureDirName)
  fs.mkdirSync(featureDir, { recursive: true })
  const featureExport = `${camel(exportName)}${pascal(key)}Feature`
  const featureId = `${component.dir}.${exportName === primary ? key : `${kebab(exportName)}-${key}`}`
  const lines = [
    "import { createClassFeature } from '../../../../shared/component'",
    "import './style.css'",
    '',
    `export const ${featureExport} = createClassFeature({`,
    `  id: ${JSON.stringify(featureId)},`,
    '  props: {',
    ...Object.entries(feature.props).map(([name, meta]) => propEntry(name, meta)),
    '  },',
    `  className: (props) => (${featureCondition(key)} ? '${baseClass}--${key}' : undefined),`,
    '})',
    ''
  ]
  fs.writeFileSync(path.join(featureDir, 'index.ts'), lines.join('\n'), 'utf8')
  fs.writeFileSync(
    path.join(featureDir, 'style.css'),
    `.${baseClass}--${key} {\n  /* ${feature.group.title} */\n}\n`,
    'utf8'
  )
  return {
    featureId,
    featureExport,
    module: `packages/ui-kit/src/components/${component.dir}/features/${featureDirName}/index.ts`,
    feature
  }
}

function generateComponent(component) {
  const exportNames = (component.exports ?? [])
    .filter((name) => name.startsWith('El'))
    .filter((name) => !name.endsWith('Directive') && !name.endsWith('Service'))
  if (!exportNames.length) {
    return
  }

  const assigned = assignProps(component, exportNames)
  const primary = shortExport(exportNames[0])
  const specExports = []
  const dir = path.join(componentsDir, component.dir)
  fs.mkdirSync(dir, { recursive: true })

  const importLines = []
  const importSet = new Set()
  const blockLines = []
  const factoryNames = new Set()
  const featureImports = []

  for (const rawName of exportNames) {
    const exportName = shortExport(rawName)
    const baseClass = baseClassFor(component.dir, exportName, primary)
    const props = assigned[rawName] ?? {}
    const { core, features } = classifyProps(props)
    const featureEntries = {}
    const featureArgs = []

    for (const [key, feature] of Object.entries(features)) {
      const info = writeFeature(component, exportName, primary, key, feature, baseClass)
      featureEntries[info.featureId] = {
        title: feature.group.title,
        description: `${feature.group.title}：${Object.keys(feature.props).join('、')}`,
        module: info.module,
        exportName: info.featureExport,
        requires: [],
        props: Object.entries(feature.props).map(([name, meta]) => propMeta(name, meta))
      }
      featureImports.push(
        `import { ${info.featureExport} } from './features/${info.module.split('/features/')[1].replace('/index.ts', '')}/index'`
      )
      featureArgs.push(info.featureExport)
    }

    const behavior = BEHAVIOR[exportName] ?? 'wrapper'
    const propsVar = `${camel(exportName)}BaseProps`
    const basePropsCode = [
      `const ${propsVar} = {`,
      ...Object.entries(core).map(([name, meta]) => propEntry(name, meta)),
      '}'
    ].join('\n')

    let factoryName
    let factoryArgs
    if (behavior === 'overlay') {
      const options = OVERLAY_OPTIONS[exportName] ?? { panelClass: `${baseClass}__panel`, defaultVisible: true }
      factoryName = 'overlayConfig'
      factoryArgs = `{
      name: 'Ui${exportName}',
      baseClass: '${baseClass}',
      props: ${propsVar},
      panelClass: '${options.panelClass}',
      visibleKey: '${options.visibleKey ?? 'modelValue'}',
      useMask: ${options.useMask === false ? 'false' : 'true'},
      defaultVisible: ${options.defaultVisible === false ? 'false' : 'true'},
    }`
    } else if (behavior === 'wrapper') {
      const defaultTag = DEFAULT_TAGS[kebab(exportName)] ?? DEFAULT_TAGS[component.dir] ?? 'div'
      factoryName = 'wrapperConfig'
      factoryArgs = `{
      name: 'Ui${exportName}',
      baseClass: '${baseClass}',
      props: ${propsVar},
      defaultTag: '${defaultTag}',
    }`
    } else if (behavior === 'text') {
      const defaultTag = exportName === 'Link' ? 'a' : 'span'
      factoryName = 'textConfig'
      factoryArgs = `{
      name: 'Ui${exportName}',
      baseClass: '${baseClass}',
      props: ${propsVar},
      defaultTag: '${defaultTag}',
    }`
    } else {
      factoryName = `${behavior}Config`
      factoryArgs = `{
      name: 'Ui${exportName}',
      baseClass: '${baseClass}',
      props: ${propsVar},
    }`
    }

    factoryNames.add(factoryName)
    blockLines.push(
      basePropsCode,
      '',
      `export function create${exportName}(features: UiFeature[] = []) {`,
      `  return createUiComponent(${factoryName}(${factoryArgs}), features)`,
      '}',
      ''
    )

    specExports.push({
      name: exportName,
      module: `packages/ui-kit/src/components/${component.dir}/core.ts`,
      createExport: `create${exportName}`,
      coreProps: Object.entries(core).map(([name, meta]) => ({
        ...propMeta(name, meta),
        description: name
      })),
      features: featureEntries
    })
  }

  importLines.push("import type { UiFeature } from '../../shared/feature'")
  importLines.push("import { createUiComponent } from '../../shared/component'")
  for (const factoryName of [...factoryNames].sort()) {
    importLines.push(`import { ${factoryName} } from '../../shared/behavior'`)
  }
  importLines.push(...featureImports)
  importLines.push("import './core.css'")
  importLines.push('')

  fs.writeFileSync(path.join(dir, 'core.ts'), [...importLines, ...blockLines].join('\n'), 'utf8')

  const cssLines = [
    `.ui-${component.dir} {`,
    '  box-sizing: border-box;',
    '  font-family: inherit;',
    '}',
    '',
    `.ui-${component.dir}.is-disabled {`,
    '  opacity: 0.6;',
    '  cursor: not-allowed;',
    '}',
    ''
  ]
  fs.writeFileSync(path.join(dir, 'core.css'), cssLines.join('\n'), 'utf8')

  const title = TITLES[component.dir] ?? `${pascal(component.dir)}`
  const spec = {
    id: component.dir,
    title,
    description: `对齐主流组件库的 ${exportNames.map(shortExport).join(' / ')}，基础 props 与可选特性拆分。`,
    order: 10,
    exports: specExports
  }
  fs.writeFileSync(path.join(dir, 'spec.mjs'), `export default ${JSON.stringify(spec, null, 2)}\n`, 'utf8')
  return spec
}

const generated = []
for (const component of catalog.components) {
  if (SKIP_DIRS.has(component.dir)) {
    continue
  }
  if (!component.exports?.length) {
    continue
  }
  const spec = generateComponent(component)
  if (spec) {
    generated.push(spec.id)
  }
}

console.log(`generated ${generated.length} component directories`)
