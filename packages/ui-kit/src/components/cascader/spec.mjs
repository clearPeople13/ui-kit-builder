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
          "name": "checkbox",
          "type": "boolean",
          "default": null,
          "description": "多选复选框模式：每级节点都渲染复选框，勾选父级级联选中/取消全部叶子并显示半选态，禁用叶子不可勾选且不计入统计；checkStrictly 时每级独立勾选"
        },
        {
          "name": "checkStrictly",
          "type": "boolean",
          "description": "父子不关联：任意节点（含父级）可单独选中，全选=全部已加载节点"
        },
        {
          "name": "emitPath",
          "type": "boolean",
          "default": true,
          "description": "false 时 v-model 只存末级值（多选为末级值数组）"
        },
        {
          "name": "props",
          "type": "Record<string, any>",
          "description": "props"
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
        "cascader.select-all": {
          "title": "全选",
          "description": "面板顶部全选栏：selectAll；值语义跟随 checkStrictly（父子不关联则全选=全部已加载节点）与 emitPath（false 只存末级值）",
          "module": "packages/ui-kit/src/components/cascader/features/select-all/index.ts",
          "exportName": "cascaderSelectAllFeature",
          "requires": ["cascader.multiple"],
          "props": [
            {
              "name": "selectAll",
              "type": "boolean"
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
          "description": "虚拟滚动：virtualScroll、itemSize",
          "module": "packages/ui-kit/src/components/cascader/features/virtualized/index.ts",
          "exportName": "cascaderVirtualizedFeature",
          "requires": [],
          "props": [
            {
              "name": "virtualScroll",
              "type": "boolean"
            },
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
