import { createApp, h } from 'vue'

const CATEGORIES = [
  {
    id: 'basic',
    title: '基础元件',
    hint: '图标、按钮、文字、标签',
    ids: ['icon', 'button', 'link', 'text', 'space', 'divider', 'tag', 'badge', 'check-tag'],
  },
  {
    id: 'layout',
    title: '布局与容器',
    hint: '栅格、容器、滚动、虚拟列表',
    ids: ['container', 'row', 'col', 'splitter', 'affix', 'backtop', 'scrollbar', 'virtual-list'],
  },
  {
    id: 'form',
    title: '表单输入',
    hint: '输入、选择、日期、上传',
    ids: [
      'autocomplete', 'cascader', 'cascader-panel', 'checkbox', 'color-picker', 'color-picker-panel',
      'date-picker', 'date-picker-panel', 'form', 'input', 'input-number', 'input-otp', 'input-tag',
      'mention', 'radio', 'rate', 'select', 'select-v2', 'slider', 'switch', 'time-picker',
      'time-select', 'transfer', 'tree-select', 'upload',
    ],
  },
  {
    id: 'data',
    title: '数据展示',
    hint: '表格、卡片、树、进度',
    ids: [
      'avatar', 'calendar', 'card', 'carousel', 'collapse', 'collection', 'descriptions', 'empty',
      'image', 'image-viewer', 'pagination', 'progress', 'result', 'skeleton', 'statistic', 'table',
      'table-v2', 'timeline', 'tree', 'tree-v2', 'watermark', 'countdown',
    ],
  },
  {
    id: 'nav',
    title: '导航',
    hint: '菜单、标签页、步骤、面包屑',
    ids: ['anchor', 'breadcrumb', 'dropdown', 'menu', 'page-header', 'segmented', 'steps', 'tabs'],
  },
  {
    id: 'feedback',
    title: '反馈提示',
    hint: '弹窗、消息、加载、引导',
    ids: ['alert', 'dialog', 'drawer', 'loading', 'message', 'message-box', 'notification', 'overlay', 'tour'],
  },
  {
    id: 'overlay',
    title: '浮层与内部工具',
    hint: '气泡、下拉根、焦点管理',
    ids: [
      'popconfirm', 'popover', 'popper', 'tooltip', 'focus-trap', 'roving-focus-group', 'slot',
      'config-provider', 'collapse-transition', 'infinite-scroll',
    ],
  },
]

const MINIMAL_IDS = [
  'icon', 'button', 'input', 'input-number', 'text', 'space', 'form', 'checkbox', 'radio', 'switch',
  'select', 'tag', 'divider', 'message', 'dialog', 'tooltip',
]

const COMMON_IDS = [
  ...MINIMAL_IDS,
  'avatar', 'card', 'table', 'tabs', 'menu', 'breadcrumb', 'dropdown', 'pagination', 'alert', 'drawer',
  'popover', 'popconfirm', 'upload', 'date-picker', 'time-picker', 'steps', 'progress', 'skeleton',
  'empty', 'result', 'loading', 'notification', 'autocomplete', 'slider', 'badge', 'segmented',
]

const PRESETS = [
  { id: 'minimal', title: '最小组件集', ids: MINIMAL_IDS },
  { id: 'common', title: '常用组合', ids: COMMON_IDS },
  { id: 'all', title: '全部组件', ids: null },
  { id: 'none', title: '全不选', ids: [] },
]

const GLOBAL_GROUPS = [
  { id: 'color', title: '品牌与状态色', hint: '主色按钮、选中态、成功/警告提示', match: token => token.startsWith('color-') },
  { id: 'text', title: '文字颜色', hint: '正文、次要说明、占位文字', match: token => token.startsWith('text-color-') },
  {
    id: 'surface',
    title: '背景与边框',
    hint: '页面底色、卡片、分割线',
    match: token => token === 'bg-color' || token.startsWith('fill-color') || token.startsWith('border-color'),
  },
  { id: 'radius', title: '圆角', hint: '按钮、输入框、卡片', match: token => token.startsWith('radius-') },
  { id: 'font', title: '字号', hint: '基础字号与大小号文本', match: token => token.startsWith('font-size-') },
  { id: 'shadow', title: '阴影', hint: '卡片、浮层的投影', match: token => token.startsWith('shadow-') },
  { id: 'scrollbar', title: '滚动条', hint: '粗细与配色', match: token => token.startsWith('scrollbar-') },
  { id: 'other', title: '其他', hint: '浮层高度等', match: () => true },
]

const TOKEN_LABELS = {
  'color-primary': '主色',
  'color-primary-light': '主色（浅）',
  'color-primary-lighter': '主色（更浅）',
  'color-primary-dark': '主色（深）',
  'color-success': '成功',
  'color-warning': '警告',
  'color-danger': '危险',
  'color-info': '信息',
  'text-color-primary': '主要文字',
  'text-color-regular': '常规文字',
  'text-color-secondary': '次要文字',
  'text-color-placeholder': '占位文字',
  'border-color': '边框',
  'border-color-light': '边框（浅）',
  'border-color-lighter': '边框（更浅）',
  'bg-color': '背景',
  'fill-color': '填充',
  'fill-color-light': '填充（浅）',
  'radius-base': '基础圆角',
  'radius-small': '小圆角',
  'radius-large': '大圆角',
  'radius-xl': '超大圆角',
  'font-size-base': '基础字号',
  'font-size-small': '小字号',
  'font-size-extra-small': '超小字号',
  'shadow-base': '基础阴影',
  'shadow-light': '浅阴影',
  'scrollbar-size': '粗细',
  'scrollbar-radius': '圆角',
  'scrollbar-thumb': '滑块',
  'scrollbar-thumb-hover': '滑块悬停',
  'scrollbar-track': '轨道',
  'floating-panel-max-height': '浮层最大高度',
}

const COMPONENT_TOKEN_LABELS = {
  bg: '背景色',
  border: '边框色',
  text: '文字色',
  'hover-bg': '悬停背景',
  'hover-border': '悬停边框',
  'hover-text': '悬停文字',
  radius: '圆角',
  height: '高度',
  accent: '强调色',
  'footer-bg': '底部背景',
  'header-bg': '头部背景',
  'text-bg': '文字底色',
  color: '颜色',
  'active-color': '选中颜色',
  'void-color': '未选中颜色',
  'thumb-color': '滑块颜色',
  'thumb-hover-color': '滑块悬停色',
  'bar-bg': '分隔条背景',
  'bar-grip': '拖拽点',
  'bar-line': '分隔线',
  'dot-color': '圆点颜色',
}

const PREVIEW_STYLE = `
:host { display: block; }
.pv { display: flex; flex-direction: column; gap: 10px; }
.pv__row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.pv__text { font-size: 12px; color: #667085; }
`

const state = {
  name: '@demo/ui-kit',
  version: '',
  components: new Map(),
  order: [],
  groups: [],
  activeCategory: 'all',
  tokens: { global: [], components: {} },
  // 变量名 → 用户输入原值；空串视为未覆盖
  overrides: new Map(),
  // 变量名 → { token, scope, def }，scope 为 global 或组件 id
  varIndex: new Map(),
  // 变量名 → 行 DOM 引用，用于回写与状态同步
  themeRows: new Map(),
  themeBaseStatus: '',
  presets: [],
  preset: '',
  // 上次预设填充的变量名集合，切换预设时只回收这些项，保留用户手工覆盖
  presetKeys: new Set(),
  preview: null,
}

let copyTimer = 0
let themeCopyTimer = 0
let isBuilding = false
let estimateTimer = 0
let estimateSeq = 0
let estimateLast = null

