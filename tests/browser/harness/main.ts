import { createApp, defineComponent, h, reactive, ref } from 'vue'
import * as kit from '../../../dist/full/ui-kit.js'
import '../../../dist/full/ui-kit.css'

/**
 * 浏览器层探针页：happy-dom 里矩形恒为 0、没有真实合成器，
 * 定位翻转、列宽拖拽、色板拖拽、虚拟滚动、焦点顺序、控制台告警这些"只有真浏览器能证"的东西
 * 全部在这一页里按场景挂载，由 tests/browser/*.spec.ts 用 Playwright 驱动。
 *
 * 约定：场景靠 ?scene=<名字> 选择；需要回读的运行期事实（emit 载荷、内部状态）
 * 统一写到 window.__probe，用例只读不改。
 */

const probe: Record<string, any> = {}
;(window as unknown as Record<string, any>).__probe = probe
// 探针脚本在没有 Vue 依赖的页面上下文里也需要挂载组件
;(window as unknown as Record<string, any>).__vue = { h, createApp }
// 用例侧 page.evaluate 会被 Vitest 改写成 SSR 形式，里面不能写 import()，
// 因此把产物本身也挂到 window 上供扫描用
;(window as unknown as Record<string, any>).__kit = kit

const {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Menu,
  MenuItem,
  Popover,
  Tooltip,
  Select,
  Option: SelectOption,
  Table,
  TableColumn,
  ColorPicker,
  Input,
  InputNumber,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  Slider,
  Tabs,
  TabPane,
  Dialog,
  Drawer,
  Upload,
  DatePicker,
  TimePicker,
  Form,
  FormItem,
  Pagination,
  Tree,
  Carousel,
  CarouselItem,
  Affix,
  Backtop,
  Tour,
  TourStep
} = kit as Record<string, any>

function log(key: string) {
  return (value: unknown) => {
    probe[key] = value
  }
}

/** 非 full 产物按 profile 动态加载：裁剪包也要在真浏览器里冒烟一次（B3b-B2） */
const profileModules = import.meta.glob('../../../dist/*/ui-kit.js') as Record<string, () => Promise<any>>
const profileStyles = import.meta.glob('../../../dist/*/ui-kit.css') as Record<string, () => Promise<unknown>>

function sceneProfile(kitModule: any) {
  return () =>
    h('div', {}, [
      h(kitModule.Button, { id: 'profile-button' }, { default: () => 'Probe' }),
      h(kitModule.Input, { id: 'profile-input', modelValue: '探针文本', placeholder: '输入' }),
      h(kitModule.Tag, { id: 'profile-tag' }, { default: () => '标签' }),
      h(
        'div',
        { class: 'edge-bottom' },
        h(
          kitModule.Tooltip,
          { placement: 'bottom', content: '裁剪产物里的浮层', popperClass: 'panel-profile-tip' },
          { default: () => h(kitModule.Button, { id: 'profile-tip' }, { default: () => '浮层触发器' }) }
        )
      )
    ])
}

