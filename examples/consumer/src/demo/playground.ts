import metaJson from './meta.json'
import { CASCADER_DEFAULT_CLEAR_PATH, CASCADER_OPTIONS } from './cascader-data'
import { FORM_MODEL } from './form-data'
import { SAMPLE_AVATAR_A, SAMPLE_IMAGE_SRC, SAMPLE_PHOTOS } from './sample-image'
import { SELECT_CITY_OPTIONS } from './select-data'
import { TABLE_DEMO_ROWS } from './table-data'

interface MetaProp {
  name: string
  type: string
  default?: unknown
  offValue?: unknown
  description?: string
}

interface MetaFeature {
  id: string
  title: string
  description: string
  props: MetaProp[]
}

interface MetaExport {
  name: string
  coreProps: MetaProp[]
  features: MetaFeature[]
  methods: string[]
}

interface MetaComponent {
  id: string
  title: string
  description: string
  order: number
  exports: MetaExport[]
}

interface MetaRegistry {
  base: string
  version: string
  components: MetaComponent[]
}

export type ControlKind = 'switch' | 'select' | 'number' | 'text' | 'color' | 'json'

export interface PlaygroundControl {
  name: string
  type: string
  description: string
  kind: ControlKind
  options: string[]
  defaultValue: unknown
  offValue?: unknown
  featureId: string
  featureTitle: string
  initialEnabled: boolean
  sampleValue: unknown
}

export interface PlaygroundControlGroup {
  id: string
  title: string
  description: string
  controls: PlaygroundControl[]
}

export interface PlaygroundEntry {
  name: string
  componentId: string
  componentTitle: string
  componentDescription: string
  controls: PlaygroundControl[]
  groups: PlaygroundControlGroup[]
  skipped: MetaProp[]
  previewEvents: string[]
  allProps: number
  note: string
}

export interface PlaygroundGroup {
  id: string
  title: string
  description: string
  exports: PlaygroundEntry[]
}

export interface ControlState {
  enabled: boolean
  value: unknown
  text: string
  valid: boolean
  initialEnabled: boolean
  initialValue: unknown
  initialText: string
}

export interface ExportState {
  controls: Record<string, ControlState>
}

const META = metaJson as unknown as MetaRegistry

const TABLE_ROWS = [
  { id: 1, name: 'Button', city: '上海', status: '稳定' },
  { id: 2, name: 'Input', city: '杭州', status: '内测' },
  { id: 3, name: 'Table', city: '成都', status: '规划' },
  { id: 4, name: 'Tree', city: '深圳', status: '稳定' }
]

const TREE_DATA = [
  {
    id: 'forms',
    label: '表单组件',
    children: [
      { id: 'button', label: 'Button' },
      { id: 'input', label: 'Input' }
    ]
  },
  {
    id: 'data',
    label: '数据组件',
    children: [
      { id: 'table', label: 'Table' },
      { id: 'tree', label: 'Tree' }
    ]
  }
]

const TRANSFER_DATA = [
  { key: 'a', label: '选项 A' },
  { key: 'b', label: '选项 B' },
  { key: 'c', label: '选项 C' },
  { key: 'd', label: '选项 D' }
]

const SEGMENTED_OPTIONS = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' }
]

const RADIO_OPTIONS = [
  { label: '标准版', value: 'standard' },
  { label: '专业版', value: 'pro' },
  { label: '旗舰版', value: 'ultimate', disabled: true }
]

const MENTION_OPTIONS = [
  { value: 'alice', label: 'Alice' },
  { value: 'bob', label: 'Bob' },
  { value: 'carol', label: 'Carol' }
]

const VIRTUAL_DATA = Array.from({ length: 40 }, (_value, index) => `列表项 ${index + 1}`)

const SAMPLE_BY_NAME: Record<string, unknown> = {
  placeholder: '请输入内容',
  title: '示例标题',
  description: '一段示例描述，用于观察属性效果。',
  content: '示例内容',
  message: '这是一条示例消息',
  label: '标签名称',
  options: SELECT_CITY_OPTIONS,
  data: TABLE_ROWS,
  total: 120,
  percentage: 62,
  src: SAMPLE_IMAGE_SRC,
  prefix: '¥',
  suffix: '件',
  name: '示例名称',
  value: 1280,
  currentPage: 1,
  pageSize: 10,
  icon: 'star',
  prefixIcon: 'clock',
  suffixIcon: 'search',
  clearIcon: 'close',
  loadingIcon: 'loader',
  activeIcon: 'star',
  inactiveIcon: 'star',
  activeActionIcon: 'eye',
  inactiveActionIcon: 'eyeOff',
  expandOpenIcon: 'chevronUp',
  expandCloseIcon: 'chevronDown',
  collapseOpenIcon: 'chevronUp',
  collapseCloseIcon: 'chevronDown',
  prevIcon: 'chevronLeft',
  nextIcon: 'chevronRight',
  arrowIcon: 'arrowDown',
  checkIcon: 'check',
  indeterminateIcon: 'minus',
  ariaOrientation: 'horizontal'
}

