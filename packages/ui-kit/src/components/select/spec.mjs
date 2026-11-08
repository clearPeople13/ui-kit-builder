export default {
  "id": "select",
  "title": "Select 选择器",
  "description": "对齐主流组件库的 Option / OptionGroup / Select，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Option",
      "module": "packages/ui-kit/src/components/select/core.ts",
      "createExport": "createOption",
      "coreProps": [
        {
          "name": "value",
          "type": "string | number | boolean | Record<string, any>",
          "description": "value"
        },
        {
          "name": "label",
          "type": "string | number",
          "description": "label",
          "default": ""
        },
        {
          "name": "disabled",
          "type": "boolean",
          "description": "disabled"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": true,
          "description": "选项内容，渲染在选项元素内，回退 label prop"
        }
      ],
      "features": {}
    },
    {
      "name": "OptionGroup",
      "module": "packages/ui-kit/src/components/select/core.ts",
      "createExport": "createOptionGroup",
      "coreProps": [
        {
          "name": "label",
          "type": "string",
          "description": "label",
          "default": ""
        },
        {
          "name": "disabled",
          "type": "boolean",
          "description": "disabled"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": true,
          "description": "分组标题内容，渲染在分组元素内，回退 label"
        }
      ],
      "features": {}
    },
    {
      "name": "Select",
      "module": "packages/ui-kit/src/components/select/core.ts",
      "createExport": "createSelect",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "any[] | string | number | boolean | Record<string, any>",
          "default": null,
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
          "name": "options",
          "type": "any[]",
          "description": "options"
        },
        {
          "name": "name",
          "type": "string",
          "description": "name"
        },
        {
          "name": "id",
          "type": "string",
          "description": "id"
        },
        {
          "name": "autocomplete",
          "type": "string",
          "default": "off",
          "description": "autocomplete"
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
          "name": "tabindex",
          "type": "string | number",
          "default": 0,
          "description": "tabindex"
        },
        {
          "name": "props",
          "type": "Record<string, any>",
          "description": "props"
        },
        {
          "name": "ariaLabel",
          "type": "string",
          "description": "ariaLabel"
        },
        {
          "name": "fitWidth",
          "type": "boolean",
          "description": "自适应内容宽度：宽度跟随选中标签/占位文本"
        },
        {
          "name": "maxWidth",
          "type": "string | number",
          "description": "最大宽度：超出后文本省略"
        }
      ],
      "features": {
        "select.select-clearable": {
          "title": "可清空",
          "description": "可清空：clearable、clearIcon",
          "module": "packages/ui-kit/src/components/select/features/select-clearable/index.ts",
          "exportName": "selectClearableFeature",
          "requires": [],
          "props": [
            {
              "name": "clearable",
              "type": "boolean"
            },
            {
              "name": "clearIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any",
              "default": ""
            }
          ]
        },
        "select.select-icons": {
          "title": "图标",
          "description": "图标：suffixIcon",
          "module": "packages/ui-kit/src/components/select/features/select-icons/index.ts",
          "exportName": "selectIconsFeature",
          "requires": [],
          "props": [
            {
              "name": "suffixIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any",
              "default": ""
            }
          ]
        },
        "select.select-loading": {
          "title": "加载状态",
          "description": "加载状态：loading、loadingText",
          "module": "packages/ui-kit/src/components/select/features/select-loading/index.ts",
          "exportName": "selectLoadingFeature",
          "requires": [],
          "props": [
            {
              "name": "loading",
              "type": "boolean"
            },
            {
              "name": "loadingText",
              "type": "string"
            }
          ]
        },
        "select.select-multiple": {
          "title": "多选",
          "description": "多选：multiple、multipleLimit、collapseTags、collapseTagsTooltip、maxCollapseTags、tagTooltip、tagType、tagEffect",
          "module": "packages/ui-kit/src/components/select/features/select-multiple/index.ts",
          "exportName": "selectMultipleFeature",
          "requires": [],
          "props": [
            {
              "name": "multiple",
              "type": "boolean"
            },
            {
              "name": "multipleLimit",
              "type": "number",
              "default": 0
            },
            {
              "name": "collapseTags",
              "type": "boolean"
            },
            {
              "name": "maxCollapseTags",
              "type": "number",
              "default": 1
            },
            {
              "name": "tagType",
              "type": "string",
              "default": "info"
            },
            {
              "name": "tagEffect",
              "type": "string",
              "default": "light"
            }
          ]
        },
        "select.select-filterable": {
          "title": "筛选与远程搜索",
          "description": "筛选与远程搜索：filterable、filterMethod、remote、remoteMethod、debounce、reserveKeyword、defaultFirstOption、allowCreate、automaticDropdown、noMatchText、noDataText、remoteShowSuffix、fitInputWidth",
          "module": "packages/ui-kit/src/components/select/features/select-filterable/index.ts",
          "exportName": "selectFilterableFeature",
          "requires": [],
          "props": [
            {
              "name": "filterable",
              "type": "boolean"
            },
            {
              "name": "filterMethod",
              "type": "(...args: any[]) => any"
            },
            {
              "name": "remote",
              "type": "boolean"
            },
            {
              "name": "remoteMethod",
              "type": "(...args: any[]) => any"
            },
            {
              "name": "debounce",
              "type": "number",
              "default": 300
            },
            {
              "name": "noMatchText",
              "type": "string"
            },
            {
              "name": "noDataText",
              "type": "string"
            }
          ]
        },
        "select.select-popper": {
          "title": "浮层定位",
          "description": "浮层定位：teleported、appendTo、persistent、popperClass、popperStyle、placement、fallbackPlacements、offset、showArrow、panelScroll",
          "module": "packages/ui-kit/src/components/select/features/select-popper/index.ts",
          "exportName": "selectPopperFeature",
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
              "default": ""
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
              "type": "any[]",
              "default": [
                "bottom-start",
                "top-start",
                "right",
                "left"
              ]
            },
            {
              "name": "offset",
              "type": "number",
              "default": 12
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
        },
        "select.select-format": {
          "title": "清空回填",
          "description": "清空回填：valueOnClear",
          "module": "packages/ui-kit/src/components/select/features/select-format/index.ts",
          "exportName": "selectFormatFeature",
          "requires": [],
          "props": [
            {
              "name": "valueOnClear",
              "type": "string | number | boolean | (...args: any[]) => any",
              "default": null
            }
          ]
        },
        "select.select-virtualized": {
          "title": "大数据虚拟列表",
          "description": "大数据虚拟列表：virtualized、itemSize、virtualThreshold；超过阈值的扁平列表只渲染可视区，分组列表与未开启时回退全量",
          "module": "packages/ui-kit/src/components/select/features/select-virtualized/index.ts",
          "exportName": "selectVirtualizedFeature",
          "requires": [],
          "props": [
            {
              "name": "virtualized",
              "type": "boolean",
              "default": true,
              "description": "是否启用窗口化渲染，默认开启"
            },
            {
              "name": "itemSize",
              "type": "number",
              "default": 34,
              "description": "单行高度 px；主题令牌影响行高时以运行时实测为准"
            },
            {
              "name": "virtualThreshold",
              "type": "number",
              "default": 100,
              "description": "超过该条数才启用窗口化"
            }
          ]
        },
        "select.methods": {
          "title": "实例方法",
          "description": "通过 ref 调用选择器方法：focus、blur。",
          "module": "packages/ui-kit/src/components/select/features/methods/index.ts",
          "exportName": "selectMethodsFeature",
          "requires": [],
          "props": [],
          "methods": [
            {
              "name": "focus",
              "signature": "() => void",
              "description": "聚焦选择器"
            },
            {
              "name": "blur",
              "signature": "() => void",
              "description": "失焦选择器"
            }
          ]
        }
      }
    }
  ]
}
