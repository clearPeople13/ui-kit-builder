export default {
  "id": "date-picker",
  "title": "DatePicker 日期选择器",
  "description": "对齐主流组件库的 DatePicker，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "DatePicker",
      "module": "packages/ui-kit/src/components/date-picker/core.ts",
      "createExport": "createDatePicker",
      "coreProps": [
        {
          "name": "type",
          "type": "string",
          "default": "date",
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
          "default": null,
          "description": "disabled"
        },
        {
          "name": "modelValue",
          "type": "any | any[] | string | number",
          "default": "",
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
          "name": "dateFormat",
          "type": "string",
          "description": "dateFormat"
        },
        {
          "name": "timeFormat",
          "type": "string",
          "description": "timeFormat"
        },
        {
          "name": "saveOnBlur",
          "type": "boolean",
          "default": true,
          "description": "saveOnBlur"
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
          "name": "disabledDate",
          "type": "(...args: any[]) => any",
          "description": "disabledDate"
        },
        {
          "name": "cellClassName",
          "type": "(...args: any[]) => any",
          "description": "cellClassName"
        },
        {
          "name": "shortcuts",
          "type": "any[]",
          "description": "shortcuts"
        },
        {
          "name": "tabindex",
          "type": "string | number",
          "default": 0,
          "description": "tabindex"
        },
        {
          "name": "singlePanel",
          "type": "boolean",
          "description": "singlePanel"
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
        "date-picker.clearable": {
          "title": "可清空",
          "description": "可清空：clearable、clearIcon",
          "module": "packages/ui-kit/src/components/date-picker/features/clearable/index.ts",
          "exportName": "datePickerClearableFeature",
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
              "default": ""
            }
          ]
        },
        "date-picker.icons": {
          "title": "图标",
          "description": "图标：prefixIcon",
          "module": "packages/ui-kit/src/components/date-picker/features/icons/index.ts",
          "exportName": "datePickerIconsFeature",
          "requires": [],
          "props": [
            {
              "name": "prefixIcon",
              "type": "string | Record<string, any>",
              "default": ""
            }
          ]
        },
        "date-picker.popper": {
          "title": "浮层定位",
          "description": "浮层定位：popperClass、popperStyle、placement、fallbackPlacements、panelScroll",
          "module": "packages/ui-kit/src/components/date-picker/features/popper/index.ts",
          "exportName": "datePickerPopperFeature",
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
        "date-picker.editable": {
          "title": "可编辑",
          "description": "可编辑：editable",
          "module": "packages/ui-kit/src/components/date-picker/features/editable/index.ts",
          "exportName": "datePickerEditableFeature",
          "requires": [],
          "props": [
            {
              "name": "editable",
              "type": "boolean",
              "default": true
            }
          ]
        },
        "date-picker.format": {
          "title": "格式化",
          "description": "格式化：valueFormat、valueOnClear",
          "module": "packages/ui-kit/src/components/date-picker/features/format/index.ts",
          "exportName": "datePickerFormatFeature",
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
        "date-picker.range": {
          "title": "范围选择",
          "description": "范围选择：rangeSeparator、startPlaceholder、endPlaceholder、unlinkPanels、showWeekNumber",
          "module": "packages/ui-kit/src/components/date-picker/features/range/index.ts",
          "exportName": "datePickerRangeFeature",
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
            },
            {
              "name": "unlinkPanels",
              "type": "boolean"
            },
            {
              "name": "showWeekNumber",
              "type": "boolean"
            }
          ]
        }
      }
    }
  ]
}