const SAMPLE_PROP_VALUES: Record<string, unknown> = {
  'Icon.name': 'star',
  'Image.src': SAMPLE_IMAGE_SRC,
  'ImageViewer.urlList': SAMPLE_PHOTOS.map((photo) => photo.src),
  'Statistic.title': '用户总数',
  'Statistic.value': 1280,
  'Statistic.prefix': '¥',
  'Countdown.value': 3661,
  'Countdown.title': '剩余时间',
  'Countdown.prefix': '',
  'Countdown.suffix': '',
  'Watermark.content': 'feature build',
  'Watermark.width': 240,
  'Watermark.height': 120,
  'Watermark.font': { fontSize: 16, color: 'rgba(51, 102, 255, 0.16)' },
  'Segmented.options': SEGMENTED_OPTIONS,
  'Segmented.modelValue': 'day',
  'Rate.modelValue': 3,
  'Rate.voidColor': '',
  'Rate.disabledVoidColor': '',
  'Rate.textColor': '',
  'Badge.color': '',
  'Loading.color': '',
  'Progress.percentage': 62,
  'Progress.width': 320,
  'Progress.color': '',
  'Pagination.total': 128,
  'Pagination.currentPage': 3,
  'Tabs.modelValue': 'a',
  'Collapse.modelValue': ['a'],
  'Steps.active': 1,
  'Tag.color': '',
  'Menu.defaultActive': 'overview',
  'Menu.defaultOpeneds': ['components', 'components-basic'],
  'Menu.backgroundColor': '',
  'Menu.textColor': '',
  'Menu.activeTextColor': '',
  'Table.data': TABLE_DEMO_ROWS,
  'Table.rowKey': 'id',
  'Tree.data': TREE_DATA,
  'TreeSelect.data': TREE_DATA,
  'TreeSelect.modelValue': 'button',
  'TreeV2.data': TREE_DATA,
  'TreeV2.height': 280,
  'Transfer.data': TRANSFER_DATA,
  'Transfer.modelValue': ['a'],
  'Select.modelValue': 'shanghai',
  'Select.options': SELECT_CITY_OPTIONS,
  'Select.placeholder': '请选择城市',
  'Select.suffixIcon': '',
  'Select.clearIcon': '',
  'Select.loadingText': '加载中',
  'Cascader.options': CASCADER_OPTIONS,
  'Cascader.modelValue': CASCADER_DEFAULT_CLEAR_PATH,
  'CascaderPanel.options': CASCADER_OPTIONS,
  'CascaderPanel.modelValue': ['zhejiang', 'hangzhou'],
  'DatePicker.modelValue': '2026-10-26',
  'DatePicker.clearIcon': '',
  'DatePicker.prefixIcon': '',
  'TimePicker.modelValue': '10:30:00',
  'TimePicker.prefixIcon': 'bell',
  'TimeSelect.modelValue': '10:30',
  'ColorPicker.modelValue': '#3366ff',
  'ColorPickerPanel.modelValue': '#3366ff',
  'DatePickerPanel.modelValue': '2026-10-26',
  'Input.modelValue': '可编辑内容',
  'Input.placeholder': '请输入内容',
  'InputNumber.modelValue': 5,
  'InputTag.modelValue': ['Vue', 'Vite'],
  'InputOtp.modelValue': '123456',
  'Mention.modelValue': '@',
  'Mention.options': MENTION_OPTIONS,
  'Mention.placeholder': '输入 @ 唤起建议',
  'Mention.prefix': '@',
  'Autocomplete.modelValue': 'Vue',
  'Autocomplete.placeholder': '输入关键字，如 Vue',
  'Calendar.modelValue': '2026-10-26',
  'Calendar.range': [],
  'Avatar.src': SAMPLE_AVATAR_A,
  'Avatar.alt': '示例头像',
  'AvatarGroup.maxCollapseAvatars': 2,
  'Slider.modelValue': 40,
  'Switch.modelValue': true,
  'Switch.width': '',
  'CheckboxGroup.modelValue': ['a'],
  'Radio.value': 'standard',
  'Radio.label': '标准版',
  'Radio.modelValue': 'standard',
  'RadioButton.value': 'monthly',
  'RadioButton.label': '按月付费',
  'RadioButton.modelValue': 'monthly',
  'RadioGroup.options': RADIO_OPTIONS,
  'RadioGroup.modelValue': 'pro',
  'RadioGroup.textColor': '',
  'Card.header': '卡片标题',
  'PageHeader.title': '页面标题',
  'Alert.title': '提示标题',
  'Alert.description': '这是一段提示说明，用于观察标题与描述的排版。',
  'Result.title': '操作成功',
  'Result.subTitle': '相关结果已生成，可以继续下一步。',
  'Empty.description': '暂无数据',
  'Badge.value': 12,
  'Descriptions.title': '订单详情',
  'Form.model': FORM_MODEL,
  'FormItem.label': '字段名称',
  'FormItem.prop': 'name',
  'Dialog.title': '对话框标题',
  'Dialog.width': 520,
  'Drawer.title': '抽屉标题',
  'Drawer.width': 420,
  'MessageBox.title': '操作提示',
  'MessageBox.message': '确认执行该操作吗？',
  'Message.message': '这是一条行内消息。',
  'Notification.title': '通知标题',
  'Notification.message': '这是一条通知内容。',
  'Loading.text': '加载中',
  'Popover.title': '气泡标题',
  'Popover.content': '气泡内容，可在此观察宽度与主题。',
  'Popover.width': 280,
  'Tooltip.content': '提示内容',
  'Popconfirm.title': '确认执行该操作？',
  'Popconfirm.width': 260,
  'Carousel.height': '200px',
  'VirtualList.data': VIRTUAL_DATA,
  'VirtualList.height': 180,
  'VirtualList.itemSize': 30,
  'VirtualList.total': 0,
  'Scrollbar.height': '140px',
  'Option.label': '选项一',
  'Option.value': 'a',
  'OptionGroup.label': '分组一',
  'TabPane.label': '标签一',
  'TabPane.name': 'a',
  'Step.title': '步骤一',
  'Step.description': '步骤说明',
  'TimelineItem.timestamp': '2026-10-26',
  'DescriptionsItem.label': '姓名',
  'MenuItem.index': 'button',
  'SubMenu.index': 'feedback',
  'MenuItemGroup.title': '工作台',
  'BreadcrumbItem.to': '#playground',
  'TableColumn.label': '名称',
  'TableColumn.prop': 'name',
  'AnchorLink.title': '锚点标题',
  'AnchorLink.href': '#pg-sec-props',
  'Link.href': '#playground',
  'Link.icon': 'externalLink',
  'Divider.content': '',
  'Divider.contentPosition': 'center',
  'Backtop.target': '#pg-backtop-scroller',
  'Backtop.visibilityHeight': 80,
  'Space.size': 8,
  'Icon.color': '#4f46e5',
  'TourStep.target': '#pg-landmark-b',
  'TourStep.title': '引导标题',
  'TourStep.description': '引导说明',
  'CollectionItem.item': { id: 'sample' }
}

