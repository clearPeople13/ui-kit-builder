export default {
  "id": "transfer",
  "title": "Transfer 穿梭框",
  "description": "对齐主流组件库的 Transfer，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Transfer",
      "module": "packages/ui-kit/src/components/transfer/core.ts",
      "createExport": "createTransfer",
      "coreProps": [
        {
          "name": "data",
          "type": "any[]",
          "description": "data"
        },
        {
          "name": "modelValue",
          "type": "any[]",
          "description": "modelValue"
        },
        {
          "name": "titles",
          "type": "any[]",
          "description": "titles"
        },
        {
          "name": "buttonTexts",
          "type": "any[]",
          "description": "buttonTexts"
        },
        {
          "name": "filterPlaceholder",
          "type": "string",
          "description": "filterPlaceholder"
        },
        {
          "name": "leftDefaultChecked",
          "type": "any[]",
          "description": "leftDefaultChecked"
        },
        {
          "name": "rightDefaultChecked",
          "type": "any[]",
          "description": "rightDefaultChecked"
        },
        {
          "name": "props",
          "type": "Record<string, any>",
          "description": "props"
        }
      ],
      "features": {
        "transfer.filterable": {
          "title": "筛选与远程搜索",
          "description": "筛选与远程搜索：filterable、filterMethod",
          "module": "packages/ui-kit/src/components/transfer/features/filterable/index.ts",
          "exportName": "transferFilterableFeature",
          "requires": [],
          "props": [
            {
              "name": "filterable",
              "type": "boolean"
            }
          ]
        },
        "transfer.virtualized": {
          "title": "虚拟滚动",
          "description": "虚拟滚动：itemSize",
          "module": "packages/ui-kit/src/components/transfer/features/virtualized/index.ts",
          "exportName": "transferVirtualizedFeature",
          "requires": [],
          "props": [
            {
              "name": "itemSize",
              "type": "number",
              "default": 30
            }
          ]
        }
      }
    }
  ]
}
