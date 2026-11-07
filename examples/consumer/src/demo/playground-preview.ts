import {
  computed,
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
  type Component,
  type ComponentPublicInstance,
  type PropType,
  type VNode,
  type VNodeChild
} from 'vue'
import * as ANTD_KIT from '@demo/ui-kit-antd'
import * as BRANDED_KIT from '@demo/ui-kit-branded'
import * as CORE_KIT from '@demo/ui-kit-core'
import * as CUTE_KIT from '@demo/ui-kit-cute'
import * as FULL_KIT from '@demo/ui-kit-full'
import { FORM_CITY_OPTIONS } from './form-data'
import { SAMPLE_AVATAR_LIST, SAMPLE_PHOTOS } from './sample-image'
import { TableColumnDemo, TableSceneDemo } from './table-demo'

type SampleSlot = (scope?: Record<string, unknown>) => VNodeChild
type SampleSlots = Record<string, SampleSlot>
type KitModule = Record<string, Component | undefined>

function formModelFrom(scope?: Record<string, unknown>): Record<string, unknown> | undefined {
  const model = scope?.model
  return model && typeof model === 'object' ? (model as Record<string, unknown>) : undefined
}

function updateFormField(model: Record<string, unknown> | undefined, key: string, value: unknown): void {
  if (model) {
    model[key] = value
  }
}

const STATIC_KITS: Record<string, KitModule> = {
  core: CORE_KIT as unknown as KitModule,
  full: FULL_KIT as unknown as KitModule,
  branded: BRANDED_KIT as unknown as KitModule,
  cute: CUTE_KIT as unknown as KitModule,
  antd: ANTD_KIT as unknown as KitModule
}

const DYNAMIC_KITS = shallowRef<Record<string, KitModule>>({})

export function hasStaticKit(packageId: string): boolean {
  return packageId in STATIC_KITS
}

export function resolveKitComponent(packageId: string, name: string): Component | undefined {
  const module = DYNAMIC_KITS.value[packageId] ?? STATIC_KITS[packageId] ?? STATIC_KITS.full
  return module[name]
}

export function registerKit(packageId: string, module: KitModule): void {
  DYNAMIC_KITS.value = { ...DYNAMIC_KITS.value, [packageId]: module }
  SLOT_CACHE.delete(packageId)
}

const EVENT_PROPS: Record<string, string> = {
  'onUpdate:modelValue': 'modelValue',
  'onUpdate:visible': 'visible',
  'onUpdate:currentPage': 'currentPage',
  'onUpdate:current': 'current',
  'onUpdate:pageSize': 'pageSize',
  'onUpdate:value': 'value'
}

type UploadTriggerKind = 'builtin' | 'button' | 'custom'

// 场景决定触发器来源：builtin 用组件自带拖拽区/图片卡片，button 注入按钮插槽，custom 由消费方完全自定义
const UPLOAD_TRIGGER_KIND: Record<string, UploadTriggerKind> = {
  drag: 'builtin',
  'picture-card': 'builtin',
  custom: 'custom'
}

function uploadTriggerKind(sceneId: string): UploadTriggerKind {
  return UPLOAD_TRIGGER_KIND[sceneId] ?? 'button'
}

const ImageViewerGallery = defineComponent({
  name: 'ImageViewerGallery',
  setup() {
    const activeIndex = shallowRef(0)

    function selectPhoto(index: number): void {
      activeIndex.value = index
    }

    return () => {
      const activePhoto = SAMPLE_PHOTOS[activeIndex.value]
      return h('div', { class: 'pg-viewer-gallery' }, [
        h('figure', { class: 'pg-viewer-gallery__stage' }, [
          h('img', {
            class: 'pg-viewer-gallery__photo',
            src: activePhoto.src,
            alt: activePhoto.title,
            width: 1200,
            height: 800
          }),
          h('figcaption', { class: 'pg-viewer-gallery__caption' }, [
            h('span', { class: 'pg-viewer-gallery__title' }, activePhoto.title),
            h('span', { class: 'pg-viewer-gallery__meta' }, `${activeIndex.value + 1} / ${SAMPLE_PHOTOS.length}`)
          ])
        ]),
        h(
          'div',
          { class: 'pg-viewer-gallery__thumbs' },
          SAMPLE_PHOTOS.map((photo, index) =>
            h(
              'button',
              {
                type: 'button',
                class: ['pg-viewer-gallery__thumb', index === activeIndex.value ? 'is-active' : null],
                'aria-label': `查看第 ${index + 1} 张：${photo.title}`,
                'aria-pressed': index === activeIndex.value,
                onClick: () => selectPhoto(index)
              },
              [
                h('img', {
                  src: photo.thumbnail,
                  alt: photo.title,
                  width: 320,
                  height: 213
                })
              ]
            )
          )
        )
      ])
    }
  }
})

const SELECT_ASYNC_DELAY = 1500

const SelectLoadingDemo = defineComponent({
  name: 'SelectLoadingDemo',
  props: {
    select: { type: Object as PropType<Component>, required: true },
    values: { type: Object as PropType<Record<string, unknown>>, required: true }
  },
  setup(props) {
    const options = shallowRef<unknown[]>([])
    const loading = shallowRef(false)
    let timer: ReturnType<typeof setTimeout> | null = null

    function queueOptions(): void {
      if (timer) {
        clearTimeout(timer)
      }
      options.value = []
      loading.value = true
      timer = setTimeout(() => {
        options.value = Array.isArray(props.values.options) ? [...props.values.options] : []
        loading.value = false
        timer = null
      }, SELECT_ASYNC_DELAY)
    }

    function handleVisibleChange(visible: boolean): void {
      if (visible) {
        queueOptions()
      }
    }

    onBeforeUnmount(() => {
      if (timer) {
        clearTimeout(timer)
      }
    })

    return () =>
      h(props.select, {
        ...props.values,
        options: options.value,
        loading: loading.value,
        onVisibleChange: handleVisibleChange
      })
  }
})

const SplitterNestedDemo = defineComponent({
  name: 'SplitterNestedDemo',
  props: {
    splitter: { type: Object as PropType<Component>, required: true },
    panel: { type: Object as PropType<Component>, required: true }
  },
  setup(props) {
    function column(top: string, bottom: string): VNodeChild {
      return h(props.splitter, { layout: 'vertical' }, () => [
        h(props.panel, null, () => h('div', { class: 'pg-splitter-nested__cell' }, top)),
        h(props.panel, null, () => h('div', { class: 'pg-splitter-nested__cell' }, bottom))
      ])
    }

    return () =>
      h('div', { class: 'pg-splitter-nested' }, [
        h(props.splitter, null, () => [
          h(props.panel, { size: '50%' }, () => column('左上', '左下')),
          h(props.panel, null, () => column('右上', '右下'))
        ])
      ])
  }
})

type ContainerSkeleton = 'aside-main' | 'classic' | 'grail' | 'stack'

const CONTAINER_SCENE_SKELETON: Record<string, ContainerSkeleton> = {
  base: 'classic',
  aside: 'aside-main',
  grail: 'grail',
  'force-horizontal': 'stack',
  'force-vertical': 'aside-main',
  'tag-nav': 'classic'
}

function containerSkeleton(sceneId: string): ContainerSkeleton {
  return CONTAINER_SCENE_SKELETON[sceneId] ?? 'classic'
}

const ContainerDemo = defineComponent({
  name: 'ContainerDemo',
  props: {
    container: { type: Object as PropType<Component>, required: true },
    parts: { type: Object as PropType<Record<string, Component>>, required: true },
    values: { type: Object as PropType<Record<string, unknown>>, required: true },
    sceneId: { type: String, default: '' }
  },
  setup(props) {
    type Region = 'Aside' | 'Footer' | 'Header' | 'Main'

    function cell(region: Region, label: string, attrs: Record<string, unknown> = {}): VNode {
      return h(
        props.parts[region],
        { class: `pg-container-cell pg-container-cell--${region.toLowerCase()}`, ...attrs },
        () => label
      )
    }

    function nested(children: VNode[]): VNode {
      return h(props.container, { class: 'pg-container-inner' }, () => children)
    }

    function skeleton(kind: ContainerSkeleton): VNode[] {
      const aside = cell('Aside', 'Aside 侧栏')
      const main = cell('Main', 'Main 主体')
      const header = cell('Header', 'Header 顶栏')
      const footer = cell('Footer', 'Footer 底栏')
      if (kind === 'aside-main') {
        return [aside, main]
      }
      if (kind === 'stack') {
        return [header, main, footer]
      }
      if (kind === 'grail') {
        // 两侧同时占默认 300 宽会挤没主体，圣杯示例按演示需要收窄
        return [
          cell('Aside', '左 Aside', { width: 132 }),
          nested([header, main, footer]),
          cell('Aside', '右 Aside', { width: 132 })
        ]
      }
      return [header, nested([aside, main]), footer]
    }

    // 演示用的补充类名不依赖组件自身的 ui-container--vertical，换成自定义前缀的包也不会失效
    function demoClass(kind: ContainerSkeleton): string {
      if (kind === 'stack') {
        return 'pg-container-demo pg-container-demo--stack'
      }
      if (kind === 'aside-main' && String(props.values.direction ?? '') === 'vertical') {
        return 'pg-container-demo pg-container-demo--aside-vertical'
      }
      return 'pg-container-demo'
    }

    return () => {
      const kind = containerSkeleton(props.sceneId)
      return h(props.container, { ...props.values, class: demoClass(kind) }, () => skeleton(kind))
    }
  }
})

const LAYOUT_HOST_EXPORTS = new Set(['Aside', 'Footer', 'Header', 'Main'])

// 单个布局区块脱离容器时看不出宽高与内边距的实际效果，按典型用法包一层 Container 再渲染
function renderLayoutHost(
  kit: (name: string) => Component,
  exportName: string,
  attrs: Record<string, unknown>,
  slots: SampleSlots
): VNode {
  const suffix = exportName.toLowerCase()
  const region = h(
    kit(exportName),
    {
      ...attrs,
      class: `pg-container-cell pg-container-cell--${suffix}`
    },
    slots
  )
  const fillMain = h(kit('Main'), { class: 'pg-container-cell pg-container-cell--main' }, () => 'Main 主体')
  const sideAside = h(kit('Aside'), { class: 'pg-container-cell pg-container-cell--aside' }, () => 'Aside 侧栏')
  const innerRow = h(kit('Container'), { class: 'pg-container-inner' }, () => [sideAside, fillMain])
  if (exportName === 'Aside') {
    return h(kit('Container'), { key: attrs.key, class: 'pg-container-demo' }, () => [region, fillMain])
  }
  if (exportName === 'Main') {
    return h(kit('Container'), { key: attrs.key, class: 'pg-container-demo' }, () => [sideAside, region])
  }
  if (exportName === 'Header') {
    return h(kit('Container'), { key: attrs.key, class: 'pg-container-demo' }, () => [region, innerRow])
  }
  return h(kit('Container'), { key: attrs.key, class: 'pg-container-demo' }, () => [innerRow, region])
}

// 单独预览 Col 时把剩余栅格补成两侧参考列：同排占满 24，push / pull / offset 的相对位移才有参照，也不会被推出预览区
function renderColHost(kit: (name: string) => Component, attrs: Record<string, unknown>): VNode {
  const span = Number(attrs.span ?? 24)
  const rest = Math.max(0, 24 - span)
  const lead = Math.floor(rest / 2)
  const tail = rest - lead
  function cell(label: string): VNode {
    return h('div', { class: 'pg-row-cell' }, label)
  }
  const children: VNode[] = []
  if (lead > 0) {
    children.push(h(kit('Col'), { span: lead }, () => cell(`参考列 ${lead}`)))
  }
  children.push(h(kit('Col'), { ...attrs }, () => cell(`目标列 span ${span}`)))
  if (tail > 0) {
    children.push(h(kit('Col'), { span: tail }, () => cell(`参考列 ${tail}`)))
  }
  return h('div', { class: 'pg-row-demo' }, [h(kit('Row'), { key: String(attrs.key) }, () => children)])
}

interface EditablePaneItem {
  label: string
  name: string
}

// 场景只给 props，列骨架由这里决定：justify 要留出空白、align 要列高不同、纵向间距要有多行才看得出来
// 列宽合计必须小于 24，否则没有剩余空间，space-between / around / evenly 会渲染出一模一样的几何
const ROW_SCENE_COLS: Record<string, number[]> = {
  base: [12, 12],
  gutter: [8, 8, 8],
  'gutter-pair': [8, 8, 8, 8],
  center: [6, 6],
  end: [6, 6],
  between: [6, 6, 6],
  around: [6, 6, 6],
  evenly: [6, 6, 6],
  tag: [12, 12]
}

function rowGutterPair(value: unknown): [number, number] {
  if (Array.isArray(value)) {
    return [Number(value[0] ?? 0), Number(value[1] ?? 0)]
  }
  return [Number(value ?? 0), 0]
}

const RowDemo = defineComponent({
  name: 'RowDemo',
  props: {
    row: { type: Object as PropType<Component>, required: true },
    col: { type: Object as PropType<Component>, required: true },
    values: { type: Object as PropType<Record<string, unknown>>, required: true },
    sceneId: { type: String, default: '' }
  },
  setup(props) {
    // 色块放在列内部的单元里：列自身带 gutter 内填，若把背景打在列上，间距会被背景填平而看不出来
    function cell(span: number, lines: string[] = [], extra = ''): VNode {
      return h(props.col, { span }, () =>
        h('div', { class: ['pg-row-cell', extra] }, [
          h('div', null, `span ${span}`),
          ...lines.map((line) => h('div', { class: 'pg-row-cell__line' }, line))
        ])
      )
    }

    function skeleton(): VNodeChild {
      if (props.sceneId === 'align-middle' || props.sceneId === 'align-bottom') {
        return [cell(8, ['矮单元格']), cell(8, ['高单元格', '第三行内容']), cell(8, ['矮单元格'])]
      }
      if (props.sceneId === 'nested') {
        return [
          h(props.col, { span: 12 }, () => [
            h(props.row, { gutter: 12 }, () => [
              cell(12, [], 'pg-row-cell--inner'),
              cell(12, [], 'pg-row-cell--inner')
            ]),
            h('div', { class: 'pg-row-cell__line' }, '外层 span 12 内再嵌一行两列')
          ]),
          cell(12)
        ]
      }
      return (ROW_SCENE_COLS[props.sceneId] ?? [12, 12]).map((span) => cell(span))
    }

    function noteText(): string {
      const tag = String(props.values.tag ?? 'div')
      const justify = String(props.values.justify ?? 'start')
      const align = String(props.values.align ?? '拉伸')
      const [horizontal, vertical] = rowGutterPair(props.values.gutter)
      const gutter = vertical ? `${horizontal}px / ${vertical}px` : `${horizontal}px`
      return `根标签 ${tag} · justify ${justify} · align ${align} · gutter ${gutter}`
    }

    return () =>
      h('div', { class: 'pg-row-demo' }, [
        h(props.row, { ...props.values }, () => skeleton()),
        h('div', { class: 'pg-row-note' }, noteText())
      ])
  }
})

interface CollectionRow {
  id: string
  label: string
  desc: string
}

interface CollectionEntry {
  key: unknown
  id: string
  label: string
  desc: string
}

interface CollectionRegistry {
  itemRefs: Map<unknown, unknown>
  getItem: (item: unknown) => HTMLElement | null
}

// 注册表以数据对象的引用为 key，所以 item 必须用模块级常量：每次渲染新建字面量会让 getItem 查到的是已被丢弃的旧引用
const COLLECTION_ROWS: CollectionRow[] = [
  { id: 'coupon', label: '优惠券中心', desc: '满 100 减 20' },
  { id: 'flash', label: '限时秒杀', desc: '每日 10:00 开抢' },
  { id: 'points', label: '积分商城', desc: '积分兑换好物' },
  { id: 'group', label: '拼团专区', desc: '三人成团立减' },
  { id: 'live', label: '直播带货', desc: '主播专属券' },
  { id: 'fresh', label: '生鲜到家', desc: '30 分钟送达' },
  { id: 'brand', label: '大牌闪购', desc: '品牌官方直营' },
  { id: 'second', label: '第二件半价', desc: '同款可叠加' },
  { id: 'member', label: '会员专享', desc: '折上再 95 折' },
  { id: 'presale', label: '预售定金', desc: '定金十倍膨胀' }
]

