export default {
  "id": "tour",
  "title": "Tour 漫游式引导",
  "description": "对齐主流组件库的 Tour / TourStep，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Tour",
      "module": "packages/ui-kit/src/components/tour/core.ts",
      "createExport": "createTour",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "boolean",
          "description": "modelValue"
        },
        {
          "name": "type",
          "type": "'default' | 'primary'",
          "description": "面板配色风格"
        },
        {
          "name": "zIndex",
          "type": "number",
          "description": "zIndex"
        },
        {
          "name": "current",
          "type": "number",
          "description": "current"
        },
        {
          "name": "contentStyle",
          "type": "Record<string, any>",
          "description": "contentStyle"
        },
        {
          "name": "mask",
          "type": "boolean | Record<string, any>",
          "default": true,
          "description": "mask"
        },
        {
          "name": "gap",
          "type": "Record<string, any>",
          "description": "gap"
        }
      ],
      "features": {
        "tour.closable": {
          "title": "可关闭",
          "description": "可关闭：showClose、closeIcon",
          "module": "packages/ui-kit/src/components/tour/features/closable/index.ts",
          "exportName": "tourClosableFeature",
          "requires": [],
          "props": [
            {
              "name": "showClose",
              "type": "boolean",
              "default": true
            },
            {
              "name": "closeIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any"
            }
          ]
        },
        "tour.popper": {
          "title": "浮层定位",
          "description": "浮层定位：appendTo、placement、offset、showArrow",
          "module": "packages/ui-kit/src/components/tour/features/popper/index.ts",
          "exportName": "tourPopperFeature",
          "requires": [],
          "props": [
            {
              "name": "appendTo",
              "type": "string | Record<string, any>",
              "default": "body"
            },
            {
              "name": "placement",
              "type": "string",
              "default": "bottom"
            },
            {
              "name": "offset",
              "type": "number",
              "default": 10
            },
            {
              "name": "showArrow",
              "type": "boolean",
              "default": true
            }
          ]
        },
        "tour.validate": {
          "title": "滚动定位",
          "description": "滚动定位：scrollIntoViewOptions，关闭后不再把目标滚动进视口",
          "module": "packages/ui-kit/src/components/tour/features/validate/index.ts",
          "exportName": "tourValidateFeature",
          "requires": [],
          "props": [
            {
              "name": "scrollIntoViewOptions",
              "type": "boolean | Record<string, any>",
              "default": {},
              "offValue": false
            }
          ]
        },
        "tour.modal": {
          "title": "遮罩与关闭行为",
          "description": "遮罩与关闭行为：closeOnPressEscape",
          "module": "packages/ui-kit/src/components/tour/features/modal/index.ts",
          "exportName": "tourModalFeature",
          "requires": [],
          "props": [
            {
              "name": "closeOnPressEscape",
              "type": "boolean",
              "default": true
            }
          ]
        }
      }
    },
    {
      "name": "TourStep",
      "module": "packages/ui-kit/src/components/tour/core.ts",
      "createExport": "createTourStep",
      "coreProps": [
        {
          "name": "type",
          "type": "'default' | 'primary'",
          "description": "面板配色风格，覆盖 Tour 的 type"
        },
        {
          "name": "target",
          "type": "string | Record<string, any> | (...args: any[]) => any",
          "description": "高亮目标选择器 / 元素"
        },
        {
          "name": "title",
          "type": "string",
          "description": "title"
        },
        {
          "name": "description",
          "type": "string",
          "description": "description"
        },
        {
          "name": "mask",
          "type": "boolean | Record<string, any>",
          "default": null,
          "description": "mask"
        },
        {
          "name": "contentStyle",
          "type": "Record<string, any>",
          "description": "contentStyle"
        }
      ],
      "features": {
        "tour.tour-step-closable": {
          "title": "可关闭",
          "description": "可关闭：showClose、closeIcon",
          "module": "packages/ui-kit/src/components/tour/features/tour-step-closable/index.ts",
          "exportName": "tourStepClosableFeature",
          "requires": [],
          "props": [
            {
              "name": "showClose",
              "type": "boolean",
              "default": null
            },
            {
              "name": "closeIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any"
            }
          ]
        },
        "tour.tour-step-popper": {
          "title": "浮层定位",
          "description": "浮层定位：placement、showArrow",
          "module": "packages/ui-kit/src/components/tour/features/tour-step-popper/index.ts",
          "exportName": "tourStepPopperFeature",
          "requires": [],
          "props": [
            {
              "name": "placement",
              "type": "string"
            },
            {
              "name": "showArrow",
              "type": "boolean",
              "default": null
            }
          ]
        },
        "tour.tour-step-validate": {
          "title": "滚动定位",
          "description": "滚动定位：scrollIntoViewOptions，未设置时跟随 Tour",
          "module": "packages/ui-kit/src/components/tour/features/tour-step-validate/index.ts",
          "exportName": "tourStepValidateFeature",
          "requires": [],
          "props": [
            {
              "name": "scrollIntoViewOptions",
              "type": "boolean | Record<string, any>",
              "offValue": false
            }
          ]
        }
      }
    }
  ]
}
