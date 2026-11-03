import { CASCADER_OPTIONS } from './cascader-data'
import { SAMPLE_AVATAR_A, SAMPLE_AVATAR_B, SAMPLE_AVATAR_WIDE, SAMPLE_IMAGE_SRC, SAMPLE_PHOTOS } from './sample-image'
import type { ScenePreset } from './presets'

const IMAGE = SAMPLE_IMAGE_SRC
const PHOTOS = SAMPLE_PHOTOS.map((photo) => photo.src)
const CASCADER = CASCADER_OPTIONS

const TABLE_ROWS = [
  { id: 1, name: 'Button', city: '上海', status: '稳定' },
  { id: 2, name: 'Input', city: '杭州', status: '内测' },
  { id: 3, name: 'Table', city: '成都', status: '规划' },
  { id: 4, name: 'Tree', city: '深圳', status: '稳定' },
  { id: 5, name: 'Dialog', city: '北京', status: '内测' },
  { id: 6, name: 'Select', city: '广州', status: '规划' },
  { id: 7, name: 'Form', city: '南京', status: '稳定' },
  { id: 8, name: 'Tabs', city: '武汉', status: '内测' }
]

const TREE_DATA = [
  {
    id: 'forms',
    label: '表单组件',
    children: [
      { id: 'button', label: 'Button' },
      { id: 'input', label: 'Input' },
      { id: 'select', label: 'Select' }
    ]
  },
  {
    id: 'data',
    label: '数据组件',
    children: [
      { id: 'table', label: 'Table' },
      { id: 'tree', label: 'Tree' },
      {
        id: 'tree-v2',
        label: 'TreeV2',
        children: [{ id: 'tree-v2-basic', label: '基础树' }]
      }
    ]
  }
]

const TRANSFER_DATA = [
  { key: 'a', label: '选项 A' },
  { key: 'b', label: '选项 B' },
  { key: 'c', label: '选项 C' },
  { key: 'd', label: '选项 D' },
  { key: 'e', label: '选项 E' }
]

const SEGMENTED_OPTIONS = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '年', value: 'year' }
]

const CHECKBOX_OPTIONS = [
  { label: '选项一', value: 'a' },
  { label: '选项二', value: 'b' },
  { label: '选项三', value: 'c', disabled: true }
]

function formatFileSize(value: unknown): string {
  return `${(Number(value) / 1024).toFixed(1)} KB`
}

const VIRTUAL_DATA = Array.from({ length: 60 }, (_value, index) => `列表项 ${index + 1}`)

const TABLE_V2_COLUMNS = [
  { key: 'name', dataKey: 'name', title: '名称', width: 160 },
  { key: 'city', dataKey: 'city', title: '城市', width: 110 },
  { key: 'status', dataKey: 'status', title: '状态' }
]

