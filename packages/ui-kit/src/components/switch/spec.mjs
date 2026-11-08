export default {
  "id": "switch",
  "title": "Switch 开关",
  "description": "对齐主流组件库的 Switch，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Switch",
      "module": "packages/ui-kit/src/components/switch/core.ts",
      "createExport": "createSwitch",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "boolean | string | number",
          "default": false,
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
          "name": "width",
          "type": "string | number",
          "default": "",
          "description": "width"
        },
        {
          "name": "inlinePrompt",
          "type": "boolean",
          "description": "inlinePrompt"
        },
        {
          "name": "activeText",
          "type": "string",
          "default": "",
          "description": "activeText"
        },
        {
          "name": "inactiveText",
          "type": "string",
          "default": "",
          "description": "inactiveText"
        },
        {
          "name": "activeValue",
          "type": "boolean | string | number",
          "default": true,
          "description": "activeValue"
        },
        {
          "name": "inactiveValue",
          "type": "boolean | string | number",
          "default": false,
          "description": "inactiveValue"
        },
        {
          "name": "name",
          "type": "string",
          "default": "",
          "description": "name"
        },
        {
          "name": "id",
          "type": "string",
          "description": "id"
        },
        {
          "name": "tabindex",
          "type": "string | number",
          "description": "tabindex"
        },
        {
          "name": "ariaLabel",
          "type": "string",
          "description": "ariaLabel"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": false,
          "description": "开关标签内容，渲染在轨道后的 label 元素内（无默认内容）"
        }
      ],
      "features": {
        "switch.icons": {
          "title": "图标",
          "description": "图标：activeIcon、inactiveIcon、activeActionIcon、inactiveActionIcon",
          "module": "packages/ui-kit/src/components/switch/features/icons/index.ts",
          "exportName": "switchIconsFeature",
          "requires": [],
          "props": [
            {
              "name": "activeIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any"
            },
            {
              "name": "inactiveIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any"
            },
            {
              "name": "activeActionIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any"
            },
            {
              "name": "inactiveActionIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any"
            }
          ]
        },
        "switch.loading": {
          "title": "加载状态",
          "description": "加载状态：loading",
          "module": "packages/ui-kit/src/components/switch/features/loading/index.ts",
          "exportName": "switchLoadingFeature",
          "requires": [],
          "props": [
            {
              "name": "loading",
              "type": "boolean"
            }
          ]
        }
      }
    }
  ]
}