const CollectionDemo = defineComponent({
  name: 'CollectionDemo',
  props: {
    collection: { type: Object as PropType<Component>, required: true },
    item: { type: Object as PropType<Component>, required: true },
    sceneId: { type: String, default: '' },
    // 单独预览 CollectionItem 时，被调试的子项用场景给的 item 对象，其余子项只作参照
    single: { type: Boolean, default: false },
    itemValue: { type: Object as PropType<Record<string, unknown> | null>, default: null }
  },
  setup(props) {
    const registryRef = shallowRef<ComponentPublicInstance | null>(null)
    const listRef = shallowRef<HTMLElement | null>(null)
    const registered = shallowRef(0)
    const locatedId = shallowRef('')
    const readout = shallowRef('点行尾「定位」：把数据对象交给 getItem，换回它注册的 DOM 实例')

    // 宿主按场景重建，所以初始行数在 setup 里取一次就够
    function sceneRows(): CollectionRow[] {
      if (props.sceneId === 'scroll') {
        return COLLECTION_ROWS
      }
      if (props.sceneId === 'grid') {
        return COLLECTION_ROWS.slice(0, 6)
      }
      return COLLECTION_ROWS.slice(0, 3)
    }

    const rows = shallowRef<CollectionRow[]>(sceneRows())

    function registry(): CollectionRegistry | null {
      return (registryRef.value as unknown as CollectionRegistry | null) ?? null
    }

    // itemRefs 是普通 Map，不是响应式来源，挂载与增删后都要重新数一次
    function refresh() {
      const api = registry()
      registered.value = api ? api.itemRefs.size : 0
    }

    onMounted(() => {
      nextTick(refresh)
    })

    function entries(): CollectionEntry[] {
      if (props.single) {
        const value = props.itemValue ?? {}
        const id = String(value.id ?? '匿名对象')
        return [
          { key: value, id: 'target', label: `目标子项（item.id = ${id}）`, desc: '这一项的 item 对象由场景给出' },
          { key: COLLECTION_ROWS[6], id: 'ref-brand', label: '参照子项', desc: '大牌闪购' },
          { key: COLLECTION_ROWS[7], id: 'ref-second', label: '参照子项', desc: '第二件半价' }
        ]
      }
      return rows.value.map((row) => ({ key: row, id: row.id, label: row.label, desc: row.desc }))
    }

    // 注册的是 display:contents 的包装节点，自身没有盒子，尺寸要问它的第一个子元素
    function boxOf(element: HTMLElement): Element {
      return element.firstElementChild ?? element
    }

    // 卡片的父级是 display:contents 的包装节点，可滚容器只有宿主这一层
    function centerInList(entry: Element) {
      const list = listRef.value
      if (!list) {
        return
      }
      const box = entry.getBoundingClientRect()
      const offset = box.top - list.getBoundingClientRect().top
      list.scrollTop += offset - list.clientHeight / 2 + box.height / 2
    }

    function locate(entry: CollectionEntry) {
      const api = registry()
      const element = api ? api.getItem(entry.key) : null
      if (!element) {
        locatedId.value = ''
        readout.value = `getItem(${entry.label}) → null：注册表认的是对象引用，这个对象没有登记过`
        return
      }
      locatedId.value = entry.id
      const box = boxOf(element)
      const rect = box.getBoundingClientRect()
      if (props.sceneId === 'scroll') {
        centerInList(box)
      }
      readout.value = `命中 ${element.tagName.toLowerCase()}（display:contents 自身 0×0）· 卡片 ${Math.round(rect.width)}×${Math.round(rect.height)} · 文本「${box.textContent?.trim().slice(0, 8) ?? ''}」`
    }

    // 内容相同、引用不同的对象查不到，这是按引用注册的边界，也是最常见的误用
    function locateClone() {
      const row = rows.value[0]
      const api = registry()
      const element = api ? api.getItem({ ...row }) : null
      locatedId.value = ''
      readout.value = element
        ? '同值新对象也命中了（与预期不符）'
        : `getItem({ id: '${row.id}', … }) → null：内容一模一样，但引用不同，注册表只认传进来的那个对象`
    }

    function addRow() {
      const used = new Set(rows.value.map((row) => row.id))
      const next = COLLECTION_ROWS.find((row) => !used.has(row.id))
      if (!next) {
        return
      }
      rows.value = [...rows.value, next]
      nextTick(refresh)
    }

    function removeRow() {
      if (rows.value.length <= 1) {
        return
      }
      rows.value = rows.value.slice(0, -1)
      locatedId.value = ''
      nextTick(refresh)
    }

    function listClass(): string {
      if (props.sceneId === 'grid') {
        return 'pg-collection__list pg-collection__list--grid'
      }
      if (props.sceneId === 'scroll') {
        return 'pg-collection__list pg-collection__list--scroll'
      }
      return 'pg-collection__list'
    }

    function guideText(): string {
      if (props.single) {
        return `子项自身是 display:contents 包装，不参与布局；换场景就是换一个 item 对象，注册表按引用重新登记`
      }
      if (props.sceneId === 'grid') {
        return '包装节点不产生盒子，卡片直接排进外层网格：两列布局里没有多一层壳'
      }
      if (props.sceneId === 'dynamic') {
        return '增删子项看注册数：卸载时 itemRefs 会删掉对应引用，不会越积越多'
      }
      if (props.sceneId === 'scroll') {
        return '长列表里按数据对象定位，命中后把该行滚到列表中央'
      }
      if (props.sceneId === 'identity') {
        return '定位用的是列表里那个对象本身；换成同值新对象就查不到了'
      }
      return '三项列表：每行右侧「定位」都会用数据对象反查它自己的 DOM'
    }

    return () =>
      h('div', { class: 'pg-collection' }, [
        h('div', { class: 'pg-collection__bar' }, [
          h('span', { class: 'pg-collection__stat' }, `已注册 ${registered.value} 项`),
          ...(props.sceneId === 'dynamic'
            ? [
                h('button', { class: 'pg-collection__tool', type: 'button', onClick: addRow }, '加一项'),
                h('button', { class: 'pg-collection__tool', type: 'button', onClick: removeRow }, '删末项')
              ]
            : []),
          ...(props.sceneId === 'identity'
            ? [h('button', { class: 'pg-collection__tool', type: 'button', onClick: locateClone }, '用同值新对象定位')]
            : [])
        ]),
        // Collection 自身不产生元素，栅格/滚动容器由宿主提供，子项的 display:contents 才能直接排进这个容器
        h('div', { class: listClass(), ref: listRef }, [
          h(props.collection, { ref: registryRef }, () =>
            entries().map((entry) =>
              h(props.item, { key: entry.id, item: entry.key as Record<string, any> }, () =>
                h('div', { class: ['pg-collection__row', entry.id === locatedId.value ? 'is-located' : ''] }, [
                  h('div', null, [
                    h('div', { class: 'pg-collection__label' }, entry.label),
                    h('div', { class: 'pg-collection__desc' }, entry.desc)
                  ]),
                  h('button', { class: 'pg-collection__tool', type: 'button', onClick: () => locate(entry) }, '定位')
                ])
              )
            )
          )
        ]),
        h('div', { class: 'pg-collection__log' }, readout.value),
        h('div', { class: 'pg-collection__note' }, guideText())
      ])
  }
})

interface TrapStop {
  kind: 'input' | 'button'
  text: string
}

// Tab 序列就是 DOM 序列：首位是活动名称输入框，末位是取消按钮，「从末位开始」要能一眼看出落点差别
const TRAP_STOPS: TrapStop[] = [
  { kind: 'input', text: '活动名称' },
  { kind: 'input', text: '备注' },
  { kind: 'button', text: '保存' },
  { kind: 'button', text: '取消' }
]

function trapIndexLabel(index: number, stop: TrapStop): string {
  return `陷阱内第 ${index + 1}/${TRAP_STOPS.length} 个控件（${stop.text}）`
}

interface TrapTabCase {
  trapped: boolean
  loop: boolean
  moved: boolean
  onContainer: boolean
  atEdge: boolean
}

function trapTabClause(test: TrapTabCase): string {
  if (!test.trapped) {
    return '（没动：trapped=false 时 FocusTrap 不挂监听，合成按键也等不到浏览器默认跳转）'
  }
  if (test.moved) {
    return '（FocusTrap 移动了焦点）'
  }
  if (test.onContainer) {
    return '（没动：容器既不在首位也不在末位，FocusTrap 不接管这一跳，真实 Tab 会按 DOM 顺序进第一个控件）'
  }
  if (test.atEdge) {
    return test.loop
      ? '（没动：已到边界却没能回到另一端，与 loop 的循环预期不符）'
      : '（没动：已到边界，loop=false 只 preventDefault，不把焦点转到另一端）'
  }
  return '（没动：这一跳不在首末位上，FocusTrap 不接管，靠的是浏览器默认 Tab 顺序，合成按键等不到）'
}

const FocusTrapDemo = defineComponent({
  name: 'FocusTrapDemo',
  props: {
    trap: { type: Object as PropType<Component>, required: true },
    values: { type: Object as PropType<Record<string, unknown>>, required: true },
    sceneId: { type: String, default: '' }
  },
  setup(props) {
    const rootRef = shallowRef<HTMLElement | null>(null)
    const panelRef = shallowRef<HTMLElement | null>(null)
    const trapApiRef = shallowRef<ComponentPublicInstance | null>(null)
    const extraRef = shallowRef<HTMLElement | null>(null)
    const beforeRef = shallowRef<HTMLElement | null>(null)
    const outsideRef = shallowRef<HTMLElement | null>(null)
    const focusLabel = shallowRef('未聚焦')
    const focusInside = shallowRef<boolean | null>(null)
    const pullBacks = shallowRef(0)
    const tabPresses = shallowRef(0)
    const log = shallowRef('先把焦点送到首位或末位再按模拟 Tab：FocusTrap 只在首、末位接管按键')

    const trapped = computed(() => props.values.trapped === true)
    const looping = computed(() => props.values.loop === true)
    const startTarget = computed(() => String(props.values.focusStartEl ?? 'first'))
    // focusTrapEl 是 HTMLElement，场景的 JSON 值表达不了，只能由宿主把自己画的面板注成边界
    const usesPanel = computed(() => props.sceneId === 'external')

    // 陷阱元素自身由宿主挂了类名，不靠组件库的 ui-* 类找它
    function zoneEl(): HTMLElement | null {
      return panelRef.value?.querySelector<HTMLElement>('.pg-trap__zone') ?? null
    }

    function boundaryEl(): HTMLElement | null {
      return usesPanel.value ? panelRef.value : zoneEl()
    }

    function stopEls(): HTMLElement[] {
      const zone = zoneEl()
      return zone ? Array.from(zone.querySelectorAll<HTMLElement>('input, button')) : []
    }

    // 陷阱算首末位用的是「边界元素里的可聚焦控件」，换了 focusTrapEl 之后首位就不是原来那个输入框了
    function boundaryStops(): HTMLElement[] {
      const boundary = boundaryEl()
      return boundary ? Array.from(boundary.querySelectorAll<HTMLElement>('input, button')) : []
    }

    function labelOf(element: Element | null): string {
      if (!element || element === document.body) {
        return '未聚焦'
      }
      if (element === extraRef.value) {
        return '面板内 · 陷阱元素外按钮'
      }
      if (element === outsideRef.value) {
        return '面板之后 · 陷阱外按钮'
      }
      if (element === beforeRef.value) {
        return '面板之前 · 陷阱外按钮'
      }
      if (element === zoneEl()) {
        return '陷阱容器自身（tabindex=-1）'
      }
      const index = stopEls().indexOf(element as HTMLElement)
      if (index >= 0) {
        return trapIndexLabel(index, TRAP_STOPS[index])
      }
      const tool = element.closest<HTMLElement>('.pg-trap__tool')
      if (tool) {
        return `工具按钮「${(tool.textContent ?? '').trim()}」`
      }
      return element.tagName.toLowerCase()
    }

    // 焦点环不写在 :focus 上：文档没拿到窗口焦点时浏览器不给 :focus 样式，宿主直接给当前焦点元素打标，读数才和画面一致
    function markFocused(target: HTMLElement | null) {
      const root = rootRef.value
      if (!root) {
        return
      }
      root.querySelectorAll<HTMLElement>('.pg-trap__focus').forEach((element) => {
        if (element !== target) {
          element.classList.remove('pg-trap__focus')
        }
      })
      target?.classList.add('pg-trap__focus')
    }

    function applyFocus(target: HTMLElement | null) {
      // 只认演示区域内的焦点：跑到侧边栏、页头去的时候读数应当是「未聚焦」，而不是报一个裸标签名
      const root = rootRef.value
      const real = target && target !== document.body && root?.contains(target) ? target : null
      markFocused(real)
      if (!real) {
        focusLabel.value = '未聚焦'
        focusInside.value = null
        return
      }
      focusLabel.value = labelOf(real)
      const boundary = boundaryEl()
      focusInside.value = boundary ? boundary.contains(real) : null
    }

    function trackFocus(event: FocusEvent) {
      applyFocus(event.target as HTMLElement | null)
    }

    // 页面没拿到窗口焦点时（后台标签页）程序化 focus 不派发 focus 事件，宿主动作后自己回读一次 activeElement
    function syncFocus() {
      applyFocus(document.activeElement as HTMLElement | null)
    }

    function focusStart() {
      const api = trapApiRef.value as unknown as { focusStart?: () => void } | null
      api?.focusStart?.()
      nextTick(syncFocus)
    }

    onMounted(() => {
      window.addEventListener('focusin', trackFocus, true)
      nextTick(() => {
        if (usesPanel.value) {
          // 首帧还没拿到面板，陷阱把焦点放在了控件 1；面板成为边界后重跑一次组件自己的 focusStart，落点才是真实的
          focusStart()
        } else {
          syncFocus()
        }
      })
    })

    watch(
      () => props.values.trapped,
      () => {
        // 父组件的 watch 先于子组件跑，直接 nextTick 会读到陷阱自己那次 focusStart 之前的旧焦点，所以再排一个微任务
        nextTick(() => {
          nextTick(syncFocus)
        })
      }
    )

    onBeforeUnmount(() => {
      window.removeEventListener('focusin', trackFocus, true)
    })

    // 工具条按下去不能把焦点抢走，否则测的就不是陷阱里的焦点了
    function keepFocus(event: MouseEvent) {
      event.preventDefault()
    }

    function sendFocusIn() {
      stopEls()[0]?.focus()
      syncFocus()
    }

    function sendFocusLast() {
      const stops = stopEls()
      stops[stops.length - 1]?.focus()
      syncFocus()
    }

    function sendFocusExtra() {
      moveFocusAway(extraRef.value)
    }

    function sendFocusOutside() {
      moveFocusAway(outsideRef.value)
    }

    // 后台标签页里浏览器不派发真实 focus 事件，这里补发一次 focusout，时序与真实点出去一致
    function moveFocusAway(target: HTMLElement | null) {
      if (!target) {
        return
      }
      const lost = document.activeElement as HTMLElement | null
      const counted = pullBacks.value
      target.focus()
      syncFocus()
      if (lost && lost !== target && pullBacks.value === counted) {
        lost.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: target }))
        nextTick(syncFocus)
      }
    }

    function handleTrapFocusOut(event: FocusEvent) {
      pullBacks.value += 1
      const from = labelOf(event.target as HTMLElement | null)
      log.value = `第 ${pullBacks.value} 次拦截：焦点想从「${from}」离开，FocusTrap 发出 focusout 并把它拉回起点`
    }

    function pressTab(shiftKey: boolean) {
      const active = document.activeElement as HTMLElement | null
      if (!active || !rootRef.value?.contains(active)) {
        log.value = '先把焦点送进示例里的任一控件，再按模拟 Tab'
        return
      }
      const from = labelOf(active)
      const stops = boundaryStops()
      const index = stops.indexOf(active)
      const atEdge = index >= 0 && (shiftKey ? index === 0 : index === stops.length - 1)
      const onContainer = active === zoneEl()
      tabPresses.value += 1
      active.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true }))
      nextTick(() => {
        // 陷阱自己挪焦点时后台标签页不派发 focus 事件，先回读一次再算落点，读数与日志才不会各说各话
        syncFocus()
        const to = labelOf(document.activeElement as HTMLElement | null)
        const clause = trapTabClause({
          trapped: trapped.value,
          loop: looping.value,
          moved: to !== from,
          onContainer,
          atEdge
        })
        log.value = `${shiftKey ? 'Shift+Tab' : 'Tab'}：${from} → ${to}${clause}`
      })
    }

    function propsLine(): string {
      const boundary = usesPanel.value ? '宿主面板（focusTrapEl）' : '陷阱 div 自身'
      return `trapped=${trapped.value} · loop=${looping.value} · focusStartEl=${startTarget.value} · 边界=${boundary}`
    }

    function zoneText(): string {
      if (focusInside.value === null) {
        return '—'
      }
      return focusInside.value ? '在当前边界内' : '已越出边界'
    }

    function guideText(): string {
      if (props.sceneId === 'edge') {
        return 'loop=false：焦点送到末位再按 Tab，事件被 preventDefault 但焦点不再移动——它钉在最后一个控件上，换个控件也出不去'
      }
      if (props.sceneId === 'start-last') {
        return '启用陷阱的那一刻焦点落在末位，之后每次被拉回也回末位；和「循环陷阱」（落首位）对照看落点差别'
      }
      if (props.sceneId === 'start-container') {
        return 'focusStartEl=container 把焦点放进陷阱 div 自己身上（tabindex=-1，不进 Tab 序列）：它既非首位也非末位，所以这一跳没人接管，真实按 Tab 才会顺 DOM 进第一个控件'
      }
      if (props.sceneId === 'external') {
        return 'focusTrapEl 被宿主指成整个面板：边界比陷阱 div 大一圈，「面板内·陷阱外」那个按钮成了循环的首位，Tab 到它不算越界、不会被拉回'
      }
      if (!trapped.value) {
        return 'trapped=false 时这层 div 只是普通容器：连监听都不挂，焦点自由进出，拉回次数永远是 0；在右侧勾上 trapped 立刻变成陷阱'
      }
      return '陷阱只在首末位接管：末位按 Tab 回首位、首位按 Shift+Tab 回末位，中间那些跳是浏览器默认 Tab 顺序的事；焦点想越界会被拉回起点'
    }

    function trapProps(): Record<string, unknown> {
      const extra: Record<string, unknown> = {
        class: 'pg-trap__zone',
        ref: trapApiRef,
        onFocusout: handleTrapFocusOut
      }
      if (usesPanel.value) {
        extra.focusTrapEl = panelRef.value ?? undefined
      }
      return { ...props.values, ...extra }
    }

    function stopNode(stop: TrapStop, index: number): VNode {
      const label = trapIndexLabel(index, stop)
      if (stop.kind === 'input') {
        return h('input', { class: 'pg-trap__input', type: 'text', placeholder: stop.text, 'aria-label': label })
      }
      return h('button', { class: 'pg-trap__btn', type: 'button' }, stop.text)
    }

    return () =>
      h('div', { class: ['pg-trap', trapped.value ? 'is-on' : ''], ref: rootRef }, [
        h('div', { class: 'pg-trap__bar' }, [
          h('span', { class: 'pg-trap__stat' }, propsLine()),
          h(
            'button',
            {
              class: 'pg-trap__tool',
              type: 'button',
              onMousedown: keepFocus,
              onClick: sendFocusIn
            },
            '焦点送首位'
          ),
          h(
            'button',
            {
              class: 'pg-trap__tool',
              type: 'button',
              onMousedown: keepFocus,
              onClick: sendFocusLast
            },
            '焦点送末位'
          ),
          h(
            'button',
            {
              class: 'pg-trap__tool',
              type: 'button',
              onMousedown: keepFocus,
              onClick: sendFocusExtra
            },
            '焦点送面板内陷阱外'
          ),
          h(
            'button',
            {
              class: 'pg-trap__tool',
              type: 'button',
              onMousedown: keepFocus,
              onClick: sendFocusOutside
            },
            '焦点送陷阱外'
          ),
          h(
            'button',
            {
              class: 'pg-trap__tool',
              type: 'button',
              onMousedown: keepFocus,
              onClick: () => pressTab(false)
            },
            '模拟 Tab'
          ),
          h(
            'button',
            {
              class: 'pg-trap__tool',
              type: 'button',
              onMousedown: keepFocus,
              onClick: () => pressTab(true)
            },
            '模拟 Shift+Tab'
          )
        ]),
        h('div', { class: 'pg-trap__lane' }, [
          h('span', { class: 'pg-trap__lane-text' }, '面板之前 · 恒在边界外'),
          h('button', { class: 'pg-trap__edge', type: 'button', ref: beforeRef }, '前置按钮')
        ]),
        h('div', { class: 'pg-trap__panel', ref: panelRef }, [
          h(
            'button',
            { class: 'pg-trap__edge pg-trap__edge--extra', type: 'button', ref: extraRef },
            '面板内 · 陷阱元素外'
          ),
          h(props.trap, trapProps(), () => [
            h('div', { class: 'pg-trap__stops' }, TRAP_STOPS.map(stopNode)),
            h('div', { class: 'pg-trap__lane-text' }, '以上四个控件在陷阱元素内部；这行说明不可聚焦，不参与循环')
          ])
        ]),
        h('div', { class: 'pg-trap__lane' }, [
          h('span', { class: 'pg-trap__lane-text' }, '面板之后 · 恒在边界外'),
          h('button', { class: 'pg-trap__edge', type: 'button', ref: outsideRef }, '后置按钮')
        ]),
        h('div', { class: 'pg-trap__read' }, [
          h('span', null, `当前焦点：${focusLabel.value}`),
          h('span', null, `位置：${zoneText()}`),
          h('span', null, `跳出被拉回：${pullBacks.value} 次`),
          h('span', null, `模拟按键：${tabPresses.value} 次`)
        ]),
        h('div', { class: 'pg-trap__log' }, log.value),
        h('div', { class: 'pg-trap__note' }, guideText())
      ])
  }
})

