export default {
  "id": "time-picker",
  "title": "TimePicker 时间选择器",
  "description": "对齐主流组件库的 TimePicker，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "TimePicker",
      "module": "packages/ui-kit/src/components/time-picker/core.ts",
      "createExport": "createTimePicker",
      "coreProps": [
        {
          "name": "type",
          "type": "string",
          "default": "",
          "description": "type"
        },
        {
          "name": "size",
          "type": "string",
          "description": "size"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "description": "disabled"
        },
        {
          "name": "modelValue",
          "type": "any[] | string",
          "description": "modelValue"
        },
        {
          "name": "defaultValue",
          "type": "any | any[]",
          "description": "defaultValue"
        },
        {
          "name": "id",
          "type": "any[] | string",
          "description": "id"
        },
        {
          "name": "name",
          "type": "any[] | string",
          "description": "name"
        },
        {
          "name": "format",
          "type": "string",
          "description": "format"
        },
        {
          "name": "timeFormat",
          "type": "string",
          "description": "timeFormat"
        },
        {
          "name": "readonly",
          "type": "boolean",
          "description": "readonly"
        },
        {
          "name": "placeholder",
          "type": "string",
          "default": "",
          "description": "placeholder"
        },
        {
          "name": "defaultTime",
          "type": "any | any[]",
          "description": "defaultTime"
        },
        {
          "name": "isRange",
          "type": "boolean",
          "description": "isRange"
        },
        {
          "name": "disabledHours",
          "type": "(...args: any[]) => any",
          "description": "disabledHours"
        },
        {
          "name": "disabledMinutes",
          "type": "(...args: any[]) => any",
          "description": "disabledMinutes"
        },
        {
          "name": "disabledSeconds",
          "type": "(...args: any[]) => any",
          "description": "disabledSeconds"
        },
        {
          "name": "tabindex",
          "type": "string | number",
          "default": 0,
          "description": "tabindex"
        },
        {
          "name": "ariaLabel",
          "type": "string",
          "description": "ariaLabel"
        },
        {
          "name": "showNow",
          "type": "boolean",
          "default": true,
          "description": "showNow"
        },
        {
          "name": "showConfirm",
          "type": "boolean",
          "default": true,
          "description": "showConfirm"
        },
        {
          "name": "showFooter",
          "type": "boolean",
          "default": true,
          "description": "showFooter"
        }
      ],
      "features": {
        "time-picker.clearable": {
          "title": "可清空",
          "description": "可清空：clearable、clearIcon",
          "module": "packages/ui-kit/src/components/time-picker/features/clearable/index.ts",
          "exportName": "timePickerClearableFeature",
          "requires": [],
          "props": [
            {
              "name": "clearable",
              "type": "boolean",
              "default": true
            },
            {
              "name": "clearIcon",
              "type": "string | Record<string, any>",
              "default": {
                "name": "CircleClose",
                "__name": "circle-close"
              }
            }
          ]
        },
        "time-picker.icons": {
          "title": "图标",
          "description": "图标：prefixIcon",
          "module": "packages/ui-kit/src/components/time-picker/features/icons/index.ts",
          "exportName": "timePickerIconsFeature",
          "requires": [],
          "props": [
            {
              "name": "prefixIcon",
              "type": "string | Record<string, any>",
              "default": ""
            }
          ]
        },
        "time-picker.popper": {
          "title": "浮层定位",
          "description": "浮层定位：popperClass、popperStyle、placement、fallbackPlacements、panelScroll",
          "module": "packages/ui-kit/src/components/time-picker/features/popper/index.ts",
          "exportName": "timePickerPopperFeature",
          "requires": [],
          "props": [
            {
              "name": "popperClass",
              "type": "string | any[] | Record<string, any> | boolean",
              "default": null
            },
            {
              "name": "popperStyle",
              "type": "string | any[] | Record<string, any> | boolean",
              "default": null
            },
            {
              "name": "placement",
              "type": "string",
              "default": "bottom"
            },
            {
              "name": "fallbackPlacements",
              "type": "any[]",
              "default": [
                "bottom",
                "top",
                "right",
                "left"
              ]
            },
            {
              "name": "panelScroll",
              "type": "string",
              "description": "滚动策略：follow 跟随 / close 关闭",
              "default": "follow"
            }
          ]
        },
        "time-picker.editable": {
          "title": "编辑与新增",
          "description": "编辑与新增：editable",
          "module": "packages/ui-kit/src/components/time-picker/features/editable/index.ts",
          "exportName": "timePickerEditableFeature",
          "requires": [],
          "props": [
            {
              "name": "editable",
              "type": "boolean",
              "default": true
            }
          ]
        },
        "time-picker.format": {
          "title": "格式化",
          "description": "格式化：valueFormat、valueOnClear",
          "module": "packages/ui-kit/src/components/time-picker/features/format/index.ts",
          "exportName": "timePickerFormatFeature",
          "requires": [],
          "props": [
            {
              "name": "valueFormat",
              "type": "string"
            },
            {
              "name": "valueOnClear",
              "type": "string | number | boolean | (...args: any[]) => any",
              "default": null
            }
          ]
        },
        "time-picker.range": {
          "title": "范围选择",
          "description": "范围选择：rangeSeparator、startPlaceholder、endPlaceholder、unlinkPanels、showWeekNumber",
          "module": "packages/ui-kit/src/components/time-picker/features/range/index.ts",
          "exportName": "timePickerRangeFeature",
          "requires": [],
          "props": [
            {
              "name": "rangeSeparator",
              "type": "string",
              "default": "-"
            },
            {
              "name": "startPlaceholder",
              "type": "string"
            },
            {
              "name": "endPlaceholder",
              "type": "string"
            }
          ]
        }
      }
    }
  ]
}