const elements = {
  packageName: document.querySelector('#package-name'),
  manifestVersion: document.querySelector('#manifest-version'),
  componentTotal: document.querySelector('#component-total'),
  featureTotal: document.querySelector('#feature-total'),
  componentSelection: document.querySelector('#component-selection'),
  navComponents: document.querySelector('#nav-components'),
  navFeatures: document.querySelector('#nav-features'),
  navTheme: document.querySelector('#nav-theme'),
  navBuild: document.querySelector('#nav-build'),
  presets: document.querySelector('#presets'),
  presetHint: document.querySelector('#preset-hint'),
  categoryTabs: document.querySelector('#category-tabs'),
  search: document.querySelector('#search'),
  listStatus: document.querySelector('#list-status'),
  componentList: document.querySelector('#component-list'),
  emptyHint: document.querySelector('#empty-hint'),
  featureSelection: document.querySelector('#feature-selection'),
  featureSearch: document.querySelector('#feature-search'),
  featureStatus: document.querySelector('#feature-status'),
  featurePanel: document.querySelector('#feature-panel'),
  featureEmpty: document.querySelector('#feature-empty'),
  allFeatures: document.querySelector('#all-features'),
  clearFeatures: document.querySelector('#clear-features'),
  selectionCount: document.querySelector('#selection-count'),
  estimateCard: document.querySelector('#estimate-card'),
  estimateBadge: document.querySelector('#estimate-badge'),
  estimateNumbers: document.querySelector('#estimate-numbers'),
  estimateDelta: document.querySelector('#estimate-delta'),
  estimateNote: document.querySelector('#estimate-note'),
  packageSuffix: document.querySelector('#package-suffix'),
  classPrefix: document.querySelector('#class-prefix'),
  outputPackage: document.querySelector('#output-package'),
  configJson: document.querySelector('#config-json'),
  copyConfig: document.querySelector('#copy-config'),
  downloadConfig: document.querySelector('#download-config'),
  buildButton: document.querySelector('#build-button'),
  buildHint: document.querySelector('#build-hint'),
  buildOutput: document.querySelector('#build-output'),
  themeSection: document.querySelector('#step-theme'),
  themeCount: document.querySelector('#theme-count'),
  themeTotal: document.querySelector('#theme-total'),
  themeResetAll: document.querySelector('#theme-reset-all'),
  themeSearch: document.querySelector('#theme-search'),
  themeExpand: document.querySelector('#theme-expand'),
  themeCollapse: document.querySelector('#theme-collapse'),
  themeStatus: document.querySelector('#theme-status'),
  themeGroups: document.querySelector('#theme-groups'),
  themeEmpty: document.querySelector('#theme-empty'),
  themeCssBody: document.querySelector('#theme-css-body'),
  copyThemeCss: document.querySelector('#copy-theme-css'),
  themeJump: document.querySelector('#theme-jump'),
  previewBadge: document.querySelector('#preview-badge'),
  previewStage: document.querySelector('#preview-stage'),
  previewHint: document.querySelector('#preview-hint'),
  presetBadge: document.querySelector('#preset-badge'),
  presetOptions: document.querySelector('#preset-options'),
  presetStatus: document.querySelector('#preset-status'),
}

/* ---------- 数据 ---------- */

function createEntry(component) {
  const features = new Map()
  for (const item of component.exports) {
    for (const feature of item.features) {features.set(feature.id, feature)}
  }

  const dependents = new Map()
  for (const feature of features.values()) {
    for (const dependency of feature.requires) {
      if (!dependents.has(dependency)) {dependents.set(dependency, [])}
      dependents.get(dependency).push(feature.id)
    }
  }

  const coreProps = new Map()
  for (const item of component.exports) {
    for (const prop of item.coreProps) {
      if (!coreProps.has(prop.name)) {coreProps.set(prop.name, prop)}
    }
  }

  const featureList = [...features.values()]
  const vars = state.tokens.components?.[component.id] ?? []
  return {
    ...component,
    coreProps,
    featureList,
    features,
    dependents,
    vars,
    enabled: true,
    selected: new Set(),
    nodes: null,
    haystack: buildHaystack(component, coreProps, featureList, vars),
    nameHaystack: [
      component.id,
      component.title,
      ...component.exports.map(item => item.name),
    ].join(' ').toLowerCase(),
  }
}

function buildHaystack(component, coreProps, features, vars) {
  const parts = [
    component.id,
    component.title,
    ...component.exports.map(item => item.name),
    ...coreProps.keys(),
    ...vars.flatMap(token => [token.var, token.token]),
    ...features.flatMap(feature => [
      feature.id,
      feature.title,
      feature.description,
      ...feature.props.map(prop => `${prop.name} ${prop.type} ${prop.description ?? ''}`),
      ...(feature.methods ?? []).flatMap(method => [method.name, method.signature, method.description ?? '']),
    ]),
  ]
  return parts.join(' ').toLowerCase()
}

function buildGroups() {
  return CATEGORIES.map(category => ({
    ...category,
    entries: category.ids.map(id => state.components.get(id)).filter(Boolean),
    node: null,
    countNode: null,
    toggleNode: null,
  }))
}

function addWithDependencies(entry, featureId) {
  if (entry.selected.has(featureId)) {return}
  const feature = entry.features.get(featureId)
  if (!feature) {return}
  for (const dependency of feature.requires) {addWithDependencies(entry, dependency)}
  entry.selected.add(featureId)
}

function removeWithDependents(entry, featureId) {
  if (!entry.selected.has(featureId)) {return}
  entry.selected.delete(featureId)
  for (const dependent of entry.dependents.get(featureId) ?? []) {
    removeWithDependents(entry, dependent)
  }
}

/* ---------- 通用渲染 ---------- */

function createElement(tag, className, text) {
  const node = document.createElement(tag)
  if (className) {node.className = className}
  if (text !== undefined) {node.textContent = text}
  return node
}

function renderPropChip(prop) {
  const chip = createElement('code', 'prop-chip', `${prop.name}: ${prop.type}`)
  const defaultText = prop.default === undefined || prop.default === null
    ? ''
    : ` · 默认 ${formatDefault(prop.default)}`
  chip.title = `${prop.description || prop.name}${defaultText}`
  return chip
}

function renderMethodChip(method) {
  const chip = createElement('code', 'prop-chip prop-chip--method', `${method.name}: ${method.signature}`)
  chip.title = method.description || method.name
  return chip
}

function formatDefault(value) {
  if (typeof value === 'string') {return value}
  try {
    return JSON.stringify(value)
  }
  catch {
    return String(value)
  }
}

/* ---------- 第 1 步：组件 ---------- */

function buildNode(entry) {
  const details = createElement('details', 'component')
  details.dataset.component = entry.id
  entry.nodes = {
    details,
    checkbox: null,
    count: null,
    featureInputs: new Map(),
    featureGroup: null,
    featureCount: null,
  }

  const summary = createElement('summary', 'component__summary')
  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.className = 'component__check'
  checkbox.checked = true
  checkbox.setAttribute('aria-label', `包含 ${entry.title}`)
  checkbox.addEventListener('click', (event) => event.stopPropagation())
  checkbox.addEventListener('change', () => {
    entry.enabled = checkbox.checked
    if (!entry.enabled) {entry.selected.clear()}
    syncEntry(entry)
    syncCategoryDom(entry.group)
    onSelectionChanged()
  })
  entry.nodes.checkbox = checkbox

  const text = createElement('span', 'component__text')
  const titleRow = createElement('span', 'component__title-row')
  titleRow.append(
    createElement('span', 'component__title', entry.title),
    createElement('code', 'component__id', entry.id),
  )
  text.append(titleRow)

  const meta = createElement('span', 'component__meta')
  meta.append(createElement(
    'span',
    'component__features',
    entry.featureList.length ? `${entry.featureList.length} 个可选功能` : '无细分功能',
  ))
  const count = createElement('span', 'component__count')
  count.hidden = true
  entry.nodes.count = count
  meta.append(count)

  summary.append(checkbox, text, meta)

  const body = createElement('div', 'component__body')
  body.append(buildComponentLinks(entry), buildCoreProps(entry), buildComponentVars(entry))
  details.append(summary, body)
  return details
}

function buildComponentLinks(entry) {
  const links = createElement('div', 'component__links')
  if (entry.featureList.length) {
    const featureJump = createElement('button', 'link-button', `去第 2 步挑这 ${entry.featureList.length} 个功能 →`)
    featureJump.type = 'button'
    featureJump.addEventListener('click', () => focusFeatureGroup(entry))
    links.append(featureJump)
  }
  const themeJump = createElement(
    'button',
    'link-button',
    entry.vars.length ? `去第 3 步改这 ${entry.vars.length} 个样式变量 →` : '去第 3 步调全局样式 →',
  )
  themeJump.type = 'button'
  themeJump.addEventListener('click', () => {
    if (entry.vars.length) {focusThemeScope(entry.id)}
    else {scrollToTheme()}
  })
  links.append(themeJump)
  return links
}

function buildCoreProps(entry) {
  const block = createElement('div', 'core-props')
  block.append(
    createElement('span', 'core-props__label', `运行时属性（${entry.coreProps.size}）`),
    createElement('p', 'core-props__hint', '写代码时传入的 props，始终保留，不需要勾选。'),
  )
  const chips = createElement('span', 'core-props__chips')
  for (const prop of entry.coreProps.values()) {chips.append(renderPropChip(prop))}
  block.append(chips)
  return block
}

