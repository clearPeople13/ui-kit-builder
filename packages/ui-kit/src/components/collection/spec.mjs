export default {
  "id": "collection",
  "title": "Collection 集合",
  "description": "对齐主流组件库的 Collection / CollectionItem，为内部组件提供子项实例注册与查询。",
  "order": 10,
  "exports": [
    {
      "name": "Collection",
      "module": "packages/ui-kit/src/components/collection/core.ts",
      "createExport": "createCollection",
      "coreProps": [],
      "features": {}
    },
    {
      "name": "CollectionItem",
      "module": "packages/ui-kit/src/components/collection/core.ts",
      "createExport": "createCollectionItem",
      "coreProps": [
        {
          "name": "item",
          "type": "Record<string, any>",
          "description": "子项标识对象，用于注册与查询实例"
        }
      ],
      "features": {}
    }
  ]
}