// 遮罩的盖住范围、谁压着谁、点击落到哪一个元素，全靠真实布局与命中测试，读数才有意义
const OVERLAY_RIVAL_ZINDEX = 10
const OVERLAY_OUT_OF_VIEW = '目标在视口外，滚到舞台再按坐标点（工具会自动滚进来）'

function centerOf(element: HTMLElement | null): { x: number; y: number } | null {
  if (!element) {
    return null
  }
  const rect = element.getBoundingClientRect()
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
}

// elementFromPoint 只认视口内坐标，中心点跑到视口外就没有命中可读。
// 视口尺寸取 clientWidth/clientHeight：innerWidth 含滚动条，按它判断会放行一个根本量不到坐标的点
function inViewport(point: { x: number; y: number } | null): boolean {
  if (!point) {
    return false
  }
  const page = document.documentElement
  return point.x >= 0 && point.x <= page.clientWidth && point.y >= 0 && point.y <= page.clientHeight
}

// 拦在中间的外来元素只报标签名等于没报，带上它的第一个类名才认得出是谁（属性调试抽屉、页面其他浮层等）
function firstClassName(element: Element): string {
  const cls = (element.getAttribute('class') || '').trim().split(/\s+/)[0]
  return cls || element.id || '无类名'
}

const OverlayDemo = defineComponent({
  name: 'OverlayDemo',
  props: {
    overlay: { type: Object as PropType<Component>, required: true },
    values: { type: Object as PropType<Record<string, unknown>>, required: true },
    sceneId: { type: String, default: '' }
  },
  setup(props) {
    const rootRef = shallowRef<HTMLElement | null>(null)
    const targetRef = shallowRef<HTMLElement | null>(null)
    const rivalRef = shallowRef<HTMLElement | null>(null)
    const open = shallowRef(true)
    const targetHits = shallowRef(0)
    const rivalHits = shallowRef(0)
    const eaten = shallowRef(0)
    const closedByMask = shallowRef(0)
    const blocked = shallowRef(0)
    const scopeText = shallowRef('—')
    const hitText = shallowRef('—')
    const log = shallowRef('按坐标点一下「舞台按钮」：遮罩开着时这一下被它吃掉，关掉遮罩再点才轮得到按钮')

    // Overlay 只有 zIndex 一个 prop，其余差异靠宿主注入：局部遮罩靠 attrs class，是否点空白关闭靠宿主绑不绑 onClick
    const localScope = computed(() => props.sceneId === 'local')
    const closable = computed(() => props.sceneId !== 'no-close')
    const withRival = computed(() => props.sceneId === 'z-low' || props.sceneId === 'z-high')
    const withCard = computed(() => props.sceneId === 'modal' || props.sceneId === 'no-close')
    const zIndexText = computed(() => {
      const value = props.values.zIndex
      return value === undefined ? '未传' : String(value)
    })

    function maskEl(): HTMLElement | null {
      return rootRef.value?.querySelector<HTMLElement>('.pg-ovl__mask') ?? null
    }

    function contentEl(): HTMLElement | null {
      return maskEl()?.querySelector<HTMLElement>('.pg-ovl__pill, .pg-ovl__card') ?? null
    }

    function hitLabel(element: Element | null): string {
      if (!element) {
        return '命中为空'
      }
      const mask = maskEl()
      if (mask && element !== mask && mask.contains(element)) {
        return '遮罩里的插槽内容'
      }
      if (element === mask) {
        return '遮罩空白处'
      }
      if (element === targetRef.value) {
        return '舞台按钮（没被遮住）'
      }
      if (element === rivalRef.value) {
        return `对照卡片（z-index=${OVERLAY_RIVAL_ZINDEX}，浮在遮罩上）`
      }
      return `页面其他元素（${element.tagName.toLowerCase()}.${firstClassName(element)}）`
    }

    // fixed 遮罩的 DOM 仍在 root 里，量矩形就能直接说出它盖住的是视口还是舞台
    function describe() {
      const mask = maskEl()
      if (!mask) {
        scopeText.value = '—'
        hitText.value = '—'
        return
      }
      const rect = mask.getBoundingClientRect()
      const page = document.documentElement
      const covers = rect.width >= page.clientWidth - 2 && rect.height >= page.clientHeight - 2
      scopeText.value = `${Math.round(rect.width)}×${Math.round(rect.height)}（${covers ? '盖住整个视口' : '只盖住舞台'}）`
      const point = centerOf(targetRef.value)
      hitText.value =
        point && inViewport(point) ? hitLabel(document.elementFromPoint(point.x, point.y)) : OVERLAY_OUT_OF_VIEW
    }

    // 真实鼠标只会点中命中测试最靠上的那个元素，这里按同一结果派发事件，等价于在那个坐标点一下
    function pressAt(element: HTMLElement | null, name: string): string {
      const first = centerOf(element)
      if (!first) {
        return `${name}：目标不存在`
      }
      if (!inViewport(first)) {
        // 页面写了 scroll-behavior: smooth，这里显式 instant 滚进来，滚完要重新量坐标
        element?.scrollIntoView({ block: 'center', behavior: 'instant' })
        // 后台标签页不派发 scroll 事件，滚完立刻补一次读数，命中才不会一直停在「视口外」
        describe()
      }
      const point = centerOf(element)
      const hit = point ? document.elementFromPoint(point.x, point.y) : null
      if (!hit) {
        return `${name}：坐标不在视口内`
      }
      const label = hitLabel(hit)
      hit.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      return `${name} → ${label}`
    }

    function pressTarget() {
      log.value = pressAt(targetRef.value, '按坐标点舞台按钮')
    }

    function pressRival() {
      log.value = pressAt(rivalRef.value, '按坐标点对照卡片')
    }

    function handleTargetClick() {
      targetHits.value += 1
    }

    function handleRivalClick() {
      rivalHits.value += 1
    }

    function handleMaskClick(event: MouseEvent) {
      const node = event.target as HTMLElement | null
      const content = contentEl()
      eaten.value += 1
      if (content && node && (node === content || content.contains(node))) {
        log.value = `第 ${eaten.value} 次点击落在遮罩的插槽内容上：内容自己收下，遮罩不该关`
        return
      }
      if (!closable.value) {
        blocked.value += 1
        log.value = `第 ${blocked.value} 次点击落在遮罩空白处：点不穿，但按 false 的语义不关闭`
        return
      }
      closedByMask.value += 1
      open.value = false
      log.value = `第 ${closedByMask.value} 次点击落在遮罩空白处：吃掉这一击并关掉遮罩，舞台按钮重新能被点中`
    }

    function handleCardClose(event: MouseEvent) {
      event.stopPropagation()
      open.value = false
      log.value = '卡片里的关闭按钮自己 stopPropagation 后关掉了遮罩'
    }

    function showMask() {
      open.value = true
      log.value = '遮罩已渲染：它没有 visible/modelValue 这类开关 prop，渲染与否由上层 v-if 决定'
    }

    function hideMask() {
      open.value = false
      log.value = '遮罩已从 DOM 卸载：被它压住的元素立刻恢复可点'
    }

    function resetCounters() {
      targetHits.value = 0
      rivalHits.value = 0
      eaten.value = 0
      closedByMask.value = 0
      blocked.value = 0
      log.value = '计数已清零'
    }

    // 读数取的是视口坐标，页面滚到舞台才测得到，所以滚动停下后补一次读数
    let scrollTimer: ReturnType<typeof setTimeout> | null = null

    function handleScroll() {
      if (scrollTimer) {
        return
      }
      scrollTimer = setTimeout(() => {
        scrollTimer = null
        describe()
      }, 160)
    }

    onMounted(() => {
      nextTick(describe)
      window.addEventListener('scroll', handleScroll, true)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('scroll', handleScroll, true)
      if (scrollTimer) {
        clearTimeout(scrollTimer)
      }
    })

    watch(open, () => {
      nextTick(describe)
    })

    function overlayProps(): Record<string, unknown> {
      const classes = ['pg-ovl__mask']
      if (localScope.value) {
        classes.push('pg-ovl--local')
      }
      return { ...props.values, class: classes, onClick: handleMaskClick }
    }

    function maskContent(): VNode[] {
      if (withCard.value) {
        return [
          h('div', { class: 'pg-ovl__card' }, [
            h('div', { class: 'pg-ovl__card-title' }, '遮罩上的内容'),
            h(
              'div',
              { class: 'pg-ovl__card-body' },
              closable.value
                ? 'Overlay 用 flex 把默认插槽居中；点卡片不会关，点卡片外的空白处才关。'
                : '这层点空白不关闭，要退出只能按下面这个关闭按钮 —— 和真实业务里必须点「取消」的弹窗是同一套做法。'
            ),
            h('button', { class: 'pg-ovl__card-btn', type: 'button', onClick: handleCardClose }, '关闭')
          ])
        ]
      }
      return [h('div', { class: 'pg-ovl__pill' }, '遮罩的插槽内容')]
    }

    function propsLine(): string {
      return `zIndex=${zIndexText.value} · 定位=${localScope.value ? '宿主 class 改成 absolute' : '默认 fixed'} · 点空白${closable.value ? '关闭' : '不关闭'}`
    }

    function guideText(): string {
      if (props.sceneId === 'z-low') {
        return `zIndex=1 时遮罩只比静态内容高：那张 z-index=${OVERLAY_RIVAL_ZINDEX} 的对照卡片浮在它上面，按坐标点卡片能真的点着，舞台按钮仍被遮。这就是遮罩必须由 z-index 管理器取号的原因`
      }
      if (props.sceneId === 'z-high') {
        return `zIndex=3000 时同一张 z-index=${OVERLAY_RIVAL_ZINDEX} 卡片被压在下面：按坐标点卡片命中的是遮罩。和「层级 1」两个场景只差这一个 prop`
      }
      if (props.sceneId === 'local') {
        return '消费者用 attrs class 把 position 改成 absolute，遮罩就从盖住视口变成盖住这个 position:relative 的舞台，页面其他地方照常能点、能滚动'
      }
      if (props.sceneId === 'modal') {
        return '默认插槽是放内容的地方：遮罩 flex 居中承载卡片，宿主按 event.target 区分「点内容」和「点空白」，只有空白处才关闭'
      }
      if (props.sceneId === 'no-close') {
        return '点遮罩空白处不关闭：点击照样被吃掉（舞台按钮计数恒为 0），只是这层不卸载 —— 业务侧的 close-on-click-modal=false 就是这么实现的。要退出只按卡片里的「关闭」'
      }
      return 'Overlay 只做一件事：盖住整块视口、压暗、吃掉落在它上面的点击。它没有 visible/modelValue，渲染与否由上层决定，所以这里用工具条的开合按钮代替 v-if。工具条是宿主抬到遮罩之上的唯一例外，不然整页被盖时连场景标签都点不到；侧边栏和场景标签这些是真的被压住'
    }

    function tool(name: string, action: () => void): VNode {
      return h('button', { class: 'pg-ovl__tool', type: 'button', onClick: action }, name)
    }

    return () =>
      h('div', { class: ['pg-ovl', open.value ? 'is-on' : ''], ref: rootRef }, [
        h('div', { class: 'pg-ovl__bar' }, [
          h('span', { class: 'pg-ovl__stat' }, propsLine()),
          tool(open.value ? '关闭遮罩' : '打开遮罩', open.value ? hideMask : showMask),
          tool('按坐标点舞台按钮', pressTarget),
          ...(withRival.value ? [tool('按坐标点对照卡片', pressRival)] : []),
          tool('清零计数', resetCounters)
        ]),
        h('div', { class: 'pg-ovl__stage' }, [
          h('div', { class: 'pg-ovl__text' }, '这块舞台是被遮的对象：底下这个按钮能不能点着，取决于遮罩有没有盖住它。'),
          h(
            'button',
            { class: 'pg-ovl__target', type: 'button', ref: targetRef, onClick: handleTargetClick },
            '舞台按钮'
          ),
          withRival.value
            ? h(
                'div',
                {
                  class: 'pg-ovl__rival',
                  style: { zIndex: OVERLAY_RIVAL_ZINDEX },
                  ref: rivalRef,
                  onClick: handleRivalClick
                },
                `对照卡片 z-index=${OVERLAY_RIVAL_ZINDEX}`
              )
            : null,
          open.value ? h(props.overlay, overlayProps(), maskContent) : null
        ]),
        h('div', { class: 'pg-ovl__read' }, [
          h('span', null, `遮罩：${open.value ? '已渲染' : '未渲染'}`),
          h('span', null, `矩形：${scopeText.value}`),
          h('span', null, `按钮位置命中：${hitText.value}`),
          h('span', null, `按钮收到：${targetHits.value} 次`),
          withRival.value ? h('span', null, `卡片收到：${rivalHits.value} 次`) : null,
          h('span', null, `被遮罩吃掉：${eaten.value} 次`),
          h('span', null, `点空白关闭：${closedByMask.value} 次 / 拦不关：${blocked.value} 次`)
        ]),
        h('div', { class: 'pg-ovl__log' }, log.value),
        h('div', { class: 'pg-ovl__note' }, guideText())
      ])
  }
})

