export default {
  id: 'date-picker-panel',
  title: 'DatePickerPanel 日期面板',
  description: '对齐主流组件库的 DatePickerPanel，基础 props 与可选特性拆分。',
  order: 10,
  exports: [
    {
      name: 'DatePickerPanel',
      module: 'packages/ui-kit/src/components/date-picker-panel/core.ts',
      createExport: 'createDatePickerPanel',
      coreProps: [
        {
          name: 'disabled',
          type: 'boolean',
          default: null,
          description: 'disabled'
        },
        {
          name: 'modelValue',
          type: 'any | any[] | string | number',
          default: '',
          description: 'modelValue'
        },
        {
          name: 'defaultValue',
          type: 'any | any[]',
          description: 'defaultValue'
        },
        {
          name: 'type',
          type: 'string',
          default: 'date',
          description: 'type'
        },
        {
          name: 'dateFormat',
          type: 'string',
          description: 'dateFormat'
        },
        {
          name: 'isRange',
          type: 'boolean',
          description: 'isRange'
        },
        {
          name: 'disabledDate',
          type: '(...args: any[]) => any',
          description: 'disabledDate'
        },
        {
          name: 'cellClassName',
          type: '(...args: any[]) => any',
          description: 'cellClassName'
        },
        {
          name: 'shortcuts',
          type: 'any[]',
          description: 'shortcuts'
        },
        {
          name: 'showNow',
          type: 'boolean',
          default: true,
          description: 'showNow'
        },
        {
          name: 'showConfirm',
          type: 'boolean',
          description: 'showConfirm'
        },
        {
          name: 'showFooter',
          type: 'boolean',
          default: true,
          description: 'showFooter'
        }
      ],
      features: {
        'date-picker-panel.clearable': {
          title: '可清空',
          description: '可清空：clearable',
          module: 'packages/ui-kit/src/components/date-picker-panel/features/clearable/index.ts',
          exportName: 'datePickerPanelClearableFeature',
          requires: [],
          props: [
            {
              name: 'clearable',
              type: 'boolean',
              default: true
            }
          ]
        },
        'date-picker-panel.appearance': {
          title: '外观变体',
          description: '外观变体：border',
          module: 'packages/ui-kit/src/components/date-picker-panel/features/appearance/index.ts',
          exportName: 'datePickerPanelAppearanceFeature',
          requires: [],
          props: [
            {
              name: 'border',
              type: 'boolean',
              default: true
            }
          ]
        },
        'date-picker-panel.format': {
          title: '格式化',
          description: '格式化：valueFormat',
          module: 'packages/ui-kit/src/components/date-picker-panel/features/format/index.ts',
          exportName: 'datePickerPanelFormatFeature',
          requires: [],
          props: [
            {
              name: 'valueFormat',
              type: 'string'
            }
          ]
        },
        'date-picker-panel.range': {
          title: '范围选择',
          description: '范围选择：unlinkPanels、showWeekNumber',
          module: 'packages/ui-kit/src/components/date-picker-panel/features/range/index.ts',
          exportName: 'datePickerPanelRangeFeature',
          requires: [],
          props: [
            {
              name: 'unlinkPanels',
              type: 'boolean'
            },
            {
              name: 'showWeekNumber',
              type: 'boolean'
            }
          ]
        }
      }
    }
  ]
}
