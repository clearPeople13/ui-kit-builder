export default {
  "id": "color-picker",
  "title": "ColorPicker 颜色选择器",
  "description": "对齐主流组件库的 ColorPicker，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "ColorPicker",
      "module": "packages/ui-kit/src/components/color-picker/core.ts",
      "createExport": "createColorPicker",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "string",
          "default": null,
          "description": "绑定色值；空值或无法解析的文本视作未选中（显示占位文案），清空后未回写则继续显示原值"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "default": null,
          "description": "disabled"
        },
        {
          "name": "size",
          "type": "string",
          "description": "size"
        },
        {
          "name": "id",
          "type": "string",
          "description": "id"
        },
        {
          "name": "showAlpha",
          "type": "boolean",
          "description": "showAlpha"
        },
        {
          "name": "colorFormat",
          "type": "string",
          "description": "colorFormat"
        },
        {
          "name": "tabindex",
          "type": "string | number",
          "default": 0,
          "description": "tabindex"
        },
        {
          "name": "predefine",
          "type": "any[]",
          "description": "predefine"
        },
        {
          "name": "ariaLabel",
          "type": "string",
          "description": "ariaLabel"
        }
      ],
      "features": {
        "color-picker.clearable": {
          "title": "可清空",
          "description": "可清空：clearable",
          "module": "packages/ui-kit/src/components/color-picker/features/clearable/index.ts",
          "exportName": "colorPickerClearableFeature",
          "requires": [],
          "props": [
            {
              "name": "clearable",
              "type": "boolean",
              "default": true
            }
          ]
        },
        "color-picker.popper": {
          "title": "浮层定位",
          "description": "浮层定位：teleported、appendTo、persistent、popperClass、popperStyle、panelScroll",
          "module": "packages/ui-kit/src/components/color-picker/features/popper/index.ts",
          "exportName": "colorPickerPopperFeature",
          "requires": [],
          "props": [
            {
              "name": "teleported",
              "type": "boolean",
              "default": true
            },
            {
              "name": "appendTo",
              "type": "string | Record<string, any>"
            },
            {
              "name": "persistent",
              "type": "boolean",
              "default": true
            },
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
              "name": "panelScroll",
              "type": "string",
              "description": "滚动策略：follow 跟随 / close 关闭",
              "default": "follow"
            }
          ]
        },
        "color-picker.format": {
          "title": "格式化",
          "description": "格式化：valueOnClear",
          "module": "packages/ui-kit/src/components/color-picker/features/format/index.ts",
          "exportName": "colorPickerFormatFeature",
          "requires": [],
          "props": [
            {
              "name": "valueOnClear",
              "type": "string | number | boolean | (...args: any[]) => any",
              "default": null
            }
          ]
        }
      }
    }
  ]
}
