export default {
  "id": "tooltip",
  "title": "Tooltip 文字提示",
  "description": "对齐主流组件库的 Tooltip，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Tooltip",
      "module": "packages/ui-kit/src/components/tooltip/core.ts",
      "createExport": "createTooltip",
      "coreProps": [
        {
          "name": "content",
          "type": "string",
          "description": "content",
          "default": ""
        },
        {
          "name": "placement",
          "type": "string",
          "description": "placement",
          "default": "bottom"
        },
        {
          "name": "effect",
          "type": "string",
          "description": "effect",
          "default": "dark"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "description": "disabled"
        },
        {
          "name": "trigger",
          "type": "string | string[]",
          "description": "trigger",
          "default": "hover"
        },
        {
          "name": "modelValue",
          "type": "boolean",
          "description": "受控显示状态（v-model），缺省时回退内部触发状态"
        },
        {
          "name": "showArrow",
          "type": "boolean",
          "description": "showArrow",
          "default": true
        },
        {
          "name": "rawContent",
          "type": "boolean",
          "description": "rawContent"
        },
        {
          "name": "teleported",
          "type": "boolean",
          "description": "teleported",
          "default": true
        },
        {
          "name": "offset",
          "type": "number",
          "description": "offset",
          "default": 12
        },
        {
          "name": "fallbackPlacements",
          "type": "any[]",
          "description": "fallbackPlacements"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": false,
          "description": "触发器内容，渲染在触发区（无默认内容，面板文案仍取 content 属性）"
        }
      ],
      "features": {
        "tooltip.delay": {
          "title": "延迟显示",
          "description": "延迟显示：showAfter、hideAfter、enterable、autoClose",
          "module": "packages/ui-kit/src/components/tooltip/features/delay/index.ts",
          "exportName": "tooltipDelayFeature",
          "requires": [],
          "props": [
            {
              "name": "showAfter",
              "type": "number",
              "description": "showAfter",
              "default": 0
            },
            {
              "name": "hideAfter",
              "type": "number",
              "description": "hideAfter",
              "default": 200
            },
            {
              "name": "enterable",
              "type": "boolean",
              "description": "鼠标是否可以进入浮层内容",
              "default": true
            },
            {
              "name": "autoClose",
              "type": "number",
              "description": "autoClose",
              "default": 0
            }
          ]
        },
        "tooltip.popper": {
          "title": "弹出层配置",
          "description": "弹出层配置：appendTo、popperClass、popperStyle、persistent、panelScroll",
          "module": "packages/ui-kit/src/components/tooltip/features/popper/index.ts",
          "exportName": "tooltipPopperFeature",
          "requires": [],
          "props": [
            {
              "name": "appendTo",
              "type": "string | Record<string, any>",
              "description": "appendTo",
              "default": "body"
            },
            {
              "name": "popperClass",
              "type": "string | string[] | Record<string, any>",
              "description": "popperClass",
              "default": ""
            },
            {
              "name": "popperStyle",
              "type": "string | Record<string, any> | any[]",
              "description": "popperStyle",
              "default": ""
            },
            {
              "name": "persistent",
              "type": "boolean",
              "description": "persistent",
              "default": true
            },
            {
              "name": "panelScroll",
              "type": "string",
              "description": "滚动策略：follow 跟随 / close 关闭",
              "default": "follow"
            }
          ]
        }
      }
    }
  ]
}
