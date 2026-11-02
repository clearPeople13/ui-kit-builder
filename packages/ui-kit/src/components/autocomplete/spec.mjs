export default {
  "id": "autocomplete",
  "title": "Autocomplete 自动补全",
  "description": "对齐主流组件库的 Autocomplete，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Autocomplete",
      "module": "packages/ui-kit/src/components/autocomplete/core.ts",
      "createExport": "createAutocomplete",
      "coreProps": [
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
          "type": "string | number",
          "default": "",
          "description": "modelValue"
        },
        {
          "name": "type",
          "type": "string",
          "default": "text",
          "description": "type"
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
          "name": "valueKey",
          "type": "string",
          "default": "value",
          "description": "valueKey"
        },
        {
          "name": "fetchSuggestions",
          "type": "(...args: any[]) => any | any[]",
          "description": "fetchSuggestions"
        },
        {
          "name": "triggerOnFocus",
          "type": "boolean",
          "default": true,
          "description": "triggerOnFocus"
        },
        {
          "name": "selectWhenUnmatched",
          "type": "boolean",
          "description": "selectWhenUnmatched"
        },
        {
          "name": "hideLoading",
          "type": "boolean",
          "description": "hideLoading"
        },
        {
          "name": "highlightFirstItem",
          "type": "boolean",
          "description": "highlightFirstItem"
        },
        {
          "name": "loopNavigation",
          "type": "boolean",
          "default": true,
          "description": "loopNavigation"
        }
      ],
      "features": {
        "autocomplete.clearable": {
          "title": "可清空",
          "description": "可清空：clearable、clearIcon",
          "module": "packages/ui-kit/src/components/autocomplete/features/clearable/index.ts",
          "exportName": "autocompleteClearableFeature",
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
        "autocomplete.password": {
          "title": "密码可见切换",
          "description": "密码可见切换：showPassword",
          "module": "packages/ui-kit/src/components/autocomplete/features/password/index.ts",
          "exportName": "autocompletePasswordFeature",
          "requires": [],
          "props": [
            {
              "name": "showPassword",
              "type": "boolean"
            }
          ]
        },
        "autocomplete.word-limit": {
          "title": "字数统计",
          "description": "字数统计：showWordLimit、wordLimitPosition",
          "module": "packages/ui-kit/src/components/autocomplete/features/word-limit/index.ts",
          "exportName": "autocompleteWordLimitFeature",
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
        "autocomplete.icons": {
          "title": "图标",
          "description": "图标：prefixIcon、suffixIcon",
          "module": "packages/ui-kit/src/components/autocomplete/features/icons/index.ts",
          "exportName": "autocompleteIconsFeature",
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
        "autocomplete.filterable": {
          "title": "筛选与远程搜索",
          "description": "筛选与远程搜索：debounce、fitInputWidth",
          "module": "packages/ui-kit/src/components/autocomplete/features/filterable/index.ts",
          "exportName": "autocompleteFilterableFeature",
          "requires": [],
          "props": [
            {
              "name": "debounce",
              "type": "number",
              "default": 300
            },
            {
              "name": "fitInputWidth",
              "type": "boolean"
            }
          ]
        },
        "autocomplete.popper": {
          "title": "浮层定位",
          "description": "浮层定位：teleported、appendTo、popperClass、popperStyle、placement、fallbackPlacements、offset、showArrow、panelScroll",
          "module": "packages/ui-kit/src/components/autocomplete/features/popper/index.ts",
          "exportName": "autocompletePopperFeature",
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