/** 浮层定位：贴边翻转、视口内夹取、滚动跟随 */
function sceneFloating() {
  const longOptions = Array.from({ length: 40 }, (_, index) => `选项 ${index + 1}`)

  // 每个实例都给独立的 popperClass：面板全部 teleport 到 body 下，
  // 用 .ui-select__dropdown 这类公共类名选到的是第一个实例，断言会指错对象
  return () =>
    h('div', {}, [
      // 常规流里的点击浮层：滚动时面板要跟着文档一起走（absolute 文档坐标）
      h(
        'div',
        { class: 'in-flow' },
        h(
          Popover,
          { trigger: 'click', placement: 'bottom', title: '随文档滚动', popperClass: 'panel-scroll', width: 200 },
          {
            default: () => h(Button, { id: 'pop-scroll' }, { default: () => '文档坐标 Popover' }),
            content: () => h('div', {}, '滚动页面时这个面板应当与触发器保持同样的相对位移')
          }
        )
      ),
      h(
        'div',
        { class: 'in-flow' },
        h(
          Tooltip,
          { placement: 'bottom', content: '悬停出现的提示' },
          { default: () => h(Button, { id: 'tip-flow' }, { default: () => '常规 Tooltip' }) }
        )
      ),
      h(
        'div',
        { class: 'in-flow' },
        h(
          Select,
          {
            modelValue: longOptions[0],
            'onUpdate:modelValue': log('selectValue'),
            style: 'width: 220px',
            id: 'select-flow',
            popperClass: 'panel-select-flow'
          },
          {
            default: () =>
              longOptions.map((item) => h(SelectOption, { value: item, label: item }, { default: () => item }))
          }
        )
      ),
      // 贴视口下沿：bottom 方位放不下必须翻到上方
      h(
        'div',
        { class: 'edge-bottom' },
        h(
          Tooltip,
          { placement: 'bottom', content: '贴在视口下沿的提示，应当翻到上方', popperClass: 'panel-tip-bottom' },
          { default: () => h(Button, { id: 'tip-bottom' }, { default: () => '下贴边 Tooltip' }) }
        )
      ),
      // 贴右沿：宽面板必须整体留在视口内（翻到左侧）
      h(
        'div',
        { class: 'edge-right' },
        h(
          Popover,
          { placement: 'right', trigger: 'click', title: '右贴边', width: 320, popperClass: 'panel-pop-right' },
          {
            default: () => h(Button, { id: 'pop-right' }, { default: () => '右贴边 Popover' }),
            content: () => h('div', {}, '内容足够宽，右侧放不下时应整体留在视口内')
          }
        )
      ),
      h(
        'div',
        { class: 'edge-right-2' },
        h(
          Dropdown,
          { trigger: 'click', popperClass: 'panel-drop-right' },
          {
            default: () => h(Button, { id: 'drop-right' }, { default: () => '右贴边 Dropdown' }),
            dropdown: () =>
              h(
                DropdownMenu,
                {},
                {
                  default: () => [
                    h(DropdownItem, {}, { default: () => '非常长的一条菜单项，用来撑出宽度以触发夹取' }),
                    h(DropdownItem, {}, { default: () => '第二条' })
                  ]
                }
              )
          }
        )
      ),
      h(
        'div',
        { class: 'edge-right-3' },
        h(
          Select,
          {
            modelValue: longOptions[0],
            'onUpdate:modelValue': log('selectValue'),
            style: 'width: 180px',
            id: 'select-right',
            popperClass: 'panel-select-right'
          },
          {
            default: () =>
              longOptions.map((item) => h(SelectOption, { value: item, label: item }, { default: () => item }))
          }
        )
      ),
      h('div', { class: 'tall-page' })
    ])
}

/** 表格：表头固定、冻结列、列宽拖拽、合计行 */
function sceneTable() {
  const rows = Array.from({ length: 200 }, (_, index) => ({
    id: index + 1,
    name: `行 ${index + 1}`,
    owner: index % 3 === 0 ? '张三' : '李四',
    amount: (index + 1) * 137,
    note: `备注 ${index + 1}`
  }))

  return () =>
    h(
      'div',
      { style: 'width: 720px' },
      h(
        Table,
        {
          data: rows,
          height: 320,
          showSummary: true,
          resizable: true,
          minColumnWidth: 80,
          id: 'probe-table',
          style: 'width: 100%',
          'onResize-change': log('resize')
        },
        {
          default: () => [
            h(TableColumn, { prop: 'id', label: '编号', width: 90, fixed: 'left' }),
            h(TableColumn, { prop: 'name', label: '名称', minWidth: 160 }),
            h(TableColumn, { prop: 'owner', label: '负责人', width: 120 }),
            h(TableColumn, { prop: 'amount', label: '金额', width: 120 }),
            h(TableColumn, { prop: 'note', label: '备注', minWidth: 240 }),
            h(TableColumn, { prop: 'id', label: '右冻结', width: 110, fixed: 'right' })
          ]
        }
      )
    )
}

/** 宽容器铺满：列宽总和小于容器，验证表格留 1px 余量避免缩放时小数像素露出横向滚动条 */
function sceneTableFit() {
  const rows = Array.from({ length: 8 }, (_, index) => ({
    id: index + 1,
    name: `行 ${index + 1}`,
    owner: index % 2 ? '李四' : '张三',
    amount: (index + 1) * 100,
    note: `备注 ${index + 1}`
  }))

  return () =>
    h(
      'div',
      { style: 'width: 900px' },
      h(
        Table,
        { data: rows, height: 200, id: 'probe-table-fit', style: 'width: 100%' },
        {
          default: () => [
            h(TableColumn, { prop: 'id', label: '编号', width: 90 }),
            h(TableColumn, { prop: 'name', label: '名称', width: 200 }),
            h(TableColumn, { prop: 'owner', label: '负责人', width: 120 }),
            h(TableColumn, { prop: 'amount', label: '金额', width: 120 }),
            h(TableColumn, { prop: 'note', label: '备注', width: 260, minWidth: 120 })
          ]
        }
      )
    )
}