function buildComponentVars(entry) {
  const block = createElement('div', 'component-vars')
  block.append(createElement('span', 'core-props__label', `样式变量（${entry.vars.length}）`))
  if (!entry.vars.length) {
    block.append(createElement(
      'p',
      'component-vars__empty',
      '这个组件没有单独的样式变量，颜色、圆角、字号都复用第 3 步的全局设置。',
    ))
    return block
  }

  const info = createElement('span', 'component-vars__info')
  info.append(createElement('span', '', '只影响这个组件，可在第 3 步单独调整'))
  const jump = createElement('button', 'link-button', '去调整 →')
  jump.type = 'button'
  jump.addEventListener('click', () => focusThemeScope(entry.id))
  info.append(jump)
  block.append(info)

  const chips = createElement('span', 'core-props__chips')
  for (const token of entry.vars) {
    const chip = createElement('code', 'prop-chip var-chip', token.var)
    chip.title = `默认 ${token.value}${token.source === 'fallback' ? '（var() 兜底值）' : ''}`
    chips.append(chip)
  }
  block.append(chips)
  return block
}

function renderList() {
  const fragment = document.createDocumentFragment()
  for (const group of state.groups) {
    const section = createElement('section', 'category')
    section.dataset.category = group.id
    group.node = section

    const head = createElement('header', 'category__head')
    const titles = createElement('div', 'category__titles')
    titles.append(
      createElement('h3', 'category__title', group.title),
      createElement('span', 'category__hint', group.hint),
    )
    const meta = createElement('div', 'category__meta')
    const count = createElement('span', 'category__count')
    const toggle = createElement('button', 'link-button')
    toggle.type = 'button'
    toggle.addEventListener('click', () => toggleCategory(group))
    meta.append(count, toggle)
    head.append(titles, meta)
    group.countNode = count
    group.toggleNode = toggle

    const rows = createElement('div', 'category__rows')
    for (const entry of group.entries) {
      entry.group = group
      rows.append(buildNode(entry))
    }
    section.append(head, rows)
    fragment.append(section)
  }
  elements.componentList.append(fragment)
  for (const group of state.groups) {syncCategoryDom(group)}
}

function toggleCategory(group) {
  const allEnabled = group.entries.every(entry => entry.enabled)
  for (const entry of group.entries) {
    entry.enabled = !allEnabled
    if (!entry.enabled) {entry.selected.clear()}
    syncEntry(entry)
  }
  syncCategoryDom(group)
  onSelectionChanged()
}

function syncCategoryDom(group) {
  if (!group?.countNode) {return}
  const total = group.entries.length
  const enabled = group.entries.filter(entry => entry.enabled).length
  group.countNode.textContent = `已启用 ${enabled} / ${total}`
  group.countNode.classList.toggle('is-empty', enabled === 0)
  group.toggleNode.textContent = enabled === total ? '全部取消' : '全部启用'
}

function renderCategoryTabs() {
  const items = [{ id: 'all', title: '全部', total: state.order.length }]
  for (const group of state.groups) {
    items.push({ id: group.id, title: group.title, total: group.entries.length })
  }
  const fragment = document.createDocumentFragment()
  for (const item of items) {
    const button = createElement('button', 'category-tab')
    button.type = 'button'
    button.dataset.category = item.id
    button.append(
      createElement('span', 'category-tab__title', item.title),
      createElement('span', 'category-tab__count', String(item.total)),
    )
    button.addEventListener('click', () => {
      state.activeCategory = item.id
      elements.search.value = ''
      syncCategoryTabs()
      applySearch()
    })
    fragment.append(button)
  }
  elements.categoryTabs.replaceChildren(fragment)
  syncCategoryTabs()
}

function syncCategoryTabs() {
  for (const button of elements.categoryTabs.querySelectorAll('.category-tab')) {
    const active = button.dataset.category === state.activeCategory
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-pressed', active ? 'true' : 'false')
  }
}

function applySearch() {
  const query = elements.search.value.trim().toLowerCase()
  let visible = 0

  for (const group of state.groups) {
    const categoryVisible = state.activeCategory === 'all' || state.activeCategory === group.id
    let groupVisible = 0
    for (const entry of group.entries) {
      const matched = categoryVisible && (!query || entry.haystack.includes(query))
      entry.nodes.details.hidden = !matched
      if (matched) {groupVisible += 1}
    }
    group.node.hidden = groupVisible === 0
    visible += groupVisible
  }

  elements.emptyHint.hidden = visible > 0
  if (query) {
    elements.listStatus.textContent = `匹配 ${visible} 个组件`
    return
  }
  if (state.activeCategory !== 'all') {
    const group = state.groups.find(item => item.id === state.activeCategory)
    elements.listStatus.textContent = `${group.title}：${visible} 个组件`
    return
  }
  elements.listStatus.textContent = `共 ${state.order.length} 个组件，分 ${state.groups.length} 类；展开某行可以看它的运行时属性和样式变量`
}

function handleComponentSearch() {
  if (elements.search.value.trim() && state.activeCategory !== 'all') {
    state.activeCategory = 'all'
    syncCategoryTabs()
  }
  applySearch()
}

/* ---------- 第 1 步：预设 ---------- */

function presetIds(preset) {
  if (preset.id === 'all') {return state.order.map(entry => entry.id)}
  return preset.ids ?? []
}

function presetHintText(preset) {
  const count = presetIds(preset).length
  if (preset.id === 'minimal') {return `最小组件集：${count} 个组件，能撑起一个常规表单页；功能默认不勾选。`}
  if (preset.id === 'common') {return `常用组合：${count} 个后台常用组件；功能默认不勾选，需要时在第 2 步补。`}
  if (preset.id === 'all') {return `全部组件：${count} 个组件都启用；已勾选的功能保持不动。`}
  return '全不选：组件和功能都会清空。'
}

function renderPresets() {
  const fragment = document.createDocumentFragment()
  for (const preset of PRESETS) {
    const button = createElement('button', 'preset')
    button.type = 'button'
    button.dataset.preset = preset.id
    button.append(
      createElement('span', 'preset__title', preset.title),
      createElement('span', 'preset__count', String(presetIds(preset).length)),
    )
    button.addEventListener('click', () => applyPreset(preset))
    fragment.append(button)
  }
  elements.presets.replaceChildren(fragment)
  syncPresetState()
}

function applyPreset(preset) {
  const allowed = new Set(presetIds(preset))
  for (const entry of state.order) {
    entry.enabled = allowed.has(entry.id)
    if (!entry.enabled) {entry.selected.clear()}
    syncEntry(entry)
  }
  for (const group of state.groups) {syncCategoryDom(group)}
  elements.search.value = ''
  state.activeCategory = 'all'
  syncCategoryTabs()
  applySearch()
  onSelectionChanged()
}

function syncPresetState() {
  const enabledIds = state.order.filter(entry => entry.enabled).map(entry => entry.id)
  const enabledSet = new Set(enabledIds)
  let matched = null
  for (const preset of PRESETS) {
    const ids = presetIds(preset)
    if (ids.length === enabledIds.length && ids.every(id => enabledSet.has(id))) {
      matched = preset
      break
    }
  }

  for (const button of elements.presets.querySelectorAll('.preset')) {
    button.classList.toggle('is-active', Boolean(matched) && button.dataset.preset === matched.id)
  }

  if (matched) {
    elements.presetHint.textContent = presetHintText(matched)
    return
  }
  const features = state.order.reduce((total, entry) => total + entry.selected.size, 0)
  elements.presetHint.textContent = `当前手动选择：${enabledIds.length} 个组件、${features} 个功能。点上面的预设可以整体切换。`
}

/* ---------- 第 2 步：功能 ---------- */

function buildFeatureCard(entry, feature) {
  const card = createElement('article', 'feature-card')
  card.dataset.feature = feature.id
  card.dataset.search = [
    feature.id,
    feature.title,
    feature.description,
    ...feature.props.map(prop => `${prop.name} ${prop.type} ${prop.description ?? ''}`),
    ...(feature.methods ?? []).flatMap(method => [method.name, method.signature, method.description ?? '']),
  ].join(' ').toLowerCase()

  const label = createElement('label', 'feature-card__label')
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.className = 'feature-card__input'
  input.setAttribute('aria-label', `启用 ${feature.title}`)
  input.addEventListener('change', () => {
    if (input.checked) {addWithDependencies(entry, feature.id)}
    else {removeWithDependents(entry, feature.id)}
    syncEntry(entry)
    onSelectionChanged()
  })

  const text = createElement('span', 'feature-card__text')
  const titleRow = createElement('span', 'feature-card__title-row')
  titleRow.append(
    createElement('span', 'feature-card__title', feature.title),
    createElement('code', 'feature-card__id', feature.id),
  )
  const desc = createElement('span', 'feature-card__desc', feature.description)
  const propChips = createElement('span', 'feature-card__chips')
  for (const prop of feature.props) {propChips.append(renderPropChip(prop))}
  for (const method of feature.methods ?? []) {propChips.append(renderMethodChip(method))}
  text.append(titleRow, desc, propChips)

  label.append(text, input)
  card.append(label)

  if (feature.requires.length) {
    card.append(createElement(
      'span',
      'feature-card__requires',
      `需要先开启 ${feature.requires.map(id => entry.features.get(id)?.title ?? id).join('、')}，会自动勾选`,
    ))
  }

  entry.nodes.featureInputs.set(feature.id, input)
  return card
}

