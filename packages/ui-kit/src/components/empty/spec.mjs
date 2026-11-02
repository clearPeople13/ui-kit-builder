export default {
  "id": "empty",
  "title": "Empty 空状态",
  "description": "对齐主流组件库的 Empty，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Empty",
      "module": "packages/ui-kit/src/components/empty/core.ts",
      "createExport": "createEmpty",
      "coreProps": [
        {
          "name": "image",
          "type": "string",
          "default": "",
          "description": "image"
        },
        {
          "name": "imageSize",
          "type": "number",
          "description": "imageSize"
        },
        {
          "name": "description",
          "type": "string",
          "default": "",
          "description": "description"
        }
      ],
      "features": {}
    }
  ]
}
