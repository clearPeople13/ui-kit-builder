export default {
  "id": "mention",
  "title": "Mention 提及",
  "description": "对齐主流组件库的 Mention，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Mention",
      "module": "packages/ui-kit/src/components/mention/core.ts",
      "createExport": "createMention",
      "coreProps": [
        {
          "name": "value",
          "type": "any",
          "description": "value"
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
          "name": "modelValue",
          "type": "string",
          "description": "modelValue"
        },
        {
          "name": "type",
          "type": "string",
          "default": "text",
          "description": "type"
        },
        {
          "name": "options",
          "type": "any[]",
          "description": "options"
        },
        {
          "name": "label",
          "type": "any",
          "description": "label"
        },
        {
          "name": "id",
          "type": "string",
          "default": null,
          "description": "id"
        },
        {
          "name": "maxlength",
          "type": "string | number",
          "description": "maxlength"
        },
        {
          "name": "minlength",
          "type": "string | number",
          "description": "minlength"
        },
        {
          "name": "resize",
          "type": "string",
          "description": "resize"
        },
        {
          "name": "autocomplete",
          "type": "string",
          "default": "off",
          "description": "autocomplete"
        },
        {
          "name": "placeholder",
          "type": "string",
          "description": "placeholder"
        },
        {
          "name": "form",
          "type": "string",
          "description": "form"
        },
        {
          "name": "readonly",
          "type": "boolean",
          "description": "readonly"
        },
        {
          "name": "containerRole",
          "type": "string",
          "default": null,
          "description": "containerRole"
        },
        {
          "name": "tabindex",
          "type": "string | number",
          "default": 0,
          "description": "tabindex"
        },
        {
          "name": "inputStyle",
          "type": "Record<string, any> | any[] | string | boolean",
          "description": "inputStyle"
        },
        {
          "name": "countGraphemes",
          "type": "(...args: any[]) => any",
          "description": "countGraphemes"
        },
        {
          "name": "autofocus",
          "type": "boolean",
          "description": "autofocus"
        },
        {
          "name": "rows",
          "type": "number",
          "default": 2,
          "description": "rows"
        },
        {
          "name": "ariaLabel",
          "type": "string",
          "description": "ariaLabel"
        },
        {
          "name": "inputmode",
          "type": "string",
          "default": null,
          "description": "inputmode"
        },
        {
          "name": "name",
          "type": "string",
          "description": "name"
        },
        {
          "name": "prefix",
          "type": "string | any[]",
          "default": "@",
          "description": "prefix"
        },
        {
          "name": "split",
          "type": "string",
          "default": " ",
          "description": "split"
        },
        {
          "name": "filterable",
          "type": "boolean",
          "default": true,
          "description": "是否启用关键字过滤"
        },
        {
          "name": "filterMethod",
          "type": "(...args: any[]) => any",
          "description": "自定义过滤方法：filterMethod(query, option) 返回 true 时保留该项"
        },
        {
          "name": "whole",
          "type": "boolean",
          "description": "whole"
        },
        {
          "name": "props",
          "type": "Record<string, any>",
          "description": "props"
        }
      ],
      "features": {
        "mention.clearable": {
          "title": "可清空",
          "description": "可清空：clearable、clearIcon",
          "module": "packages/ui-kit/src/components/mention/features/clearable/index.ts",
          "exportName": "mentionClearableFeature",
          "requires": [],
          "props": [
            {
              "name": "clearable",
              "type": "boolean"
            },
            {
              "name": "clearIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any",
              "default": {
                "name": "CircleClose",
                "__name": "circle-close"
              }
            }
          ]
        },
        "mention.password": {
          "title": "密码可见切换",
          "description": "密码可见切换：showPassword",
          "module": "packages/ui-kit/src/components/mention/features/password/index.ts",
          "exportName": "mentionPasswordFeature",
          "requires": [],
          "props": [
            {
              "name": "showPassword",
              "type": "boolean"
            }
          ]
        },
        "mention.word-limit": {
          "title": "字数统计",
          "description": "字数统计：showWordLimit、wordLimitPosition",
          "module": "packages/ui-kit/src/components/mention/features/word-limit/index.ts",
          "exportName": "mentionWordLimitFeature",
          "requires": [],
          "props": [
            {
              "name": "showWordLimit",
              "type": "boolean"
            },
            {
              "name": "wordLimitPosition",
              "type": "string",
              "default": "inside"
            }
          ]
        },
        "mention.icons": {
          "title": "图标",
          "description": "图标：prefixIcon、suffixIcon",
          "module": "packages/ui-kit/src/components/mention/features/icons/index.ts",
          "exportName": "mentionIconsFeature",
          "requires": [],
          "props": [
            {
              "name": "prefixIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any"
            },
            {
              "name": "suffixIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any"
            }
          ]
        },
        "mention.loading": {
          "title": "加载状态",
          "description": "加载状态：loading",
          "module": "packages/ui-kit/src/components/mention/features/loading/index.ts",
          "exportName": "mentionLoadingFeature",
          "requires": [],
          "props": [
            {
              "name": "loading",
              "type": "boolean"
            }
          ]
        },
        "mention.popper": {
          "title": "浮层定位",
          "description": "浮层定位：teleported、appendTo、popperClass、popperStyle、placement、fallbackPlacements、offset、showArrow、panelScroll",
          "module": "packages/ui-kit/src/components/mention/features/popper/index.ts",
          "exportName": "mentionPopperFeature",
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
              "default": "bottom-start"
            },
            {
              "name": "fallbackPlacements",
              "type": "any[]"
            },
            {
              "name": "offset",
              "type": "number",
              "default": 6
            },
            {
              "name": "showArrow",
              "type": "boolean",
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
