export default {
  "id": "slider",
  "title": "Slider 滑块",
  "description": "对齐主流组件库的 Slider，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Slider",
      "module": "packages/ui-kit/src/components/slider/core.ts",
      "createExport": "createSlider",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "number | any[]",
          "default": 0,
          "description": "modelValue"
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
          "name": "id",
          "type": "string",
          "default": null,
          "description": "id"
        },
        {
          "name": "min",
          "type": "number",
          "default": 0,
          "description": "min"
        },
        {
          "name": "max",
          "type": "number",
          "default": 100,
          "description": "max"
        },
        {
          "name": "step",
          "type": "number | string",
          "default": 1,
          "description": "step"
        },
        {
          "name": "showInput",
          "type": "boolean",
          "description": "显示输入框"
        },
        {
          "name": "showInputControls",
          "type": "boolean",
          "default": true,
          "description": "输入框是否带加减按钮"
        },
        {
          "name": "inputSize",
          "type": "string",
          "description": "输入框尺寸"
        },
        {
          "name": "showStops",
          "type": "boolean",
          "description": "显示刻度点"
        },
        {
          "name": "showTooltip",
          "type": "boolean",
          "default": true,
          "description": "showTooltip"
        },
        {
          "name": "vertical",
          "type": "boolean",
          "description": "vertical"
        },
        {
          "name": "height",
          "type": "string",
          "description": "height"
        },
        {
          "name": "tooltipClass",
          "type": "string | any[] | Record<string, any> | boolean",
          "default": null,
          "description": "tooltipClass"
        },
        {
          "name": "marks",
          "type": "Record<string, any>",
          "description": "刻度标记，{ 数值: 文案 }"
        },
        {
          "name": "ariaLabel",
          "type": "string",
          "description": "无障碍标签"
        }
      ],
      "features": {
        "slider.popper": {
          "title": "浮层定位",
          "description": "浮层定位：persistent、placement",
          "module": "packages/ui-kit/src/components/slider/features/popper/index.ts",
          "exportName": "sliderPopperFeature",
          "requires": [],
          "props": [
            {
              "name": "persistent",
              "type": "boolean",
              "default": true
            },
            {
              "name": "placement",
              "type": "string",
              "default": "top"
            }
          ]
        },
        "slider.format": {
          "title": "格式化",
          "description": "格式化：formatTooltip、formatValueText",
          "module": "packages/ui-kit/src/components/slider/features/format/index.ts",
          "exportName": "sliderFormatFeature",
          "requires": [],
          "props": [
            {
              "name": "formatTooltip",
              "type": "(...args: any[]) => any",
              "default": null
            }
          ]
        },
        "slider.range": {
          "title": "范围选择",
          "description": "范围选择：range",
          "module": "packages/ui-kit/src/components/slider/features/range/index.ts",
          "exportName": "sliderRangeFeature",
          "requires": [],
          "props": [
            {
              "name": "range",
              "type": "boolean"
            }
          ]
        }
      }
    }
  ]
}