function buildFeatureGroup(entry) {
  const group = createElement('details', 'feature-group')
  group.dataset.component = entry.id

  const head = createElement('summary', 'feature-group__head')
  const caret = createElement('span', 'feature-group__caret', '▸')
  caret.setAttribute('aria-hidden', 'true')
  const title = createElement('span', 'feature-group__title')
  title.append(
    createElement('span', 'feature-group__name', entry.title),
    createElement('code', 'feature-group__id', entry.id),
  )
  const side = createElement('span', 'feature-group__side')
  const count = createElement('span', 'feature-group__count')
  const all = createElement('button', 'link-button', '全选')
  all.type = 'button'
  all.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    for (const feature of entry.featureList) {addWithDependencies(entry, feature.id)}
    syncEntry(entry)
    onSelectionChanged()
  })
  const none = createElement('button', 'link-button', '清空')
  none.type = 'button'
  none.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    entry.selected.clear()
    syncEntry(entry)
    onSelectionChanged()
  })
  side.append(count, all, none)
  head.append(caret, title, side)
  group.append(head)

  const grid = createElement('div', 'feature-grid')
  for (const feature of entry.featureList) {grid.append(buildFeatureCard(entry, feature))}
  group.append(grid)

  entry.nodes.featureGroup = group
  entry.nodes.featureCount = count
  group.hidden = !entry.enabled
  return group
}

function renderFeaturePanel() {
  const fragment = document.createDocumentFragment()
  for (const entry of state.order) {
    if (!entry.featureList.length) {continue}
    fragment.append(buildFeatureGroup(entry))
  }
  elements.featurePanel.replaceChildren(fragment)
}

function syncEntry(entry) {
  const nodes = entry.nodes
  if (!nodes) {return}
  nodes.checkbox.checked = entry.enabled
  nodes.details.classList.toggle('is-disabled', !entry.enabled)
  nodes.details.classList.toggle('is-selected', entry.selected.size > 0)

  const active = entry.selected.size > 0
  nodes.count.hidden = !active
  nodes.count.textContent = active ? `已选 ${entry.selected.size}` : ''
  nodes.count.classList.toggle('is-active', active)

  for (const [featureId, input] of nodes.featureInputs) {
    input.checked = entry.selected.has(featureId)
    input.disabled = !entry.enabled
  }
  if (nodes.featureGroup) {
    nodes.featureGroup.hidden = !entry.enabled
    for (const card of nodes.featureGroup.querySelectorAll('.feature-card')) {
      card.classList.toggle('is-selected', entry.selected.has(card.dataset.feature))
    }
    nodes.featureCount.textContent = `已选 ${entry.selected.size} / ${entry.featureList.length}`
  }
}

function applyFeatureSearch() {
  const query = elements.featureSearch.value.trim().toLowerCase()
  const enabledEntries = state.order.filter(entry => entry.enabled)
  const groups = state.order.filter(entry => entry.enabled && entry.featureList.length)
  let matched = 0
  let matchedGroups = 0

  for (const entry of groups) {
    const group = entry.nodes.featureGroup
    const componentMatched = !query || entry.nameHaystack.includes(query)
    let groupMatches = 0
    for (const card of group.querySelectorAll('.feature-card')) {
      const cardMatched = !query || componentMatched || card.dataset.search.includes(query)
      card.hidden = !cardMatched
      if (cardMatched) {groupMatches += 1}
    }
    group.hidden = groupMatches === 0
    if (!group.hidden) {matchedGroups += 1}
    if (query && groupMatches > 0) {group.open = true}
    matched += groupMatches
  }

  if (!enabledEntries.length) {
    elements.featureEmpty.hidden = false
    elements.featureEmpty.textContent = '第 1 步还没有启用任何组件。先回去选几个组件，这里就会出现可勾选的功能。'
    elements.featureStatus.textContent = '还没有启用组件。'
    return
  }
  if (!groups.length) {
    elements.featureEmpty.hidden = false
    elements.featureEmpty.textContent = '当前启用的组件都只有基础能力，没有可拆分的功能，可以直接进入第 3 步。'
    elements.featureStatus.textContent = '没有可勾选的功能。'
    return
  }

  if (query) {
    elements.featureEmpty.hidden = matched > 0
    elements.featureEmpty.textContent = '没有匹配的功能，换个关键词试试。'
    elements.featureStatus.textContent = `匹配 ${matched} 个功能，分布在 ${matchedGroups} 个组件`
    return
  }

  elements.featureEmpty.hidden = true
  const total = groups.reduce((sum, entry) => sum + entry.featureList.length, 0)
  const selected = groups.reduce((sum, entry) => sum + entry.selected.size, 0)
  elements.featureStatus.textContent = `已启用 ${enabledEntries.length} 个组件（${groups.length} 个含可选功能），共 ${total} 个可选功能；已勾选 ${selected} 个。`
}

function focusFeatureGroup(entry) {
  if (!entry.nodes.featureGroup) {return}
  if (!entry.enabled) {
    entry.enabled = true
    syncEntry(entry)
    syncCategoryDom(entry.group)
    onSelectionChanged()
  }
  elements.featureSearch.value = ''
  applyFeatureSearch()
  const group = entry.nodes.featureGroup
  group.open = true
  group.scrollIntoView({ behavior: 'smooth', block: 'center' })
  group.classList.add('is-flash')
  window.setTimeout(() => group.classList.remove('is-flash'), 1400)
}

/* ---------- 选择汇总 ---------- */

function selectionStats() {
  let components = 0
  let features = 0
  for (const entry of state.order) {
    if (!entry.enabled) {continue}
    components += 1
    features += entry.selected.size
  }
  return { components, features }
}

function syncNavCounts() {
  const { components, features } = selectionStats()
  elements.componentSelection.textContent = `已启用 ${components} / ${state.order.length}`
  elements.navComponents.textContent = `${components} / ${state.order.length}`
  elements.navFeatures.textContent = String(features)
}

function onSelectionChanged() {
  syncNavCounts()
  syncPresetState()
  applyFeatureSearch()
  renderConfig()
  resetBuildResult()
  scheduleEstimate()
}

/* ---------- 主题变量 ---------- */

function tokenLabel(token) {
  return TOKEN_LABELS[token] ?? COMPONENT_TOKEN_LABELS[token] ?? token
}

function camelToken(token) {
  return token.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase())
}

function isValidThemeValue(value) {
  const trimmed = String(value ?? '').trim()
  return Boolean(trimmed) && !/[;{}]/.test(trimmed)
}

function hexColor(value) {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(value ?? '').trim())
  if (!match) {return ''}
  const hex = match[1]
  return `#${hex.length === 3 ? [...hex].map(char => char + char).join('') : hex}`.toLowerCase()
}

function rewriteVarName(name, prefix) {
  return prefix === 'ui' ? name : name.replace(/^--ui-/, `--${prefix}-`)
}

function scopeTitle(scope) {
  if (scope === 'global') {return '全局'}
  const entry = state.components.get(scope)
  return entry ? entry.title : scope
}

function sampleKindOf(token) {
  if (token.kind === 'color') {return 'color'}
  if (token.token.includes('radius')) {return 'radius'}
  if (token.token.includes('font-size')) {return 'font-size'}
  if (token.token.includes('shadow')) {return 'shadow'}
  if (token.token.includes('height')) {return 'height'}
  return ''
}

function buildVarSample(token, kind) {
  if (!kind) {return null}
  const sample = createElement('span', `var-row__sample var-row__sample--${kind}`)
  if (kind === 'font-size') {sample.textContent = 'Aa'}
  return sample
}