/** 树形大数据：展开一层的耗时（性能回归口径与消费者 demo 一致） */
function sceneTree() {
  function build(prefix: string, depth: number): any[] {
    if (depth === 0) {
      return []
    }
    return Array.from({ length: 10 }, (_, index) => {
      const id = `${prefix}-${index + 1}`
      return { id, label: `节点 ${id}`, children: build(id, depth - 1) }
    })
  }

  const data = ref(build('r', 4))
  // 单节点 5000 子项：还原"树形大数据"示例里点一下卡很久的场景
  const wide = ref([
    {
      id: 'wide',
      label: '宽节点 wide',
      children: Array.from({ length: 5000 }, (_, index) => ({ id: `w-${index + 1}`, label: `子节点 ${index + 1}` }))
    }
  ])

  return () =>
    h('div', {}, [
      h(
        'div',
        { style: 'width: 420px; height: 320px; overflow: auto', id: 'tree-box' },
        h(Tree, { data: data.value, props: { label: 'label', children: 'children' }, 'onNode-click': log('treeNode') })
      ),
      h(
        'div',
        { style: 'width: 420px; height: 320px; overflow: auto', id: 'tree-wide-box' },
        h(Tree, { data: wide.value, props: { label: 'label', children: 'children' } })
      )
    ])
}

/** 颜色：SV 区与色相条拖拽 */
function sceneColor() {
  const value = ref('#e64b4b')
  return () =>
    h('div', {}, [
      h(ColorPicker, {
        modelValue: value.value,
        'onUpdate:modelValue': (next: string) => {
          value.value = next
          log('color')(next)
        },
        id: 'probe-color'
      })
    ])
}

/** 键盘与焦点：下拉、菜单、标签页、对话框 */
function sceneA11y() {
  const dialogVisible = ref(false)
  const tab = ref('a')
  const checked = ref(false)
  const input = ref('')

  return () =>
    h('div', {}, [
      h(Input, {
        modelValue: input.value,
        'onUpdate:modelValue': (value: string) => {
          input.value = value
        },
        placeholder: '姓名',
        'aria-label': '姓名',
        id: 'a11y-input'
      }),
      h(
        Checkbox,
        { modelValue: checked.value, 'onUpdate:modelValue': (value: boolean) => (checked.value = value) },
        { default: () => '同意条款' }
      ),
      h('br'),
      h(
        Dropdown,
        { trigger: 'click', popperClass: 'panel-a11y-drop' },
        {
          default: () => h(Button, { id: 'a11y-dropdown' }, { default: () => '更多操作' }),
          dropdown: () =>
            h(
              DropdownMenu,
              {},
              {
                default: () => [
                  h(DropdownItem, {}, { default: () => '复制' }),
                  h(DropdownItem, {}, { default: () => '删除' })
                ]
              }
            )
        }
      ),
      h(
        Menu,
        { mode: 'horizontal', defaultActive: 'home' },
        {
          default: () => [
            h(MenuItem, { index: 'home' }, { default: () => '首页' }),
            h(MenuItem, { index: 'doc' }, { default: () => '文档' })
          ]
        }
      ),
      h(
        Tabs,
        { modelValue: tab.value, 'onUpdate:modelValue': (value: string) => (tab.value = value) },
        {
          default: () => [
            h(TabPane, { label: '甲', name: 'a' }, { default: () => '甲内容' }),
            h(TabPane, { label: '乙', name: 'b' }, { default: () => '乙内容' })
          ]
        }
      ),
      h(Button, { id: 'a11y-dialog', onClick: () => (dialogVisible.value = true) }, { default: () => '打开对话框' }),
      h(
        Dialog,
        {
          modelValue: dialogVisible.value,
          'onUpdate:modelValue': (value: boolean) => (dialogVisible.value = value),
          title: '确认',
          closeOnPressEscape: true,
          popperClass: 'panel-a11y-dialog'
        },
        {
          default: () => h('p', {}, '对话框正文')
        }
      ),
      h(Slider, { modelValue: 30, style: 'width: 240px' }),
      h(InputNumber, { modelValue: 5, min: 0, max: 10 }),
      h(
        RadioGroup,
        { modelValue: 'x' },
        {
          default: () => [
            h(Radio, { value: 'x' }, { default: () => 'X' }),
            h(Radio, { value: 'y' }, { default: () => 'Y' })
          ]
        }
      ),
      h(Switch, { modelValue: true }),
      h(Pagination, { total: 200, pageSize: 10, currentPage: 1 }),
      h(Upload, { action: '#', fileList: [] }, { default: () => h(Button, {}, { default: () => '上传' }) }),
      h(DatePicker, { modelValue: '', placeholder: '选择日期' }),
      h(
        Carousel,
        { loop: false },
        {
          default: () => [
            h(CarouselItem, { name: 'a' }, { default: () => 'A' }),
            h(CarouselItem, { name: 'b' }, { default: () => 'B' })
          ]
        }
      ),
      h(Drawer, { modelValue: false, title: '抽屉' }, { default: () => h('p', {}, '抽屉正文') })
    ])
}

