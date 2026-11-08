export default {
  "id": "popover",
  "title": "Popover 弹出框",
  "description": "对齐主流组件库的 Popover，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Popover",
      "module": "packages/ui-kit/src/components/popover/core.ts",
      "createExport": "createPopover",
      "coreProps": [
        {
          "name": "disabled",
          "type": "boolean",
          "description": "disabled"
        },
        {
          "name": "modelValue",
          "type": "boolean",
          "default": null,
          "description": "受控显示（v-model），true 常显 / false 强制收起"
        },
        {
          "name": "showAfter",
          "type": "number",
          "default": 0,
          "description": "显示延迟（毫秒）"
        },
        {
          "name": "hideAfter",
          "type": "number",
          "default": 200,
          "description": "隐藏延迟（毫秒）"
        },
        {
          "name": "autoClose",
          "type": "number",
          "default": 0,
          "description": "autoClose"
        },
        {
          "name": "arrowOffset",
          "type": "number",
          "default": 5,
          "description": "arrowOffset"
        },
        {
          "name": "id",
          "type": "string",
          "description": "id"
        },
        {
          "name": "style",
          "type": "string | any[] | Record<string, any> | boolean",
          "default": null,
          "description": "style"
        },
        {
          "name": "className",
          "type": "string | any[] | Record<string, any> | boolean",
          "description": "className"
        },
        {
          "name": "effect",
          "type": "string",
          "default": "light",
          "description": "effect"
        },
        {
          "name": "enterable",
          "type": "boolean",
          "default": true,
          "description": "enterable"
        },
        {
          "name": "zIndex",
          "type": "number",
          "description": "zIndex"
        },
        {
          "name": "content",
          "type": "string",
          "default": "",
          "description": "content"
        },
        {
          "name": "onClick",
          "type": "(...args: any[]) => any",
          "description": "onClick"
        },
        {
          "name": "trigger",
          "type": "string | any[]",
          "default": "hover",
          "description": "trigger"
        },
        {
          "name": "tabindex",
          "type": "number | string",
          "default": 0,
          "description": "tabindex"
        },
        {
          "name": "title",
          "type": "string",
          "description": "title"
        },
        {
          "name": "width",
          "type": "string | number",
          "default": 150,
          "description": "width"
        }
      ],
      "features": {
        "popover.popper": {
          "title": "浮层定位",
          "description": "浮层定位：teleported、appendTo、persistent、popperClass、popperStyle、placement、fallbackPlacements、offset、showArrow、panelScroll",
          "module": "packages/ui-kit/src/components/popover/features/popper/index.ts",
          "exportName": "popoverPopperFeature",
          "requires": [],
          "props": [
            {
              "name": "teleported",
              "type": "boolean",
              "default": true,
              "description": "浮层是否传送到 body"
            },
            {
              "name": "appendTo",
              "type": "string | Record<string, any>",
              "description": "浮层挂载目标，默认 body"
            },
            {
              "name": "persistent",
              "type": "boolean",
              "default": true,
              "description": "收起后是否保留浮层 DOM"
            },
            {
              "name": "popperClass",
              "type": "string | any[] | Record<string, any> | boolean",
              "description": "浮层附加类名"
            },
            {
              "name": "popperStyle",
              "type": "string | any[] | Record<string, any> | boolean",
              "description": "浮层附加样式"
            },
            {
              "name": "showArrow",
              "type": "boolean",
              "default": true,
              "description": "是否显示箭头"
            },
            {
              "name": "placement",
              "type": "string",
              "default": "bottom"
            },
            {
              "name": "fallbackPlacements",
              "type": "any[]",
              "default": null
            },
            {
              "name": "offset",
              "type": "number",
              "default": null
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