function buildVarRow(token, scope) {
  const row = createElement('div', 'var-row')
  row.dataset.var = token.var

  const main = createElement('span', 'var-row__main')
  const labelRow = createElement('span', 'var-row__label-row')
  labelRow.append(
    createElement('span', 'var-row__label', tokenLabel(token.token)),
    createElement('code', 'var-row__name', token.var),
  )
  const defaultValue = `${token.value}${token.source === 'fallback' ? '（var() 兜底）' : ''}`
  const meta = createElement('span', 'var-row__meta', `默认 ${defaultValue}`)
  main.append(labelRow, meta)
  row.append(main)

  const fields = createElement('span', 'var-row__fields')
  const kind = sampleKindOf(token)
  const sample = buildVarSample(token, kind)
  if (sample) {fields.append(sample)}

  let colorInput = null
  if (token.kind === 'color') {
    colorInput = document.createElement('input')
    colorInput.type = 'color'
    colorInput.className = 'var-row__color'
    colorInput.value = hexColor(token.value) || '#000000'
    colorInput.setAttribute('aria-label', `${token.var} 取色`)
    fields.append(colorInput)
  }

  const textInput = document.createElement('input')
  textInput.type = 'text'
  textInput.className = 'var-row__text'
  textInput.spellcheck = false
  textInput.autocomplete = 'off'
  textInput.placeholder = token.value
  textInput.setAttribute('aria-label', `${token.var} 取值`)
  fields.append(textInput)

  const reset = createElement('button', 'var-row__reset', '↺')
  reset.type = 'button'
  reset.title = '恢复默认'
  reset.setAttribute('aria-label', `恢复 ${token.var} 默认值`)
  fields.append(reset)
  row.append(fields)

  state.varIndex.set(token.var, {
    var: token.var,
    token: token.token,
    scope,
    def: token.value,
  })
  state.themeRows.set(token.var, {
    row,
    color: colorInput,
    text: textInput,
    reset,
    sample,
    sampleKind: kind,
  })

  textInput.addEventListener('input', () => {
    setOverride(token.var, textInput.value)
    const hex = hexColor(textInput.value)
    if (hex && colorInput) {colorInput.value = hex}
  })
  if (colorInput) {
    colorInput.addEventListener('input', () => {
      textInput.value = colorInput.value
      setOverride(token.var, colorInput.value)
    })
  }
  reset.addEventListener('click', () => {
    state.overrides.delete(token.var)
    syncVarRow(token.var)
    onThemeChanged()
  })

  syncVarRow(token.var)
  return row
}

function buildVarGroup({ key, scope, title, subtitle, tokens, open }) {
  const details = createElement('details', 'theme-group')
  details.dataset.scope = key
  details.open = open

  const summary = createElement('summary', 'theme-group__summary')
  const titleRow = createElement('span', 'theme-group__title', title)
  if (scope !== 'global') {
    titleRow.append(createElement('code', '', scope))
  }
  summary.append(
    titleRow,
    createElement('span', 'theme-group__meta', `${subtitle ? `${subtitle} · ` : ''}${tokens.length} 项`),
  )

  const list = createElement('div', 'var-list')
  for (const token of tokens) {list.append(buildVarRow(token, scope))}

  details.append(summary, list)
  return details
}

function renderThemePanel() {
  const globals = state.tokens.global ?? []
  const groups = GLOBAL_GROUPS.map(group => ({ ...group, tokens: [] }))
  for (const token of globals) {
    const target = groups.find(group => group.match(token.token)) ?? groups[groups.length - 1]
    target.tokens.push(token)
  }

  const fragment = document.createDocumentFragment()
  for (const group of groups) {
    if (!group.tokens.length) {continue}
    fragment.append(buildVarGroup({
      key: `global-${group.id}`,
      scope: 'global',
      title: group.title,
      subtitle: group.hint,
      tokens: group.tokens,
      open: group.id === 'color' || group.id === 'radius',
    }))
  }

  const componentScopes = state.order
    .filter(entry => state.tokens.components?.[entry.id]?.length)
    .map(entry => [entry.id, state.tokens.components[entry.id]])
  for (const [scope, tokens] of componentScopes) {
    fragment.append(buildVarGroup({
      key: scope,
      scope,
      title: scopeTitle(scope),
      subtitle: '只影响这个组件',
      tokens,
      open: false,
    }))
  }
  elements.themeGroups.replaceChildren(fragment)

  const componentTotal = componentScopes.reduce((total, [, tokens]) => total + tokens.length, 0)
  state.themeBaseStatus = `全局 ${globals.length} 项 · 组件级 ${componentTotal} 项，共 ${componentScopes.length} 个组件有单独变量`
  elements.themeStatus.textContent = state.themeBaseStatus
  elements.themeTotal.textContent = String(globals.length + componentTotal)
}

function applyThemeSearch() {
  const query = elements.themeSearch.value.trim().toLowerCase()
  let visible = 0

  for (const group of elements.themeGroups.querySelectorAll('.theme-group')) {
    let groupMatches = 0
    for (const row of group.querySelectorAll('.var-row')) {
      const info = state.varIndex.get(row.dataset.var)
      const haystack = [
        row.dataset.var,
        info?.token ?? '',
        info ? tokenLabel(info.token) : '',
        scopeTitle(info?.scope ?? 'global'),
      ].join(' ').toLowerCase()
      const matched = !query || haystack.includes(query)
      row.hidden = !matched
      if (matched) {groupMatches += 1}
    }
    group.hidden = groupMatches === 0
    if (query && groupMatches) {group.open = true}
    visible += groupMatches
  }

  elements.themeEmpty.hidden = visible > 0
  elements.themeStatus.textContent = query
    ? `匹配 ${visible} 项变量`
    : state.themeBaseStatus
}

function expandThemeGroups(open) {
  for (const group of elements.themeGroups.querySelectorAll('.theme-group')) {
    if (!group.hidden) {group.open = open}
  }
}

function scrollToTheme() {
  elements.themeSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  elements.themeSearch.focus({ preventScroll: true })
}

function focusThemeScope(scope) {
  const group = elements.themeGroups.querySelector(`.theme-group[data-scope="${scope}"]`)
  if (!group) {
    scrollToTheme()
    return
  }
  elements.themeSearch.value = ''
  applyThemeSearch()
  group.open = true
  group.scrollIntoView({ behavior: 'smooth', block: 'center' })
  group.classList.add('is-flash')
  window.setTimeout(() => group.classList.remove('is-flash'), 1400)
}

function setOverride(name, raw) {
  if (raw === '') {state.overrides.delete(name)}
  else {state.overrides.set(name, raw)}
  syncVarRow(name)
  onThemeChanged()
}

function applyVarSample(name) {
  const refs = state.themeRows.get(name)
  if (!refs || !refs.sample) {return}
  const info = state.varIndex.get(name)
  const raw = state.overrides.get(name) ?? ''
  const valid = raw === '' || isValidThemeValue(raw)
  const value = valid && raw.trim() ? raw.trim() : info?.def ?? ''
  const sample = refs.sample
  sample.style.background = ''
  sample.style.borderRadius = ''
  sample.style.fontSize = ''
  sample.style.boxShadow = ''
  sample.style.height = ''

  if (refs.sampleKind === 'color') {sample.style.background = value}
  if (refs.sampleKind === 'radius') {sample.style.borderRadius = value}
  if (refs.sampleKind === 'font-size') {sample.style.fontSize = value}
  if (refs.sampleKind === 'shadow') {sample.style.boxShadow = value}
  if (refs.sampleKind === 'height') {sample.style.height = value}
}

function syncVarRow(name) {
  const refs = state.themeRows.get(name)
  if (!refs) {return}
  const info = state.varIndex.get(name)
  const raw = state.overrides.get(name) ?? ''
  const valid = raw === '' || isValidThemeValue(raw)

  refs.row.classList.toggle('is-overridden', valid && raw !== '')
  refs.row.classList.toggle('is-invalid', !valid)
  refs.reset.disabled = raw === ''
  refs.text.title = valid ? '' : '取值不能为空，也不能包含 ; { }'
  if (refs.text !== document.activeElement) {refs.text.value = raw}
  if (refs.color) {
    const hex = hexColor(raw) || hexColor(info?.def ?? '')
    if (hex && refs.color.value !== hex) {refs.color.value = hex}
  }
  applyVarSample(name)
}

function invalidOverrides() {
  const names = []
  for (const [name, raw] of state.overrides) {
    if (!isValidThemeValue(raw)) {names.push(name)}
  }
  return names
}

function themeFromOverrides() {
  const global = {}
  const components = {}
  for (const [name, raw] of state.overrides) {
    const info = state.varIndex.get(name)
    if (!info || !isValidThemeValue(raw)) {continue}
    const key = camelToken(info.token)
    if (info.scope === 'global') {global[key] = raw.trim()}
    else {
      if (!components[info.scope]) {components[info.scope] = {}}
      components[info.scope][key] = raw.trim()
    }
  }
  const theme = {}
  if (Object.keys(global).length) {theme.global = global}
  if (Object.keys(components).length) {theme.components = components}
  return Object.keys(theme).length ? theme : undefined
}