/**
 * 全家桶：把每一个对外导出的组件都按默认属性渲染一遍，控制台必须一声不响。
 *
 * GALLERY_SKIP 里只放"脱离父上下文就无法合法实例化"的复合片段：
 * CollectionItem 的 item 是 required prop，单独挂载必然告警，
 * 它由 Collection 用例覆盖，不该混进这条全局静默门禁。
 */
const GALLERY_SKIP = ['CollectionItem']

function sceneGallery() {
  const names = Object.keys(kit).filter(
    (name) =>
      /^[A-Z]/.test(name) &&
      !name.startsWith('DEFAULT_') &&
      name !== 'UI_ICONS' &&
      !name.startsWith('active') &&
      !GALLERY_SKIP.includes(name)
  )
  probe.galleryNames = names

  return () =>
    h(
      'div',
      {},
      names.map((name) =>
        h(
          defineComponent({
            name: `Gallery${name}`,
            render: () =>
              h('div', { 'data-gallery': name, class: 'inline-block' }, h(kit[name as keyof typeof kit], {}))
          }),
          { key: name }
        )
      )
    )
}

/** 固钉 / 回顶 / 引导：吸附状态、容器内贴边、平滑滚动与目标贴靠都依赖真实滚动与矩形 */
function sceneSticky() {
  return () =>
    h('div', {}, [
      // 顶部留白：滚动前 sentinel 在 offset 之下，滚动越过后才吸附
      h('div', { style: 'height: 220px' }),
      h('div', { style: 'width: 300px' }, [
        h(
          Affix,
          { id: 'probe-affix', offset: 24, zIndex: 1200 },
          {
            default: () =>
              h(
                'div',
                {
                  id: 'affix-content',
                  style:
                    'box-sizing: border-box; width: 300px; height: 48px; display: flex; align-items: center; padding: 0 16px; background: #fff; border: 1px solid #d0d7de'
                },
                '固钉内容'
              )
          }
        )
      ]),
      h('div', { style: 'height: 900px' }),
      // 容器内回顶：按钮用 calc 贴住容器可视区右下角
      h(
        'div',
        {
          id: 'backtop-box',
          style:
            'position: relative; margin-left: 80px; width: 520px; height: 300px; overflow: auto; border: 1px solid #ccc'
        },
        [
          h('div', { style: 'height: 900px; padding: 12px' }, '容器内滚动内容'),
          h(Backtop, { id: 'probe-backtop-box', target: '#backtop-box', right: 20, bottom: 20, visibilityHeight: 80 })
        ]
      ),
      h('div', { style: 'height: 900px' }),
      // 窗口回顶：真实平滑滚动
      h(Backtop, { id: 'probe-backtop-window', visibilityHeight: 400 }),
      h('div', { style: 'height: 1200px' }),
      // 引导目标用 fixed 定位：scrollIntoView 关掉后坐标不随页面滚动变化
      h(
        'div',
        {
          id: 'tour-target',
          style:
            'position: fixed; left: 320px; top: 200px; width: 200px; height: 64px; background: #eef; border: 1px solid #99c'
        },
        '引导目标'
      ),
      h(
        Tour,
        {
          modelValue: true,
          current: 0,
          offset: 16,
          gap: { padding: 8, offset: 4, radius: 6 },
          mask: { color: 'rgba(0, 0, 0, 0.5)' },
          scrollIntoViewOptions: false
        },
        {
          default: () => [
            h(TourStep, { title: '第一步', target: '#tour-target', placement: 'right' }),
            h(TourStep, { title: '第二步', target: '#tour-target', placement: 'bottom' })
          ]
        }
      )
    ])
}

/**
 * TimePicker 场景契约：happy-dom 里没有真实焦点链与合成指针，
 * "点输入框会不会收起面板""输入未回车就点列项会不会写回两次"这类问题
 * 只有真浏览器能证。三个实例分别覆盖默认格式、自定义显示格式、区间格式。
 * 写回载荷统一落进 probe，用例只读不改。
 */
