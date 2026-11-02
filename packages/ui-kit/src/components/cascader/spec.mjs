export default {
  "id": "cascader",
  "title": "Cascader 级联选择器",
  "description": "对齐主流组件库的 Cascader，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Cascader",
      "module": "packages/ui-kit/src/components/cascader/core.ts",
      "createExport": "createCascader",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "number | string | any[] | Record<string, any>",
          "description": "modelValue"
        },
        {
          "name": "options",
          "type": "any[]",
          "description": "options"
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
          "name": "multiple",
          "type": "boolean",
          "default": null,
          "description": "multiple"
        },
        {
          "name": "props",
          "type": "Record<string, any>",
          "description": "props"
        },
        {
          "name": "virtualScroll",
          "type": "boolean",
          "description": "virtualScroll"
        },
        {
          "name": "height",
          "type": "number",
          "default": 204,
          "description": "height"
        },
        {
          "name": "placeholder",
          "type": "string",
          "description": "placeholder"
        },
        {
          "name": "separator",
          "type": "string",
          "default": " / ",
          "description": "separator"
        },
        {
          "name": "showAllLevels",
          "type": "boolean",
          "default": true,
          "description": "showAllLevels"
        },
        {
          "name": "beforeFilter",
          "type": "(...args: any[]) => any",
          "description": "beforeFilter"
        },
        {
          "name": "effect",
          "type": "string",
          "default": "light",
          "description": "effect"
        }
      ],
      "features": {
        "cascader.clearable": {
          "title": "可清空",
          "description": "可清空：clearable、clearIcon",
          "module": "packages/ui-kit/src/components/cascader/features/clearable/index.ts",
          "exportName": "cascaderClearableFeature",
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
        "cascader.multiple": {
          "title": "多选",
          "description": "多选：collapseTags、collapseTagsTooltip、maxCollapseTags、tagType、tagEffect",
          "module": "packages/ui-kit/src/components/cascader/features/multiple/index.ts",
          "exportName": "cascaderMultipleFeature",
          "requires": [],
          "props": [
            {
              "name": "collapseTags",
              "type": "boolean"
            },
            {
              "name": "collapseTagsTooltip",
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
        "cascader.filterable": {
          "title": "筛选与远程搜索",
          "description": "筛选与远程搜索：filterable、filterMethod、debounce、fitInputWidth",
          "module": "packages/ui-kit/src/components/cascader/features/filterable/index.ts",
          "exportName": "cascaderFilterableFeature",
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
              "name": "debounce",
              "type": "number",
              "default": 300
            },
            {
              "name": "fitInputWidth",
              "type": "boolean | number",
              "default": false
            }
          ]
        },
        "cascader.popper": {
          "title": "浮层定位",
          "description": "浮层定位：teleported、persistent、popperClass、popperStyle、placement、fallbackPlacements、panelScroll",
          "module": "packages/ui-kit/src/components/cascader/features/popper/index.ts",
          "exportName": "cascaderPopperFeature",
          "requires": [],
          "props": [
            {
              "name": "teleported",
              "type": "boolean",
              "default": true
            },
            {
              "name": "persistent",
              "type": "boolean",
              "default": true
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
              "type": "any[]",
              "default": [
                "bottom-start",
                "bottom",
                "top-start",
                "top",
                "right",
                "left"
              ]
            },
            {
              "name": "panelScroll",
              "type": "string",
              "description": "滚动策略：follow 跟随 / close 关闭",
              "default": "follow"
            }
          ]
        },
        "cascader.lazy": {
          "title": "懒加载与展开",
          "description": "懒加载与展开：lazy、lazyLoad",
          "module": "packages/ui-kit/src/components/cascader/features/lazy/index.ts",
          "exportName": "cascaderLazyFeature",
          "requires": [],
          "props": [
            {
              "name": "lazy",
              "type": "boolean"
            },
            {
              "name": "lazyLoad",
              "type": "(...args: any[]) => any"
            }
          ]
        },
        "cascader.virtualized": {
          "title": "虚拟滚动",
          "description": "虚拟滚动：itemSize",
          "module": "packages/ui-kit/src/components/cascader/features/virtualized/index.ts",
          "exportName": "cascaderVirtualizedFeature",
          "requires": [],
          "props": [
            {
              "name": "itemSize",
              "type": "number",
              "default": 34
            }
          ]
        },
        "cascader.format": {
          "title": "格式化",
          "description": "格式化：valueOnClear",
          "module": "packages/ui-kit/src/components/cascader/features/format/index.ts",
          "exportName": "cascaderFormatFeature",
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