const DISPLAY_PRESETS: Record<string, ScenePreset[]> = {
  Affix: [
    { id: 'base', label: '基础', values: {} },
    { id: 'offset', label: '吸附偏移 40', hint: '吸附点距容器顶部 40px', values: { offset: 40 } },
    { id: 'z-index', label: '层级 1000', hint: '固定后以 zIndex 覆盖页面其他内容', values: { zIndex: 1000 } },
    { id: 'position', label: '吸附底部', values: { position: 'bottom' } },
    {
      id: 'target',
      label: '目标容器',
      hint: 'target 指向预览内的滚动容器，超出容器范围即解除吸附',
      values: { target: '#pg-affix-scroller' }
    },
    { id: 'z-index-string', label: '字符串层级', values: { zIndex: '2000' } }
  ],
  Anchor: [
    { id: 'base', label: '基础', values: {} },
    { id: 'bound', label: '高亮偏移 24', values: { bound: 24 } },
    { id: 'line', label: '线条指示', values: { type: 'line' } },
    { id: 'dot', label: '圆点指示', values: { type: 'dot' } },
    { id: 'offset', label: '滚动偏移 60', requires: 'anchor.popper', values: { offset: 60 } }
  ],
  AnchorLink: [
    { id: 'base', label: '基础', values: { href: '#pg-sec-props', title: '属性调试' } },
    {
      id: 'underline',
      label: '隐藏下划线',
      values: { href: '#pg-sec-props', title: '属性调试', underline: false }
    },
    { id: 'blank', label: '新窗口打开', values: { href: '#pg-sec-build', title: '构建产物', target: '_blank' } },
    { id: 'long', label: '较长标题', values: { href: '#pg-sec-overview', title: '特性按需构建与产物验证' } },
    {
      id: 'external',
      label: '外部链接',
      hint: 'href 指向外部地址时不拦截默认跳转',
      values: { href: 'https://vuejs.org', title: 'Vue 文档' }
    }
  ],
  Backtop: [
    {
      id: 'base',
      label: '基础',
      hint: '滚动面板超过 80px 后按钮出现在面板右下角内侧',
      values: { target: '#pg-backtop-scroller', visibilityHeight: 80, right: 16, bottom: 16 }
    },
    {
      id: 'offset',
      label: '右下偏移',
      hint: 'right / bottom 以面板边缘为基准，位置随面板而不是视口',
      values: { target: '#pg-backtop-scroller', visibilityHeight: 80, right: 48, bottom: 104 }
    },
    {
      id: 'always',
      label: '始终显示',
      hint: 'visibilityHeight 为 0 时未滚动也显示按钮',
      values: { target: '#pg-backtop-scroller', visibilityHeight: 0, right: 16, bottom: 16 }
    },
    {
      id: 'target',
      label: '高阈值容器',
      hint: '阈值 200px：需把面板滚到底才出现',
      values: { target: '#pg-backtop-scroller', visibilityHeight: 200, right: 16, bottom: 16 }
    }
  ],
  Badge: [
    {
      id: 'show-zero',
      label: '显示 0',
      hint: 'showZero 打开后数值为 0 也展示徽标',
      values: { value: 0, showZero: true }
    },
    { id: 'info', label: '信息类型', values: { value: 5, type: 'info' } },
    { id: 'color', label: '自定义颜色', values: { value: 8, color: '#0f766e' } },
    {
      id: 'offset',
      label: '平移徽标',
      requires: 'badge.popper',
      hint: 'offset=[x, y]，徽标相对右上角向右、向下平移',
      values: { value: 5, offset: [8, 6] }
    }
  ],
  Breadcrumb: [
    { id: 'base', label: '基础', values: {} },
    { id: 'dash', label: '短横线分隔', values: { separator: '-' } },
    { id: 'dot', label: '圆点分隔', values: { separator: '·' } },
    { id: 'icon', label: '图标分隔', values: { separatorIcon: 'arrowRight' } },
    { id: 'double', label: '双箭头', values: { separatorIcon: 'arrowLeft' } }
  ],
  BreadcrumbItem: [
    { id: 'base', label: '基础', values: {} },
    { id: 'to', label: '跳转地址', values: { to: '#packages' } },
    { id: 'replace', label: '替换历史', values: { to: '#playground', replace: true } },
    { id: 'external', label: '外链', values: { to: 'https://vuejs.org' } },
    { id: 'current', label: '当前页', hint: '不传 to 时渲染为纯文本', values: {} }
  ],
  ButtonGroup: [
    { id: 'base', label: '基础', values: {} },
    { id: 'large', label: '大尺寸', values: { size: 'large' } },
    { id: 'small', label: '小尺寸', values: { size: 'small' } },
    { id: 'primary', label: '主要类型', values: { type: 'primary' } },
    { id: 'rtl', label: '反向排列', values: { dir: 'rtl' } }
  ],
  Carousel: [
    { id: 'base', label: '基础', values: {} },
    { id: 'card', label: '卡片模式', values: { type: 'card' } },
    { id: 'vertical', label: '纵向切换', values: { direction: 'vertical' } },
    { id: 'arrow-always', label: '箭头常显', values: { arrow: 'always' } },
    { id: 'indicator-outside', label: '指示器外置', values: { indicatorPosition: 'outside' } },
    { id: 'no-autoplay', label: '关闭自动播放', values: { autoplay: false } }
  ],
  CarouselItem: [
    { id: 'base', label: '基础', values: {} },
    { id: 'name', label: '命名项', values: { name: 'slide-1' } },
    { id: 'label', label: '指示器文案', values: { label: '第一张' } },
    { id: 'number', label: '数字标签', values: { label: 1 } },
    { id: 'both', label: '名称 + 标签', values: { name: 'intro', label: '介绍' } }
  ],
  Avatar: [
    {
      id: 'text',
      label: '文字头像',
      hint: 'src 置空后回退到默认插槽里的文字',
      values: { size: 48, src: '' }
    },
    {
      id: 'fit-contain',
      label: 'fit contain',
      hint: '横向照片完整放进圆形头像，上下留白',
      values: { size: 64, src: SAMPLE_AVATAR_WIDE, fit: 'contain' }
    },
    {
      id: 'fit-cover',
      label: 'fit cover',
      hint: '同一张照片按 cover 裁切两侧，铺满头像',
      values: { size: 64, src: SAMPLE_AVATAR_WIDE, fit: 'cover' }
    },
    {
      id: 'srcset',
      label: '响应式图片',
      hint: 'src 与 srcSet 指向两张不同照片，浏览器按设备像素比取图，可据此确认 srcSet 被真正消费',
      values: { size: 56, src: SAMPLE_AVATAR_A, srcSet: `${SAMPLE_AVATAR_B} 2x` }
    }
  ],
  AvatarGroup: [
    { id: 'large', label: '大尺寸', values: { size: 'large', collapseAvatars: true, maxCollapseAvatars: 2 } },
    {
      id: 'dark',
      label: '深色浮层',
      hint: '折叠头像的悬浮面板切换为深色',
      values: { effect: 'dark', collapseAvatars: true, maxCollapseAvatars: 2 }
    },
    { id: 'single', label: '只显示 1 个', values: { collapseAvatars: true, maxCollapseAvatars: 1 } },
    { id: 'square', label: '方形组', hint: 'shape 会作用到组内每一个头像', values: { shape: 'square' } }
  ],
  Card: [
    { id: 'footer', label: '带页脚', values: { footer: '卡片底部操作区' } },
    { id: 'body-style', label: '自定义内边距', values: { bodyStyle: { padding: '24px', background: '#f8fafc' } } },
    { id: 'full', label: '完整结构', values: { header: '构建详情', footer: '更新于 2026-10-26' } }
  ],
  CheckTag: [
    { id: 'controlled', label: '选中', values: { checked: true } },
    { id: 'success', label: '成功类型', values: { type: 'success', checked: true } },
    { id: 'disabled', label: '禁用', values: { disabled: true } },
    { id: 'disabled-checked', label: '禁用选中', values: { disabled: true, checked: true, type: 'warning' } }
  ],
  Collapse: [
    { id: 'base', label: '基础', values: {} },
    { id: 'accordion', label: '手风琴', hint: '手风琴模式同时只展开一个面板', values: { accordion: true } },
    { id: 'icon-left', label: '图标左置', values: { expandIconPosition: 'left' } },
    { id: 'both-open', label: '展开两项', values: { modelValue: ['a', 'b'] } },
    { id: 'second', label: '展开第二项', values: { modelValue: ['b'] } }
  ],
  CollapseItem: [
    { id: 'base', label: '基础', values: { title: '面板一', name: 'a' } },
    { id: 'disabled', label: '禁用', values: { title: '面板一', name: 'a', disabled: true } },
    { id: 'title', label: '自定义标题', values: { title: '高级设置', name: 'advanced' } },
    {
      id: 'icon',
      label: '自定义图标',
      requires: 'collapse.collapse-item-icons',
      values: { title: '面板一', name: 'a', icon: 'star' }
    },
    { id: 'named', label: '指定 name', values: { title: '面板一', name: 'panel-one' } }
  ],
  CollapseTransition: [
    { id: 'base', label: '基础', values: {} },
    { id: 'name', label: '过渡名称', values: { name: 'fade' } }
  ],
  Container: [
    {
      id: 'base',
      label: '基础',
      hint: '顶栏 + 中间容器 + 底栏：外层没有 Aside 自动纵向，中间那层含 Aside 自动横向',
      values: {}
    },
    {
      id: 'aside',
      label: '侧栏 + 主体',
      hint: '只有 Aside 与 Main，自动判定为横向，侧栏固定宽度、主体占满剩余',
      values: {}
    },
    {
      id: 'grail',
      label: '双侧栏圣杯',
      hint: '左右两个 Aside 使外层横向，中间嵌套容器不含 Aside 自动转为纵向',
      values: {}
    },
    {
      id: 'force-horizontal',
      label: '强制横向',
      hint: '三块本应纵向，direction 优先于自动判断改为并排，顶栏与底栏仍按自身高度停在上方',
      values: { direction: 'horizontal' }
    },
    {
      id: 'force-vertical',
      label: '强制纵向',
      hint: '含 Aside 本应横向，direction 同样优先：侧栏变成整行，宽度不再用于分栏',
      values: { direction: 'vertical' }
    },
    {
      id: 'tag-nav',
      label: '语义标签',
      hint: '根元素换成 nav 标签，只影响语义，不改变任何布局',
      values: { tag: 'nav' }
    }
  ],
  Header: [
    { id: 'base', label: '基础', hint: '默认高度 60，其余空间全部交给下方的主体区', values: {} },
    { id: 'number', label: '高度 88', hint: '数字按 px 处理，行内写入 height: 88px', values: { height: 88 } },
    { id: 'string', label: '高度 4.5rem', hint: '字符串原样输出，可跟随根字号缩放', values: { height: '4.5rem' } },
    {
      id: 'compact',
      label: '薄顶栏 40px',
      hint: '顶栏不参与伸缩，压缩后多出的高度仍归主体',
      values: { height: '40px' }
    },
    {
      id: 'tall',
      label: '高顶栏 120',
      hint: '纵向容器里只有主体会伸缩，顶栏始终按设定值占位',
      values: { height: 120 }
    }
  ],
  Aside: [
    { id: 'base', label: '基础', hint: '默认宽度 300，父容器因含 Aside 自动横向排布', values: {} },
    { id: 'number', label: '宽度 200', hint: '数字按 px 处理，行内写入 width: 200px', values: { width: 200 } },
    {
      id: 'percent',
      label: '宽度 28%',
      hint: '字符串原样输出，相对值会跟随预览容器宽度变化',
      values: { width: '28%' }
    },
    {
      id: 'narrow',
      label: '宽度 120px',
      hint: '侧栏固定不伸缩，缩窄后多出的宽度全部让给主体',
      values: { width: '120px' }
    },
    { id: 'wide', label: '宽度 360', hint: '侧栏变宽后主体等量缩小，两者仍填满整行', values: { width: 360 } }
  ],
  Main: [
    { id: 'base', label: '基础', hint: '留空时不写内联 padding，主体只负责占满剩余空间', values: {} },
    { id: 'number', label: '内边距 24', hint: '数字按 px 处理，行内写入 padding: 24px', values: { padding: 24 } },
    {
      id: 'string',
      label: '内边距 32px',
      hint: '字符串原样输出，与数字效果一致但可带任意单位',
      values: { padding: '32px' }
    },
    {
      id: 'shorthand',
      label: '上下 12px 左右 24px',
      hint: '字符串支持 CSS 简写，可同时给出纵横不同的内边距',
      values: { padding: '12px 24px' }
    },
    { id: 'zero', label: '无内边距', hint: '0 也会写成内联 padding: 0px，内容与边框贴合', values: { padding: 0 } }
  ],
  Footer: [
    { id: 'base', label: '基础', hint: '默认高度 60，与顶栏对称固定在容器末行', values: {} },
    { id: 'number', label: '高度 64', hint: '数字按 px 处理，行内写入 height: 64px', values: { height: 64 } },
    { id: 'string', label: '高度 48px', hint: '字符串原样输出，可换 rem、vh 等单位', values: { height: '48px' } },
    {
      id: 'tall',
      label: '高底栏 80px',
      hint: '底栏增高只挤压上方的主体，自身不参与伸缩',
      values: { height: '80px' }
    },
    { id: 'thin', label: '薄底栏 40', hint: '底栏收薄后主体向下扩展，容器整体高度保持不变', values: { height: 40 } }
  ],
  Descriptions: [
    { id: 'column', label: '两列布局', values: { column: 2 } },
    { id: 'title-extra', label: '标题与操作', values: { title: '订单信息', extra: '2026-10-26' } },
    { id: 'small', label: '小尺寸', values: { size: 'small' } },
    { id: 'large', label: '大尺寸', values: { size: 'large' } }
  ],
  DescriptionsItem: [
    { id: 'base', label: '基础', values: { label: '姓名' } },
    { id: 'span', label: '跨两列', values: { label: '收货地址', span: 2 } },
    { id: 'align', label: '内容居中', values: { label: '姓名', align: 'center' } },
    { id: 'label-align', label: '标签右对齐', values: { label: '姓名', labelAlign: 'right' } },
    { id: 'width', label: '固定宽度', values: { label: '姓名', width: '160px' } }
  ],
  Empty: [
    { id: 'small', label: '小尺寸图', values: { imageSize: 72, description: '暂无数据' } },
    { id: 'long', label: '长描述', values: { description: '暂无数据，可切换筛选条件后重试' } },
    { id: 'image', label: '自定义图片', values: { image: IMAGE, description: '暂无数据' } }
  ],
  Icon: [{ id: 'stroke', label: '细描边', values: { name: 'star', size: 28, color: '#e11d48', strokeWidth: 1 } }],
  Image: [
    { id: 'base', label: '基础', values: { src: IMAGE } },
    { id: 'contain', label: '完整适应', values: { src: IMAGE, fit: 'contain' } },
    { id: 'fill', label: '拉伸填充', values: { src: IMAGE, fit: 'fill' } },
    {
      id: 'preview-single',
      label: '单图预览',
      requires: 'image.preview',
      hint: '点击图片打开预览层，滚轮缩放，Esc 或关闭按钮退出',
      values: { src: IMAGE, zIndex: 2100 }
    },
    {
      id: 'preview-multi',
      label: '多图预览',
      requires: 'image.preview',
      hint: '内置 4 张在线实景图，左右箭头切换并显示页码，点击遮罩关闭',
      values: {
        src: PHOTOS[0],
        previewSrcList: PHOTOS,
        initialIndex: 1,
        showProgress: true,
        hideOnClickModal: true
      }
    }
  ],
  ImageViewer: [
    {
      id: 'escape-off',
      label: '禁用 Esc 关闭',
      requires: 'image-viewer.modal',
      hint: 'closeOnPressEscape=false，按 Esc 不会关闭预览层，需点击遮罩',
      values: { closeOnPressEscape: false }
    },
    {
      id: 'teleported',
      label: '传送到 body',
      requires: 'image-viewer.popper',
      hint: 'teleported=true，预览层挂载到 body 而非组件原位',
      values: { teleported: true }
    },
    { id: 'z-index', label: '提高层级', hint: 'zIndex=3200，预览层压过页面上其他浮层', values: { zIndex: 3200 } }
  ],
  PageHeader: [
    {
      id: 'base',
      label: '基础',
      hint: '只有标题一行，右侧操作区来自 extra 插槽；左侧返回按钮由「图标」特性的默认值 arrowLeft 渲染',
      values: { title: '构建详情', content: '' }
    },
    {
      id: 'content',
      label: '带描述',
      hint: 'content 作为标题下方的小字说明，与标题共用左侧留白',
      values: { title: '构建详情', content: '查看并管理当前构建任务' }
    },
    {
      id: 'icon',
      label: '自定义图标',
      requires: 'page-header.icons',
      hint: 'icon 换成 chevronLeft 覆盖默认的 arrowLeft，点击仍触发 back 事件',
      values: { title: '构建详情', content: '返回按钮换成自定义图标', icon: 'chevronLeft' }
    },
    {
      id: 'no-back',
      label: '无返回按钮',
      requires: 'page-header.icons',
      hint: 'icon 传空字符串即可隐藏返回按钮，标题顶到最左；未开启「图标」特性的包里本来就没有返回按钮',
      values: { title: '构建详情', content: '不需要返回入口的页面', icon: '' }
    },
    {
      id: 'long',
      label: '长标题',
      hint: '标题超长时自动换行，右侧操作区保持在同一行不被挤掉',
      values: {
        title: '特性按需构建与产物验证控制台，支持按组件与特性粒度定制打包产物',
        content: ''
      }
    },
    {
      id: 'no-title',
      label: '仅描述',
      hint: 'title 显式置空后不再渲染标题行，只剩一行描述文字',
      values: { title: '', content: '仅有描述内容的页头' }
    }
  ],
  Result: [
    {
      id: 'success',
      label: '成功图标',
      requires: 'result.icons',
      values: { icon: 'success', title: '构建成功', subTitle: '产物已写入 dist 目录。' }
    },
    {
      id: 'warning',
      label: '警告图标',
      requires: 'result.icons',
      values: { icon: 'warning', title: '存在警告', subTitle: '构建完成，但有 3 条警告。' }
    },
    {
      id: 'error',
      label: '错误图标',
      requires: 'result.icons',
      values: { icon: 'error', title: '构建失败', subTitle: '请检查控制台错误日志。' }
    },
    {
      id: 'long-sub',
      label: '长副标题',
      values: {
        title: '操作成功',
        subTitle: '相关结果已生成，可以继续下一步；如果暂时不需要，也可以稍后从历史记录中恢复。'
      }
    }
  ],
  Skeleton: [
    { id: 'base', label: '基础', values: {} },
    { id: 'animated', label: '动画', values: { animated: true } },
    { id: 'rows', label: '两行', values: { rows: 2 } },
    { id: 'count', label: '重复三组', values: { count: 3 } },
    {
      id: 'throttle',
      label: '延迟渲染 600ms',
      hint: '切换到此场景后，五行骨架在 600ms 后才渲染',
      values: { rows: 5, animated: true, throttle: 600 }
    },
    { id: 'long', label: '五行骨架', values: { rows: 5, animated: true } }
  ],
  SkeletonItem: [
    { id: 'text', label: '文本', values: { variant: 'text' } },
    { id: 'image', label: '图片', values: { variant: 'image' } },
    { id: 'circle', label: '圆形', values: { variant: 'circle' } },
    { id: 'rect', label: '矩形', values: { variant: 'rect' } },
    { id: 'button', label: '按钮', values: { variant: 'button' } }
  ],
  Statistic: [
    { id: 'precision', label: '保留两位', values: { title: '平均耗时', value: 12.3456, precision: 2, suffix: 's' } },
    { id: 'group', label: '千分位', values: { title: '累计访问', value: 1234567, groupSeparator: ',' } },
    { id: 'percent', label: '百分比', values: { title: '转化率', value: 92.5, precision: 1, suffix: '%' } },
    {
      id: 'formatter',
      label: '自定义格式化',
      requires: 'statistic.format',
      hint: 'formatter 接收 value，返回展示文本',
      values: { title: '文件大小', value: 1536, formatter: formatFileSize }
    }
  ],
  Tag: [
    { id: 'dark', label: '深色主题', values: { type: 'success', effect: 'dark' } },
    { id: 'large', label: '大尺寸', values: { size: 'large' } }
  ],
  Timeline: [
    { id: 'base', label: '基础', values: {} },
    { id: 'center', label: '居中排布', hint: '节点居中、内容居中，连线走中线', values: { mode: 'center' } },
    { id: 'alternate', label: '交替排列', hint: '内容在连线两侧交替出现', values: { mode: 'alternate' } },
    { id: 'reverse', label: '反向顺序', values: { reverse: true } },
    { id: 'alternate-reverse', label: '交替 + 反向', values: { mode: 'alternate', reverse: true } }
  ],
  TimelineItem: [
    { id: 'base', label: '基础', values: { timestamp: '2026-10-26' } },
    { id: 'success', label: '成功节点', values: { timestamp: '2026-10-26', type: 'success' } },
    { id: 'large', label: '大尺寸', values: { timestamp: '2026-10-26', size: 'large' } },
    { id: 'no-time', label: '无时间戳', values: { hideTimestamp: true } },
    { id: 'time-top', label: '时间戳在上方', values: { timestamp: '2026-10-26', timestampPosition: 'top' } },
    { id: 'hollow', label: '空心节点', values: { timestamp: '2026-10-26', hollow: true } }
  ],
  Watermark: [
    { id: 'base', label: '基础', values: {} },
    { id: 'rotate', label: '倾斜角度', values: { rotate: -20 } },
    { id: 'font', label: '大字号', values: { font: { fontSize: 18 } } },
    { id: 'gap', label: '自定义间距', values: { gap: [120, 80] } },
    {
      id: 'offset',
      label: '水印平移',
      requires: 'watermark.popper',
      hint: 'offset=[x, y]，水印图案整体向右下平移',
      values: { offset: [24, 16] }
    },
    { id: 'lines', label: '多行内容', values: { content: ['内部资料', '禁止外传'] } },
    { id: 'image', label: '图片水印', values: { image: PHOTOS[0] } }
  ]
}