function sceneTimePicker() {
  const main = ref<string>('09:24:36')
  const formatted = ref<string>('09:24:36')
  const range = ref<string[]>(['09:00', '10:00'])
  const mainEmits: string[] = []
  const rangeEmits: string[][] = []

  return () =>
    h('div', { class: 'time-picker-scene' }, [
      h(TimePicker, {
        id: 'scene-time-picker',
        popperClass: 'scene-tp-panel',
        modelValue: main.value,
        'onUpdate:modelValue': (next: string) => {
          main.value = next
          mainEmits.push(next)
          probe.tpValue = next
          probe.tpEmits = [...mainEmits]
        }
      }),
      h(TimePicker, {
        id: 'scene-time-picker-formatted',
        popperClass: 'scene-tp-panel-formatted',
        format: 'HH 点 mm 分',
        modelValue: formatted.value,
        'onUpdate:modelValue': (next: string) => {
          formatted.value = next
          probe.fmtValue = next
        }
      }),
      h(TimePicker, {
        id: ['scene-time-picker-range-start', 'scene-time-picker-range-end'],
        popperClass: 'scene-tp-panel-range',
        isRange: true,
        modelValue: range.value,
        'onUpdate:modelValue': (next: string[]) => {
          range.value = next
          rangeEmits.push(next)
          probe.rangeValue = next
          probe.rangeEmits = [...rangeEmits]
        }
      }),
      // 固定在右上角：浮层从左上触发器向下展开，绝不会盖住"点外部"的落点
      h(
        'button',
        {
          id: 'scene-time-picker-outside',
          type: 'button',
          style: { position: 'fixed', top: '8px', right: '8px' }
        },
        '外部区域'
      )
    ])
}

/**
 * Form 场景契约：F-93 之后 blur 通路由 focusout 冒泡承载，happy-dom 没有真实焦点链，
 * "trigger 为 blur 的规则输入过程中不报错、失焦才报错"只有真浏览器能证。
 * name 走 change（输入即校验），email 走 blur（失焦才校验），互相印证不牵连。
 */
function sceneForm() {
  const model = reactive({ name: '', email: '' })
  const emailRules = [
    { required: true, message: '邮箱必填', trigger: 'blur' },
    { pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: '邮箱格式不正确', trigger: 'blur' }
  ]
  return () =>
    h('div', { class: 'form-scene' }, [
      h(
        Form,
        {
          model,
          rules: {
            name: [{ required: true, message: '姓名必填', trigger: 'change' }],
            email: emailRules
          }
        },
        {
          default: () => [
            h(
              FormItem,
              { prop: 'name', label: '姓名' },
              {
                default: () =>
                  h(Input, {
                    id: 'scene-form-name',
                    modelValue: model.name,
                    'onUpdate:modelValue': (value: string) => {
                      model.name = value
                    }
                  })
              }
            ),
            h(
              FormItem,
              { prop: 'email', label: '邮箱' },
              {
                default: () =>
                  h(Input, {
                    id: 'scene-form-email',
                    modelValue: model.email,
                    'onUpdate:modelValue': (value: string) => {
                      model.email = value
                    }
                  })
              }
            )
          ]
        }
      ),
      h(
        'button',
        {
          id: 'scene-form-outside',
          type: 'button',
          style: { position: 'fixed', top: '8px', right: '8px' }
        },
        '外部区域'
      )
    ])
}

const scenes: Record<string, () => any> = {
  'time-picker': sceneTimePicker(),
  form: sceneForm(),
  floating: sceneFloating(),
  table: sceneTable(),
  'table-fit': sceneTableFit(),
  tree: sceneTree(),
  color: sceneColor(),
  a11y: sceneA11y(),
  gallery: sceneGallery(),
  sticky: sceneSticky()
}

const params = new URLSearchParams(window.location.search)
const requested = params.get('scene') ?? 'floating'
const profile = params.get('profile')
const scene = scenes[requested]
probe.ready = false

async function boot() {
  try {
    if (profile) {
      const loadJs = profileModules[`../../../dist/${profile}/ui-kit.js`]
      const loadCss = profileStyles[`../../../dist/${profile}/ui-kit.css`]
      if (!loadJs) {
        probe.error = `dist/${profile} 缺少产物，请先 npm run build:all`
        return
      }
      await loadCss?.()
      const kitModule = await loadJs()
      createApp({ render: sceneProfile(kitModule) }).mount('#app')
    } else if (!scene) {
      probe.error = `未知场景 ${requested}`
      return
    } else {
      createApp({ render: scene }).mount('#app')
    }
  } catch (error) {
    probe.error = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error)
    return
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      probe.ready = true
    })
  })
}

boot()