// RovingFocusGroup 的产出全在 tabindex 和焦点位置上：不读这两样，页面上就是几个普通方块。
// 所以示例把「组内唯一 tab stop / tabindex 序列 / 焦点所在 / 被接管的按键」直接摊开，并放一组普通 div 做对照
const ROVING_BASE_IDS = ['a', 'b', 'c', 'd', 'e']
const ROVING_ITEMS = ['加粗', '斜体', '下划线', '删除线', '插入链接']
const ROVING_EXPORTS = ['RovingFocusGroup', 'RovingFocusItem']
const ROVING_READ_ITEMS = [
  { key: 'tabstop', label: 'tabindex=0' },
  { key: 'order', label: 'tabindex 序列' },
  { key: 'focus', label: '焦点所在' },
  { key: 'key', label: '最近按键' },
  { key: 'events', label: '焦点事件' },
  { key: 'arrow', label: '前后键换算' },
  { key: 'plain', label: '对照组' }
]

const RovingFocusDemo = defineComponent({
  name: 'RovingFocusDemo',
  props: {
    parts: { type: Object as PropType<Record<string, Component>>, required: true },
    focus: { type: String, default: 'RovingFocusGroup' },
    values: { type: Object as PropType<Record<string, unknown>>, required: true }
  },
  setup(props) {
    const hostRef = shallowRef<HTMLElement | null>(null)
    const orientation = shallowRef<'horizontal' | 'vertical'>('horizontal')
    const dir = shallowRef<'ltr' | 'rtl'>('ltr')
    const loop = shallowRef(true)
    const thirdUnfocusable = shallowRef(false)
    const secondActive = shallowRef(false)
    const keyLine = shallowRef('还没按过键')
    const focusCount = shallowRef(0)
    const blurCount = shallowRef(0)
    const lastEvent = shallowRef('—')
    const read = shallowRef<Record<string, string>>({})
    const log = shallowRef(
      '先点「聚焦 tab stop」，再按方向键：整组只有一项 tabindex=0，方向键把 tab stop 和焦点一起挪到邻项'
    )
    let previousFocus = ''

    // 场景 / 调试台的值优先于工具条，读数里回显的是最终生效值
    const groupValues = computed(() => {
      if (props.focus !== 'RovingFocusGroup') {
        return {}
      }
      const values = { ...props.values }
      delete values.key
      return values
    })

    const effective = computed(() => ({
      orientation: String(groupValues.value.orientation ?? orientation.value),
      dir: String(groupValues.value.dir ?? dir.value),
      loop: groupValues.value.loop === undefined ? loop.value : Boolean(groupValues.value.loop)
    }))

    // RovingFocusItem 的值只发给第一项，其余项各持固定 id，注册表才不会撞键
    const itemValues = computed(() => {
      if (props.focus !== 'RovingFocusItem') {
        return {}
      }
      const values = { ...props.values }
      delete values.key
      delete values.tabStopId
      return values
    })

    const itemIds = computed(() => {
      const wanted = props.focus === 'RovingFocusItem' ? String(props.values.tabStopId || 'a') : 'a'
      return [wanted, ...ROVING_BASE_IDS.filter((id) => id !== wanted)].slice(0, ROVING_ITEMS.length)
    })

    function itemProps(index: number): Record<string, unknown> {
      const result: Record<string, unknown> = { tabStopId: itemIds.value[index] }
      if (index === 1 && secondActive.value) {
        result.active = true
      }
      if (index === 2) {
        result.focusable = !thirdUnfocusable.value
      }
      if (index === 0) {
        Object.assign(result, itemValues.value)
      }
      return result
    }

    function itemEls(): HTMLElement[] {
      const host = hostRef.value
      return host ? Array.from(host.querySelectorAll<HTMLElement>('[data-roving-focus-item]')) : []
    }

    function idOf(element: HTMLElement | null): string {
      if (!element) {
        return ''
      }
      const item = element.closest<HTMLElement>('[data-roving-focus-item]')
      return item?.dataset.rovingFocusItem ?? ''
    }

    function forwardKey(): string {
      if (effective.value.orientation === 'vertical') {
        return 'ArrowDown'
      }
      return effective.value.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    }

    function backwardKey(): string {
      if (effective.value.orientation === 'vertical') {
        return 'ArrowUp'
      }
      return effective.value.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
    }

    function measure() {
      const host = hostRef.value
      if (!host) {
        return
      }
      const items = itemEls()
      const stops = items.filter((item) => item.getAttribute('tabindex') === '0')
      const active = document.activeElement as HTMLElement | null
      const inside = Boolean(active && host.contains(active))
      const next: Record<string, string> = {}
      next.tabstop = stops.length ? stops.map((item) => idOf(item)).join('、') : '无：整组进不了 Tab 序'
      next.order = items.map((item) => `${idOf(item)}:${item.getAttribute('tabindex') ?? '—'}`).join(' ')
      next.focus = inside ? idOf(active) || '组容器' : '不在组内'
      next.key = keyLine.value
      next.events = `item-focus ${focusCount.value} · item-blur ${blurCount.value} · 最近 ${lastEvent.value}`
      next.arrow = `前 ${forwardKey()} · 后 ${backwardKey()}`
      next.plain = `普通 div 组 ${host.querySelectorAll('.pg-rvg__plain-btn').length} 个可 Tab 停靠 · 组内 ${stops.length} 个`
      read.value = next
      previousFocus = inside ? idOf(active) : ''
      // 文档没拿到窗口焦点时 :focus-visible 不一定生效，宿主自己打标，画面才和读数一致
      for (const item of items) {
        item.classList.toggle('is-current', item.getAttribute('tabindex') === '0')
        item.classList.toggle('is-focused', Boolean(active && (item === active || item.contains(active))))
        item.classList.toggle('is-locked', !item.hasAttribute('tabindex'))
      }
    }

    function handleItemFocus(id: string) {
      focusCount.value += 1
      lastEvent.value = `item-focus ${id}`
      nextTick(measure)
    }

    function handleItemBlur(id: string) {
      blurCount.value += 1
      lastEvent.value = `item-blur ${id}`
      nextTick(measure)
    }

    function handleKeydown(event: KeyboardEvent) {
      // 冒泡到这里时组件的 keydown 已经跑完，defaultPrevented 才是最终态
      const after = idOf(document.activeElement as HTMLElement | null)
      keyLine.value = `${event.key} · ${event.defaultPrevented ? '组件已接管' : '未接管'} · ${previousFocus || '—'} → ${after || '—'}`
      nextTick(measure)
    }

    function stopEl(): HTMLElement | null {
      const items = itemEls()
      return (
        items.find((item) => item.getAttribute('tabindex') === '0') ??
        items.find((item) => item.hasAttribute('tabindex')) ??
        null
      )
    }

    function focusStop() {
      const target = stopEl()
      if (!target) {
        log.value = '组里没有带 tabindex 的项：所有项都被设成不可聚焦了'
        return
      }
      target.focus({ preventScroll: true })
      log.value = `焦点落到 ${idOf(target)}：真实按 Tab 时浏览器只会停在这一项，其余项要进组后才用方向键漫游`
      nextTick(measure)
    }

    function simulateKey(key: string) {
      const host = hostRef.value
      if (!host) {
        return
      }
      const active = document.activeElement as HTMLElement | null
      if (!active || !host.contains(active) || !idOf(active)) {
        stopEl()?.focus({ preventScroll: true })
      }
      const focused = document.activeElement as HTMLElement | null
      if (!focused || !host.contains(focused) || !idOf(focused)) {
        log.value = '没有可聚焦项，按键无处可派发'
        return
      }
      focused.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
      log.value = `在 ${idOf(focused)} 上派发 ${key}：看 tabindex 序列、焦点和 itemFocus 计数是否一起动`
      nextTick(measure)
    }

    function toggleOrientation() {
      orientation.value = orientation.value === 'horizontal' ? 'vertical' : 'horizontal'
      log.value = `方向改成${orientation.value === 'vertical' ? '纵向' : '横向'}：上下键接管，左右键不再响应`
      nextTick(measure)
    }

    function toggleDir() {
      dir.value = dir.value === 'ltr' ? 'rtl' : 'ltr'
      log.value = `${dir.value.toUpperCase()}：视觉顺序翻转，前后键左右互换`
      nextTick(measure)
    }

    function toggleLoop() {
      loop.value = !loop.value
      log.value = loop.value ? 'loop 打开：末项再往前会绕回第一项' : 'loop 关闭：末项再往前不动，焦点停在原地'
      nextTick(measure)
    }

    function toggleThird() {
      thirdUnfocusable.value = !thirdUnfocusable.value
      log.value = thirdUnfocusable.value
        ? '第 3 项 focusable=false：它没有 tabindex，方向键漫游会直接跳过它'
        : '第 3 项恢复可聚焦：tabindex 序列里重新出现 -1'
      nextTick(measure)
    }

    function toggleSecondActive() {
      secondActive.value = !secondActive.value
      log.value = secondActive.value
        ? '第 2 项 active=true：它无条件保留 tabindex=0，于是出现两个 0'
        : '第 2 项取消 active：tabindex=0 只剩当前 tab stop'
      nextTick(measure)
    }

    function resetCounters() {
      focusCount.value = 0
      blurCount.value = 0
      lastEvent.value = '—'
      keyLine.value = '还没按过键'
      log.value = '计数清零，tab stop 没动'
      nextTick(measure)
    }

    function handleFocusChange() {
      nextTick(measure)
    }

    onMounted(() => {
      const host = hostRef.value
      host?.addEventListener('focusin', handleFocusChange)
      host?.addEventListener('focusout', handleFocusChange)
      host?.addEventListener('keydown', handleKeydown)
      nextTick(measure)
    })

    onBeforeUnmount(() => {
      const host = hostRef.value
      host?.removeEventListener('focusin', handleFocusChange)
      host?.removeEventListener('focusout', handleFocusChange)
      host?.removeEventListener('keydown', handleKeydown)
    })

    watch([() => props.values, orientation, dir, loop, thirdUnfocusable, secondActive], () => {
      nextTick(measure)
    })

    function tool(name: string, action: () => void, active = false): VNode {
      return h('button', { class: ['pg-rvg__tool', active ? 'is-on' : ''], type: 'button', onClick: action }, name)
    }

    function statLine(): string {
      const source = Object.keys(groupValues.value).length ? ' · 场景值优先' : ''
      return `在测 ${props.focus} · ${effective.value.orientation === 'vertical' ? '纵向' : '横向'} · ${effective.value.dir.toUpperCase()} · loop ${effective.value.loop ? '开' : '关'}${source}`
    }

    function guideText(): string {
      if (props.focus === 'RovingFocusItem') {
        return 'item 的三个 props 全在 DOM 上：tabStopId = data-roving-focus-item（注册表的键），focusable=false 时干脆不写 tabindex（漫游跳过它），active=true 时无条件占着 tabindex=0（所以会同时出现两个 0）。把第 3 项设成不可聚焦，再按方向键，tabindex 序列里会直接越过它'
      }
      return '漫游焦点组的价值是「整组只占一个 Tab 停靠点」：组内永远只有一项 tabindex=0，方向键改的是这个 0 归属谁，并把焦点带过去。orientation 决定用上下还是左右，dir=rtl 再把左右对调，loop 决定到头是否回绕，Home/End 直接跳首末——这五件事都能在读数里对上'
    }

    return () =>
      h('div', { class: 'pg-rvg' }, [
        h('div', { class: 'pg-rvg__bar' }, [
          h('span', { class: 'pg-rvg__stat' }, statLine()),
          tool(
            orientation.value === 'vertical' ? '改横向' : '改纵向',
            toggleOrientation,
            orientation.value === 'vertical'
          ),
          tool(dir.value === 'rtl' ? '改 LTR' : '改 RTL', toggleDir, dir.value === 'rtl'),
          tool(loop.value ? 'loop 开' : 'loop 关', toggleLoop, loop.value),
          tool('第 3 项不可聚焦', toggleThird, thirdUnfocusable.value),
          tool('第 2 项 active', toggleSecondActive, secondActive.value),
          tool('清空记录', resetCounters)
        ]),
        h('div', { class: 'pg-rvg__bar' }, [
          tool('聚焦 tab stop', focusStop),
          tool('←', () => simulateKey('ArrowLeft')),
          tool('→', () => simulateKey('ArrowRight')),
          tool('↑', () => simulateKey('ArrowUp')),
          tool('↓', () => simulateKey('ArrowDown')),
          tool('Home', () => simulateKey('Home')),
          tool('End', () => simulateKey('End'))
        ]),
        h('div', { class: 'pg-rvg__host', ref: hostRef }, [
          h('div', { class: 'pg-rvg__caption' }, 'RovingFocusGroup：整组只有一个 Tab 停靠点，进组后用方向键漫游'),
          h(
            props.parts.RovingFocusGroup,
            {
              ...groupValues.value,
              // 工具条状态也要下发给组件，否则开关只改了读数，漫游行为还是默认值
              orientation: effective.value.orientation,
              dir: effective.value.dir,
              loop: effective.value.loop,
              class: [
                'pg-rvg__group',
                effective.value.orientation === 'vertical' ? 'is-vertical' : '',
                effective.value.dir === 'rtl' ? 'is-rtl' : ''
              ],
              onItemFocus: handleItemFocus,
              onItemBlur: handleItemBlur
            },
            () =>
              ROVING_ITEMS.map((label, index) => {
                const id = itemIds.value[index]
                return h(
                  props.parts.RovingFocusItem,
                  { key: id, ...itemProps(index), onClick: () => nextTick(measure) },
                  () => h('span', { class: 'pg-rvg__chip' }, [h('em', { class: 'pg-rvg__id' }, id), label])
                )
              })
          ),
          h('div', { class: 'pg-rvg__caption' }, '对照：普通 div 列表，进 Tab 序时每一项都要停一次'),
          h(
            'div',
            { class: 'pg-rvg__plain' },
            ROVING_ITEMS.map((label, index) =>
              h(
                'button',
                { class: 'pg-rvg__plain-btn', type: 'button', key: `plain-${label}` },
                `${ROVING_BASE_IDS[index]} ${label}`
              )
            )
          )
        ]),
        h(
          'div',
          { class: 'pg-rvg__read' },
          ROVING_READ_ITEMS.map((item) => h('span', { key: item.key }, `${item.label}：${read.value[item.key] ?? '—'}`))
        ),
        h('div', { class: 'pg-rvg__log' }, log.value),
        h('div', { class: 'pg-rvg__note' }, guideText())
      ])
  }
})

// Popper 这套原语不做定位计算：它只把「定位基准」交给 strategy，把坐标留给宿主写。
// 所以示例必须现场量出真实矩形，否则 strategy 传错、面板还是 static 这类问题在页面上根本看不出来
const POPPER_GAP = 8
const POPPER_PLACEMENTS = [
  { id: 'bottom', label: '贴下' },
  { id: 'top', label: '贴上' },
  { id: 'right', label: '贴右' },
  { id: 'left', label: '贴左' }
]
const POPPER_RIVAL_ZINDEX = 50
const POPPER_EXPORTS = ['Popper', 'PopperArrow', 'PopperContent', 'PopperTrigger']