const FORM_PRESETS: Record<string, ScenePreset[]> = {
  Checkbox: [
    { id: 'base', label: '基础', values: {} },
    { id: 'checked', label: '选中', values: { modelValue: true } },
    { id: 'disabled', label: '禁用', values: { disabled: true } },
    { id: 'large', label: '大尺寸选中', values: { size: 'large', modelValue: true } },
    {
      id: 'indeterminate',
      label: '半选',
      hint: 'indeterminate 只控制横杠状态，不影响选中值',
      values: { indeterminate: true }
    },
    { id: 'label', label: '自定义标签', values: { label: '同意用户协议', modelValue: true } },
    {
      id: 'true-value',
      label: '自定义选中值',
      hint: 'modelValue 为 yes 时选中，取消后回到 no',
      values: { value: 'sub', label: '订阅更新', trueValue: 'yes', falseValue: 'no', modelValue: 'yes' }
    },
    {
      id: 'checked-fallback',
      label: 'checked 初始态',
      hint: '未传 modelValue 时以 checked 作为初始状态',
      values: { label: 'checked 驱动', checked: true }
    },
    {
      id: 'border',
      label: '带边框',
      requires: 'checkbox.appearance',
      values: { label: '带边框选项', border: true, modelValue: true }
    }
  ],
  CheckboxButton: [
    { id: 'base', label: '基础', values: {} },
    { id: 'checked', label: '选中', values: { modelValue: true } },
    { id: 'disabled', label: '禁用', values: { disabled: true } },
    { id: 'small', label: '小尺寸', values: { size: 'small' } },
    { id: 'label', label: '自定义标签', values: { label: '按月付费' } }
  ],
  CheckboxGroup: [
    { id: 'base', label: '基础', values: { modelValue: ['a'], options: CHECKBOX_OPTIONS } },
    { id: 'both', label: '全选', values: { modelValue: ['a', 'b'], options: CHECKBOX_OPTIONS } },
    {
      id: 'min',
      label: '最少选两个',
      hint: 'min 为 2 时取消第二个选项会被拦截',
      values: { modelValue: ['a', 'b'], min: 2, options: CHECKBOX_OPTIONS }
    },
    {
      id: 'max',
      label: '最多选一个',
      hint: 'max 为 1 时再勾选会被拦截',
      values: { modelValue: ['a'], max: 1, options: CHECKBOX_OPTIONS }
    },
    { id: 'disabled', label: '整组禁用', values: { modelValue: ['a'], disabled: true, options: CHECKBOX_OPTIONS } },
    {
      id: 'button',
      label: '按钮组',
      values: { type: 'button', modelValue: ['a'], options: CHECKBOX_OPTIONS }
    }
  ],
  ColorPicker: [
    { id: 'base', label: '基础', values: { modelValue: '#3366ff' } },
    {
      id: 'alpha',
      label: '透明度',
      hint: '打开 Alpha 通道后可调透明度',
      values: { modelValue: '#3366ff80', showAlpha: true }
    },
    { id: 'hsl', label: 'HSL 输出', values: { modelValue: '#3366ff', colorFormat: 'hsl' } },
    {
      id: 'predefine',
      label: '预定义色板',
      values: { modelValue: '#3366ff', predefine: ['#3366ff', '#0f766e', '#f59e0b', '#ef4444', '#8b5cf6'] }
    },
    {
      id: 'clearable',
      label: '可清除',
      requires: 'color-picker.clearable',
      values: { modelValue: '#3366ff', clearable: true }
    }
  ],
  ColorPickerPanel: [
    { id: 'base', label: '基础', values: { modelValue: '#3366ff' } },
    { id: 'alpha', label: '透明度', values: { modelValue: '#3366ff80', showAlpha: true } },
    { id: 'hsl', label: 'HSL 输出', values: { modelValue: '#3366ff', colorFormat: 'hsl' } },
    {
      id: 'predefine',
      label: '预定义色板',
      values: { modelValue: '#0f766e', predefine: ['#3366ff', '#0f766e', '#f59e0b'] }
    },
    {
      id: 'border',
      label: '显示边框',
      requires: 'color-picker-panel.appearance',
      values: { modelValue: '#3366ff', border: true }
    }
  ],
  CascaderPanel: [
    { id: 'base', label: '基础', values: { options: CASCADER, modelValue: ['zhejiang', 'hangzhou'] } },
    {
      id: 'multiple',
      label: '多选面板',
      requires: 'cascader-panel.multiple',
      values: { options: CASCADER, multiple: true, modelValue: [['zhejiang', 'hangzhou']] }
    },
    {
      id: 'strict',
      label: '父子不关联',
      requires: ['cascader-panel.multiple', 'cascader-panel.selection'],
      hint: 'checkStrictly 打开后父节点可独立勾选',
      values: { options: CASCADER, multiple: true, checkStrictly: true, modelValue: [['zhejiang']] }
    },
    {
      id: 'disabled',
      label: '禁用',
      values: { options: CASCADER, modelValue: ['zhejiang', 'hangzhou'], disabled: true }
    },
    {
      id: 'lazy',
      label: '懒加载',
      requires: 'cascader-panel.lazy',
      hint: '首屏加载根节点，逐级请求约 550ms',
      values: { options: [], lazy: true, modelValue: [] }
    }
  ],
  DatePickerPanel: [
    { id: 'base', label: '基础', hint: '默认展示「此刻」与清空入口', values: { modelValue: '2026-10-26' } },
    {
      id: 'range',
      label: '区间选择',
      hint: '两次点击选择起止日期，中间日期高亮',
      requires: 'date-picker-panel.range',
      values: { isRange: true, modelValue: ['2026-10-01', '2026-10-31'] }
    },
    {
      id: 'week',
      label: '显示周号',
      hint: '开启后每行左侧显示 ISO 周数',
      requires: 'date-picker-panel.range',
      values: { isRange: true, showWeekNumber: true, modelValue: ['2026-10-01', '2026-10-31'] }
    },
    {
      id: 'shortcuts',
      label: '快捷选项',
      hint: '侧栏快捷项点击即提交对应日期区间',
      requires: 'date-picker-panel.range',
      values: {
        isRange: true,
        modelValue: ['2026-10-01', '2026-10-31'],
        shortcuts: [
          { text: '最近一周', value: ['2026-10-21', '2026-10-27'] },
          { text: '最近一月', value: ['2026-09-28', '2026-10-27'] }
        ]
      }
    },
    {
      id: 'confirm',
      label: '确认与页脚',
      hint: '选择后需点击「确定」才提交',
      values: { modelValue: '2026-10-26', showConfirm: true, showFooter: true }
    },
    {
      id: 'hide-footer',
      label: '隐藏页脚',
      hint: 'showFooter 关闭后底部操作整体隐藏',
      values: { modelValue: '2026-10-26', showFooter: false }
    },
    { id: 'disabled', label: '禁用', values: { modelValue: '2026-10-26', disabled: true } },
    {
      id: 'border',
      label: '显示边框',
      requires: 'date-picker-panel.appearance',
      values: { modelValue: '2026-10-26', border: true }
    }
  ],
  InputNumber: [
    { id: 'step', label: '步长 5', values: { modelValue: 5, step: 5 } },
    { id: 'range', label: '限定 0-10', hint: '越界时会自动收敛到边界值', values: { modelValue: 0, min: 0, max: 10 } },
    { id: 'precision', label: '两位小数', values: { modelValue: 3.14159, precision: 2 } },
    { id: 'controls-right', label: '按钮右置', values: { modelValue: 5, controlsPosition: 'right' } },
    { id: 'readonly', label: '只读', values: { modelValue: 5, readonly: true } },
    { id: 'small', label: '小尺寸', values: { modelValue: 5, size: 'small' } },
    { id: 'large', label: '大尺寸', values: { modelValue: 5, size: 'large' } }
  ],
  InputOtp: [
    { id: 'base', label: '六位验证码', values: { modelValue: '123456' } },
    { id: 'four', label: '四位', values: { length: 4, modelValue: '1234' } },
    { id: 'separator', label: '分隔符', values: { separator: '-', modelValue: '123456' } },
    { id: 'mask', label: '掩码', values: { mask: true, modelValue: '123456' } },
    { id: 'disabled', label: '禁用', values: { disabled: true, modelValue: '123456' } }
  ],
  InputTag: [
    {
      id: 'max',
      label: '最多两个',
      hint: '达到 max 后继续输入会被拦截',
      values: { modelValue: ['Vue', 'Vite', 'Vitest'], max: 2 }
    }
  ],
  Option: [
    { id: 'base', label: '基础', values: { label: '选项一', value: 'a' } },
    { id: 'second', label: '选项二', values: { label: '选项二', value: 'b' } },
    { id: 'disabled', label: '禁用', values: { label: '禁用选项', value: 'c', disabled: true } },
    { id: 'object-value', label: '对象值', values: { label: '对象选项', value: { id: 1 } } },
    { id: 'created', label: '临时创建项', values: { label: '新建选项', value: 'new' } }
  ],
  OptionGroup: [
    { id: 'base', label: '基础', values: { label: '分组一' } },
    { id: 'second', label: '分组二', values: { label: '分组二' } },
    { id: 'disabled', label: '禁用分组', values: { label: '禁用分组', disabled: true } },
    { id: 'long', label: '长分组标题', values: { label: '按业务场景划分的组件分组' } }
  ],
  Segmented: [
    { id: 'large', label: '大尺寸', values: { options: SEGMENTED_OPTIONS, modelValue: 'week', size: 'large' } },
    { id: 'small', label: '小尺寸', values: { options: SEGMENTED_OPTIONS, modelValue: 'day', size: 'small' } },
    { id: 'disabled', label: '禁用', values: { options: SEGMENTED_OPTIONS, modelValue: 'day', disabled: true } },
    { id: 'block', label: '块级铺满', values: { options: SEGMENTED_OPTIONS, modelValue: 'month', block: true } },
    {
      id: 'vertical',
      label: '纵向排列',
      values: { options: SEGMENTED_OPTIONS, modelValue: 'day', direction: 'vertical' }
    },
    { id: 'selected', label: '默认选中年', values: { options: SEGMENTED_OPTIONS, modelValue: 'year' } }
  ],
  Slider: [
    {
      id: 'marks',
      label: '刻度标记',
      values: { modelValue: 40, showStops: true, marks: { 0: '0', 25: '25', 50: '50', 75: '75', 100: '100' } }
    }
  ],
  Switch: [
    {
      id: 'inline',
      label: '两侧文案',
      hint: 'inlinePrompt 关闭时文案位于开关两侧',
      values: { modelValue: true, activeText: '开启', inactiveText: '关闭' }
    },
    {
      id: 'icons',
      label: '自定义图标',
      requires: 'switch.icons',
      values: { modelValue: true, activeIcon: 'check', inactiveIcon: 'close' }
    },
    { id: 'width', label: '加宽开关', values: { modelValue: true, width: 64 } }
  ],
  TimeSelect: [
    {
      id: 'window',
      label: '上午时段',
      hint: '只保留 08:00 - 12:00 的可选时间',
      values: { modelValue: '09:30', start: '08:00', end: '12:00' }
    },
    {
      id: 'format',
      label: '中文格式',
      hint: 'format 支持 HH、H、mm、m 占位符',
      values: { modelValue: '09:30', format: 'H时m分' }
    }
  ],
  Transfer: [
    { id: 'titles', label: '自定义标题', values: { titles: ['待选列表', '已选列表'], modelValue: ['a'] } },
    { id: 'buttons', label: '自定义按钮文案', values: { buttonTexts: ['加入右侧', '移回左侧'], modelValue: ['a'] } }
  ],
  Upload: [
    {
      id: 'picture',
      label: '图片列表',
      hint: 'listType 设为 picture 时文件以缩略图展示',
      values: {
        listType: 'picture',
        fileList: [{ name: 'preview.png', url: IMAGE, status: 'success', uid: 1 }]
      }
    },
    { id: 'limit', label: '最多一个文件', hint: '达到 limit 后继续选择会被拦截', values: { limit: 1 } },
    {
      id: 'picture-card',
      label: '图片卡片',
      hint: 'listType 为 picture-card 时触发器与文件都是 100px 卡片，状态用遮罩文案呈现',
      values: {
        listType: 'picture-card',
        fileList: [
          { name: 'banner.png', url: IMAGE, status: 'success', uid: 1 },
          { name: 'logo.png', url: IMAGE, status: 'uploading', uid: 2 },
          { name: 'cover.jpg', url: IMAGE, status: 'fail', uid: 3 }
        ]
      }
    },
    {
      id: 'status',
      label: '文件状态',
      hint: 'fileList[].status 决定列表项配色与状态文案',
      values: {
        fileList: [
          { name: 'component-guide.pdf', status: 'success', uid: 1 },
          { name: 'build-log.txt', status: 'uploading', uid: 2 },
          { name: 'large-asset.zip', status: 'fail', uid: 3 }
        ]
      }
    },
    {
      id: 'custom',
      label: '自定义触发',
      hint: '默认插槽交给消费方，触发区样式由消费方自己的按钮提供，组件只管选文件与渲染列表',
      values: {
        listType: 'picture',
        accept: 'image/*',
        fileList: [{ name: 'poster.png', url: IMAGE, status: 'success', uid: 1 }]
      }
    },
    { id: 'disabled', label: '禁用', values: { disabled: true } }
  ],
  Message: [
    { id: 'success', label: '成功', values: { type: 'success', message: '构建产物已生成。' } },
    { id: 'warning', label: '警告', values: { type: 'warning', message: '当前配置存在 3 条警告。' } },
    {
      id: 'closable',
      label: '可关闭',
      requires: 'message.closable',
      values: {
        message: '可手动关闭的消息。',
        showClose: true
      }
    },
    {
      id: 'icon',
      label: '自定义图标',
      requires: 'message.icons',
      values: { message: '使用铃铛图标的消息。', icon: 'bell' }
    },
    {
      id: 'plain',
      label: '朴素样式',
      requires: 'message.appearance',
      values: { type: 'warning', plain: true, message: '白底朴素样式的警告消息。' }
    },
    {
      id: 'placement',
      label: '顶部弹出',
      requires: 'message.popper',
      values: { message: '从页面顶部弹出。', placement: 'top' }
    }
  ],
  Loading: [
    { id: 'base', label: '基础', values: {} },
    { id: 'text', label: '加载文案', values: { text: '正在生成产物…' } },
    { id: 'color', label: '自定义颜色', values: { color: '#0f766e', text: '同步中' } },
    { id: 'large', label: '大尺寸', values: { size: 48, text: '加载中' } },
    { id: 'hidden', label: '隐藏遮罩', values: { visible: false } },
    {
      id: 'background',
      label: '深色背景',
      values: { background: 'rgba(15, 23, 42, 0.72)', color: '#ffffff', text: '处理中' }
    }
  ]
}

