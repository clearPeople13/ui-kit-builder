export default {
  "id": "popconfirm",
  "title": "Popconfirm 气泡确认框",
  "description": "对齐主流组件库的 Popconfirm，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Popconfirm",
      "module": "packages/ui-kit/src/components/popconfirm/core.ts",
      "createExport": "createPopconfirm",
      "coreProps": [
        {
          "name": "title",
          "type": "string",
          "description": "title"
        },
        {
          "name": "confirmButtonText",
          "type": "string",
          "description": "confirmButtonText"
        },
        {
          "name": "cancelButtonText",
          "type": "string",
          "description": "cancelButtonText"
        },
        {
          "name": "confirmButtonType",
          "type": "string",
          "default": "primary",
          "description": "confirmButtonType"
        },
        {
          "name": "cancelButtonType",
          "type": "string",
          "default": "text",
          "description": "cancelButtonType"
        },
        {
          "name": "iconColor",
          "type": "string",
          "default": "#f90",
          "description": "iconColor"
        },
        {
          "name": "hideIcon",
          "type": "boolean",
          "description": "hideIcon"
        },
        {
          "name": "hideAfter",
          "type": "number",
          "default": 200,
          "description": "关闭延迟（毫秒）"
        },
        {
          "name": "modelValue",
          "type": "boolean",
          "description": "受控显示（v-model），true 常显 / false 强制收起"
        },
        {
          "name": "effect",
          "type": "string",
          "default": "light",
          "description": "effect"
        },
        {
          "name": "width",
          "type": "string | number",
          "default": 150,
          "description": "width"
        }
      ],
      "features": {
        "popconfirm.icons": {
          "title": "图标",
          "description": "图标：icon",
          "module": "packages/ui-kit/src/components/popconfirm/features/icons/index.ts",
          "exportName": "popconfirmIconsFeature",
          "requires": [],
          "props": [
            {
              "name": "icon",
              "type": "string | Record<string, any> | (...args: any[]) => any"
            }
          ]
        },
        "popconfirm.popper": {
          "title": "浮层定位",
          "description": "浮层定位：teleported、persistent、placement、fallbackPlacements、offset、panelScroll",
          "module": "packages/ui-kit/src/components/popconfirm/features/popper/index.ts",
          "exportName": "popconfirmPopperFeature",
          "requires": [],
          "props": [
            {
              "name": "teleported",
              "type": "boolean",
              "default": true,
              "description": "浮层是否传送到 body"
            },
            {
              "name": "persistent",
              "type": "boolean",
              "description": "收起后是否保留浮层 DOM"
            },
            {
              "name": "placement",
              "type": "string",
              "default": "bottom"
            },
            {
              "name": "fallbackPlacements",
              "type": "any[]"
            },
            {
              "name": "offset",
              "type": "number"
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
