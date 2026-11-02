export default {
  "id": "time-select",
  "title": "TimeSelect 时间选择",
  "description": "对齐主流组件库的 TimeSelect，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "TimeSelect",
      "module": "packages/ui-kit/src/components/time-select/core.ts",
      "createExport": "createTimeSelect",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "string",
          "description": "modelValue"
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
          "name": "format",
          "type": "string",
          "default": "HH:mm",
          "description": "format"
        },
        {
          "name": "effect",
          "type": "string",
          "default": "light",
          "description": "effect"
        },
        {
          "name": "placeholder",
          "type": "string",
          "description": "placeholder"
        },
        {
          "name": "start",
          "type": "string",
          "default": "09:00",
          "description": "start"
        },
        {
          "name": "end",
          "type": "string",
          "default": "18:00",
          "description": "end"
        },
        {
          "name": "step",
          "type": "string",
          "default": "00:30",
          "description": "step"
        },
        {
          "name": "minTime",
          "type": "string",
          "description": "minTime"
        },
        {
          "name": "maxTime",
          "type": "string",
          "description": "maxTime"
        },
        {
          "name": "includeEndTime",
          "type": "boolean",
          "description": "includeEndTime"
        },
        {
          "name": "name",
          "type": "string",
          "description": "name"
        }
      ],
      "features": {
        "time-select.clearable": {
          "title": "可清空",
          "description": "可清空：clearable、clearIcon",
          "module": "packages/ui-kit/src/components/time-select/features/clearable/index.ts",
          "exportName": "timeSelectClearableFeature",
          "requires": [],
          "props": [
            {
              "name": "clearable",
              "type": "boolean",
              "default": true
            },
            {
              "name": "clearIcon",
              "type": "string | Record<string, any>"
            }
          ]
        },
        "time-select.icons": {
          "title": "图标",
          "description": "图标：prefixIcon",
          "module": "packages/ui-kit/src/components/time-select/features/icons/index.ts",
          "exportName": "timeSelectIconsFeature",
          "requires": [],
          "props": [
            {
              "name": "prefixIcon",
              "type": "string | Record<string, any>"
            }
          ]
        },
        "time-select.popper": {
          "title": "浮层定位",
          "description": "浮层定位：popperClass、popperStyle、panelScroll",
          "module": "packages/ui-kit/src/components/time-select/features/popper/index.ts",
          "exportName": "timeSelectPopperFeature",
          "requires": [],
          "props": [
            {
              "name": "popperClass",
              "type": "string | any[] | Record<string, any> | boolean",
              "default": ""
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
        "time-select.editable": {
          "title": "编辑与新增",
          "description": "编辑与新增：editable",
          "module": "packages/ui-kit/src/components/time-select/features/editable/index.ts",
          "exportName": "timeSelectEditableFeature",
          "requires": [],
          "props": [
            {
              "name": "editable",
              "type": "boolean",
              "default": true
            }
          ]
        },
        "time-select.format": {
          "title": "格式化",
          "description": "格式化：valueOnClear",
          "module": "packages/ui-kit/src/components/time-select/features/format/index.ts",
          "exportName": "timeSelectFormatFeature",
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