const DATA_PRESETS: Record<string, ScenePreset[]> = {
  Alert: [
    {
      id: 'center',
      label: '居中排版',
      values: { type: 'info', title: '居中提示', description: '标题与描述都居中显示。', center: true }
    },
    {
      id: 'dark',
      label: '深色主题',
      values: { type: 'success', title: '深色提示', description: '深色背景下的提示。', effect: 'dark' }
    },
    {
      id: 'close-text',
      label: '关闭文案',
      requires: 'alert.closable',
      values: {
        type: 'warning',
        title: '可关闭提示',
        description: '右侧显示自定义关闭文案。',
        closable: true,
        closeText: '知道了'
      }
    }
  ],
  Calendar: [
    {
      id: 'range-selected',
      label: '区间已选',
      requires: 'calendar.range',
      hint: 'range 传入起止日期后区间高亮',
      values: { modelValue: '2026-10-26', range: ['2026-10-01', '2026-10-15'] }
    },
    { id: 'month-start', label: '月初日期', values: { modelValue: '2026-11-01' } },
    { id: 'year-end', label: '年末日期', values: { modelValue: '2026-12-31' } }
  ],
  Countdown: [
    {
      id: 'days',
      label: '显示天数',
      hint: 'format 支持 D / HH / mm / ss 占位符',
      values: { value: { days: 1, hours: 2, minutes: 3, seconds: 4 }, format: 'D 天 HH:mm:ss', title: '活动倒计时' }
    },
    { id: 'affix', label: '前后缀', values: { value: 3661, prefix: '剩余', suffix: '结束', title: '限时优惠' } },
    { id: 'no-title', label: '无标题', values: { value: 3661 } },
    { id: 'minutes', label: '分秒格式', values: { value: 3599, format: 'mm:ss', title: '剩余时间' } },
    { id: 'large', label: '大号剩余时间', values: { value: 172800, format: 'D 天 HH:mm:ss', title: '距发布还有' } }
  ],
  Row: [
    {
      id: 'base',
      label: '基础',
      hint: '默认 gutter=0、justify=start：两列各占 12/24，色块首尾相接没有空隙',
      values: {}
    },
    {
      id: 'gutter',
      label: '列间距 16',
      hint: 'gutter=16：行左右各外扩 8px（负边距），每列左右各内填 8px，于是色块之间空出 16px',
      values: { gutter: 16 }
    },
    {
      id: 'gutter-pair',
      label: '横纵间距',
      hint: 'gutter=[16,24]：四列换行成两行，行与行之间留 24px，只有多行才看得到纵向间距',
      values: { gutter: [16, 24] }
    },
    {
      id: 'center',
      label: '居中',
      hint: 'justify=center：两列各 span 6 只占一半宽度，剩余空间平分到两侧',
      values: { justify: 'center' }
    },
    {
      id: 'end',
      label: '靠右',
      hint: 'justify=end：剩余空间全部留在左侧',
      values: { justify: 'end' }
    },
    {
      id: 'between',
      label: '两端贴边',
      hint: '三列各 span 6 只占 75%，space-between 让首列贴左、末列贴右，剩余 25% 只均分在列之间',
      values: { justify: 'space-between' }
    },
    {
      id: 'around',
      label: '两端留半',
      hint: 'space-around：列间空隙是两端空隙的两倍',
      values: { justify: 'space-around' }
    },
    {
      id: 'evenly',
      label: '等分间隔',
      hint: 'space-evenly：两端与列间空隙全部等宽',
      values: { justify: 'space-evenly' }
    },
    {
      id: 'align-middle',
      label: '垂直居中',
      hint: '不设置 align 时列沿交叉轴拉伸等高；align=middle 让高矮不同的三列按自身高度居中',
      values: { align: 'middle' }
    },
    {
      id: 'align-bottom',
      label: '底部对齐',
      hint: 'align=bottom：矮单元格贴到行底部，中间高单元格决定行高',
      values: { align: 'bottom' }
    },
    {
      id: 'tag',
      label: '语义标签',
      hint: 'tag=section：根节点换成 section，栅格行为不变，差异看下方读数与 DOM 标签',
      values: { tag: 'section' }
    },
    {
      id: 'nested',
      label: '嵌套栅格',
      hint: 'span 以所在列为基准：外层 span 12 里再排一行两列，内层自带 12px 间距且与外层互不影响',
      values: { gutter: 24 }
    }
  ],
  Col: [
    {
      id: 'base',
      label: '基础',
      hint: '默认 span=24 独占整行，剩余 0 格，所以这一行没有参考列',
      values: {}
    },
    {
      id: 'span',
      label: '半数栅格',
      hint: 'span=12 占一半，剩余 12 格由左右参考列各占 6 格补齐',
      values: { span: 12 }
    },
    {
      id: 'push',
      label: '向右偏移',
      hint: 'push=3 让目标列相对自身右移 3 格，压到右侧参考列上，其他列位置不变',
      values: { span: 9, push: 3 }
    },
    {
      id: 'pull',
      label: '向左偏移',
      hint: 'pull=3 相对左移 3 格，压到左侧参考列上；push 与 pull 都是 position: relative 的位移',
      values: { span: 9, pull: 3 }
    },
    {
      id: 'offset',
      label: '栅格偏移',
      hint: 'offset=6 用 margin-left 在列左侧真实空出 6 整格；参考列 + 偏移 + 目标列合计 30 格超过 24，右侧参考列被挤到下一行',
      requires: 'col.popper',
      values: { span: 6, offset: 6 }
    }
  ],
  Table: [
    { id: 'highlight', label: '高亮当前行', values: { data: TABLE_ROWS, highlightCurrentRow: true } },
    { id: 'small', label: '紧凑尺寸', values: { data: TABLE_ROWS, size: 'small' } },
    { id: 'max-height', label: '固定高度滚动', values: { data: TABLE_ROWS, maxHeight: 220 } },
    { id: 'no-header', label: '隐藏表头', values: { data: TABLE_ROWS, showHeader: false } }
  ],
  TableColumn: [
    { id: 'index', label: '索引列', values: { type: 'index', label: '#', width: 52 } },
    { id: 'name', label: '名称列', values: { prop: 'name', label: '名称' } },
    { id: 'width', label: '固定列宽', values: { prop: 'name', label: '名称', width: 160 } },
    { id: 'center', label: '居中对齐', values: { prop: 'status', label: '状态', align: 'center' } },
    {
      id: 'sortable',
      label: '可排序',
      requires: 'table.column-sort',
      values: { prop: 'name', label: '名称', sortable: true }
    },
    {
      id: 'selection',
      label: '选择列',
      requires: 'table.selection',
      values: { type: 'selection', label: '选择' }
    }
  ],
  TableV2: [
    { id: 'base', label: '基础', values: { columns: TABLE_V2_COLUMNS, data: TABLE_ROWS, width: 480, height: 260 } },
    {
      id: 'row-height',
      label: '行高 64',
      values: { columns: TABLE_V2_COLUMNS, data: TABLE_ROWS, width: 480, height: 260, rowHeight: 64 }
    },
    {
      id: 'header-height',
      label: '表头高 72',
      values: { columns: TABLE_V2_COLUMNS, data: TABLE_ROWS, width: 480, height: 260, headerHeight: 72 }
    },
    { id: 'tall', label: '更高视口', values: { columns: TABLE_V2_COLUMNS, data: TABLE_ROWS, width: 480, height: 360 } }
  ],
  AutoResizer: [{ id: 'base', label: '基础', values: {} }],
  Tabs: [
    { id: 'bottom', label: '底部标签', values: { tabPosition: 'bottom' } },
    { id: 'right', label: '右侧标签', values: { tabPosition: 'right' } },
    { id: 'closable', label: '可关闭', requires: 'tabs.tabs-closable', values: { closable: true } },
    { id: 'editable', label: '可编辑', requires: 'tabs.tabs-editable', values: { editable: true } }
  ],
  TabPane: [
    { id: 'base', label: '基础', values: { label: '概览', name: 'a' } },
    { id: 'second', label: '第二个标签', values: { label: '配置', name: 'b' } },
    { id: 'disabled', label: '禁用', values: { label: '概览', name: 'a', disabled: true } },
    {
      id: 'closable',
      label: '可关闭',
      requires: 'tabs.closable',
      values: { label: '概览', name: 'a', closable: true }
    },
    { id: 'lazy', label: '懒加载', requires: 'tabs.lazy', values: { label: '概览', name: 'a', lazy: true } }
  ],
  Tree: [
    {
      id: 'checkbox',
      label: '复选树',
      hint: 'showCheckbox 配合 defaultCheckedKeys 预置勾选',
      values: {
        data: TREE_DATA,
        showCheckbox: true,
        defaultCheckedKeys: ['button', 'input'],
        defaultExpandAll: true
      }
    },
    {
      id: 'icon',
      label: '自定义展开图标',
      requires: 'tree.icons',
      values: { data: TREE_DATA, icon: 'star', defaultExpandAll: true }
    }
  ],
  TreeV2: [
    {
      id: 'base',
      label: '展开全部',
      values: {
        data: TREE_DATA,
        defaultExpandAll: true
      }
    },
    {
      id: 'collapsed',
      label: '默认收起',
      values: {
        data: TREE_DATA
      }
    },
    {
      id: 'height',
      label: '固定高度',
      values: {
        data: TREE_DATA,
        defaultExpandAll: true,
        height: 240
      }
    },
    {
      id: 'indent',
      label: '缩进 28',
      values: {
        data: TREE_DATA,
        defaultExpandAll: true,
        indent: 28
      }
    },
    {
      id: 'check',
      label: '复选树',
      requires: 'tree-v2.check',
      values: {
        data: TREE_DATA,
        defaultExpandAll: true,
        showCheckbox: true,
        defaultCheckedKeys: ['button']
      }
    }
  ],
  VirtualList: [
    { id: 'base', label: '基础', values: { data: VIRTUAL_DATA, height: 180, itemSize: 30 } },
    { id: 'row-height', label: '行高 40', values: { data: VIRTUAL_DATA, height: 180, itemSize: 40 } },
    { id: 'tall', label: '更高视口', values: { data: VIRTUAL_DATA, height: 240, itemSize: 30 } },
    { id: 'cache', label: '增大缓存', values: { data: VIRTUAL_DATA, height: 180, itemSize: 30, cache: 6 } },
    {
      id: 'total',
      label: '总数 80',
      hint: 'total 大于数据长度时按总数计算滚动高度，超出数据的部分显示"加载中…"占位行',
      values: { data: VIRTUAL_DATA, height: 180, itemSize: 30, total: 80 }
    }
  ],
  Scrollbar: [
    { id: 'base', label: '基础', values: { height: '140px' } },
    { id: 'native', label: '原生滚动条', values: { height: '140px', native: true } },
    { id: 'always', label: '常显滚动条', values: { height: '140px', always: true } },
    { id: 'tall', label: '高度 220', values: { height: 220 } },
    { id: 'distance', label: '贴边显示', values: { height: '140px', distance: 0 } },
    { id: 'max-height', label: '最大高度', values: { maxHeight: 120 } }
  ],
  Pagination: [
    { id: 'pager-count', label: '五个页码', values: { total: 60, pagerCount: 5 } },
    {
      id: 'icons',
      label: '自定义箭头',
      requires: 'pagination.icons',
      hint: '前后按钮替换为自定义箭头图标',
      values: { total: 128, currentPage: 3, prevIcon: 'arrowLeft', nextIcon: 'arrowRight' }
    }
  ],
  Steps: [
    { id: 'vertical', label: '垂直方向', values: { direction: 'vertical', active: 1 } },
    { id: 'center', label: '居中对齐', values: { alignCenter: true, active: 1 } },
    { id: 'third', label: '第三步进行中', values: { active: 2 } },
    { id: 'space', label: '自定义间距', values: { space: 160, active: 1 } }
  ],
  Step: [
    { id: 'base', label: '基础', values: { title: '步骤一', description: '选择组件' } },
    { id: 'second', label: '第二步', values: { title: '步骤二', description: '勾选特性' } },
    { id: 'success', label: '成功状态', values: { title: '步骤一', description: '已生成产物', status: 'success' } },
    { id: 'error', label: '错误状态', values: { title: '步骤一', description: '构建失败', status: 'error' } },
    {
      id: 'icon',
      label: '自定义图标',
      requires: 'steps.icons',
      values: { title: '步骤一', description: '选择组件', icon: 'star' }
    }
  ],
  Menu: [
    {
      id: 'expand-all',
      label: '三层全展开',
      hint: '五个子菜单 index 逐级填入 defaultOpeneds，可看到三级缩进与竖向引导线',
      values: {
        defaultActive: 'popconfirm',
        defaultOpeneds: ['components', 'components-basic', 'components-form', 'feedback', 'feedback-popper']
      }
    },
    {
      id: 'unique',
      label: '手风琴子菜单',
      hint: '点击“反馈组件”标题，已展开的“组件库”会自动收起',
      values: { defaultOpeneds: ['components'], uniqueOpened: true }
    },
    {
      id: 'dark',
      label: '深色配色',
      hint: 'textColor 同时作用于菜单项与子菜单标题，activeTextColor 决定激活文字与其 12% 混色底色',
      values: { backgroundColor: '#1f2937', textColor: '#e5e7eb', activeTextColor: '#60a5fa' }
    },
    {
      id: 'dark-horizontal',
      label: '深色水平',
      hint: 'backgroundColor 会跟随到浮出的子菜单面板，面板内三级子项 Button 保持激活色',
      values: {
        mode: 'horizontal',
        backgroundColor: '#1f2937',
        textColor: '#e5e7eb',
        activeTextColor: '#60a5fa',
        defaultActive: 'button',
        defaultOpeneds: ['components', 'components-basic']
      }
    },
    {
      id: 'hover-delay',
      label: '悬停延迟展开',
      hint: '水平菜单默认收起，指针停留 800ms 才展开、移出 800ms 才收起；点击展开的子菜单不自动收起',
      values: {
        mode: 'horizontal',
        showTimeout: 800,
        hideTimeout: 800,
        defaultActive: 'dialog',
        defaultOpeneds: []
      }
    }
  ],
  MenuItem: [
    {
      id: 'base',
      label: '基础',
      hint: 'index 参与菜单激活与 select 事件，预览中同级还有构建概览等兄弟项',
      values: { index: 'overview' }
    },
    { id: 'custom-index', label: '自定义索引', hint: '索引可与路由或业务 ID 对应', values: { index: 'settings' } },
    {
      id: 'deep-leaf',
      label: '三级子项',
      hint: 'index 落在已展开的三级子菜单内，激活底色出现在缩进层',
      values: { index: 'button' }
    },
    { id: 'disabled', label: '禁用', hint: '禁用项点击不改变激活态，也不触发 select', values: { index: 'logs', disabled: true } },
    { id: 'group-item', label: '分组子项', hint: '与 MenuItemGroup 搭配时的索引写法', values: { index: 'group-item' } }
  ],
  MenuItemGroup: [
    { id: 'base', label: '基础', hint: '分组标题字号小于菜单项，内部条目自动缩进', values: { title: '工作台' } },
    { id: 'second', label: '分组二', values: { title: '运维' } },
    { id: 'long', label: '长分组标题', values: { title: '按构建产物划分的菜单分组' } },
    { id: 'empty-title', label: '空标题', hint: 'title 留空时只保留一条空行高，不渲染文案', values: { title: '' } },
    { id: 'blank-title', label: '仅空格标题', hint: '空格字符串按“有标题”处理，可用于对比占位差异', values: { title: '   ' } }
  ],
  SubMenu: [
    {
      id: 'base',
      label: '基础',
      hint: '点击标题展开，子项缩进一级并显示引导线；子项内还能再嵌一层子菜单',
      values: { index: 'components-basic' }
    },
    { id: 'second', label: '第二个子菜单', values: { index: 'feedback' } },
    {
      id: 'disabled',
      label: '禁用',
      hint: '禁用后点击与悬停都不展开，标题仍按禁用透明度显示',
      values: { index: 'components-form', disabled: true }
    },
    {
      id: 'icons',
      label: '自定义展开图标',
      requires: 'menu.sub-menu-icons',
      hint: '纵向菜单使用 expand* 图标，自定义图标不再旋转 90°',
      values: { index: 'components-basic', expandOpenIcon: 'arrowDown', expandCloseIcon: 'arrowRight' }
    },
    {
      id: 'timeout',
      label: '延迟展开',
      hint: '本项 showTimeout/hideTimeout 覆盖 Menu 的 300ms 默认值，悬停 800ms 后展开',
      values: { index: 'components-basic', showTimeout: 800, hideTimeout: 800 }
    }
  ],
  Dropdown: [
    { id: 'disabled', label: '禁用', values: { disabled: true } },
    {
      id: 'placement-top',
      label: '向上弹出',
      requires: 'dropdown.popper',
      hint: 'placement=top，菜单从按钮上方展开',
      values: { placement: 'top' }
    },
    {
      id: 'arrow-off',
      label: '隐藏箭头',
      requires: 'dropdown.popper',
      values: { showArrow: false }
    },
    {
      id: 'persistent',
      label: '常显菜单',
      hint: 'visible=true 受控常显，不受 hover/click 影响',
      values: { visible: true }
    },
    { id: 'size-small', label: '小尺寸菜单', hint: 'size=small，面板与菜单项同步缩小', values: { size: 'small' } },
    { id: 'size-large', label: '大尺寸菜单', values: { size: 'large' } }
  ],
  DropdownItem: [
    { id: 'base', label: '基础', values: {} },
    { id: 'disabled', label: '禁用', values: { disabled: true } },
    { id: 'divided', label: '分割线', values: { divided: true } },

    {
      id: 'icon',
      label: '自定义图标',
      requires: 'dropdown.dropdown-item-icons',
      values: { icon: 'star' }
    }
  ],
  DropdownMenu: [
    { id: 'base', label: '基础', values: {} },
    { id: 'second', label: '第二组', values: {} }
  ],
  Popconfirm: [
    {
      id: 'buttons',
      label: '自定义按钮',
      values: {
        title: '确认删除该记录？',
        confirmButtonText: '删除',
        cancelButtonText: '保留',
        confirmButtonType: 'danger'
      }
    },
    {
      id: 'icon',
      label: '自定义图标',
      requires: 'popconfirm.icons',
      hint: 'icon 换成 star，iconColor 决定图标颜色',
      values: { icon: 'star', iconColor: '#16a34a' }
    },
    {
      id: 'no-icon',
      label: '隐藏图标',
      values: { hideIcon: true }
    },
    {
      id: 'narrow',
      label: '窄面板',
      hint: '示例默认把 width 预置成 260，这里显式改回组件默认的 150 验证 width 真的生效',
      values: { width: 150, title: '确认删除？' }
    }
  ],
  Progress: [
    { id: 'complete', label: '完成状态', values: { percentage: 100, status: 'success' } },
    {
      id: 'indeterminate',
      label: '不确定进度',
      hint: 'indeterminate 打开后不再显示具体百分比',
      values: { percentage: 30, indeterminate: true }
    }
  ],
  MessageBox: [
    {
      id: 'warning',
      label: '危险操作',
      values: { type: 'warning', title: '删除确认', message: '删除后不可恢复，确认继续？' }
    },
    {
      id: 'confirm-only',
      label: '仅确认按钮',
      values: { title: '操作提示', message: '确认后立即生效。', showCancelButton: false }
    },
    { id: 'center', label: '内容居中', values: { title: '操作提示', message: '确认执行该操作吗？', center: true } },
    {
      id: 'input',
      label: '输入框',
      requires: 'message-box.input',
      hint: '开启输入框后需要输入内容才能确认',
      values: { title: '删除确认', message: '请输入删除原因。', showInput: true, inputPlaceholder: '请输入原因' }
    }
  ],
  Notification: [
    { id: 'base', label: '基础', values: { title: '通知标题', message: '这是一条通知内容。' } },
    { id: 'success', label: '成功类型', values: { type: 'success', title: '构建完成', message: '产物已生成。' } },
    {
      id: 'offset',
      label: '边缘偏移',
      requires: 'notification.popper',
      hint: 'offset=36，通知卡片距视口顶部再让出 36px',
      values: { title: '通知标题', message: '带边缘偏移的通知。', offset: 36 }
    },
    {
      id: 'bottom-left',
      label: '左下角',
      values: { position: 'bottom-left', title: '通知标题', message: '从页面左下角弹出。' }
    },

    {
      id: 'closable',
      label: '可关闭',
      requires: 'notification.closable',
      values: {
        title: '通知标题',
        message: '右上角显示关闭按钮。',
        showClose: true
      }
    },
    {
      id: 'icon',
      label: '自定义图标',
      requires: 'notification.icons',
      values: { title: '通知标题', message: '使用铃铛图标。', icon: 'bell' }
    }
  ],
  Overlay: [
    {
      id: 'base',
      label: '基础',
      hint: '不传 zIndex：遮罩盖满视口、压暗、吃掉点击',
      values: {}
    },
    {
      id: 'z-low',
      label: '层级 1',
      hint: 'zIndex=1 压不住 z-index=10 的对照卡片：卡片能被点着，舞台按钮仍被遮',
      values: { zIndex: 1 }
    },
    {
      id: 'z-high',
      label: '层级 3000',
      hint: '同一个坐标改点对照卡片：命中的是遮罩，卡片这一下收不到',
      values: { zIndex: 3000 }
    },
    {
      id: 'local',
      label: '只遮局部',
      hint: '宿主用 attrs class 把 position 改成 absolute，遮罩收进舞台内，页面其他地方照常能点',
      values: {}
    },
    {
      id: 'modal',
      label: '居中内容卡片',
      hint: '默认插槽由遮罩 flex 居中；点卡片不关，点卡片外空白才关',
      values: { zIndex: 2000 }
    },
    {
      id: 'no-close',
      label: '点空白不关闭',
      hint: '点击照样被吃掉，只是这层不卸载：对应业务侧 close-on-click-modal=false，退出只按卡片里的关闭',
      values: { zIndex: 2000 }
    }
  ],
  Popper: [
    {
      id: 'base',
      label: '基础',
      hint: '默认 absolute + GPU 加速：锚点认舞台原点，间距实测正好留缝 8px',
      values: {}
    },
    {
      id: 'fixed',
      label: '固定定位',
      hint: 'strategy=fixed 把基准换成视口：坐标基还按舞台原点算就偏，点「坐标按视口原点」对齐',
      values: { strategy: 'fixed' }
    },
    {
      id: 'no-gpu',
      label: '关闭 GPU 加速',
      hint: 'transform/will-change 被摘掉：锚点层读数里 transform 变 none，面板层若用 fixed 也会改认祖先',
      values: { gpuAcceleration: false }
    },
    {
      id: 'role',
      label: '对话框角色',
      hint: 'role 由组件直接写进 DOM，读数行的「触发器 DOM」看不到它，看锚点元素的 role 属性',
      values: { role: 'dialog' }
    }
  ],
  PopperArrow: [
    { id: 'base', label: '基础', hint: '默认 5px：读数「实测」应当与设的值一致', values: {} },
    { id: 'offset-0', label: '偏移 0', hint: '箭头落在面板水平中心', values: { arrowOffset: 0 } },
    { id: 'offset-16', label: '偏移 16', hint: 'CSS 用 left: calc(50% + 变量) 位移，箭头整体右移', values: { arrowOffset: 16 } },
    { id: 'offset-neg', label: '反向偏移 -12', hint: '负值把箭头推到中心左侧', values: { arrowOffset: -12 } }
  ],
  PopperContent: [
    {
      id: 'base',
      label: '基础',
      hint: '深色面板贴在锚点上：position 必须是 absolute，写上去的 left/top 才吃得住',
      values: {}
    },
    { id: 'light', label: '浅色主题', hint: 'effect 换成 is-light，带边框与投影', values: { effect: 'light' } },
    { id: 'hidden', label: '隐藏面板', hint: 'visible=false 出 is-hidden（display:none）：读数会标出「没有布局盒」，间距与遮挡测试都不再硬算', values: { visible: false } },
    {
      id: 'z-index',
      label: '层级 3000',
      hint: '面板 z-index 抬到遮挡条之上：遮挡测试从「遮挡条压住」翻成「面板压住」',
      values: { zIndex: 3000 }
    },
    {
      id: 'fixed',
      label: '面板固定定位',
      hint: 'strategy=fixed 换基准；注意祖先带 transform 时 fixed 仍改认祖先 —— 读数的「坐标按」会说出来',
      values: { strategy: 'fixed' }
    },
    { id: 'no-gpu', label: '关闭 GPU 加速', hint: '面板不再挂 translateZ(0)，transform 读数为 none', values: { gpuAcceleration: false } },
    { id: 'aria', label: '无障碍标注', hint: 'id 与 aria-label 直接落到面板 DOM 上', values: { id: 'pg-ppr-panel', ariaLabel: '浮层面板' } }
  ],
  PopperTrigger: [
    { id: 'base', label: '基础', hint: 'role=button；aria-expanded 跟着浮层的实际开合走，点触发器看计数与状态一起动', values: {} },
    { id: 'open', label: '打开状态', hint: 'open=true 让 aria-expanded 与高亮框亮起来，与浮层实际是否渲染无关', values: { open: true } },
    { id: 'id', label: '自定义 id', hint: 'id 落进 DOM，读数的「触发器 DOM · id」跟着变', values: { id: 'popper-trigger' } },
    { id: 'virtual', label: '虚拟触发', hint: 'virtualTriggering=true：触发器不存在，aria-hidden 变 true 并降透明度', values: { virtualTriggering: true } }
  ],
  RovingFocusGroup: [
    { id: 'base', label: '基础', hint: '横向：整组只有一项 tabindex=0，方向键在组内挪这个 0', values: {} },
    { id: 'vertical', label: '垂直方向', hint: 'orientation=vertical：前后键从左右换成上下，左右键不再响应', values: { orientation: 'vertical' } },
    { id: 'rtl', label: '从右向左', hint: 'dir=rtl：视觉顺序翻转，←/→ 的作用也对调', values: { dir: 'rtl' } },
    { id: 'initial-c', label: '初始停在第 3 项', hint: 'currentTabStopId=c：首帧起 tabindex=0 就落在 c 上', values: { currentTabStopId: 'c' } },
    { id: 'no-loop', label: '到头不回绕', hint: 'loop=false：末项再按前键，焦点停在原地', values: { loop: false } }
  ],
  RovingFocusItem: [
    { id: 'base', label: '基础', hint: '第一项 tabStopId=a，读数里的 tabindex 序列首位就是它', values: { tabStopId: 'a' } },
    { id: 'id-b', label: '改 id 为 b', hint: 'tabStopId=b：第一项注册键变成 b，顺序表里换到 b 的位置', values: { tabStopId: 'b' } },
    { id: 'not-focusable', label: '不可聚焦', hint: 'focusable=false：该项不写 tabindex，方向键漫游直接跳过它', values: { tabStopId: 'a', focusable: false } },
    { id: 'active', label: '常驻停靠点', hint: 'active=true：该项无条件占着 tabindex=0，于是同时出现两个 0', values: { tabStopId: 'a', active: true } },
    { id: 'custom-id', label: '自定义 id', hint: 'tabStopId=z：注册键是自定义字符串，顺序表里显示 z', values: { tabStopId: 'z' } }
  ],
  Collection: [
    {
      id: 'base',
      label: '基础列表',
      hint: '三项列表：点行尾「定位」把数据对象交给 getItem，换回它注册的 DOM 实例，顶部读数显示注册项数',
      values: {}
    },
    {
      id: 'grid',
      label: '网格布局',
      hint: '子项是 display:contents 包装，自身不产生盒子，卡片直接排进外层的两列网格，中间没有多余的一层壳',
      values: {}
    },
    {
      id: 'dynamic',
      label: '增删子项',
      hint: '注册数随增删实时变化：子项卸载时会从 itemRefs 里删掉自己的引用，不会越积越多',
      values: {}
    },
    {
      id: 'scroll',
      label: '长列表定位',
      hint: '十项定高滚动列表：命中后把该行滚到列表中央，演示「按数据对象定位视图」这一唯一用途',
      values: {}
    },
    {
      id: 'identity',
      label: '引用即 key',
      hint: '注册表以对象引用为 key：换成内容完全相同的新对象，getItem 返回 null',
      values: {}
    }
  ],
  CollectionItem: [
    {
      id: 'base',
      label: '基础',
      hint: '目标子项用场景给的 item 对象登记，点它的「定位」应命中；另两项是参照子项',
      values: { item: { id: 'first' } }
    },
    {
      id: 'second',
      label: '第二个子项',
      hint: '换场景等于换一个新的 item 对象，集合会随宿主重建，注册数重新从 3 开始',
      values: { item: { id: 'second' } }
    },
    {
      id: 'string-id',
      label: '字符串标识',
      hint: 'item 只要求是对象，内部字段不参与注册，id 叫什么、有没有 children 都不影响命中',
      values: { item: { id: 'text' } }
    },
    {
      id: 'nested',
      label: '带子级',
      hint: 'item 里带 children 数组也只当作一个引用登记，集合不会递归收集子级',
      values: { item: { id: 'nested', children: [] } }
    },
    {
      id: 'empty',
      label: '空对象',
      hint: 'item 传 {} 同样能注册与命中：key 是对象本身，与内容无关',
      values: { item: {} }
    }
  ],
  FocusTrap: [
    {
      id: 'base',
      label: '基础',
      hint: '默认 trapped=false：这层 div 连监听都不挂，焦点自由进出、拉回次数恒为 0；勾上右侧 trapped 立刻变成陷阱',
      values: {}
    },
    {
      id: 'loop',
      label: '循环陷阱',
      hint: 'trapped+loop：焦点送到末位按 Tab 回首位、送到首位按 Shift+Tab 回末位，中间几跳仍归浏览器默认顺序；送出边界会被拉回首位',
      values: { trapped: true, loop: true }
    },
    {
      id: 'edge',
      label: '边界不转发',
      hint: 'loop=false：末位按 Tab 时事件被 preventDefault 但焦点不再移动，钉在最后一个控件上；送出边界仍会被拉回',
      values: { trapped: true, loop: false }
    },
    {
      id: 'start-last',
      label: '从末位开始',
      hint: "focusStartEl='last'：启用陷阱的瞬间焦点落在取消按钮，之后每次被拉回也回取消按钮",
      values: { trapped: true, loop: true, focusStartEl: 'last' }
    },
    {
      id: 'start-container',
      label: '落在容器',
      hint: "focusStartEl='container'：焦点放进陷阱 div 自身（tabindex=-1，不进 Tab 序列），它既非首位也非末位，所以这一跳没人接管",
      values: { trapped: true, focusStartEl: 'container' }
    },
    {
      id: 'external',
      label: '换陷阱边界',
      hint: 'focusTrapEl 由演示宿主注入整个面板：边界比陷阱 div 大一圈，「面板内·陷阱外」按钮成了循环首位，Tab 到它不算越界',
      values: { trapped: true, loop: true }
    }
  ],
  OnlyChild: [{ id: 'base', label: '基础', values: {} }],
  Tour: [
    { id: 'base', label: '显示引导', values: { modelValue: true } },
    { id: 'closed', label: '关闭引导', values: { modelValue: false } },
    {
      id: 'primary',
      label: '主色面板',
      hint: "type: 'primary' 把引导面板换成主题色实底，箭头与按钮同步反色",
      values: { modelValue: true, type: 'primary' }
    },
    {
      id: 'current',
      label: '从第二步开始',
      hint: 'current=1 直接定位到第二个 TourStep，进度显示 2 / 3',
      values: { modelValue: true, current: 1 }
    },
    { id: 'no-mask', label: '无遮罩', values: { modelValue: true, mask: false } },
    {
      id: 'mask-color',
      label: '加深遮罩',
      hint: 'mask 传对象时 color 决定遮罩底色',
      values: { modelValue: true, mask: { color: 'rgba(15, 23, 42, 0.78)' } }
    },
    {
      id: 'gap',
      label: '高亮留白 8',
      hint: 'gap 同时扩大高亮镂空与圆角',
      values: { modelValue: true, gap: { padding: 8, radius: 8 } }
    },
    {
      id: 'gap-offset',
      label: '高亮外扩 14',
      hint: 'gap.offset 在 padding 之外再向外扩一圈',
      values: { modelValue: true, gap: { padding: 6, offset: 14, radius: 12 } }
    },
    {
      id: 'closable',
      label: '显示关闭按钮',
      requires: 'tour.closable',
      values: { modelValue: true }
    },
    {
      id: 'esc',
      label: 'ESC 关闭',
      hint: '开启 tour.modal 后按 Esc 关闭引导',
      requires: 'tour.modal',
      values: { modelValue: true }
    },
    {
      id: 'top',
      label: '上方弹出',
      requires: 'tour.popper',
      values: { modelValue: true, placement: 'top', showArrow: false }
    },
    {
      id: 'offset',
      label: '面板远离 28px',
      requires: 'tour.popper',
      values: { modelValue: true, offset: 28 }
    },
    {
      id: 'scroll',
      label: '滚动到顶部对齐',
      requires: 'tour.validate',
      hint: 'scrollIntoViewOptions 传对象，目标按 block: start 对齐',
      values: { modelValue: true, scrollIntoViewOptions: { block: 'start' } }
    },
    {
      id: 'no-scroll',
      label: '不自动滚动',
      requires: 'tour.validate',
      hint: 'scrollIntoViewOptions 传 false 后目标不再被滚进视口（关掉该特性开关效果相同）',
      values: { modelValue: true, scrollIntoViewOptions: false }
    }
  ],
  TourStep: [
    { id: 'base', label: '基础', values: { title: '引导标题', description: '引导说明' } },
    {
      id: 'primary',
      label: '主色面板',
      hint: '步骤级 type 覆盖 Tour 的 type',
      values: { title: '引导标题', description: '引导说明', type: 'primary' }
    },
    {
      id: 'third',
      label: '指向第三个区块',
      hint: 'target 换成 #pg-landmark-c，高亮与面板跟着换位置',
      values: { title: '引导标题', description: '引导说明', target: '#pg-landmark-c' }
    },
    { id: 'no-mask', label: '无遮罩', values: { title: '引导标题', description: '引导说明', mask: false } },
    {
      id: 'width',
      label: '自定义宽度',
      values: { title: '引导标题', description: '引导说明', contentStyle: { width: '320px' } }
    },
    {
      id: 'closable',
      label: '步骤级关闭',
      requires: 'tour.tour-step-closable',
      hint: 'showClose 只作用于当前步骤',
      values: { title: '引导标题', description: '引导说明', showClose: true }
    },
    {
      id: 'top',
      label: '上方弹出',
      requires: 'tour.tour-step-popper',
      values: { title: '引导标题', description: '引导说明', placement: 'top', showArrow: false }
    },
    {
      id: 'no-scroll',
      label: '不自动滚动',
      requires: 'tour.tour-step-validate',
      hint: '步骤级 scrollIntoViewOptions: false 覆盖 Tour 的设置',
      values: { title: '引导标题', description: '引导说明', scrollIntoViewOptions: false }
    }
  ],
  InfiniteScroll: [
    {
      id: 'base',
      label: '基础',
      hint: '在白色面板内滚动（滚整页不会触发）：默认 distance=0 要滚到最底才触发，吸底状态条实时显示还差多少像素，每次追加 6 条',
      values: {}
    },
    {
      id: 'distance',
      label: '提前 160px 触发',
      hint: 'distance=160：距底部还有 160px 就触发，无需滚到最底',
      values: { distance: 160 }
    },
    {
      id: 'immediate',
      label: '挂载即补满',
      hint: 'immediate=true 且 distance=400：首屏距底 255px 已落在触发区内，挂载后立刻加载，不用滚动',
      values: { immediate: true, distance: 400 }
    },
    {
      id: 'no-immediate',
      label: '挂载时不检查',
      hint: 'immediate=false：同样落在触发区，但要手动滚动一下才会开始加载',
      values: { immediate: false, distance: 400 }
    },
    {
      id: 'delay',
      label: '防抖 800ms',
      hint: 'delay=800：滚动停止 800ms 后才检查，连续滚动期间不重复触发',
      values: { delay: 800 }
    },
    {
      id: 'loading',
      label: '加载中',
      hint: 'loading=true：加载期间不再触发新的 load',
      values: { loading: true }
    },
    {
      id: 'disabled',
      label: '禁用',
      hint: 'disabled=true：滚动到任何位置都不会触发 load',
      values: { disabled: true }
    },
    {
      id: 'nested',
      label: '外层容器滚动',
      hint: '列表自身不滚动，由外层面板滚动触底：组件会向上寻找最近的可滚动祖先',
      values: {}
    }
  ],
  Splitter: [
    { id: 'base', label: '基础', values: {} },
    { id: 'vertical', label: '上下分栏', values: { layout: 'vertical' } },
    { id: 'lazy', label: '拖拽结束再更新', requires: 'splitter.lazy', values: { lazy: true } },
    { id: 'nested', label: '嵌套分栏（横竖同用）', hint: '外层左右分栏，左右面板内再嵌上下分栏', values: {} }
  ],
  SplitterPanel: [
    { id: 'base', label: '基础', values: {} },
    { id: 'size', label: '初始 40%', values: { size: '40%' } },
    { id: 'min', label: '最小 200px', values: { min: 200 } },
    { id: 'max', label: '最大 420px', values: { max: 420 } },

    {
      id: 'resizable',
      label: '可拖拽调整',
      requires: 'splitter.splitter-panel-draggable',
      values: { resizable: true }
    }
  ],
  Popover: [
    {
      id: 'custom-panel',
      label: '自定义面板样式',
      hint: 'className 追加 demo 类，style 作用于气泡面板',
      values: {
        content: '应用了自定义样式的气泡面板',
        width: 240,
        className: 'demo-popover-panel',
        style: { padding: '18px', background: '#eef2ff' }
      }
    }
  ]
}

export const EXTRA_SCENE_PRESETS: Record<string, ScenePreset[]> = {
  ...DISPLAY_PRESETS,
  ...FORM_PRESETS,
  ...DATA_PRESETS
}