function themeCssText(prefix, rootSelector = ':root') {
  const globalDeclarations = []
  const scopeDeclarations = new Map()
  for (const [name, raw] of state.overrides) {
    const info = state.varIndex.get(name)
    if (!info || !isValidThemeValue(raw)) {continue}
    const declaration = `  ${rewriteVarName(name, prefix)}: ${raw.trim()};`
    if (info.scope === 'global') {globalDeclarations.push(declaration)}
    else {
      if (!scopeDeclarations.has(info.scope)) {scopeDeclarations.set(info.scope, [])}
      scopeDeclarations.get(info.scope).push(declaration)
    }
  }
  const blocks = []
  if (globalDeclarations.length) {blocks.push(`${rootSelector} {\n${globalDeclarations.join('\n')}\n}`)}
  for (const [scope, declarations] of scopeDeclarations) {
    blocks.push(`.${prefix}-${scope} {\n${declarations.join('\n')}\n}`)
  }
  return blocks.length ? blocks.join('\n\n') : '/* 还没有覆盖任何变量 */'
}

function renderThemeCss() {
  const prefix = toPrefix(elements.classPrefix.value)
  elements.themeCssBody.textContent = `${themeCssText(prefix)}\n`
}

function renderThemeCounts() {
  const valid = [...state.overrides.values()].filter(isValidThemeValue).length
  const invalid = invalidOverrides().length
  elements.themeCount.textContent = String(valid)
  elements.themeCount.classList.toggle('is-invalid', invalid > 0)
  elements.navTheme.textContent = `${valid} 项`
  elements.themeResetAll.disabled = valid === 0 && invalid === 0
}

function onThemeChanged() {
  resetBuildResult()
  renderThemeCounts()
  renderThemeCss()
  applyPreviewTheme()
  renderConfig()
}

function resetAllOverrides() {
  for (const name of [...state.themeRows.keys()]) {
    if (!state.overrides.has(name)) {continue}
    state.overrides.delete(name)
    syncVarRow(name)
  }
  state.presetKeys = new Set()
  onThemeChanged()
  renderPresetStatus(presetById(state.preset))
}

/* ---------- 主题预设 ---------- */

function presetById(id) {
  return state.presets.find(item => item.id === id) ?? null
}

function countThemeTokens(theme) {
  let total = Object.keys(theme.global ?? theme.tokens ?? {}).length
  for (const tokens of Object.values(theme.components ?? {})) {
    total += Object.keys(tokens).length
  }
  return total
}

function varNameForThemeKey(scope, key) {
  const token = camelToken(key)
  for (const [name, info] of state.varIndex) {
    if (info.scope === scope && camelToken(info.token) === token) {return name}
  }
  return ''
}

function presetOverrides(preset) {
  const entries = new Map()
  if (!preset) {return entries}
  const theme = preset.theme ?? {}
  const collect = (scope, tokens) => {
    if (!tokens || typeof tokens !== 'object') {return}
    for (const [key, value] of Object.entries(tokens)) {
      const raw = typeof value === 'number' ? String(value) : String(value ?? '').trim()
      if (!isValidThemeValue(raw)) {continue}
      const name = varNameForThemeKey(scope, key)
      if (name) {entries.set(name, raw)}
    }
  }
  collect('global', theme.global ?? theme.tokens)
  for (const [scope, tokens] of Object.entries(theme.components ?? {})) {
    collect(scope, tokens)
  }
  return entries
}

function applyPresetTheme(preset) {
  // 回收上个预设填过、之后没被用户改过的项，避免两套预设叠加；用户手工覆盖的其他变量保留
  for (const name of state.presetKeys) {
    if (state.overrides.has(name)) {
      state.overrides.delete(name)
      syncVarRow(name)
    }
  }
  const entries = presetOverrides(preset)
  for (const [name, raw] of entries) {
    state.overrides.set(name, raw)
    syncVarRow(name)
  }
  state.presetKeys = new Set(entries.keys())
  return entries.size
}

function renderPresetStatus(preset, applied) {
  elements.presetBadge.textContent = preset ? preset.label : '无预设'
  elements.presetBadge.classList.toggle('badge--accent', Boolean(preset))
  if (!preset) {
    elements.presetStatus.textContent = '当前未选预设：产物只包含组件样式和变量覆盖。'
    return
  }
  const counts = countThemeTokens(preset.theme ?? {})
  const filled = applied ?? state.presetKeys.size
  const appliedNote = filled === counts
    ? `已填入 ${filled} 项主题令牌，可直接构建或继续微调`
    : `已填入 ${filled} / ${counts} 项主题令牌（其余令牌在当前清单里不存在，已跳过）`
  elements.presetStatus.textContent = `${preset.label} · ${appliedNote}`
}

function renderPresetOptions() {
  const options = [
    {
      id: '',
      label: '无预设',
      desc: '只保留变量覆盖，组件保持默认几何与配色',
      palette: [],
    },
    ...state.presets.map(preset => ({
      id: preset.id,
      label: preset.label,
      desc: `一键填入 ${countThemeTokens(preset.theme ?? {})} 项主题令牌（配色、渐变、阴影、间距），每项都可继续微调`,
      palette: preset.palette ?? [],
    })),
  ]

  const fragment = document.createDocumentFragment()
  for (const option of options) {
    const label = createElement('label', 'preset-option')
    const input = document.createElement('input')
    input.type = 'radio'
    input.name = 'preset'
    input.value = option.id
    input.checked = state.preset === option.id
    input.addEventListener('change', () => {
      if (input.checked) {selectPreset(option.id)}
    })

    const body = createElement('span', 'preset-option__body')
    body.append(createElement('span', 'preset-option__name', option.label))
    body.append(createElement('span', 'preset-option__desc', option.desc))
    if (option.palette.length) {
      const meta = createElement('span', 'preset-option__meta')
      for (const color of option.palette) {
        const swatch = createElement('span', 'preset-option__swatch')
        swatch.style.background = color
        meta.append(swatch)
      }
      body.append(meta)
    }

    label.append(input, body)
    fragment.append(label)
  }
  elements.presetOptions.replaceChildren(fragment)
}

function selectPreset(id) {
  if (state.preset === id) {return}
  state.preset = id
  const preset = presetById(id)
  const applied = preset ? applyPresetTheme(preset) : 0
  onThemeChanged()
  renderPresetStatus(preset, applied)
  syncPreviewHint()
}

async function loadPresets() {
  try {
    const response = await fetch('/api/presets', { cache: 'no-store' })
    if (!response.ok) {throw new Error(`HTTP ${response.status}`)}
    const payload = await response.json()
    state.presets = Array.isArray(payload.presets) ? payload.presets : []
  }
  catch (error) {
    state.presets = []
    elements.presetStatus.textContent = `预设清单加载失败（${error.message}），可手动在变量清单里配置主题。`
  }
  if (!state.presets.length && !elements.presetStatus.textContent) {
    elements.presetStatus.textContent = '没有可用预设，可手动在变量清单里配置主题。'
  }
  renderPresetOptions()
  if (state.presets.length) {
    renderPresetStatus(presetById(state.preset))
  }
}

/* ---------- 实时预览 ---------- */

