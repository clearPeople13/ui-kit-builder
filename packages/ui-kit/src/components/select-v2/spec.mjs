export default {
  "id": "select-v2",
  "title": "SelectV2 虚拟列表选择器",
  "description": "对齐主流组件库的 SelectV2，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "SelectV2",
      "module": "packages/ui-kit/src/components/select-v2/core.ts",
      "createExport": "createSelectV2",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "any",
          "description": "modelValue"
        },
        {
          "name": "options",
          "type": "any[]",
          "description": "options"
        },
        {
          "name": "placeholder",
          "type": "string",
          "description": "placeholder",
          "default": "请选择"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "description": "disabled"
        },
        {
          "name": "size",
          "type": "string",
          "description": "size",
          "default": ""
        }
      ],
      "features": {
        "select-v2.clearable": {
          "title": "可清空",
          "description": "可清空：clearable",
          "module": "packages/ui-kit/src/components/select-v2/features/clearable/index.ts",
          "exportName": "selectV2ClearableFeature",
          "requires": [],
          "props": [
            {
              "name": "clearable",
              "type": "boolean",
              "description": "clearable"
            }
          ]
        },
        "select-v2.multiple": {
          "title": "多选",
          "description": "多选：multiple、collapseTags、maxCollapseTags、reserveKeyword",
          "module": "packages/ui-kit/src/components/select-v2/features/multiple/index.ts",
          "exportName": "selectV2MultipleFeature",
          "requires": [],
          "props": [
            {
              "name": "multiple",
              "type": "boolean",
              "description": "multiple"
            },
            {
              "name": "collapseTags",
              "type": "boolean",
              "description": "collapseTags"
            },
            {
              "name": "maxCollapseTags",
              "type": "number",
              "description": "maxCollapseTags",
              "default": 1
            }
          ]
        },
        "select-v2.filterable": {
          "title": "可筛选",
          "description": "可筛选：filterable、filterMethod、remote、remoteMethod、loading、loadingText、noMatchText、noDataText",
          "module": "packages/ui-kit/src/components/select-v2/features/filterable/index.ts",
          "exportName": "selectV2FilterableFeature",
          "requires": [],
          "props": [
            {
              "name": "filterable",
              "type": "boolean",
              "description": "filterable"
            },
            {
              "name": "filterMethod",
              "type": "(query: string, option: any) => boolean",
              "description": "filterMethod"
            },
            {
              "name": "remote",
              "type": "boolean",
              "description": "remote"
            },
            {
              "name": "remoteMethod",
              "type": "(query: string) => void",
              "description": "remoteMethod"
            },
            {
              "name": "loading",
              "type": "boolean",
              "description": "loading"
            },
            {
              "name": "loadingText",
              "type": "string",
              "description": "loadingText",
              "default": "加载中"
            },
            {
              "name": "noMatchText",
              "type": "string",
              "description": "noMatchText",
              "default": "无匹配数据"
            },
            {
              "name": "noDataText",
              "type": "string",
              "description": "noDataText",
              "default": "无数据"
            }
          ]
        },
        "select-v2.popper": {
          "title": "弹层配置",
          "description": "弹层配置：teleported、popperClass、popperStyle、placement、effect、valueKey、props、emptyValues、panelScroll",
          "module": "packages/ui-kit/src/components/select-v2/features/popper/index.ts",
          "exportName": "selectV2PopperFeature",
          "requires": [],
          "props": [
            {
              "name": "teleported",
              "type": "boolean",
              "description": "teleported",
              "default": true
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
              "name": "placement",
              "type": "string",
              "description": "placement",
              "default": "bottom-start"
            },
            {
              "name": "effect",
              "type": "string",
              "description": "effect",
              "default": "light"
            },
            {
              "name": "props",
              "type": "Record<string, any>",
              "description": "props",
              "default": {}
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
