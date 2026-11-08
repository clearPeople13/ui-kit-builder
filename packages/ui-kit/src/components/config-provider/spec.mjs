export default {
  id: 'config-provider',
  title: 'ConfigProvider 全局配置',
  description: '对齐主流组件库的 ConfigProvider，基础 props 与可选特性拆分。',
  order: 10,
  exports: [
    {
      name: 'ConfigProvider',
      module: 'packages/ui-kit/src/components/config-provider/core.ts',
      createExport: 'createConfigProvider',
      coreProps: [
        {
          name: 'size',
          type: 'string',
          description: '全局尺寸：未显式设置 size 的子组件继承该值'
        },
        {
          name: 'locale',
          type: '{ empty?: { description?: string }; select?: { placeholder?: string; loading?: string; noData?: string; noMatch?: string }; transfer?: { filterPlaceholder?: string; empty?: string; titleLeft?: string; titleRight?: string }; datePicker?: { placeholder?: string; startPlaceholder?: string; endPlaceholder?: string; today?: string; now?: string; confirm?: string; clear?: string; week?: string; weekdays?: string[]; weekNumberFormat?: string; prevPage?: string; nextPage?: string; prevGroup?: string; nextGroup?: string; hour?: string; minute?: string; second?: string; yearFormat?: string; monthFormat?: string; yearMonthFormat?: string; panelYearMonthFormat?: string }; timePicker?: { placeholder?: string; startPlaceholder?: string; endPlaceholder?: string; separator?: string; now?: string; confirm?: string; hour?: string; minute?: string; second?: string }; timeSelect?: { placeholder?: string; empty?: string }; calendar?: { weekdays?: string[]; selectEnd?: string; startHintFormat?: string; rangeFormat?: string; rangeHint?: string; monthTitleFormat?: string }; cascader?: { placeholder?: string; loading?: string; noData?: string; noMatch?: string; clear?: string; selectAll?: string; levelFormat?: string; removeFormat?: string; hiddenFormat?: string }; colorPicker?: { placeholder?: string; clear?: string; confirm?: string; saturationBrightness?: string; hue?: string; opacity?: string; svValueFormat?: string; presetFormat?: string }; table?: { emptyText?: string; expandRow?: string; collapseRow?: string }; tree?: { emptyText?: string }; messageBox?: { confirm?: string; cancel?: string; inputErrorMessage?: string }; popconfirm?: { title?: string; cancel?: string; confirm?: string }; tour?: { close?: string; prev?: string; next?: string; finish?: string }; tabs?: { closeFormat?: string; add?: string }; carousel?: { slideFormat?: string }; backtop?: { label?: string }; inputTag?: { removeFormat?: string; placeholder?: string } }',
          description: '全局文案：按组件分组注入，未覆盖的键回退默认中文文案'
        }
      ],
      features: {}
    }
  ]
}