const BOOLEAN_INITIALS: Record<string, boolean> = {
  'Switch.modelValue': true,
  'Tree.defaultExpandAll': true,
  'TreeSelect.defaultExpandAll': true,
  'TreeV2.defaultExpandAll': true,
  'AvatarGroup.collapseAvatars': true
}

const INITIAL_ENABLED: Record<string, string[]> = {
  Icon: ['name'],
  Image: ['src'],
  Alert: ['title', 'description'],
  Statistic: ['title', 'value', 'prefix'],
  Result: ['title', 'subTitle'],
  Empty: ['description'],
  Countdown: ['value', 'title'],
  Watermark: ['content'],
  Segmented: ['options', 'modelValue'],
  Rate: ['modelValue'],
  Progress: ['percentage'],
  Pagination: ['total', 'currentPage'],
  Tabs: ['modelValue'],
  Collapse: ['modelValue'],
  Steps: ['active'],
  Menu: ['defaultActive', 'defaultOpeneds'],
  Table: ['data'],
  Tree: ['data'],
  TreeSelect: ['data', 'modelValue'],
  TreeV2: ['data'],
  Transfer: ['data', 'modelValue'],
  Select: ['modelValue'],
  Cascader: ['options', 'modelValue'],
  CascaderPanel: ['options', 'modelValue'],
  DatePicker: ['modelValue'],
  TimePicker: ['modelValue'],
  TimeSelect: ['modelValue'],
  ColorPicker: ['modelValue'],
  ColorPickerPanel: ['modelValue'],
  DatePickerPanel: ['modelValue'],
  Input: ['modelValue', 'placeholder'],
  InputTag: ['modelValue'],
  InputOtp: ['modelValue'],
  Mention: ['modelValue', 'options', 'placeholder'],
  Autocomplete: ['modelValue', 'placeholder'],
  Calendar: ['modelValue', 'range'],
  AvatarGroup: ['collapseAvatars', 'maxCollapseAvatars'],
  Slider: ['modelValue'],
  CheckboxGroup: ['modelValue'],
  RadioGroup: ['modelValue'],
  Carousel: ['height'],
  Card: ['header'],
  PageHeader: ['title'],
  Descriptions: ['title'],
  Form: ['model'],
  FormItem: ['label', 'prop'],
  Dialog: ['title'],
  Drawer: ['title'],
  MessageBox: ['title', 'message'],
  Message: ['message'],
  Notification: ['title', 'message'],
  Loading: ['text'],
  Popover: ['title', 'content'],
  Tooltip: ['content'],
  Popconfirm: ['title'],
  Badge: ['value'],
  VirtualList: ['data', 'height', 'itemSize'],
  Scrollbar: ['height'],
  Space: ['size'],
  Option: ['label', 'value'],
  OptionGroup: ['label'],
  TabPane: ['label', 'name'],
  Step: ['title', 'description'],
  TimelineItem: ['timestamp'],
  DescriptionsItem: ['label'],
  MenuItem: ['index'],
  SubMenu: ['index'],
  MenuItemGroup: ['title'],
  BreadcrumbItem: ['to'],
  TableColumn: ['label', 'prop'],
  AnchorLink: ['title', 'href'],
  Link: ['href'],
  TourStep: ['title', 'description'],
  CollectionItem: ['item']
}

const HIDDEN_PROP_NAMES = new Set(['modelModifiers'])

const PREVIEW_EVENT_PROPS = ['modelValue', 'currentPage', 'current', 'pageSize', 'value']

const CHILD_EXPORT_NOTES: Record<string, string> = {
  TableColumn: 'TableColumn 需作为 Table 的子节点使用。',
  TabPane: 'TabPane 需作为 Tabs 的子节点使用。',
  Step: 'Step 需作为 Steps 的子节点使用。',
  TimelineItem: 'TimelineItem 需作为 Timeline 的子节点使用。',
  DescriptionsItem: 'DescriptionsItem 需作为 Descriptions 的子节点使用。',
  CarouselItem: 'CarouselItem 需作为 Carousel 的子节点使用。',
  SplitterPanel: 'SplitterPanel 需作为 Splitter 的子节点使用。',
  BreadcrumbItem: 'BreadcrumbItem 需作为 Breadcrumb 的子节点使用。',
  Option: 'Option 需作为 Select 的子节点使用。',
  OptionGroup: 'OptionGroup 需作为 Select 的子节点使用。',
  MenuItem: '预览已把 MenuItem 放进三层菜单树中：同组还有构建概览等兄弟项，可对比激活底色与禁用态。',
  MenuItemGroup: '预览已把 MenuItemGroup 放进三层菜单树中：分组标题只在小标题位置出现，内部条目自动缩进一级。',
  SubMenu: '预览已把 SubMenu 放进三层菜单树中：点击或悬停标题展开，子项按层级缩进并带竖向引导线。',
  DropdownItem: 'DropdownItem 需放在 DropdownMenu 中。',
  DropdownMenu: 'DropdownMenu 需放在 Dropdown 的 dropdown 插槽中。',
  CheckboxButton: 'CheckboxButton 需作为 CheckboxGroup 的子节点使用。',
  SkeletonItem: 'SkeletonItem 需作为 Skeleton 的子节点使用。',
  AvatarGroup: 'AvatarGroup 用于包裹多个 Avatar。'
}

