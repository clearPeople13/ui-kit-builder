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
          "description": "右侧条目 key 数组；移动时抛 update:modelValue 与 change（新数组，方向 right/left）"
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
          "description": "左侧默认勾选的项，disabled 条目会被忽略"
        },
        {
          "name": "rightDefaultChecked",
          "type": "any[]",
          "description": "右侧默认勾选的项，disabled 条目会被忽略"
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
        }
      }
    }
  ]
}
