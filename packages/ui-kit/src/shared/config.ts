import type { ComputedRef, InjectionKey } from 'vue'
import { computed, inject } from 'vue'

export interface UiLocaleEmpty {
  description?: string
}

export interface UiLocaleSelect {
  placeholder?: string
  loading?: string
  noData?: string
  noMatch?: string
}

export interface UiLocaleTransfer {
  filterPlaceholder?: string
  empty?: string
  titleLeft?: string
  titleRight?: string
}

export interface UiLocaleDatePicker {
  placeholder?: string
  startPlaceholder?: string
  endPlaceholder?: string
  today?: string
  now?: string
  confirm?: string
  clear?: string
  week?: string
  weekdays?: string[]
  weekNumberFormat?: string
  prevPage?: string
  nextPage?: string
  prevGroup?: string
  nextGroup?: string
  hour?: string
  minute?: string
  second?: string
  yearFormat?: string
  monthFormat?: string
  yearMonthFormat?: string
  panelYearMonthFormat?: string
}

export interface UiLocaleTimePicker {
  placeholder?: string
  startPlaceholder?: string
  endPlaceholder?: string
  separator?: string
  now?: string
  confirm?: string
  hour?: string
  minute?: string
  second?: string
}

export interface UiLocaleTimeSelect {
  placeholder?: string
  empty?: string
}

export interface UiLocaleCalendar {
  weekdays?: string[]
  selectEnd?: string
  startHintFormat?: string
  rangeFormat?: string
  rangeHint?: string
  monthTitleFormat?: string
}

export interface UiLocaleCascader {
  placeholder?: string
  loading?: string
  noData?: string
  noMatch?: string
  clear?: string
  selectAll?: string
  levelFormat?: string
  removeFormat?: string
  hiddenFormat?: string
}

export interface UiLocaleColorPicker {
  placeholder?: string
  clear?: string
  confirm?: string
  saturationBrightness?: string
  hue?: string
  opacity?: string
  svValueFormat?: string
  presetFormat?: string
}

export interface UiLocaleTable {
  emptyText?: string
  expandRow?: string
  collapseRow?: string
}

export interface UiLocaleTree {
  emptyText?: string
}

export interface UiLocaleMessageBox {
  confirm?: string
  cancel?: string
  inputErrorMessage?: string
}

export interface UiLocalePopconfirm {
  title?: string
  cancel?: string
  confirm?: string
}

export interface UiLocaleTour {
  close?: string
  prev?: string
  next?: string
  finish?: string
}

export interface UiLocaleTabs {
  closeFormat?: string
  add?: string
}

export interface UiLocaleCarousel {
  slideFormat?: string
}

export interface UiLocaleBacktop {
  label?: string
}

export interface UiLocaleInputTag {
  removeFormat?: string
  placeholder?: string
}

export interface UiLocale {
  empty?: UiLocaleEmpty
  select?: UiLocaleSelect
  transfer?: UiLocaleTransfer
  datePicker?: UiLocaleDatePicker
  timePicker?: UiLocaleTimePicker
  timeSelect?: UiLocaleTimeSelect
  calendar?: UiLocaleCalendar
  cascader?: UiLocaleCascader
  colorPicker?: UiLocaleColorPicker
  table?: UiLocaleTable
  tree?: UiLocaleTree
  messageBox?: UiLocaleMessageBox
  popconfirm?: UiLocalePopconfirm
  tour?: UiLocaleTour
  tabs?: UiLocaleTabs
  carousel?: UiLocaleCarousel
  backtop?: UiLocaleBacktop
  inputTag?: UiLocaleInputTag
}

export const defaultUiLocale: { [K in keyof UiLocale]-?: Required<NonNullable<UiLocale[K]>> } = {
  empty: { description: '暂无数据' },
  select: { placeholder: '请选择', loading: '加载中', noData: '无数据', noMatch: '无匹配数据' },
  transfer: { filterPlaceholder: '请输入搜索内容', empty: '暂无数据', titleLeft: '列表 1', titleRight: '列表 2' },
  datePicker: {
    placeholder: '选择日期',
    startPlaceholder: '开始日期',
    endPlaceholder: '结束日期',
    today: '今天',
    now: '此刻',
    confirm: '确定',
    clear: '清空',
    week: '周',
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    weekNumberFormat: '第 {week} 周',
    prevPage: '上一页',
    nextPage: '下一页',
    prevGroup: '上一组',
    nextGroup: '下一组',
    hour: '时',
    minute: '分',
    second: '秒',
    yearFormat: '{year}年',
    monthFormat: '{month}月',
    yearMonthFormat: '{year}年{month}月',
    panelYearMonthFormat: '{year}年 {month}月'
  },
  timePicker: {
    placeholder: '选择时间',
    startPlaceholder: '开始时间',
    endPlaceholder: '结束时间',
    separator: '至',
    now: '此刻',
    confirm: '确定',
    hour: '时',
    minute: '分',
    second: '秒'
  },
  timeSelect: { placeholder: '选择时间', empty: '无可选时间' },
  calendar: {
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    selectEnd: '请选择结束日期',
    startHintFormat: '开始 {start}，请选择结束日期',
    rangeFormat: '{start} 至 {end}',
    rangeHint: '点击日期选择范围',
    monthTitleFormat: '{year} 年 {month} 月'
  },
  cascader: {
    placeholder: '请选择',
    loading: '加载中…',
    noData: '无数据',
    noMatch: '无匹配数据',
    clear: '清空',
    selectAll: '全选',
    levelFormat: '第 {level} 级',
    removeFormat: '移除 {label}',
    hiddenFormat: '还有 {count} 个已选项'
  },
  colorPicker: {
    placeholder: '选择颜色',
    clear: '清空',
    confirm: '确定',
    saturationBrightness: '饱和度与明度',
    hue: '色相',
    opacity: '不透明度',
    svValueFormat: '饱和度 {saturation}%，明度 {value}%',
    presetFormat: '预设颜色 {color}'
  },
  table: { emptyText: '暂无数据', expandRow: '展开行', collapseRow: '收起行' },
  tree: { emptyText: '暂无数据' },
  messageBox: { confirm: '确定', cancel: '取消', inputErrorMessage: '输入不合法' },
  popconfirm: { title: '确定执行此操作吗？', cancel: '取消', confirm: '确定' },
  tour: { close: '关闭引导', prev: '上一步', next: '下一步', finish: '完成' },
  tabs: { closeFormat: '关闭 {label}', add: '新增标签' },
  carousel: { slideFormat: '第 {index} 张' },
  backtop: { label: '回到顶部' },
  inputTag: { removeFormat: '移除 {label}', placeholder: '请输入后回车' }
}

export function formatLocale(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in params ? String(params[key]) : match))
}

export interface UiGlobalConfig {
  size?: string
  locale?: UiLocale
}

export const UI_CONFIG_KEY: InjectionKey<ComputedRef<UiGlobalConfig>> = Symbol('ui-config')

export function useUiConfig(): ComputedRef<UiGlobalConfig> | undefined {
  return inject(UI_CONFIG_KEY, undefined)
}

export function useLocale<T extends keyof UiLocale>(component: T): ComputedRef<Required<NonNullable<UiLocale[T]>>> {
  const config = inject(UI_CONFIG_KEY, undefined)
  // 键级回退：注入的 locale 只覆盖显式给出的键，其余键落回默认中文文案
  return computed(
    () =>
      ({ ...defaultUiLocale[component], ...(config?.value.locale?.[component] ?? {}) }) as unknown as Required<
        NonNullable<UiLocale[T]>
      >
  )
}
