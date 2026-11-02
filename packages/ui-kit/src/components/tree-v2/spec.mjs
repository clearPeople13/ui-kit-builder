export default {
  "id": "tree-v2",
  "title": "TreeV2 虚拟化树形控件",
  "description": "对齐主流组件库的 TreeV2，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "TreeV2",
      "module": "packages/ui-kit/src/components/tree-v2/core.ts",
      "createExport": "createTreeV2",
      "coreProps": [
        {
          "name": "data",
          "type": "any[]",
          "description": "data"
        },
        {
          "name": "props",
          "type": "Record<string, any>",
          "description": "props",
          "default": {}
        },
        {
          "name": "emptyText",
          "type": "string",
          "description": "emptyText",
          "default": "暂无数据"
        },
        {
          "name": "height",
          "type": "string | number",
          "description": "height",
          "default": ""
        },
        {
          "name": "indent",
          "type": "number",
          "description": "indent",
          "default": 16
        },
        {
          "name": "defaultExpandAll",
          "type": "boolean",
          "description": "defaultExpandAll"
        },
        {
          "name": "defaultExpandedKeys",
          "type": "any[]",
          "description": "defaultExpandedKeys"
        },
        {
          "name": "expandOnClickNode",
          "type": "boolean",
          "description": "expandOnClickNode",
          "default": true
        },
        {
          "name": "accordion",
          "type": "boolean",
          "description": "accordion"
        },
        {
          "name": "highlightCurrent",
          "type": "boolean",
          "description": "highlightCurrent"
        }
      ],
      "features": {
        "tree-v2.check": {
          "title": "复选框",
          "description": "复选框：showCheckbox、defaultCheckedKeys、checkStrictly、checkOnClickNode",
          "module": "packages/ui-kit/src/components/tree-v2/features/check/index.ts",
          "exportName": "treeV2CheckFeature",
          "requires": [],
          "props": [
            {
              "name": "showCheckbox",
              "type": "boolean",
              "description": "showCheckbox"
            },
            {
              "name": "defaultCheckedKeys",
              "type": "any[]",
              "description": "defaultCheckedKeys"
            },
            {
              "name": "checkStrictly",
              "type": "boolean",
              "description": "checkStrictly"
            },
            {
              "name": "checkOnClickNode",
              "type": "boolean",
              "description": "checkOnClickNode"
            }
          ]
        }
      }
    }
  ]
}
