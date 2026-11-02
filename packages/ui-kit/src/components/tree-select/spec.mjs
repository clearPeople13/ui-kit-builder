export default {
  "id": "tree-select",
  "title": "TreeSelect 树选择",
  "description": "对齐主流组件库的 TreeSelect，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "TreeSelect",
      "module": "packages/ui-kit/src/components/tree-select/core.ts",
      "createExport": "createTreeSelect",
      "coreProps": [
        {
          "name": "data",
          "type": "any[]",
          "description": "data"
        },
        {
          "name": "modelValue",
          "type": "any",
          "description": "modelValue"
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
        },
        {
          "name": "props",
          "type": "Record<string, any>",
          "description": "props",
          "default": {}
        },
        {
          "name": "clearable",
          "type": "boolean",
          "description": "clearable"
        },
        {
          "name": "emptyText",
          "type": "string",
          "description": "emptyText",
          "default": "暂无数据"
        },
        {
          "name": "defaultExpandAll",
          "type": "boolean",
          "description": "defaultExpandAll"
        }
      ],
      "features": {
        "tree-select.multiple": {
          "title": "多选",
          "description": "多选：multiple、collapseTags、maxCollapseTags",
          "module": "packages/ui-kit/src/components/tree-select/features/multiple/index.ts",
          "exportName": "treeSelectMultipleFeature",
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
        "tree-select.filterable": {
          "title": "可筛选",
          "description": "可筛选：filterable、filterMethod",
          "module": "packages/ui-kit/src/components/tree-select/features/filterable/index.ts",
          "exportName": "treeSelectFilterableFeature",
          "requires": [],
          "props": [
            {
              "name": "filterable",
              "type": "boolean",
              "description": "filterable"
            },
            {
              "name": "filterMethod",
              "type": "(query: string) => void",
              "description": "filterMethod"
            }
          ]
        },
        "tree-select.popper": {
          "title": "弹层配置",
          "description": "弹层配置：teleported、popperClass、popperStyle、placement、effect、panelScroll",
          "module": "packages/ui-kit/src/components/tree-select/features/popper/index.ts",
          "exportName": "treeSelectPopperFeature",
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