const PREVIEW_NOTES: Record<string, string> = {
  ConfigProvider: '通过 provide/inject 下发全局尺寸，未显式设置 size 的子组件会继承这里的配置。',
  Form: '示例通过默认插槽的 scope.model 绑定四个字段，下方实时回显当前 model；开启校验后错误随输入即时清除，标签宽度、位置、尺寸与禁用状态都由 Form 继承给 FormItem。',
  FormItem:
    'FormItem 在 Form 内会自动继承 model、rules、labelWidth、labelPosition 与 size；单独预览时用 error 属性演示错误态，inlineMessage 与 showMessage 需启用校验特性。',
  Cascader:
    '场景即数据：多选场景折叠标签并支持悬浮 +N 查看，展开两条场景演示 maxCollapseTags=2；复选框场景以 checkbox 渲染叶子勾选；标签场景对比 showAllLevels 全路径与仅末级；懒加载场景每级请求约 550ms 并显示加载中；虚拟滚动场景首列 400 项只渲染可视窗口。清除按钮在悬浮触发器时出现。',
  DatePicker:
    '场景即数据：可清除场景使用自定义清除图标；可编辑场景直接在输入框键入日期回车生效；格式化场景按 YYYY/MM/DD 输出并在清空后回填；区间场景展示“至”分隔、自定义占位、ISO 周数列与左右独立翻月，重新打开时左栏定位开始月、右栏定位结束月。',
  Select:
    '场景即数据：内置 18 个城市选项；可清除场景使用自定义清除图标；自定义后缀图标场景展示图标替换；加载中场景每次打开面板先只显示旋转指示器与加载文案、没有选项，约 1.5 秒后返回全部选项；清空回填场景清空后展示「全部」。',
  TimePicker:
    '场景即数据：显示格式场景把 format 改为 HH:mm，触发器与面板同步去掉秒；格式化输出场景显示仍是 10:30:00，但 v-model 只输出 10:30；清空回填场景清除后回填 00:00:00；时间范围场景下两端互相约束，结束时间不可早于开始时间，越界的时/分/秒置灰不可选；自定义前缀图标场景把触发器左侧的时钟替换为铃铛图标，槽位与间距不变。',
  Radio:
    'border 特性把单选项渲染为整块可点击的卡片，选中时边框与底色同步高亮；size 支持 small / large，选中时文字与圆点同步变为主色。',
  RadioButton: '单独的 RadioButton 用 modelValue 控制选中；放入 RadioGroup 后由父级接管选中态并自动拼接成分段控件。',
  RadioGroup:
    '场景即数据：按钮组场景把 type 切到 button，同组选项合并成分段控件；自定义配色场景用 fill 与 textColor 覆盖选中块；选项里的 disabled 与整组 disabled 分别演示单点禁用和整体禁用。',
  Icon: '图标来自 UI_ICONS 内置注册表，可在下方图标库搜索并点击套用 name。',
  Divider: '基础示例是纯分割线，content 或默认插槽显示文案，contentPosition 控制文案位置。',
  Space:
    'size 控制子项间距（数字或 [横, 纵] 数组），direction / alignment / wrap / fill 控制整体布局；示例已开启 wrap 以适配预览宽度。',
  Text: 'truncated 或 lineClamp 需要配合 maxWidth 才能看出省略效果。',
  Dialog: '以浮层渲染在预览区中央，modelValue 开关即时控制显隐。',
  Drawer: '以抽屉浮层渲染，可实时观察方向、尺寸与遮罩。',
  MessageBox: '以 MessageBox 浮层渲染，modelValue 开关即时控制显隐。',
  Menu: '示例是三组、三层菜单（分组 → 子菜单 → 子菜单 → 菜单项）：点击子菜单标题展开，指针悬停满 showTimeout（默认 300ms）也会自动展开，悬停展开的移出 hideTimeout 后收起，点击展开的保持展开。defaultOpeneds 逐级填入可一次展开到第三级，uniqueOpened 让同层子菜单互斥，collapsed 只保留顶级条目且不再响应展开，horizontal 下分组标题隐藏、子菜单浮出为面板，textColor 与 backgroundColor 会一并作用于菜单项与浮出面板。',
  PageHeader:
    '标题与说明分别走 title / content，正文区域走 default 插槽，右侧操作区走 extra 插槽；返回按钮属于「图标」特性：包里开启该特性时默认渲染 arrowLeft 箭头，icon 可换成其他图标名或自定义渲染函数，传空字符串则隐藏，包里未开启该特性时始终没有返回按钮；点击按钮只触发 back 事件，跳转由使用方决定。',
  Container:
    'direction 留空时按直接子项自动判断：默认插槽里有 Aside 就横向排布，没有就纵向，显式传 horizontal / vertical 可覆盖。嵌套的子容器各自判断，所以经典三段是外层纵向、中间那层含 Aside 自动变横向。tag 只换根元素标签，不影响布局。',
  Row: '一行按 24 栅格等分，列宽取 span/24。gutter 是「行左右各外扩一半 + 列左右各内填一半」这对组合，所以色块之间的空隙正好等于 gutter，而行的外沿仍与容器对齐；数组形式的第二项写成 row-gap，只有换行才看得见。justify 只在列没占满 24 时才有可见差异，align 只在列高不同时才有差异——不设置时列沿交叉轴被拉伸成等高。嵌套行的 span 以所在列为基准，与外层互不影响；tag 只换根元素标签。',
  Col: '预览会自动把剩余栅格补成左右参考列，位移才有参照：span 按 24 等分（span=24 时没有剩余空间，参考列为 0）。push / pull 是列自身的相对位移（position: relative），不改变其他列的位置，所以会压在同排相邻列上；offset 用 margin-left 真实空出整格，占位会挤开后续列，合计超过 24 就换行，属于「栅格偏移」特性。',
  Aside:
    '预览把 Aside 放回「侧栏 + 主体」的横向容器里，才能看出宽度是否生效：数字与纯数字字符串按 px 处理，其他字符串原样输出，28% 这类相对值会跟随容器宽度变化；侧栏不参与伸缩，剩余空间交给 Main。',
  Header:
    '预览把 Header 放在纵向容器的首行，上下各留固定高度，剩余空间由中间的容器占据：数字与纯数字字符串按 px 处理，其他字符串原样输出。',
  Footer:
    '预览把 Footer 放在纵向容器的末行，与 Header 对称：数字与纯数字字符串按 px 处理，其他字符串原样输出，底栏不参与伸缩。',
  Main: '预览把 Main 与固定宽度的 Aside 放在同一横向容器里：Main 始终占满剩余空间，padding 留空时不写内联样式，数字按 px、字符串可用「12px 24px」这类简写。',
  Backtop:
    '预览下方的演示面板即滚动容器：向下滚动超过 visibilityHeight 后，按钮贴在面板右下角内侧并跟随面板位置；right / bottom 以该容器边缘为基准，target 留空时改为监听 window 并按视口定位。',
  Affix: '滚动页面超过固钉位置后，内容会吸附到视口顶部或底部；target 指向滚动容器时按其可视区域计算。',
  Anchor:
    '预览右侧面板即滚动容器：点击链接平滑定位，滚动时按 bound 阈值高亮当前区块，子级链接激活时父级链路一起点亮；type 切换 default / 线条 / 圆点形态，offset 需勾选“滚动偏移”特性。',
  InfiniteScroll:
    '只有在白色列表面板内部滚动才会触底，滚整页不会触发：组件优先取自身滚动尺寸，不滚动时才对最近的可滚动祖先生效。distance=0 需要滚到最底，吸底状态条会实时报出还差多少像素；停止滚动满 delay 后才会检查一次，所以滚动过程中不会连续追加。',
  Tour: 'Tour 根据 TourStep 的 target 高亮目标并定位引导面板，支持上一步/下一步与完成。',
  Watermark: 'Watermark 以覆盖层渲染，可观察文字与角度。',
  Notification: 'Notification 以卡片样式渲染，位置由 position 属性决定。',
  Loading: 'Loading 以遮罩形式渲染在预览区内。',
  Popper: 'Popper 为内部组件，通常由 Tooltip / Popover 组合使用。',
  PopperArrow: 'PopperArrow 为内部组件，需搭配 PopperContent。',
  PopperContent: 'PopperContent 为内部组件，需提供定位上下文。',
  PopperTrigger: 'PopperTrigger 为内部组件，需搭配 Popper。',
  RovingFocusGroup:
    '漫游焦点组只产出两样东西：谁拿 tabindex=0，以及焦点在谁身上——外观、开合、选中态都得宿主自己画。整组在 Tab 序里只占一个停靠点，进组后方向键把「0」和焦点一起挪到邻项：orientation 决定用上下还是左右，dir=rtl 再把左右对调，loop 决定末项再往前是否回绕，Home/End 直接跳首末。focusable=false 的项不写 tabindex，漫游会跳过它；active=true 的项无条件占着 0，所以可能出现两个 0。预览把 tabindex 序列、当前焦点、itemFocus/itemBlur 计数和每个按键是否被接管都读出来，并放一组普通 div 做对照：那边五个都要按 Tab，这边只停一次。',
  RovingFocusItem:
    'focus 项是组内的一格：tabStopId 就是注册表的键（落在 data-roving-focus-item 上，换个 id 顺序表里就换位置），focusable=false 时干脆不写 tabindex（鼠标也点不进来，方向键漫游跳过），active=true 时无条件保留 tabindex=0（用来表达「当前选中项」这类需要常驻停靠点的状态）。它自己不做按键处理，方向键由外层 RovingFocusGroup 统一接管，所以单独一个 item 没有漫游行为。',
  Collection:
    'Collection 没有可见外观，也不接 props：它只维护一张「数据对象 → 子项 DOM」的注册表，把实例上的 getItem(item) 交给上层组件去定位子项，供键盘漫游、焦点管理这类内部逻辑使用（本库暂无组件消费它，所以它是独立导出的基础件）。预览用行尾「定位」按钮把这条链路显式画出来，顶部读数即当前注册项数。',
  CollectionItem:
    'CollectionItem 必须放在 Collection 里：挂载时把自己的 item 对象与自身元素登记进注册表，卸载时删除。注册的 key 是对象引用而不是内容，所以换一个字段全相同的新对象就查不到了，调试台改 item 也会生成新引用；包装节点是 display:contents，自身没有盒子，取尺寸要用它的第一个子元素。',
  OnlyChild: 'OnlyChild 为内部组件，用于约束默认插槽只有一个子节点。',
  FocusTrap:
    'FocusTrap 是一个只处理 Tab 焦点的容器：默认 trapped=false 时它什么都不做（连监听器都不挂），必须在场景或调试台里显式打开 trapped 才会接管按键。接管后它在 window 捕获阶段听 keydown/focusout——Tab 落在首/末控件（或焦点已在容器外）时才 preventDefault，loop=true 才把焦点转到另一端，loop=false 只拦住按键、焦点停在原地；焦点越出边界则触发 focusout 并在下一帧用 focusStartEl（first/last/container 或元素）把它拉回。focusTrapEl 会整块替换边界元素，本库暂无组件引用它。预览把真实焦点位置、当前边界和被拉回次数都读出来：先用「焦点送首位/末位」把光标放到边界上再按「模拟 Tab」，因为合成按键只能复现 FocusTrap 自己接管的那几跳，中间位置那一跳是浏览器默认 Tab 顺序的事。',
  Overlay:
    'Overlay 就是最底下那块遮罩：一个铺满视口、半透明加背景模糊的容器，除了盖住内容和吃掉落在它上面的点击，不干任何业务事。它只有一个 prop：zIndex，直接写成内联 style.z-index（字符串会被转成数字）；CSS 里刻意不配 z-index，这样传与不传的差别才看得见。它没有 visible/modelValue，挂不挂载由上层 v-if 决定，点空白关不关也由上层绑不绑 onClick 决定，内容走默认插槽（容器是 flex 居中）。想只遮局部就用 attrs class 把 position 换成 absolute，配合父级的 position:relative 即可。带滚动锁定、Esc 关闭、teleport 的那套是内部配置 overlayConfig，Dialog/Drawer 等走的是它，与本组件无关；本库暂无组件消费独立导出的 Overlay。预览把遮罩矩形、舞台中心的命中元素、每个按钮实际收到几次点击都读出来，「按坐标点」先走 elementFromPoint 再派发事件，等价于真实鼠标只能点中最靠上的那个元素：层级 1 与层级 3000 两个场景唯一的差别就是那张 z-index=10 的对照卡片能不能被点着。只有工具条被示例抬高在遮罩之上以便随时操作，侧边栏、场景标签这些是真的被盖住。'
}