interface PopperBox {
  left: number
  top: number
  width: number
  height: number
  bottom: number
  right: number
}

function popperBox(rect: DOMRect): PopperBox {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
    right: rect.right
  }
}

function roundCoord(value: number): number {
  return Math.round(value * 100) / 100
}

const POPPER_READ_ITEMS = [
  { key: 'shown', label: '浮层' },
  { key: 'place', label: '方位/间距' },
  { key: 'anchor', label: '锚点层' },
  { key: 'panel', label: '面板层' },
  { key: 'coord', label: '面板视口坐标' },
  { key: 'arrow', label: 'arrow 偏移' },
  { key: 'rival', label: '遮挡测试' },
  { key: 'trigger', label: '触发器 DOM' },
  { key: 'clicks', label: '触发点击' }
]

const PopperDemo = defineComponent({
  name: 'PopperDemo',
  props: {
    parts: { type: Object as PropType<Record<string, Component>>, required: true },
    focus: { type: String, default: 'Popper' },
    values: { type: Object as PropType<Record<string, unknown>>, required: true }
  },
  setup(props) {
    const hostRef = shallowRef<HTMLElement | null>(null)
    const triggerApi = shallowRef<ComponentPublicInstance | null>(null)
    const popperApi = shallowRef<ComponentPublicInstance | null>(null)
    const contentApi = shallowRef<ComponentPublicInstance | null>(null)
    const arrowApi = shallowRef<ComponentPublicInstance | null>(null)
    const rivalRef = shallowRef<HTMLElement | null>(null)
    const shown = shallowRef(true)
    const placement = shallowRef('bottom')
    const basis = shallowRef<'host' | 'viewport'>('host')
    // 写进 style 的坐标只在「重新定位」时更新；读数走 live*，滚动后先看到偏移、再点重算，才看得出差别
    const anchorPoint = shallowRef({ left: 0, top: 0 })
    const panelPoint = shallowRef({ left: 0, top: 0 })
    const panelSize = shallowRef({ width: 0, height: 0 })
    const clicks = shallowRef(0)
    const read = shallowRef<Record<string, string>>({})
    const log = shallowRef('点触发按钮开合浮层：面板贴在按钮的真实矩形上，改方位 / 换坐标基 / 滚页面都会重测')

    function elOf(api: ComponentPublicInstance | null): HTMLElement | null {
      const node = api?.$el as HTMLElement | null
      return node && node.nodeType === 1 ? node : null
    }

    function triggerEl(): HTMLElement | null {
      return elOf(triggerApi.value)
    }

    function popperEl(): HTMLElement | null {
      return elOf(popperApi.value)
    }

    function contentEl(): HTMLElement | null {
      return elOf(contentApi.value)
    }

    function rivalEl(): HTMLElement | null {
      return rivalRef.value
    }

    // 场景 / 调试台的值只发给当前标签页在测的那个导出，其余层保持默认，读数才归因得清楚
    function attrsOf(name: string): Record<string, unknown> {
      if (props.focus !== name) {
        return {}
      }
      const values = { ...props.values }
      // key 是演示台自己的 vnode 标识，传进被测组件只会在 DOM 上多一个无意义的属性
      delete values.key
      return values
    }

    // expanded 决定 aria-expanded 与高亮框：场景里显式打开，或跟着浮层实际开合走
    function triggerOpen(): boolean {
      return attrsOf('PopperTrigger').expanded === true || shown.value
    }

    function offsetOf(): { left: number; top: number } {
      const trigger = triggerEl()?.getBoundingClientRect()
      const width = panelSize.value.width
      const height = panelSize.value.height
      if (!trigger) {
        return { left: 0, top: POPPER_GAP }
      }
      if (placement.value === 'top') {
        return { left: 0, top: -(POPPER_GAP + height) }
      }
      if (placement.value === 'right') {
        return { left: trigger.width + POPPER_GAP, top: 0 }
      }
      if (placement.value === 'left') {
        return { left: -(POPPER_GAP + width), top: 0 }
      }
      return { left: 0, top: trigger.height + POPPER_GAP }
    }

    // 锚点坐标：absolute 认最近的定位祖先（这里就是舞台），fixed 认视口 —— 但祖先带 transform 时 fixed 也会改认它
    function relocate() {
      const trigger = triggerEl()
      const host = hostRef.value
      if (!trigger || !host) {
        return
      }
      const rect = trigger.getBoundingClientRect()
      const hostRect = host.getBoundingClientRect()
      // absolute 的包含块是舞台的内边距盒，量的是 border box：不扣掉边框宽度，间距会稳定偏出 1px
      anchorPoint.value =
        basis.value === 'host'
          ? {
              left: roundCoord(rect.left - hostRect.left - host.clientLeft),
              top: roundCoord(rect.top - hostRect.top - host.clientTop)
            }
          : { left: roundCoord(rect.left), top: roundCoord(rect.top) }
      panelPoint.value = offsetOf()
    }

    function gapOf(panel: PopperBox, trigger: PopperBox): number {
      if (placement.value === 'top') {
        return trigger.top - panel.bottom
      }
      if (placement.value === 'right') {
        return panel.left - trigger.right
      }
      if (placement.value === 'left') {
        return trigger.left - panel.right
      }
      return panel.top - trigger.bottom
    }

    function measure() {
      const triggerNode = triggerEl()
      const panel = contentEl()
      const anchor = popperEl()
      const triggerRect = triggerNode?.getBoundingClientRect()
      const panelRect = panel?.getBoundingClientRect()
      const next: Record<string, string> = { shown: shown.value ? '已渲染' : '未渲染' }
      // 浮层卸载后触发器和点击计数还在，读数不能跟着面板一起消失；否则「关掉浮层后 aria-expanded 变 false」根本看不到
      next.trigger = triggerNode
        ? `role ${triggerNode.getAttribute('role') ?? '-'} · aria-expanded ${String(triggerNode.getAttribute('aria-expanded') ?? '-')} · aria-hidden ${String(triggerNode.getAttribute('aria-hidden') ?? '-')} · id ${triggerNode.id || '-'}`
        : '触发器未渲染'
      next.clicks = `${clicks.value} 次`
      if (!triggerRect || !panelRect || !panel || !anchor) {
        const missing = '浮层未渲染'
        next.place = missing
        next.anchor = missing
        next.panel = missing
        next.coord = missing
        next.arrow = missing
        next.rival = missing
        read.value = next
        return
      }
      const trigger = popperBox(triggerRect)
      const box = popperBox(panelRect)
      const gap = gapOf(box, trigger)
      const anchorStyle = getComputedStyle(anchor)
      const panelStyle = getComputedStyle(panel)
      const anchorParent = anchor.offsetParent as HTMLElement | null
      next.anchor = `position ${anchorStyle.position} · 坐标按 ${anchorParent ? firstClassName(anchorParent) : '视口'} 计算 · inline left/top ${anchor.style.left},${anchor.style.top}`
      // display:none 的元素没有布局盒，矩形全 0：接着算间距只会得出负数，遮挡测试还会去量 (0,0)
      if (panelStyle.display === 'none') {
        next.place = '面板 display:none，没有布局盒'
        next.panel = `position ${panelStyle.position} · z-index ${panelStyle.zIndex} · display none（visible=false）`
        next.coord = '0,0 0×0（无布局盒）'
        next.arrow = 'arrow 随面板隐藏'
        next.rival = '面板不可见，遮挡测试不适用'
        read.value = next
        return
      }
      next.place = `${POPPER_PLACEMENTS.find((item) => item.id === placement.value)?.label ?? ''} · 实测 ${Math.round(gap)}px（期望 ${POPPER_GAP}px，偏 ${Math.round(gap - POPPER_GAP)}px）`
      next.panel = `position ${panelStyle.position} · z-index ${panelStyle.zIndex} · transform ${panelStyle.transform === 'none' ? '已摘（GPU 关）' : 'translateZ(0)（GPU 开）'}`
      next.coord = `${Math.round(box.left)},${Math.round(box.top)} ${Math.round(box.width)}×${Math.round(box.height)} · class ${panel.getAttribute('class') || ''}`
      const arrow = elOf(arrowApi.value)
      const arrowRect = arrow?.getBoundingClientRect()
      const wanted = Number(props.values.arrowOffset ?? 5)
      next.arrow = arrowRect
        ? `实测 ${Math.round(arrowRect.left + arrowRect.width / 2 - (box.left + box.width / 2))}px · 设 ${wanted}px`
        : 'arrow 未渲染'
      const center = { x: Math.round(box.left + box.width / 2), y: Math.round(box.top + box.height / 2) }
      const rival = rivalEl()
      const hit = rival && inViewport(center) ? document.elementFromPoint(center.x, center.y) : null
      next.rival =
        !rival || !hit
          ? '遮挡条不在视口内，滚到舞台再测'
          : hit === rival || rival.contains(hit)
            ? `遮挡条（z-index=${POPPER_RIVAL_ZINDEX}）压住面板中心：面板 zIndex 抬到它以上才翻得过来`
            : `面板压住遮挡条（命中 ${firstClassName(hit)}）`
      read.value = next
      if (Math.abs(box.width - panelSize.value.width) > 0.5 || Math.abs(box.height - panelSize.value.height) > 0.5) {
        panelSize.value = { width: box.width, height: box.height }
      }
    }

    function refresh() {
      relocate()
      nextTick(measure)
    }

    function handleTriggerClick() {
      clicks.value += 1
      shown.value = !shown.value
      log.value = shown.value
        ? `第 ${clicks.value} 次点触发按钮：PopperTrigger 的 onClick 回调被调用，浮层挂上`
        : `第 ${clicks.value} 次点触发按钮：onClick 回调被调用，浮层卸载（浮层渲染由宿主决定，组件没有 visible 开关）`
      refresh()
    }

    function toggleShown() {
      shown.value = !shown.value
      log.value = shown.value ? '浮层由宿主挂上：这是 Popper 系列没有开合 prop 的直接体现' : '浮层由宿主卸载'
      refresh()
    }

    function place(id: string) {
      placement.value = id
      log.value = `方位改成 ${POPPER_PLACEMENTS.find((item) => item.id === id)?.label ?? id}：面板坐标按触发元素的矩形重算`
      refresh()
    }

    function switchBasis() {
      basis.value = basis.value === 'host' ? 'viewport' : 'host'
      log.value =
        basis.value === 'host'
          ? '锚点坐标改成按舞台原点算：给 absolute 用是对的'
          : '锚点坐标改成按视口左上角算：只有 fixed 且祖先不带 transform 时这套数字才对得上'
      refresh()
    }

    function relocateNow() {
      relocate()
      nextTick(() => {
        measure()
        log.value = '重新定位（等价于浮层库的 autoUpdate）：坐标按当前矩形重算，间距回到 8px'
      })
    }

    // 只滚页面、不重算坐标：absolute 锚点跟着内容一起走（间距不变），fixed 锚点留在屏幕原处（间距被拉开一个滚动量）
    function scrollPage(to: number) {
      const before = window.scrollY
      window.scrollTo({ top: to, left: 0, behavior: 'instant' })
      measure()
      const moved = Math.round(window.scrollY - before)
      log.value = `页面滚了 ${moved}px，坐标没有重算：看「方位/间距」有没有跟着变 —— 变了就是这一层的定位基准不跟着内容走，点「重新定位」才补得回来`
    }

    let scrollTimer: ReturnType<typeof setTimeout> | null = null

    function handleScroll() {
      if (scrollTimer) {
        return
      }
      scrollTimer = setTimeout(() => {
        scrollTimer = null
        measure()
      }, 160)
    }

    onMounted(() => {
      refresh()
      window.addEventListener('scroll', handleScroll, true)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('scroll', handleScroll, true)
      if (scrollTimer) {
        clearTimeout(scrollTimer)
      }
    })

    watch(shown, () => {
      nextTick(measure)
    })

    watch(
      () => props.values,
      () => {
        refresh()
      }
    )

    function tool(name: string, action: () => void, active = false): VNode {
      return h('button', { class: ['pg-ppr__tool', active ? 'is-on' : ''], type: 'button', onClick: action }, name)
    }

    function statLine(): string {
      const placeLabel = POPPER_PLACEMENTS.find((item) => item.id === placement.value)?.label ?? ''
      return `在测 ${props.focus} · 方位 ${placeLabel} · 坐标基 ${basis.value === 'host' ? '舞台原点' : '视口原点'} · 留缝 ${POPPER_GAP}px`
    }

    function guideText(): string {
      if (props.focus === 'PopperArrow') {
        return 'arrowOffset 写进 --ui-popper-arrow-offset，CSS 用它算 left: calc(50% + 偏移)：读数里的「实测」是箭头顶点到面板中线的水平距离，和设的值应当一致'
      }
      if (props.focus === 'PopperContent') {
        return `面板这一层同时吃 strategy 和 zIndex：position 若是 static，写上去的 left/top 与 z-index 都会被浏览器忽略（这正是之前遮挡条总能压住面板的原因）。zIndex 设成 ${POPPER_RIVAL_ZINDEX} 以上，遮挡测试才会翻过来`
      }
      if (props.focus === 'PopperTrigger') {
        return 'PopperTrigger 只做三件事：给 role=button、把 expanded 变成 aria-expanded 与高亮框、把 onClick 回调接上。点它看「触发点击」计数和 aria-expanded 一起动，才算验到'
      }
      return 'Popper 是定位容器：strategy 决定坐标按谁解释，坐标由宿主算。改成「坐标按视口原点」而锚点还是 absolute，间距立刻偏出一个舞台到视口的距离 —— 这就是基准与坐标必须配对'
    }

    return () =>
      h('div', { class: 'pg-ppr' }, [
        h('div', { class: 'pg-ppr__bar' }, [
          h('span', { class: 'pg-ppr__stat' }, statLine()),
          tool(shown.value ? '关闭浮层' : '打开浮层', toggleShown),
          ...POPPER_PLACEMENTS.map((item) => tool(item.label, () => place(item.id), placement.value === item.id)),
          tool('坐标按视口原点', switchBasis, basis.value === 'viewport'),
          tool('重新定位', relocateNow),
          tool('页面滚到 300', () => scrollPage(300)),
          tool('回到顶部', () => scrollPage(0))
        ]),
        h('div', { class: 'pg-ppr__host', ref: hostRef }, [
          h(
            'div',
            { class: 'pg-ppr__hint' },
            '浮层贴的是下面这个按钮的真实矩形：改方位、换坐标基、滚页面，读数会立刻重测。'
          ),
          h(
            props.parts.PopperTrigger,
            { ...attrsOf('PopperTrigger'), expanded: triggerOpen(), ref: triggerApi, onClick: handleTriggerClick },
            () => h('button', { class: 'pg-ppr__trigger-btn', type: 'button' }, '点我开合浮层')
          ),
          shown.value
            ? h(
                props.parts.Popper,
                {
                  ...attrsOf('Popper'),
                  ref: popperApi,
                  style: { left: `${anchorPoint.value.left}px`, top: `${anchorPoint.value.top}px` }
                },
                () => [
                  h(
                    props.parts.PopperContent,
                    {
                      ...attrsOf('PopperContent'),
                      ref: contentApi,
                      class: 'pg-ppr__panel',
                      style: { left: `${panelPoint.value.left}px`, top: `${panelPoint.value.top}px` }
                    },
                    () => [
                      h('span', { class: 'pg-ppr__bubble' }, '浮层内容：坐标全部由宿主测出来，不写死'),
                      h(props.parts.PopperArrow, { ...attrsOf('PopperArrow'), ref: arrowApi })
                    ]
                  ),
                  h(
                    'div',
                    {
                      class: 'pg-ppr__rival',
                      ref: rivalRef,
                      // 故意压在面板中心之上：面板不带 zIndex 时层叠顺序只按文档序，同层的遮挡条后渲染反而在上
                      style: {
                        zIndex: POPPER_RIVAL_ZINDEX,
                        left: `${panelPoint.value.left + panelSize.value.width / 2 - 46}px`,
                        top: `${panelPoint.value.top + panelSize.value.height / 2 - 12}px`
                      }
                    },
                    `遮挡条 z=${POPPER_RIVAL_ZINDEX}`
                  )
                ]
              )
            : null
        ]),
        h(
          'div',
          { class: 'pg-ppr__read' },
          POPPER_READ_ITEMS.map((item) => h('span', { key: item.key }, `${item.label}：${read.value[item.key] ?? '—'}`))
        ),
        h('div', { class: 'pg-ppr__log' }, log.value),
        h('div', { class: 'pg-ppr__note' }, guideText())
      ])
  }
})