function rootToHost(cssText) {
  return cssText.replace(/:root\s*\{/g, ':host{')
}

function applyPreviewTheme() {
  if (!state.preview) {return}
  state.preview.themeStyle.textContent = themeCssText(state.preview.prefix, ':host')
}

function syncPreviewHint() {
  if (!state.preview) {return}
  const previewPrefix = state.preview.prefix
  const chosen = toPrefix(elements.classPrefix.value)
  const prefixNote = chosen === previewPrefix
    ? '变量改动即时生效'
    : `构建前缀将改写为 ${chosen}，预览仍按 ${previewPrefix} 前缀展示`
  const preset = presetById(state.preset)
  const presetNote = preset ? `已填入「${preset.label}」预设` : '未选预设'
  elements.previewHint.textContent = `预览来自 ${state.preview.label} 预制包（${previewPrefix} 前缀）；${presetNote}，${prefixNote}。对话框、抽屉、加载等他处组件未在预览中出场，变量一样会写进产物。`
}

function createPreviewApp(mod) {
  const slot = text => ({ default: () => text })
  return {
    name: 'ThemePreview',
    render() {
      const row = children => h('div', { class: 'pv__row' }, children)
      return h('div', { class: 'pv' }, [
        row([
          h(mod.Button, { type: 'primary' }, slot('主要')),
          h(mod.Button, null, slot('默认')),
          h(mod.Button, { plain: true, type: 'primary' }, slot('朴素')),
        ]),
        row([
          h(mod.Button, { type: 'success', size: 'small' }, slot('成功')),
          h(mod.Button, { type: 'danger', size: 'small' }, slot('危险')),
          h(mod.Switch, { modelValue: true }),
        ]),
        row([
          h(mod.Input, { modelValue: '', placeholder: '输入内容' }),
          h(mod.Rate, { modelValue: 4 }),
        ]),
        row([
          h(mod.Tag, { type: 'success' }, slot('成功')),
          h(mod.Tag, { type: 'warning' }, slot('警告')),
          h(mod.Tag, { type: 'danger' }, slot('危险')),
          h(mod.Tag, null, slot('默认')),
        ]),
        h(mod.Alert, {
          type: 'success',
          title: '主题生效时整块换色',
          description: '背景、边框、文字都取自变量',
        }),
        h(mod.Card, { header: '卡片' }, { default: () => h('div', { class: 'pv__text' }, '卡片圆角与阴影来自全局 token') }),
        h(mod.Divider, { content: '分割线' }),
        h(mod.Menu, { mode: 'horizontal', defaultActive: 'theme' }, {
          default: () => [
            h(mod.MenuItem, { index: 'home' }, slot('首页')),
            h(mod.MenuItem, { index: 'theme' }, slot('主题')),
            h(mod.MenuItem, { index: 'build' }, slot('构建')),
          ],
        }),
        h(mod.Progress, { percentage: 60 }),
      ])
    },
  }
}

async function initPreview() {
  let payload
  try {
    const response = await fetch('/api/packages', { cache: 'no-store' })
    if (!response.ok) {throw new Error(`HTTP ${response.status}`)}
    payload = await response.json()
  }
  catch (error) {
    elements.previewHint.textContent = `预览接口不可用（${error.message}），需要 npm run dev 启动。`
    return
  }

  const packages = payload.packages ?? []
  const target = packages.find(item => item.id === 'full') ?? packages.find(item => item.prefix === 'ui') ?? packages[0]
  if (!target) {
    elements.previewHint.textContent = '还没找到构建产物。先点第 4 步的「生成 npm 包」或运行 npm run build:all，刷新后就有实时预览。'
    return
  }

  try {
    // Vite 会把 JS 发起的 .css 请求包成 JS 模块，加 ?direct 才拿到原始样式表
    const styleUrl = `${target.styleUrl}${target.styleUrl.includes('?') ? '&' : '?'}direct`
    // 产物 URL 只带文件 mtime；依赖预构建哈希变化时浏览器会复用旧模块体，里面指向另一份 Vue 导致 inject 失败
    const moduleUrl = `${target.moduleUrl}&preview=${Date.now()}`
    const [mod, cssText] = await Promise.all([
      import(/* @vite-ignore */ moduleUrl),
      fetch(styleUrl).then(response => response.text()),
    ])

    const shadow = elements.previewStage.attachShadow({ mode: 'open' })
    const baseStyle = document.createElement('style')
    baseStyle.textContent = `${rootToHost(cssText)}\n${PREVIEW_STYLE}`
    const themeStyle = document.createElement('style')
    const mount = document.createElement('div')
    // 与构建产物一致：基础样式 → 主题令牌覆盖
    shadow.append(baseStyle, themeStyle, mount)

    createApp(createPreviewApp(mod)).mount(mount)

    state.preview = {
      themeStyle,
      prefix: target.prefix || 'ui',
      label: target.label || target.id,
    }
    elements.previewBadge.textContent = target.label || target.id
    applyPreviewTheme()
    syncPreviewHint()
  }
  catch (error) {
    elements.previewHint.textContent = `预览加载失败：${error.message}`
  }
}

/* ---------- 体积试算 ---------- */

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) {return '—'}
  if (bytes < 1024) {return `${bytes} B`}
  const kb = bytes / 1024
  if (kb < 100) {return `${kb.toFixed(1)} kB`}
  return `${Math.round(kb)} kB`
}

function formatSignedBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes === 0) {return '没有变化'}
  const sign = bytes > 0 ? '+' : '-'
  return `${sign}${formatBytes(Math.abs(bytes))}`
}

function updateNavBuild() {
  elements.navBuild.textContent = estimateLast ? `≈ ${formatBytes(estimateLast.totalBytes)}` : '—'
}

function renderEstimateNumbers(payload) {
  const items = [
    ['JS', payload.jsBytes],
    ['CSS', payload.cssBytes],
    ['合计', payload.totalBytes],
    ['gzip', payload.gzipBytes],
  ]
  const fragment = document.createDocumentFragment()
  for (const [label, bytes] of items) {
    const item = createElement('span', `estimate__item${label === '合计' ? ' estimate__item--total' : ''}`)
    item.append(
      createElement('span', 'estimate__label', label),
      createElement('span', 'estimate__value', formatBytes(bytes)),
    )
    fragment.append(item)
  }
  elements.estimateNumbers.replaceChildren(fragment)
}

function renderEstimateEmpty() {
  elements.estimateCard.classList.remove('is-loading', 'is-error')
  elements.estimateBadge.textContent = '未选组件'
  elements.estimateNumbers.replaceChildren(
    createElement('p', 'estimate__placeholder', '第 1 步选上组件后，这里会自动试算包体积。'),
  )
  elements.estimateDelta.textContent = ''
  elements.estimateNote.textContent = '试算会实际构建一次，约 1–2 秒。'
  updateNavBuild()
}

function setEstimateLoading() {
  elements.estimateCard.classList.add('is-loading')
  elements.estimateCard.classList.remove('is-error')
  elements.estimateBadge.textContent = '试算中…'
  elements.estimateNote.textContent = '正在实际构建试算包（约 1–2 秒）…'
}

function renderEstimate(payload, previous, measured = false) {
  elements.estimateCard.classList.remove('is-loading', 'is-error')
  elements.estimateBadge.textContent = measured ? '构建实测' : '试算完成'
  renderEstimateNumbers(payload)
  if (measured) {
    elements.estimateDelta.textContent = '刚刚生成的包，数字就是它的实际体积。'
    elements.estimateNote.textContent = `${payload.components} 个组件、${payload.features} 个功能，含主题覆盖。`
  }
  else {
    elements.estimateDelta.textContent = previous
      ? `较上次 ${formatSignedBytes(payload.totalBytes - previous.totalBytes)}，gzip ${formatSignedBytes(payload.gzipBytes - previous.gzipBytes)}。`
      : '首次试算：数字来自刚才的一次实际构建。'
    elements.estimateNote.textContent = `${payload.components} 个组件、${payload.features} 个功能；试算不含主题覆盖追加的少量 CSS。`
  }
  updateNavBuild()
}

function renderEstimateError(message) {
  elements.estimateCard.classList.remove('is-loading')
  elements.estimateCard.classList.add('is-error')
  elements.estimateBadge.textContent = '试算失败'
  if (!estimateLast) {
    elements.estimateNumbers.replaceChildren(
      createElement('p', 'estimate__placeholder', '暂时拿不到体积数据。'),
    )
    updateNavBuild()
  }
  elements.estimateDelta.textContent = ''
  elements.estimateNote.textContent = `${message}。试算与构建都需要 npm run dev 启动的接口。`
}

function scheduleEstimate() {
  estimateSeq += 1
  window.clearTimeout(estimateTimer)
  estimateTimer = window.setTimeout(() => runEstimate(estimateSeq), 500)
}