const PLAYGROUND_STATS = { components: META.components.length, exports: 0, controls: 0, skipped: 0 }

export const PLAYGROUND_ENTRIES: PlaygroundEntry[] = []
export const PLAYGROUND_ENTRY_MAP: Record<string, PlaygroundEntry> = {}
export const PLAYGROUND_GROUPS: PlaygroundGroup[] = []

function splitTopLevel(type: string): string[] {
  const parts: string[] = []
  let current = ''
  let depth = 0
  for (const char of type) {
    if ('<[({'.includes(char)) {
      depth += 1
    } else if ('>])}'.includes(char)) {
      depth -= 1
    }
    if (char === '|' && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += char
  }
  parts.push(current)
  return parts.map((part) => part.trim()).filter(Boolean)
}

function literalOptions(type: string): string[] {
  const parts = splitTopLevel(type)
  if (parts.includes('string') || parts.includes('number') || parts.includes('boolean')) {
    return []
  }
  const options: string[] = []
  const rest: string[] = []
  for (const part of parts) {
    const match = part.match(/^(['"])(.*)\1$/)
    if (match) {
      options.push(match[2])
    } else {
      rest.push(part)
    }
  }
  if (options.length < 2) {
    return []
  }
  const compatible =
    rest.length === 0 ||
    rest.every((part) => part === 'null' || part === 'undefined' || part === 'HTMLElement' || part === 'Component')
  return compatible ? options : []
}

function isColorProp(name: string, type: string): boolean {
  if (!/\bstring\b/.test(type)) {
    return false
  }
  if (/Format$/i.test(name)) {
    return false
  }
  return name === 'color' || name === 'fill' || /Color$/i.test(name)
}

const NAMED_STRING_OPTIONS: Record<string, string[]> = {
  placement: [
    'top',
    'top-start',
    'top-end',
    'bottom',
    'bottom-start',
    'bottom-end',
    'left',
    'left-start',
    'left-end',
    'right',
    'right-start',
    'right-end'
  ],
  effect: ['dark', 'light'],
  trigger: ['hover', 'click', 'focus', 'contextmenu'],
  type: ['primary', 'success', 'warning', 'danger', 'info'],
  tagType: ['primary', 'success', 'warning', 'danger', 'info'],
  tagEffect: ['light', 'dark'],
  underline: ['always', 'hover', 'never'],
  borderStyle: ['solid', 'dashed', 'dotted'],
  contentPosition: ['left', 'center', 'right'],
  direction: ['horizontal', 'vertical'],
  alignment: ['start', 'center', 'end', 'baseline']
}

const CONTROL_KIND_OVERRIDES: Record<string, ControlKind> = {
  'Space.size': 'number'
}

const SELECT_OPTIONS_OVERRIDES: Record<string, string[]> = {
  'RadioGroup.type': ['radio', 'button'],
  'DatePickerPanel.type': ['date', 'month', 'year']
}

function selectOptions(entryName: string, prop: MetaProp): string[] {
  const override = SELECT_OPTIONS_OVERRIDES[`${entryName}.${prop.name}`]
  if (override) {
    return override
  }
  const literals = literalOptions(prop.type)
  if (literals.length) {
    return literals
  }
  if (!/\bstring\b/.test(prop.type) || /\bnumber\b/.test(prop.type)) {
    return []
  }
  return NAMED_STRING_OPTIONS[prop.name] ?? []
}

export function deriveControl(prop: MetaProp, entryName: string): ControlKind | null {
  const type = prop.type.trim()
  if (HIDDEN_PROP_NAMES.has(prop.name) || !type) {
    return null
  }
  if (type === 'boolean') {
    return 'switch'
  }
  if (/=>/.test(type) || /\bFunction\b/.test(type)) {
    return /^string\s*\|/.test(type) ? 'text' : null
  }
  if (/\bRegExp\b/.test(type) || type === 'null') {
    return null
  }
  if (type === 'Component' || type === 'HTMLElement') {
    return null
  }
  if (selectOptions(entryName, prop).length) {
    return 'select'
  }
  if (type === 'number' || type === 'number | null' || type === 'null | number') {
    return 'number'
  }
  if (prop.name === 'modelValue' && /\[\]/.test(type)) {
    return 'json'
  }
  if (prop.name === 'appendTo' && /\bstring\b/.test(type)) {
    return 'text'
  }
  if (/\bRecord</.test(type)) {
    return 'json'
  }
  if (/\[]|Record<|\bobject\b/.test(type) && !/\bstring\b/.test(type)) {
    return 'json'
  }
  if (/\bstring\b/.test(type)) {
    return isColorProp(prop.name, type) ? 'color' : 'text'
  }
  if (/\bnumber\b/.test(type)) {
    return 'number'
  }
  if (/\bany\b/.test(type)) {
    return 'json'
  }
  return null
}

export function parseDefaultValue(raw: unknown): unknown {
  if (typeof raw !== 'string') {
    return raw
  }
  const text = raw.trim()
  if (!text || text === 'undefined') {
    return undefined
  }
  if ((text.startsWith("'") && text.endsWith("'")) || (text.startsWith('"') && text.endsWith('"'))) {
    return text.slice(1, -1)
  }
  if (text === 'true') {
    return true
  }
  if (text === 'false') {
    return false
  }
  if (text === 'null') {
    return null
  }
  if (/^-?\d+(\.\d+)?$/.test(text)) {
    return Number(text)
  }
  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      return JSON.parse(text)
    } catch {
      return undefined
    }
  }
  return raw
}

function cloneValue(value: unknown): unknown {
  if (value === undefined) {
    return undefined
  }
  try {
    return structuredClone(value)
  } catch {
    return value
  }
}

function jsonSeed(type: string): unknown {
  if (/\[\]/.test(type)) {
    return []
  }
  if (/Record</.test(type)) {
    return {}
  }
  return null
}

function globalSampleFor(kind: ControlKind, name: string, type: string): unknown {
  const value = SAMPLE_BY_NAME[name]
  if (value === undefined) {
    return undefined
  }
  if (kind === 'json' && (value === null || typeof value !== 'object')) {
    if (typeof value === 'string' && /^\s*string\b/.test(type)) {
      return value
    }
    return undefined
  }
  if (kind === 'number' && typeof value !== 'number') {
    return undefined
  }
  return value
}

function initialValueFor(entryName: string, control: PlaygroundControl): unknown {
  if (control.kind === 'switch') {
    const override = BOOLEAN_INITIALS[`${entryName}.${control.name}`]
    if (typeof override === 'boolean') {
      return override
    }
    return typeof control.defaultValue === 'boolean' ? control.defaultValue : false
  }
  const specific = SAMPLE_PROP_VALUES[`${entryName}.${control.name}`]
  let value = specific ?? globalSampleFor(control.kind, control.name, control.type) ?? control.defaultValue
  if (value === undefined || value === null) {
    if (control.kind === 'json') {
      value = jsonSeed(control.type)
    } else if (control.kind === 'number') {
      value = undefined
    } else {
      value = ''
    }
  }
  if (control.kind === 'select' && !control.options.includes(String(value))) {
    value = value === undefined || value === null || value === '' ? '' : (control.options[0] ?? '')
  }
  if ((control.kind === 'text' || control.kind === 'color') && typeof value === 'number') {
    value = String(value)
  }
  return cloneValue(value)
}

export function formatControlText(value: unknown, kind: ControlKind): string {
  if (kind === 'json') {
    return value === undefined ? '' : JSON.stringify(value, null, 2)
  }
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

function buildControl(
  entryName: string,
  prop: MetaProp,
  featureId: string,
  featureTitle: string,
  kind: ControlKind
): PlaygroundControl {
  const parsedDefault = parseDefaultValue(prop.default)
  const defaultValue = kind === 'text' && typeof parsedDefault === 'object' ? undefined : parsedDefault
  const control: PlaygroundControl = {
    name: prop.name,
    type: prop.type,
    description: prop.description ?? '',
    kind,
    options: kind === 'select' ? selectOptions(entryName, prop) : [],
    defaultValue,
    offValue: prop.offValue,
    featureId,
    featureTitle,
    initialEnabled: (INITIAL_ENABLED[entryName] ?? []).includes(prop.name),
    sampleValue: undefined
  }
  control.sampleValue = initialValueFor(entryName, control)
  return control
}

function buildEntry(component: MetaComponent, metaExport: MetaExport): PlaygroundEntry {
  const controls: PlaygroundControl[] = []
  const groups: PlaygroundControlGroup[] = []
  const skipped: MetaProp[] = []
  const seen = new Set<string>()

  const coreControls: PlaygroundControl[] = []
  for (const prop of metaExport.coreProps) {
    if (seen.has(prop.name)) {
      continue
    }
    seen.add(prop.name)
    const kind = CONTROL_KIND_OVERRIDES[`${metaExport.name}.${prop.name}`] ?? deriveControl(prop, metaExport.name)
    if (!kind) {
      skipped.push(prop)
      continue
    }
    coreControls.push(buildControl(metaExport.name, prop, 'core', '核心属性', kind))
  }
  if (coreControls.length) {
    groups.push({
      id: 'core',
      title: '核心属性',
      description: 'createXxx() 的核心 props',
      controls: coreControls
    })
    controls.push(...coreControls)
  }

  for (const feature of metaExport.features) {
    const featureControls: PlaygroundControl[] = []
    for (const prop of feature.props) {
      if (seen.has(prop.name)) {
        continue
      }
      seen.add(prop.name)
      const kind = CONTROL_KIND_OVERRIDES[`${metaExport.name}.${prop.name}`] ?? deriveControl(prop, metaExport.name)
      if (!kind) {
        skipped.push(prop)
        continue
      }
      featureControls.push(buildControl(metaExport.name, prop, feature.id, feature.title, kind))
    }
    if (featureControls.length) {
      groups.push({
        id: feature.id,
        title: feature.title,
        description: feature.description || feature.id,
        controls: featureControls
      })
      controls.push(...featureControls)
    }
  }

  const allProps =
    metaExport.coreProps.length +
    metaExport.features.reduce((total, feature) => {
      return total + feature.props.length
    }, 0)
  const previewEvents = PREVIEW_EVENT_PROPS.filter((name) => {
    return controls.some((control) => control.name === name)
  })

  return {
    name: metaExport.name,
    componentId: component.id,
    componentTitle: component.title,
    componentDescription: component.description,
    controls,
    groups,
    skipped,
    previewEvents,
    allProps,
    note: PREVIEW_NOTES[metaExport.name] ?? CHILD_EXPORT_NOTES[metaExport.name] ?? ''
  }
}

for (const component of META.components) {
  const group: PlaygroundGroup = {
    id: component.id,
    title: component.title,
    description: component.description,
    exports: []
  }
  for (const metaExport of component.exports) {
    const entry = buildEntry(component, metaExport)
    PLAYGROUND_ENTRIES.push(entry)
    PLAYGROUND_ENTRY_MAP[entry.name] = entry
    group.exports.push(entry)
    PLAYGROUND_STATS.controls += entry.controls.length
    PLAYGROUND_STATS.skipped += entry.skipped.length
  }
  PLAYGROUND_GROUPS.push(group)
}

PLAYGROUND_STATS.exports = PLAYGROUND_ENTRIES.length

export { PLAYGROUND_STATS }

export function createExportState(entry: PlaygroundEntry): ExportState {
  const controls: Record<string, ControlState> = {}
  for (const control of entry.controls) {
    const initialValue = cloneValue(control.sampleValue)
    const initialText = formatControlText(initialValue, control.kind)
    const initialEnabled = control.kind === 'switch' ? true : control.initialEnabled
    controls[control.name] = {
      enabled: initialEnabled,
      value: initialValue,
      text: initialText,
      valid: true,
      initialEnabled,
      initialValue,
      initialText
    }
  }
  return { controls }
}

export function createInitialStates(): Record<string, ExportState> {
  const states: Record<string, ExportState> = {}
  for (const entry of PLAYGROUND_ENTRIES) {
    states[entry.name] = createExportState(entry)
  }
  return states
}

export function isControlDirty(control: PlaygroundControl, state: ControlState): boolean {
  if (control.kind === 'switch') {
    return Boolean(state.value) !== Boolean(state.initialValue)
  }
  if (state.enabled !== state.initialEnabled) {
    return true
  }
  return state.text !== state.initialText
}

export function countDirty(entry: PlaygroundEntry, state: ExportState): number {
  let total = 0
  for (const control of entry.controls) {
    const controlState = state.controls[control.name]
    if (controlState && isControlDirty(control, controlState)) {
      total += 1
    }
  }
  return total
}

export function resetExportState(entry: PlaygroundEntry, state: ExportState): void {
  for (const control of entry.controls) {
    const controlState = state.controls[control.name]
    if (!controlState) {
      continue
    }
    controlState.enabled = controlState.initialEnabled
    controlState.value = cloneValue(controlState.initialValue)
    controlState.text = controlState.initialText
    controlState.valid = true
  }
}

function shouldPassSwitch(control: PlaygroundControl, value: unknown): boolean {
  if (control.defaultValue === undefined) {
    return Boolean(value)
  }
  return Boolean(value) !== Boolean(control.defaultValue)
}

export function buildBaseValues(entry: PlaygroundEntry, enabledFeatureGroups: Set<string>): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const control of entry.controls) {
    if (!enabledFeatureGroups.has(control.featureId)) {
      continue
    }
    if (control.kind === 'switch') {
      if (shouldPassSwitch(control, control.sampleValue)) {
        values[control.name] = Boolean(control.sampleValue)
      }
      continue
    }
    if (control.sampleValue === undefined || control.sampleValue === '' || control.sampleValue === null) {
      continue
    }
    values[control.name] = cloneValue(control.sampleValue)
  }
  return values
}

export function buildPreviewValues(entry: PlaygroundEntry, state: ExportState): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const control of entry.controls) {
    const controlState = state.controls[control.name]
    if (!controlState) {
      continue
    }
    if (control.kind === 'switch') {
      if (shouldPassSwitch(control, controlState.value)) {
        values[control.name] = Boolean(controlState.value)
      }
      continue
    }
    if (!controlState.enabled || controlState.value === undefined) {
      continue
    }
    if (control.kind === 'json' && !controlState.valid) {
      continue
    }
    values[control.name] = controlState.value
  }
  return values
}