const TabsEditableDemo = defineComponent({
  name: 'TabsEditableDemo',
  props: {
    tabs: { type: Object as PropType<Component>, required: true },
    pane: { type: Object as PropType<Component>, required: true }
  },
  setup(props) {
    let seed = 0
    const panes = shallowRef<EditablePaneItem[]>([
      { label: '概览', name: 'a' },
      { label: '配置', name: 'b' },
      { label: '产物', name: 'c' }
    ])

    function handleEdit(_name: unknown, action: unknown) {
      if (action !== 'add') {
        return
      }
      seed += 1
      panes.value = [...panes.value, { label: `新标签 ${seed}`, name: `t${seed}` }]
    }

    return () =>
      h(props.tabs, { editable: true, onEdit: handleEdit }, () =>
        panes.value.map((item) =>
          h(props.pane, { key: item.name, label: item.label, name: item.name }, () => `${item.label}面板内容`)
        )
      )
  }
})

const CarouselImagesDemo = defineComponent({
  name: 'CarouselImagesDemo',
  props: {
    carousel: { type: Object as PropType<Component>, required: true },
    item: { type: Object as PropType<Component>, required: true },
    values: { type: Object as PropType<Record<string, unknown>>, required: true }
  },
  setup(props) {
    return () =>
      h(props.carousel, props.values, () =>
        SAMPLE_PHOTOS.map((photo) =>
          h(props.item, { key: photo.title }, () =>
            h('img', { class: 'pg-slide-img', src: photo.src, alt: photo.title })
          )
        )
      )
  }
})

const TIMELINE_PHOTO_DATES = ['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26']

interface AccountMenuItem {
  label: string
  icon: string
  disabled?: boolean
  divided?: boolean
}

const ACCOUNT_MENU_ITEMS: AccountMenuItem[] = [
  { label: '个人中心', icon: 'CircleUser' },
  { label: '我的订单', icon: 'Package' },
  { label: '账户充值', icon: 'CreditCard' },
  { label: '消息通知', icon: 'Bell' },
  { label: '账号设置', icon: 'Settings', disabled: true },
  { label: '退出登录', icon: 'LogOut', divided: true }
]

const TimelinePhotosDemo = defineComponent({
  name: 'TimelinePhotosDemo',
  props: {
    timeline: { type: Object as PropType<Component>, required: true },
    item: { type: Object as PropType<Component>, required: true },
    values: { type: Object as PropType<Record<string, unknown>>, required: true }
  },
  setup(props) {
    return () =>
      h(props.timeline, props.values, () =>
        SAMPLE_PHOTOS.map((photo, index) =>
          h(props.item, { key: photo.title, timestamp: TIMELINE_PHOTO_DATES[index] }, () =>
            h('figure', { class: 'pg-timeline-photo' }, [
              h('img', { class: 'pg-timeline-photo__img', src: photo.thumbnail, alt: photo.title }),
              h('figcaption', { class: 'pg-timeline-photo__title' }, photo.title)
            ])
          )
        )
      )
  }
})

const INFINITE_BATCH = 6
const INFINITE_INITIAL = 8
const INFINITE_TOTAL = 40
const INFINITE_LATENCY = 600
const INFINITE_TITLES = [
  '按需构建产物',
  '特性开关裁剪',
  '主题变量注入',
  '类型声明生成',
  '消费方验收',
  '产物体积比对',
  '样式作用域检查',
  '运行时冒烟测试'
]

interface InfiniteRecord {
  id: number
  title: string
  desc: string
}

function createInfiniteRecords(start: number, count: number): InfiniteRecord[] {
  return Array.from({ length: count }, (_unused, index) => {
    const id = start + index + 1
    return {
      id,
      title: INFINITE_TITLES[(id - 1) % INFINITE_TITLES.length],
      desc: `批次 ${Math.ceil(id / INFINITE_BATCH)} · 序号 ${id}`
    }
  })
}

const InfiniteScrollDemo = defineComponent({
  name: 'InfiniteScrollDemo',
  props: {
    scroll: { type: Object as PropType<Component>, required: true },
    values: { type: Object as PropType<Record<string, unknown>>, required: true },
    nested: { type: Boolean, default: false }
  },
  setup(props) {
    const records = shallowRef<InfiniteRecord[]>(createInfiniteRecords(0, INFINITE_INITIAL))
    const loading = shallowRef(false)
    const loads = shallowRef(0)
    const gap = shallowRef<number | null>(null)
    const viewport = shallowRef<ComponentPublicInstance | null>(null)
    let timer: ReturnType<typeof setTimeout> | null = null

    // 调试台改 props 时组件实例复用，取成常量会让读数与组件实际生效值不一致，全部走 computed
    const distance = computed(() => Number(props.values.distance ?? 0))
    const delay = computed(() => Number(props.values.delay ?? 200))
    const disabled = computed(() => Boolean(props.values.disabled))
    const externalLoading = computed(() => Boolean(props.values.loading))

    // 与组件同口径监听 window 捕获阶段：外层面板滚动时列表自身没有 scroll 事件，只监听根元素读数会停在旧值
    onMounted(() => {
      window.addEventListener('scroll', handleScroll, true)
      nextTick(measure)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('scroll', handleScroll, true)
      if (timer) {
        clearTimeout(timer)
      }
    })

    function isFinished() {
      return records.value.length >= INFINITE_TOTAL
    }

    function isOverflowed(element: HTMLElement) {
      return (
        /auto|scroll|overlay/.test(window.getComputedStyle(element).overflowY) &&
        element.scrollHeight > element.clientHeight + 1
      )
    }

    // 与组件同口径：列表自身不滚动时，读数取最近的可滚动祖先
    function resolveScroller(): HTMLElement | null {
      const node = viewport.value?.$el
      if (!(node instanceof HTMLElement)) {
        return null
      }
      if (isOverflowed(node)) {
        return node
      }
      let parent = node.parentElement
      while (parent && parent !== document.body) {
        if (isOverflowed(parent)) {
          return parent
        }
        parent = parent.parentElement
      }
      return node
    }

    function measure() {
      const element = resolveScroller()
      if (element) {
        gap.value = Math.max(0, Math.round(element.scrollHeight - element.clientHeight - element.scrollTop))
      }
    }

    function handleLoad() {
      if (isFinished()) {
        return
      }
      loading.value = true
      timer = setTimeout(() => {
        timer = null
        const remain = INFINITE_TOTAL - records.value.length
        const batch = createInfiniteRecords(records.value.length, Math.min(INFINITE_BATCH, remain))
        records.value = [...records.value, ...batch]
        loads.value += 1
        loading.value = false
        nextTick(measure)
      }, INFINITE_LATENCY)
    }

    function handleScroll() {
      measure()
    }

    function statusText() {
      if (disabled.value) {
        return '已禁用：滚动不会触发加载'
      }
      if (isFinished()) {
        return `已加载全部 ${INFINITE_TOTAL} 条`
      }
      if (externalLoading.value || loading.value) {
        return '加载中：等待请求返回'
      }
      if (gap.value !== null && gap.value <= distance.value) {
        return '已进入触发区'
      }
      return '向下滚动，触底后追加数据'
    }

    // 状态条贴在面板底部常驻，直接报出还差多少像素才触发，避免只写“继续滚动加载”却看不出为什么不加载
    function isWaiting() {
      return externalLoading.value || loading.value
    }

    function isInZone() {
      return gap.value !== null && gap.value <= distance.value
    }

    function footText(): string {
      if (disabled.value) {
        return '已禁用：滚动不触发 load'
      }
      if (isFinished()) {
        return `已加载全部 ${INFINITE_TOTAL} 条`
      }
      if (externalLoading.value) {
        return 'loading=true：加载期间不会再触发 load'
      }
      if (loading.value) {
        return `请求中…${INFINITE_LATENCY}ms 后追加下一批`
      }
      if (isInZone()) {
        return `已在触发区，停止滚动 ${delay.value}ms 后加载`
      }
      if (gap.value === null) {
        return '在面板内滚动列表'
      }
      return `还差 ${Math.max(0, Math.round(gap.value - distance.value))}px 进入触发区`
    }

    function footClass(): string {
      if (disabled.value || isFinished()) {
        return 'pg-infinite__foot is-muted'
      }
      if (isWaiting()) {
        return 'pg-infinite__foot is-loading'
      }
      if (isInZone()) {
        return 'pg-infinite__foot is-ready'
      }
      return 'pg-infinite__foot'
    }

    return () => {
      const list = h(
        props.scroll,
        {
          ...props.values,
          ref: viewport,
          loading: externalLoading.value || loading.value,
          class: props.nested ? undefined : 'pg-infinite__viewport',
          onLoad: handleLoad
        },
        () => [
          ...records.value.map((item) =>
            h('div', { key: item.id, class: 'pg-infinite__item' }, [
              h('span', { class: 'pg-infinite__no' }, String(item.id)),
              h('div', { class: 'pg-infinite__text' }, [
                h('div', { class: 'pg-infinite__title' }, item.title),
                h('div', { class: 'pg-infinite__desc' }, item.desc)
              ])
            ])
          ),
          h('div', { class: footClass() }, footText())
        ]
      )

      return h('div', { class: 'pg-infinite' }, [
        h('div', { class: 'pg-infinite__bar' }, [
          h('span', { class: 'pg-infinite__stat' }, `${records.value.length}/${INFINITE_TOTAL} 条`),
          h('span', { class: 'pg-infinite__stat' }, `触发 ${loads.value} 次`),
          h('span', { class: 'pg-infinite__stat' }, `距底部 ${gap.value === null ? '—' : `${gap.value}px`}`),
          h('span', { class: 'pg-infinite__stat' }, `阈值 ${distance.value}px`),
          h('span', { class: 'pg-infinite__stat' }, `防抖 ${delay.value}ms`),
          h('span', { class: 'pg-infinite__stat' }, props.nested ? '滚动源：外层面板' : '滚动源：列表自身'),
          h(
            'span',
            { class: ['pg-infinite__state', isFinished() || disabled.value ? 'is-muted' : 'is-active'] },
            statusText()
          )
        ]),
        props.nested ? h('div', { class: 'pg-infinite__outer' }, [list]) : list
      ])
    }
  }
})

const UPLOAD_LATENCY = 900
const UPLOAD_MAX_SIZE = 2 * 1024 * 1024

interface UploadItem {
  uid: number
  name: string
  status: string
  url?: string
}

let uploadUidSeed = 1000

function toUploadItem(raw: unknown): UploadItem {
  const item = raw as Partial<UploadItem> | null
  if (item && typeof item === 'object' && typeof item.uid === 'number') {
    return { uid: item.uid, name: String(item.name ?? item.uid), status: String(item.status ?? ''), url: item.url }
  }
  return { uid: uploadUidSeed++, name: String((item as { name?: unknown })?.name ?? raw), status: 'uploading' }
}

function isImageFile(raw: unknown): raw is File {
  const file = raw as File | null
  return typeof file?.type === 'string' && file.type.startsWith('image/')
}

const UploadDemo = defineComponent({
  name: 'UploadDemo',
  props: {
    upload: { type: Object as PropType<Component>, required: true },
    values: { type: Object as PropType<Record<string, unknown>>, required: true },
    packageId: { type: String, default: 'full' },
    triggerKind: { type: String as PropType<UploadTriggerKind>, default: 'button' }
  },
  setup(props) {
    const files = shallowRef<UploadItem[]>(((props.values.fileList as unknown[] | undefined) ?? []).map(toUploadItem))
    const accepted = shallowRef(0)
    const rejected = shallowRef(0)
    const exceeded = shallowRef(0)
    const removed = shallowRef(0)
    const log = shallowRef('未选择文件')
    const timed = new Set<number>()
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const previews = new Map<number, string>()
    for (const item of files.value) {
      timed.add(item.uid)
    }

    onBeforeUnmount(() => {
      for (const timer of timers) {
        clearTimeout(timer)
      }
      timers.clear()
      revokeAllPreviews()
    })

    function revokePreview(uid: number) {
      const url = previews.get(uid)
      if (url) {
        URL.revokeObjectURL(url)
        previews.delete(uid)
      }
    }

    function revokeAllPreviews() {
      for (const uid of [...previews.keys()]) {
        revokePreview(uid)
      }
    }

    function toItem(raw: unknown): UploadItem {
      const item = toUploadItem(raw)
      if (!item.url && isImageFile(raw) && !previews.has(item.uid)) {
        const url = URL.createObjectURL(raw)
        previews.set(item.uid, url)
        return { ...item, url }
      }
      return item
    }

    function settle(uid: number) {
      files.value = files.value.map((item) => (item.uid === uid ? { ...item, status: 'success' } : item))
      log.value = `上传完成：${files.value.find((item) => item.uid === uid)?.name ?? uid}`
    }

    function watchPending(next: UploadItem[]) {
      for (const item of next) {
        if (item.status !== 'uploading' || timed.has(item.uid)) {
          continue
        }
        timed.add(item.uid)
        const timer = setTimeout(() => {
          timers.delete(timer)
          settle(item.uid)
        }, UPLOAD_LATENCY)
        timers.add(timer)
      }
    }

    function handleUpdateFileList(next: unknown[]) {
      const items = next.map(toItem)
      const alive = new Set(items.map((item) => item.uid))
      for (const uid of [...previews.keys()]) {
        if (!alive.has(uid)) {
          revokePreview(uid)
        }
      }
      watchPending(items)
      files.value = items
    }

    function handleChange(next: unknown[]) {
      accepted.value += next.length
      log.value = `已接收 ${next.map((file) => String((file as { name?: string })?.name ?? file)).join('、')}`
    }

    function handleBeforeUpload(file: File) {
      if (Number(file?.size) > UPLOAD_MAX_SIZE) {
        rejected.value += 1
        log.value = `beforeUpload 拒绝：${file.name} 超过 2MB`
        return false
      }
      return true
    }

    function handleRemove(file: unknown) {
      removed.value += 1
      const uid = (file as UploadItem | null)?.uid
      if (typeof uid === 'number') {
        revokePreview(uid)
      }
      log.value = `已移除：${String((file as { name?: string })?.name ?? file)}`
    }

    function handleExceed(_: unknown, current: unknown[]) {
      exceeded.value += 1
      log.value = `limit=${String(props.values.limit ?? '')}，已保留 ${current.length} 个文件`
    }

    function reset() {
      files.value = []
      timed.clear()
      revokeAllPreviews()
      log.value = '已清空文件列表'
    }

    function triggerSlots(): SampleSlots | undefined {
      if (props.triggerKind === 'builtin') {
        return undefined
      }
      if (props.triggerKind === 'custom') {
        const kit = kitOf(props.packageId)
        return {
          default: () =>
            h('span', { class: 'pg-upload__pick' }, [
              h(kit('Button'), { type: 'primary', plain: true }, () => '选择图片'),
              h(kit('Text'), { type: 'info' }, () => '触发区整块由消费方提供')
            ])
        }
      }
      return slotsFor(props.packageId).Upload
    }

    return () => {
      const uploading = files.value.filter((item) => item.status === 'uploading').length
      const succeed = files.value.filter((item) => item.status === 'success').length
      return h('div', { class: 'pg-upload' }, [
        h('div', { class: 'pg-upload__bar' }, [
          h('span', { class: 'pg-upload__stat' }, `列表 ${files.value.length} 项`),
          h('span', { class: 'pg-upload__stat' }, `上传中 ${uploading}`),
          h('span', { class: 'pg-upload__stat' }, `成功 ${succeed}`),
          h('span', { class: 'pg-upload__stat' }, `接收 ${accepted.value}`),
          h('span', { class: 'pg-upload__stat' }, `拒绝 ${rejected.value}`),
          h('span', { class: 'pg-upload__stat' }, `超限 ${exceeded.value}`),
          h('span', { class: 'pg-upload__stat' }, `移除 ${removed.value}`)
        ]),
        h(
          props.upload,
          {
            ...props.values,
            fileList: files.value,
            'onUpdate:fileList': handleUpdateFileList,
            onChange: handleChange,
            beforeUpload: handleBeforeUpload,
            onRemove: handleRemove,
            onExceed: handleExceed
          },
          triggerSlots()
        ),
        h('div', { class: 'pg-upload__foot' }, [
          h('span', { class: 'pg-upload__log' }, log.value),
          h('button', { class: 'pg-upload__reset', type: 'button', onClick: reset }, '清空列表')
        ])
      ])
    }
  }
})

interface MenuDemoNode {
  index?: string
  title?: string
  label?: string
  disabled?: boolean
  children?: MenuDemoNode[]
}