async function runEstimate(seq) {
  const config = currentConfig()
  if (!Object.keys(config.components).length) {
    if (seq === estimateSeq) {
      estimateLast = null
      renderEstimateEmpty()
    }
    return
  }

  setEstimateLoading()
  try {
    const response = await fetch('/api/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    const payload = await response.json()
    if (!response.ok) {throw new Error(payload.error || `HTTP ${response.status}`)}
    if (seq !== estimateSeq) {return}
    const previous = estimateLast
    estimateLast = payload
    renderEstimate(payload, previous)
  }
  catch (error) {
    if (seq !== estimateSeq) {return}
    renderEstimateError(error.message)
  }
}

/* ---------- 配置与构建 ---------- */

function toProfileName(value) {
  const clean = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return clean || 'custom'
}

function toPrefix(value) {
  const clean = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return clean || 'ui'
}

function currentConfig() {
  const components = {}
  for (const entry of state.order) {
    if (!entry.enabled) {continue}
    const selected = entry.featureList
      .map(feature => feature.id)
      .filter(id => entry.selected.has(id))
    components[entry.id] = selected
  }
  const config = {
    name: toProfileName(elements.packageSuffix.value),
    prefix: toPrefix(elements.classPrefix.value),
    components,
  }
  const theme = themeFromOverrides()
  if (theme) {config.theme = theme}
  return config
}

function renderConfig() {
  const config = currentConfig()
  const stats = selectionStats()
  elements.selectionCount.textContent = `${stats.components} 个组件 / ${stats.features} 个功能`
  elements.configJson.textContent = `${JSON.stringify(config, null, 2)}\n`
  elements.outputPackage.textContent = `${state.name}-${config.name}`

  const enabledFeatureTotal = state.order
    .filter(entry => entry.enabled)
    .reduce((total, entry) => total + entry.featureList.length, 0)
  elements.featureSelection.textContent = enabledFeatureTotal
    ? `已勾选 ${stats.features} / ${enabledFeatureTotal} 个功能`
    : `已勾选 ${stats.features} 个功能`
}

function resetBuildResult() {
  if (isBuilding) {return}
  elements.buildOutput.hidden = true
  elements.buildHint.textContent = '构建会在 dist/<包名后缀> 输出独立包。'
}

function setBuildingState(value) {
  isBuilding = value
  elements.buildButton.disabled = value
  elements.buildButton.textContent = value ? '生成中…' : '生成 npm 包'
  if (value) {elements.buildHint.textContent = '正在打包所选组件与功能…'}
}

function renderBuildOutput(result) {
  elements.buildOutput.hidden = false
  elements.buildOutput.className = 'output output--success'
  elements.buildOutput.replaceChildren()

  elements.buildOutput.append(createElement('p', 'output__title', '构建成功'))
  elements.buildOutput.append(createElement('p', 'output__path', `${result.dir}/`))

  const summary = createElement(
    'p',
    'output__summary',
    `${result.components.length} 个组件 · ${result.features.length} 个功能 · 前缀 ${result.prefix}`,
  )
  elements.buildOutput.append(summary)

  const list = createElement('ul', 'output__list')
  for (const file of result.files) {
    const item = document.createElement('li')
    item.append(createElement('span', '', file.file), createElement('span', '', formatBytes(file.bytes)))
    list.append(item)
  }
  elements.buildOutput.append(list)

  elements.buildOutput.append(
    createElement(
      'p',
      'output__total',
      `合计 ${formatBytes(result.totalBytes)} · gzip ${formatBytes(result.gzipBytes)}`,
    ),
  )

  const types = createElement('details', 'output__types')
  types.append(
    createElement('summary', '', `index.d.ts · ${result.types.split('\n').length} 行`),
  )
  const typesBody = createElement('pre', '', result.types || '类型声明读取失败')
  types.append(typesBody)
  elements.buildOutput.append(types)
}

function renderBuildError(message) {
  elements.buildOutput.hidden = false
  elements.buildOutput.className = 'output output--error'
  elements.buildOutput.replaceChildren(
    createElement('p', 'output__title', '构建失败'),
    createElement('p', 'output__message', message),
  )
}

function adoptBuildResult(result) {
  estimateSeq += 1
  window.clearTimeout(estimateTimer)
  estimateLast = {
    components: result.components.length,
    features: result.features.length,
    jsBytes: result.jsBytes,
    cssBytes: result.cssBytes,
    totalBytes: result.totalBytes,
    gzipBytes: result.gzipBytes,
  }
  renderEstimate(estimateLast, null, true)
}

async function buildSelected() {
  if (isBuilding) {return}
  const config = currentConfig()
  if (!Object.keys(config.components).length) {
    renderBuildError('至少选择一个组件后再生成。')
    return
  }
  const invalid = invalidOverrides()
  if (invalid.length) {
    renderBuildError(`主题变量 ${invalid.join('、')} 的取值不能为空，也不能包含 ; { }`)
    return
  }

  setBuildingState(true)
  elements.buildOutput.hidden = true

  try {
    const response = await fetch('/api/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    const payload = await response.json()
    if (!response.ok) {throw new Error(payload.error || `构建失败（HTTP ${response.status}）`)}
    renderBuildOutput(payload)
    adoptBuildResult(payload)
    elements.buildHint.textContent = '产物已写入本地 dist 目录，可直接安装使用。'
  }
  catch (error) {
    renderBuildError(error.message)
    elements.buildHint.textContent = '构建接口仅在 npm run dev 下可用；也可运行 npm run build:all。'
  }
  finally {
    setBuildingState(false)
  }
}

/* ---------- 配置导出 ---------- */

async function copyConfig() {
  try {
    await navigator.clipboard.writeText(elements.configJson.textContent)
    flashCopyLabel('已复制')
  }
  catch {
    flashCopyLabel('复制失败')
  }
}

function flashCopyLabel(label) {
  window.clearTimeout(copyTimer)
  elements.copyConfig.textContent = label
  copyTimer = window.setTimeout(() => {
    elements.copyConfig.textContent = '复制'
  }, 1600)
}

async function copyThemeCss() {
  try {
    await navigator.clipboard.writeText(elements.themeCssBody.textContent)
    flashThemeCopyLabel('已复制')
  }
  catch {
    flashThemeCopyLabel('复制失败')
  }
}

function flashThemeCopyLabel(label) {
  window.clearTimeout(themeCopyTimer)
  elements.copyThemeCss.textContent = label
  themeCopyTimer = window.setTimeout(() => {
    elements.copyThemeCss.textContent = '复制'
  }, 1600)
}

function downloadConfig() {
  const blob = new Blob([`${JSON.stringify(currentConfig(), null, 2)}\n`], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'build.config.json'
  anchor.click()
  URL.revokeObjectURL(url)
}

/* ---------- 步骤导航 ---------- */

function initStepNav() {
  const links = [...document.querySelectorAll('.step-nav__link')]
  const sections = links
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean)

  function activate(id) {
    for (const link of links) {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`)
    }
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        activate(entry.target.id)
        break
      }
    }
  }, { rootMargin: '-42% 0px -50% 0px', threshold: 0 })
  for (const section of sections) {observer.observe(section)}

  for (const link of links) {
    link.addEventListener('click', () => activate(link.getAttribute('href').slice(1)))
  }
}

/* ---------- 初始化 ---------- */

function bindEvents() {
  elements.search.addEventListener('input', handleComponentSearch)
  elements.featureSearch.addEventListener('input', applyFeatureSearch)
  elements.allFeatures.addEventListener('click', () => {
    for (const entry of state.order) {
      if (!entry.enabled) {continue}
      for (const feature of entry.featureList) {addWithDependencies(entry, feature.id)}
      syncEntry(entry)
    }
    onSelectionChanged()
  })
  elements.clearFeatures.addEventListener('click', () => {
    for (const entry of state.order) {
      if (!entry.enabled) {continue}
      entry.selected.clear()
      syncEntry(entry)
    }
    onSelectionChanged()
  })
  elements.packageSuffix.addEventListener('input', () => {
    resetBuildResult()
    renderConfig()
  })
  elements.classPrefix.addEventListener('input', () => {
    resetBuildResult()
    renderConfig()
    renderThemeCss()
    syncPreviewHint()
  })
  elements.themeSearch.addEventListener('input', applyThemeSearch)
  elements.themeExpand.addEventListener('click', () => expandThemeGroups(true))
  elements.themeCollapse.addEventListener('click', () => expandThemeGroups(false))
  elements.themeResetAll.addEventListener('click', resetAllOverrides)
  elements.copyThemeCss.addEventListener('click', copyThemeCss)
  elements.themeJump.addEventListener('click', scrollToTheme)
  elements.copyConfig.addEventListener('click', copyConfig)
  elements.downloadConfig.addEventListener('click', downloadConfig)
  elements.buildButton.addEventListener('click', buildSelected)
}

async function init() {
  bindEvents()
  initStepNav()

  let registry
  try {
    const response = await fetch('/api/registry', { cache: 'no-store' })
    if (!response.ok) {throw new Error(`HTTP ${response.status}`)}
    registry = await response.json()
  }
  catch (error) {
    elements.listStatus.textContent = `组件清单加载失败：${error.message}`
    return
  }

  state.name = registry.name
  state.version = registry.version
  state.tokens = registry.tokens ?? { global: [], components: {} }
  state.order = registry.components.map(component => createEntry(component))
  for (const entry of state.order) {state.components.set(entry.id, entry)}
  state.groups = buildGroups()
  for (const group of state.groups) {
    for (const entry of group.entries) {entry.group = group}
  }

  elements.packageName.textContent = registry.name
  elements.manifestVersion.textContent = registry.version
  elements.componentTotal.textContent = String(state.order.length)
  elements.featureTotal.textContent = String(
    state.order.reduce((total, entry) => total + entry.featureList.length, 0),
  )

  renderPresets()
  renderCategoryTabs()
  renderList()
  renderFeaturePanel()
  for (const entry of state.order) {syncEntry(entry)}
  applySearch()
  applyFeatureSearch()
  renderThemePanel()
  await loadPresets()
  renderThemeCounts()
  renderThemeCss()
  renderConfig()
  syncNavCounts()
  renderEstimateEmpty()
  scheduleEstimate()
  initPreview()
}

init()