type MenuKit = (name: string) => Component

// 三层菜单树：分组 → 子菜单 → 子菜单 → 菜单项，含禁用项与三级叶子
const MENU_DEMO_TREE: MenuDemoNode[] = [
  {
    title: '工作台',
    children: [
      { index: 'overview', label: '构建概览' },
      { index: 'changes', label: '变更历史' },
      { index: 'favorites', label: '我的收藏', disabled: true }
    ]
  },
  {
    title: '组件',
    children: [
      {
        index: 'components',
        label: '组件库',
        children: [
          {
            index: 'components-basic',
            label: '基础组件',
            children: [
              { index: 'button', label: 'Button 按钮' },
              { index: 'input', label: 'Input 输入框' },
              { index: 'text', label: 'Text 文本' }
            ]
          },
          {
            index: 'components-form',
            label: '表单组件',
            children: [
              { index: 'select', label: 'Select 选择器' },
              { index: 'cascader', label: 'Cascader 级联' },
              { index: 'upload', label: 'Upload 上传', disabled: true }
            ]
          },
          { index: 'components-layout', label: 'Layout 布局' }
        ]
      },
      {
        index: 'feedback',
        label: '反馈组件',
        children: [
          { index: 'dialog', label: 'Dialog 对话框' },
          { index: 'drawer', label: 'Drawer 抽屉' },
          {
            index: 'feedback-popper',
            label: '浮层组件',
            children: [
              { index: 'tooltip', label: 'Tooltip 提示' },
              { index: 'popover', label: 'Popover 气泡' },
              { index: 'popconfirm', label: 'Popconfirm 确认' }
            ]
          }
        ]
      }
    ]
  },
  {
    title: '运维',
    children: [
      { index: 'settings', label: '构建设置' },
      { index: 'logs', label: '构建日志', disabled: true },
      { index: 'help', label: '帮助文档' }
    ]
  }
]

// MenuItemGroup / SubMenu 独立预览时的子项，index 与主树不重复
const MENU_DEMO_GROUP_ITEMS: MenuDemoNode[] = [
  { index: 'ops-queue', label: '构建队列' },
  { index: 'ops-cache', label: '缓存清理', disabled: true },
  { index: 'ops-report', label: '报表导出' }
]

const MENU_DEMO_SUB_CHILDREN: MenuDemoNode[] = [
  { index: 'sub-child-a', label: '子菜单项一' },
  { index: 'sub-child-b', label: '子菜单项二', disabled: true },
  {
    index: 'sub-child-group',
    label: '三级子菜单',
    children: [
      { index: 'sub-child-leaf', label: '三级子项一' },
      { index: 'sub-child-leaf-2', label: '三级子项二' }
    ]
  }
]

// 默认展开到第三级，让多层缩进在预览中直接可见
const MENU_DEMO_OPENED = ['components', 'components-basic']

const MENU_HOST_EXPORTS = new Set(['MenuItem', 'MenuItemGroup', 'SubMenu'])

function renderMenuNode(kit: MenuKit, node: MenuDemoNode): VNode {
  const children = node.children
  if (children && node.title) {
    return h(
      kit('MenuItemGroup'),
      { title: node.title },
      {
        default: () => children.map((child) => renderMenuNode(kit, child))
      }
    )
  }
  if (children) {
    return h(
      kit('SubMenu'),
      { index: node.index, disabled: node.disabled },
      {
        title: () => node.label ?? '',
        default: () => children.map((child) => renderMenuNode(kit, child))
      }
    )
  }
  return h(kit('MenuItem'), { index: node.index, disabled: node.disabled }, () => node.label ?? '')
}

function renderMenuNodes(kit: MenuKit, nodes: MenuDemoNode[]): VNode[] {
  return nodes.map((node) => renderMenuNode(kit, node))
}

function withoutMenuKey(nodes: MenuDemoNode[], key: string): MenuDemoNode[] {
  if (!key) {
    return nodes
  }
  return nodes
    .filter((node) => node.index !== key && node.title !== key)
    .map((node) => {
      const children = node.children
      return children ? { ...node, children: withoutMenuKey(children, key) } : node
    })
}

function menuDemoKey(attrs: Record<string, unknown>): string {
  const value = attrs.index ?? attrs.title
  return typeof value === 'string' ? value : ''
}

function renderMenuHost(kit: MenuKit, exportName: string, attrs: Record<string, unknown>, slots: SampleSlots): VNode {
  const key = menuDemoKey(attrs)
  const disabled = attrs.disabled === true
  const openeds = exportName === 'SubMenu' && !disabled ? [key, ...MENU_DEMO_OPENED] : MENU_DEMO_OPENED
  return h(
    kit('Menu'),
    {
      defaultActive: exportName === 'MenuItem' && !disabled ? key : '',
      defaultOpeneds: openeds
    },
    () => [h(kit(exportName), attrs, slots), ...renderMenuNodes(kit, withoutMenuKey(MENU_DEMO_TREE, key))]
  )
}

function createSampleSlots(kit: MenuKit): Record<string, SampleSlots> {
  const FormItemField = defineComponent({
    name: 'FormItemFieldSample',
    setup() {
      const value = shallowRef('')
      return () =>
        h(kit('Input'), {
          modelValue: value.value,
          placeholder: '请输入字段内容',
          'onUpdate:modelValue': (next: string) => {
            value.value = next
          }
        })
    }
  })

  const DescriptionsNotifySwitch = defineComponent({
    name: 'DescriptionsNotifySwitchSample',
    setup() {
      const enabled = shallowRef(true)
      return () =>
        h(kit('Switch'), {
          modelValue: enabled.value,
          activeText: '开启',
          inactiveText: '关闭',
          'onUpdate:modelValue': (next: boolean) => {
            enabled.value = next
          }
        })
    }
  })

  const renderAccountMenuItems = () =>
    ACCOUNT_MENU_ITEMS.map((item) =>
      h(kit('DropdownItem'), { icon: item.icon, disabled: item.disabled, divided: item.divided }, () => item.label)
    )

  return {
    Icon: {},
    Button: { default: () => '按钮' },
    ButtonGroup: {
      default: () => [
        h(kit('Button'), null, () => '上一页'),
        h(kit('Button'), null, () => '当前'),
        h(kit('Button'), null, () => '下一页')
      ]
    },
    Link: { default: () => '链接文本' },
    Text: {
      default: () =>
        '组合式 API 让状态与视图保持单向数据流，这段较长的文本用于观察字号、状态色、单行省略与多行截断是否符合预期。'
    },
    Tag: { default: () => '标签' },
    CheckTag: { default: () => '可选标签' },
    Badge: { default: () => h(kit('Button'), { size: 'small' }, () => '消息') },
    Avatar: { default: () => 'U' },
    AvatarGroup: {
      default: () => [
        ...SAMPLE_AVATAR_LIST.map((src) => h(kit('Avatar'), { src, alt: '群组成员' })),
        h(kit('Avatar'), null, () => 'U')
      ]
    },
    Breadcrumb: {
      default: () => [
        h(kit('BreadcrumbItem'), null, () => '首页'),
        h(kit('BreadcrumbItem'), null, () => '组件库'),
        h(kit('BreadcrumbItem'), null, () => '当前页')
      ]
    },
    BreadcrumbItem: { default: () => '首页' },
    Card: { default: () => '卡片内容' },
    ImageViewer: {
      default: () => h(ImageViewerGallery)
    },
    Collapse: {
      default: () => [
        h(kit('CollapseItem'), { title: '面板一', name: 'a' }, () => '第一个面板的内容。'),
        h(kit('CollapseItem'), { title: '面板二', name: 'b' }, () => '第二个面板的内容。')
      ]
    },
    CollapseItem: { default: () => '面板内容' },
    Container: { default: () => '容器内容' },
    Header: { default: () => 'Header 顶栏' },
    Aside: { default: () => 'Aside 侧栏' },
    Main: { default: () => 'Main 主体' },
    Footer: { default: () => 'Footer 底栏' },
    Descriptions: {
      default: () => [
        h(kit('DescriptionsItem'), { label: '订单编号', span: 2 }, () => [
          'DD2026110300188',
          h(kit('Link'), { href: '#/c/descriptions', style: 'margin-left: 8px;' }, () => '查看物流')
        ]),
        h(kit('DescriptionsItem'), { label: '订单状态' }, () => [
          h(kit('Tag'), { type: 'success' }, () => '已发货'),
          h(kit('Tag'), { type: 'warning', style: 'margin-left: 6px;' }, () => '加急')
        ]),
        h(kit('DescriptionsItem'), { label: '下单时间' }, () => '2026-11-01 10:23:08'),
        h(kit('DescriptionsItem'), { label: '支付时间' }, () => '2026-11-01 10:24:41'),
        h(kit('DescriptionsItem'), { label: '客户昵称' }, () => 'ocean_旅行者'),
        h(kit('DescriptionsItem'), { label: '会员等级' }, () =>
          h(kit('Rate'), { modelValue: 4, disabled: true, showScore: true, scoreTemplate: '{value} 级' })
        ),
        h(kit('DescriptionsItem'), { label: '联系电话' }, () => '138 0000 8888'),
        h(
          kit('DescriptionsItem'),
          { label: '收货地址', span: 3 },
          () => '上海市浦东新区世纪大道 1000 号环球金融中心 21 层 2108 室（工作日 9:00 - 18:00 可签收，周末暂不派送）'
        ),
        h(kit('DescriptionsItem'), { label: '商品总额' }, () => '¥1,299.00'),
        h(kit('DescriptionsItem'), { label: '运费' }, () => '¥12.00'),
        h(kit('DescriptionsItem'), { label: '优惠金额' }, () => '-¥50.00'),
        h(kit('DescriptionsItem'), { label: '实付金额' }, () => '¥1,261.00'),
        h(kit('DescriptionsItem'), { label: '支付方式' }, () => '支付宝（尾号 8888）'),
        h(kit('DescriptionsItem'), { label: '发票抬头', span: 2 }, () => '上海示例科技有限公司'),
        h(kit('DescriptionsItem'), { label: '税号' }, () => '91310000MA1FL0000X'),
        h(kit('DescriptionsItem'), { label: '配送进度', span: 3 }, () =>
          h(kit('Progress'), { percentage: 70, strokeWidth: 8 })
        ),
        h(
          kit('DescriptionsItem'),
          { label: '商品清单', span: 3 },
          () =>
            '无线机械键盘 × 1（深空灰 / 红轴）¥399.00；4K 便携显示器 × 1（15.6 英寸 / 带皮套）¥860.00；Type-C 十一合一扩展坞 × 1 ¥40.00。'
        ),
        h(
          kit('DescriptionsItem'),
          { label: '客户备注', span: 3 },
          () =>
            '请放前台代收，外包装请加气泡膜；如外箱破损请拍照拒收并电话联系。本订单为赠品活动单，发票随箱寄出，请勿拆分包裹。'
        ),
        h(kit('DescriptionsItem'), { label: '售后工单' }, () =>
          h(kit('Badge'), { value: 3, type: 'danger' }, () => h(kit('Button'), { size: 'small' }, () => '售后中心'))
        ),
        h(kit('DescriptionsItem'), { label: '短信通知' }, () => h(DescriptionsNotifySwitch)),
        h(kit('DescriptionsItem'), { label: '服务评分' }, () => h(kit('Rate'), { modelValue: 5, disabled: true })),
        h(kit('DescriptionsItem'), { label: '跟进人' }, () =>
          h(kit('AvatarGroup'), null, () => [
            ...SAMPLE_AVATAR_LIST.map((src) => h(kit('Avatar'), { src, alt: '跟进人' })),
            h(kit('Avatar'), null, () => 'U')
          ])
        ),
        h(kit('DescriptionsItem'), { label: '订单标签', span: 3 }, () => [
          h(kit('CheckTag'), { checked: true }, () => '企业采购'),
          h(kit('CheckTag'), { style: 'margin-left: 6px;' }, () => '复购客户'),
          h(kit('Tag'), { type: 'danger', effect: 'plain', style: 'margin-left: 6px;' }, () => 'VIP')
        ]),
        h(kit('DescriptionsItem'), { label: '最近登录' }, () => '2026-11-02 21:14:36（IP 101.86.xx.xx）'),
        h(kit('DescriptionsItem'), { label: '服务协议', span: 3 }, () => [
          h(kit('Link'), { href: '#/c/descriptions' }, () => '《平台交易服务协议》'),
          h(kit('Link'), { href: '#/c/descriptions', style: 'margin-left: 12px;' }, () => '《隐私政策》'),
          h(kit('Link'), { href: '#/c/descriptions', style: 'margin-left: 12px;' }, () => '《退换货规则》')
        ])
      ]
    },
    DescriptionsItem: { default: () => '张三' },
    Dropdown: {
      default: () => h(kit('Button'), null, () => '账户中心'),
      dropdown: () => h(kit('DropdownMenu'), null, { default: renderAccountMenuItems })
    },
    DropdownItem: { default: () => '选项一' },
    DropdownMenu: {
      default: () => renderAccountMenuItems()
    },
    Form: {
      default: (scope) => {
        const model = formModelFrom(scope)
        const disabled = scope?.disabled === true
        const size = typeof scope?.size === 'string' ? scope.size : undefined
        return [
          h(kit('FormItem'), { label: '项目名称', prop: 'name' }, () =>
            h(kit('Input'), {
              modelValue: String(model?.name ?? ''),
              placeholder: '请输入项目名称',
              disabled,
              size,
              'onUpdate:modelValue': (value: string) => updateFormField(model, 'name', value)
            })
          ),
          h(kit('FormItem'), { label: '所属城市', prop: 'city' }, () =>
            h(kit('Select'), {
              modelValue: model?.city,
              options: FORM_CITY_OPTIONS,
              placeholder: '请选择所属城市',
              disabled,
              size,
              'onUpdate:modelValue': (value: unknown) => updateFormField(model, 'city', value)
            })
          ),
          h(kit('FormItem'), { label: '启动日期', prop: 'launchDate' }, () =>
            h(kit('DatePicker'), {
              modelValue: model?.launchDate,
              placeholder: '请选择启动日期',
              disabled,
              size,
              'onUpdate:modelValue': (value: unknown) => updateFormField(model, 'launchDate', value)
            })
          ),
          h(kit('FormItem'), { label: '变更通知', prop: 'notify' }, () =>
            h(kit('Switch'), {
              modelValue: Boolean(model?.notify),
              disabled,
              size,
              'onUpdate:modelValue': (value: unknown) => updateFormField(model, 'notify', value)
            })
          ),
          h('div', { class: 'pg-form-model' }, `model：${JSON.stringify(model ?? {})}`)
        ]
      }
    },
    FormItem: { default: () => h(FormItemField) },
    Menu: { default: () => renderMenuNodes(kit, MENU_DEMO_TREE) },
    MenuItem: { default: () => '菜单项' },
    MenuItemGroup: { default: () => renderMenuNodes(kit, MENU_DEMO_GROUP_ITEMS) },
    SubMenu: {
      title: () => '子菜单',
      default: () => renderMenuNodes(kit, MENU_DEMO_SUB_CHILDREN)
    },
    RadioGroup: {
      default: () => [
        h(kit('Radio'), { value: 'a', label: '选项一' }),
        h(kit('Radio'), { value: 'b', label: '选项二' })
      ]
    },
    CheckboxGroup: {
      default: () => [
        h(kit('Checkbox'), { value: 'a', label: '选项一' }),
        h(kit('Checkbox'), { value: 'b', label: '选项二' })
      ]
    },
    Checkbox: { default: () => '选项' },
    CheckboxButton: { default: () => '选项' },
    Select: {
      default: () => [
        h(kit('Option'), { label: '选项一', value: 'a' }),
        h(kit('Option'), { label: '选项二', value: 'b' }),
        h(kit('Option'), { label: '选项三', value: 'c' })
      ]
    },
    Option: { default: () => '选项' },
    OptionGroup: { default: () => [h(kit('Option'), { label: '子项', value: 'group-a' })] },
    Space: {
      default: () => [
        h(kit('Button'), { type: 'primary' }, () => '主要按钮'),
        h(kit('Button'), { type: 'success' }, () => '成功按钮'),
        h(kit('Button'), { type: 'warning' }, () => '警告按钮'),
        h(kit('Button'), { type: 'danger' }, () => '危险按钮'),
        h(kit('Button'), { type: 'info' }, () => '信息按钮'),
        h(kit('Button'), null, () => '默认按钮'),
        h(kit('Button'), { type: 'primary', disabled: true }, () => '禁用按钮'),
        h(kit('Button'), { type: 'success' }, () => '确认提交'),
        h(kit('Button'), null, () => '取消'),
        h(kit('Button'), { type: 'warning' }, () => '稍后处理')
      ]
    },
    Splitter: {
      default: () => [
        h(kit('SplitterPanel'), { size: '40%' }, () => h('div', { class: 'pg-panel' }, '左侧面板')),
        h(kit('SplitterPanel'), null, () => h('div', { class: 'pg-panel' }, '右侧面板'))
      ]
    },
    SplitterPanel: { default: () => h('div', { class: 'pg-panel' }, '面板内容') },
    Steps: {
      default: () => [
        h(kit('Step'), { title: '步骤一', description: '选择组件' }),
        h(kit('Step'), { title: '步骤二', description: '勾选特性' }),
        h(kit('Step'), { title: '步骤三', description: '生成产物' })
      ]
    },
    Step: { default: () => '步骤' },
    Tabs: {
      default: () => [
        h(kit('TabPane'), { label: '概览', name: 'a' }, () => '概览面板内容'),
        h(kit('TabPane'), { label: '配置', name: 'b' }, () => '配置面板内容'),
        h(kit('TabPane'), { label: '产物', name: 'c' }, () => '产物面板内容')
      ]
    },
    TabPane: { default: () => '面板内容' },
    Table: {
      default: () => [
        h(kit('TableColumn'), { type: 'index', label: '#', width: 52 }),
        h(kit('TableColumn'), { prop: 'name', label: '名称' }),
        h(kit('TableColumn'), { prop: 'city', label: '城市', width: 100 }),
        h(kit('TableColumn'), { prop: 'status', label: '状态', width: 100 })
      ]
    },
    TableColumn: { default: () => '列' },
    Timeline: {
      default: () => [
        h(kit('TimelineItem'), { timestamp: '2026-10-24' }, () => '创建构建配置'),
        h(kit('TimelineItem'), { timestamp: '2026-10-25' }, () => '生成产物'),
        h(kit('TimelineItem'), { timestamp: '2026-10-26' }, () => '完成验收')
      ]
    },
    TimelineItem: { default: () => '事件内容' },
    Carousel: {
      default: () => [
        h(kit('CarouselItem'), null, () => h('div', { class: 'pg-slide' }, '01')),
        h(kit('CarouselItem'), null, () => h('div', { class: 'pg-slide pg-slide--alt' }, '02')),
        h(kit('CarouselItem'), null, () => h('div', { class: 'pg-slide pg-slide--deep' }, '03'))
      ]
    },
    CarouselItem: { default: () => h('div', { class: 'pg-slide' }, '幻灯片') },
    Upload: { default: () => h(kit('Button'), null, () => '点击上传') },
    Tooltip: { default: () => h(kit('Button'), null, () => '悬停查看') },
    Popover: {
      default: () => h(kit('Button'), null, () => '悬停查看'),
      content: () => h('div', null, '气泡内容')
    },
    Popconfirm: { default: () => h(kit('Button'), { type: 'danger', plain: true }, () => '删除') },
    ConfigProvider: {
      default: () => [
        h(kit('Button'), { type: 'primary' }, () => '主要按钮'),
        h(kit('Button'), null, () => '次要按钮'),
        h(kit('Tag'), null, () => '标签'),
        h(kit('Text'), null, () => '随全局配置变化的说明文本')
      ]
    },
    Anchor: {
      default: () => [
        h(kit('AnchorLink'), { href: '#pg-sec-overview' }, () => [
          '概览',
          h(kit('AnchorLink'), { href: '#pg-sec-layout' }, () => '布局'),
          h(kit('AnchorLink'), { href: '#pg-sec-theme' }, () => '主题')
        ]),
        h(kit('AnchorLink'), { href: '#pg-sec-props' }, () => [
          '属性调试',
          h(kit('AnchorLink'), { href: '#pg-sec-props-anchor' }, () => 'Anchor'),
          h(kit('AnchorLink'), { href: '#pg-sec-props-link' }, () => 'AnchorLink')
        ]),
        h(kit('AnchorLink'), { href: '#pg-sec-build' }, () => '构建产物')
      ]
    },
    Affix: { default: () => h('div', { class: 'pg-panel' }, '固定内容') },
    Backtop: { default: () => '↑' },
    Scrollbar: {
      default: () =>
        h(
          'div',
          { class: 'pg-scroll-content' },
          Array.from({ length: 12 }, (_value, index) =>
            h('div', { class: 'pg-scroll-content__row' }, `第 ${index + 1} 行滚动内容 · Scrollbar 横向与纵向滚动演示`)
          )
        )
    },
    VirtualList: {
      default: (scope) =>
        h(
          'div',
          { class: ['pg-virtual-item', scope?.item === undefined ? 'is-placeholder' : ''] },
          scope?.item === undefined ? '加载中…' : String(scope.item)
        )
    },
    Tour: {
      default: () => [
        h(kit('TourStep'), {
          target: '#pg-landmark-a',
          title: '第一步 · 概览',
          description: '引导面板会跟随目标元素定位，遮罩会在目标处镂空。'
        }),
        h(kit('TourStep'), {
          target: '#pg-landmark-b',
          title: '第二步 · 属性调试',
          description: 'current 决定从第几步开始，上一步/下一步可前后切换。'
        }),
        h(kit('TourStep'), {
          target: '#pg-landmark-c',
          title: '第三步 · 产物',
          description: '最后一步点完成后触发 finish 并关闭引导。'
        })
      ]
    },
    PageHeader: {
      default: () => '页面主体区域：页头只负责标题、说明、返回按钮与右侧操作区，正文内容由默认插槽提供。',
      extra: () => [
        h(kit('Button'), { size: 'small' }, () => '查看日志'),
        h(kit('Button'), { size: 'small', type: 'primary' }, () => '重新构建')
      ]
    },
    Dialog: {
      default: () => '对话框内容，可通过右侧属性面板调整宽度、居中、遮罩等。',
      footer: () => h(kit('Button'), { type: 'primary' }, () => '确定')
    },
    Drawer: { default: () => '抽屉内容，可通过右侧属性面板调整方向与尺寸。' },
    MessageBox: { default: () => '确认内容' },
    Watermark: { default: () => h('div', { class: 'pg-panel pg-watermark-panel' }, '水印覆盖区域') },
    OnlyChild: { default: () => h('div', { class: 'pg-panel' }, '唯一子节点') },
    CollapseTransition: { default: () => h('div', { class: 'pg-panel' }, '过渡内容') },
    Loading: { default: () => h('div', { class: 'pg-panel' }, '加载区域内容') }
  }
}

const SLOT_CACHE = new Map<string, Record<string, SampleSlots>>()

function kitOf(packageId: string): (name: string) => Component {
  const module = DYNAMIC_KITS.value[packageId] ?? STATIC_KITS[packageId] ?? STATIC_KITS.full
  return (name) => {
    const component = module[name]
    if (component) {
      return component
    }
    return defineComponent({
      name: `Missing${name}`,
      render: () => h('span', { class: 'pg-preview-missing' }, `${packageId} 包中缺少 ${name}`)
    })
  }
}

function slotsFor(packageId: string): Record<string, SampleSlots> {
  const cached = SLOT_CACHE.get(packageId)
  if (cached) {
    return cached
  }
  const slots = createSampleSlots(kitOf(packageId))
  SLOT_CACHE.set(packageId, slots)
  return slots
}

export default defineComponent({
  name: 'PlaygroundPreviewHost',
  props: {
    exportName: {
      type: String,
      required: true
    },
    packageId: {
      type: String,
      default: 'full'
    },
    values: {
      type: Object as PropType<Record<string, unknown>>,
      required: true
    },
    eventProps: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    sceneId: {
      type: String,
      default: ''
    }
  },
  emits: ['sync'],
  setup(props, { emit }) {
    return () => {
      const module = DYNAMIC_KITS.value[props.packageId] ?? STATIC_KITS[props.packageId] ?? STATIC_KITS.full
      const target = module[props.exportName]
      if (!target) {
        return h('div', { class: 'pg-preview-missing' }, `${props.packageId} 包中缺少 ${props.exportName}`)
      }
      const attrs: Record<string, unknown> = { key: `${props.exportName}:${props.sceneId}`, ...props.values }
      for (const [eventName, propName] of Object.entries(EVENT_PROPS)) {
        if (props.eventProps.includes(propName)) {
          attrs[eventName] = (value: unknown) => {
            emit('sync', propName, value)
          }
        }
      }
      if (props.exportName === 'Table') {
        // 列骨架要跟场景走：冻结、排序、树形、合并这些能力只靠 props 拼不出来
        const tableKit = kitOf(props.packageId)
        return h(TableSceneDemo, {
          key: String(attrs.key),
          table: target,
          column: module.TableColumn ?? tableKit('TableColumn'),
          kit: tableKit,
          values: attrs,
          sceneId: props.sceneId
        })
      }
      if (props.exportName === 'TableColumn') {
        // 单列需要前后参照列才有对照，全部塞进一张带真实数据的表里
        const tableKit = kitOf(props.packageId)
        return h(TableColumnDemo, {
          key: String(attrs.key),
          table: module.Table ?? tableKit('Table'),
          column: target,
          values: attrs
        })
      }
      if (props.exportName === 'Select' && props.sceneId === 'loading') {
        return h(SelectLoadingDemo, { key: String(attrs.key), select: target, values: attrs })
      }
      if (props.exportName === 'InfiniteScroll') {
        return h(InfiniteScrollDemo, {
          // 切场景或切包都要重新从第一批开始跑，否则读数会继承上一个场景的加载进度
          key: `infinite-${props.packageId}-${props.sceneId}`,
          scroll: target,
          values: attrs,
          nested: props.sceneId === 'nested'
        })
      }
      if (props.exportName === 'Splitter' && props.sceneId === 'nested') {
        return h(SplitterNestedDemo, {
          key: String(attrs.key),
          splitter: target,
          panel: module.SplitterPanel ?? kitOf(props.packageId)('SplitterPanel')
        })
      }
      if (props.exportName === 'Tabs' && props.sceneId === 'editable') {
        return h(TabsEditableDemo, {
          key: String(attrs.key),
          tabs: target,
          pane: module.TabPane ?? kitOf(props.packageId)('TabPane')
        })
      }
      if (props.exportName === 'Carousel' && props.sceneId === 'images') {
        return h(CarouselImagesDemo, {
          key: String(attrs.key),
          carousel: target,
          item: module.CarouselItem ?? kitOf(props.packageId)('CarouselItem'),
          values: attrs
        })
      }
      if (props.exportName === 'Timeline' && props.sceneId === 'photos') {
        return h(TimelinePhotosDemo, {
          key: String(attrs.key),
          timeline: target,
          item: module.TimelineItem ?? kitOf(props.packageId)('TimelineItem'),
          values: attrs
        })
      }
      if (props.exportName === 'TabPane') {
        // TabPane 需在 Tabs 上下文中才有标签头，单独渲染只剩内容区
        const paneSlots = slotsFor(props.packageId)[props.exportName] ?? {}
        return h(kitOf(props.packageId)('Tabs'), { key: String(attrs.key) }, () => h(target, attrs, paneSlots))
      }
      if (props.exportName === 'Col') {
        // 单独渲染 Col 没有栅格上下文，包一层 Row 并补参考列
        return renderColHost(kitOf(props.packageId), attrs)
      }
      if (props.exportName === 'TourStep') {
        // TourStep 需在 Tour 上下文中才渲染引导面板，单独渲染只剩一行文本
        const stepSlots = slotsFor(props.packageId)[props.exportName] ?? {}
        return h(kitOf(props.packageId)('Tour'), { key: String(attrs.key), modelValue: true }, () =>
          h(target, attrs, stepSlots)
        )
      }
      if (props.exportName === 'AnchorLink') {
        // AnchorLink 需在 Anchor 上下文中才有激活态与页内滚动，单独渲染只剩一条普通链接
        const linkSlots = slotsFor(props.packageId)[props.exportName] ?? {}
        return h(kitOf(props.packageId)('Anchor'), { key: String(attrs.key) }, () => h(target, attrs, linkSlots))
      }
      if (props.exportName === 'Row') {
        // 列骨架要随场景变：固定两列填满栅格时，justify / align / 纵向间距全都看不出差别
        return h(RowDemo, {
          key: String(attrs.key),
          row: target,
          col: module.Col ?? kitOf(props.packageId)('Col'),
          values: attrs,
          sceneId: props.sceneId
        })
      }
      if (props.exportName === 'Collection' || props.exportName === 'CollectionItem') {
        // 集合只有「数据对象 → DOM」注册表这一件事，没有外观，演示要把 getItem 的结果显式摆出来
        const collectionKit = kitOf(props.packageId)
        const single = props.exportName === 'CollectionItem'
        return h(CollectionDemo, {
          key: String(attrs.key),
          collection: single ? (module.Collection ?? collectionKit('Collection')) : target,
          item: single ? target : (module.CollectionItem ?? collectionKit('CollectionItem')),
          sceneId: props.sceneId,
          single,
          itemValue: single ? ((attrs.item as Record<string, unknown> | null) ?? null) : null
        })
      }
      if (props.exportName === 'FocusTrap') {
        // 陷阱只管焦点，看不见摸不着；演示要把真实焦点位置、边界和拦截次数摆出来
        return h(FocusTrapDemo, {
          key: String(attrs.key),
          trap: target,
          values: attrs,
          sceneId: props.sceneId
        })
      }
      if (ROVING_EXPORTS.includes(props.exportName)) {
        // 焦点组的产出是 tabindex 与焦点位置，单独渲染就是几个普通方块，必须把这两个读数摊开才看得出它在做什么
        const rovingKit = kitOf(props.packageId)
        return h(RovingFocusDemo, {
          key: String(attrs.key),
          parts: {
            RovingFocusGroup: module.RovingFocusGroup ?? rovingKit('RovingFocusGroup'),
            RovingFocusItem: module.RovingFocusItem ?? rovingKit('RovingFocusItem')
          },
          focus: props.exportName,
          values: attrs
        })
      }
      if (POPPER_EXPORTS.includes(props.exportName)) {
        // Popper 家族单独渲染只是一块静态文本；定位全靠真实矩形，示例把触发器、锚点、面板、箭头的实测坐标摆出来
        const popperKit = kitOf(props.packageId)
        return h(PopperDemo, {
          key: String(attrs.key),
          parts: {
            Popper: module.Popper ?? popperKit('Popper'),
            PopperArrow: module.PopperArrow ?? popperKit('PopperArrow'),
            PopperContent: module.PopperContent ?? popperKit('PopperContent'),
            PopperTrigger: module.PopperTrigger ?? popperKit('PopperTrigger')
          },
          focus: props.exportName,
          values: attrs
        })
      }
      if (props.exportName === 'Overlay') {
        // 遮罩的作用全靠几何与命中测试：摆出盖住的范围、谁压着谁、这一下点击落到哪个元素才看得出它在做什么
        return h(OverlayDemo, {
          key: String(attrs.key),
          overlay: target,
          values: attrs,
          sceneId: props.sceneId
        })
      }
      if (props.exportName === 'Container') {
        // 布局容器要看得出方向如何随子项变化，按场景给出不同的区块骨架
        const layoutKit = kitOf(props.packageId)
        return h(ContainerDemo, {
          key: String(attrs.key),
          container: target,
          parts: {
            Aside: layoutKit('Aside'),
            Footer: layoutKit('Footer'),
            Header: layoutKit('Header'),
            Main: layoutKit('Main')
          },
          values: attrs,
          sceneId: props.sceneId
        })
      }
      if (LAYOUT_HOST_EXPORTS.has(props.exportName)) {
        // 单个区块脱离容器只剩一条色带，包进典型布局才看得出宽高与内边距
        return renderLayoutHost(
          kitOf(props.packageId),
          props.exportName,
          attrs,
          slotsFor(props.packageId)[props.exportName] ?? {}
        )
      }
      if (MENU_HOST_EXPORTS.has(props.exportName)) {
        // 菜单子项需在三组、三层深度的 Menu 中才看得出激活、缩进与手风琴效果
        const menuKit = kitOf(props.packageId)
        const menuSlots = slotsFor(props.packageId)[props.exportName] ?? {}
        return renderMenuHost(menuKit, props.exportName, attrs, menuSlots)
      }
      if (props.exportName === 'Upload') {
        return h(UploadDemo, {
          key: String(attrs.key),
          upload: target,
          values: attrs,
          packageId: props.packageId,
          triggerKind: uploadTriggerKind(props.sceneId)
        })
      }
      const slots = slotsFor(props.packageId)[props.exportName] ?? {}
      return h(target, attrs, slots)
    }
  }
})
