export default {
  "id": "space",
  "title": "Space 间距",
  "description": "对齐主流组件库的 Space，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Space",
      "module": "packages/ui-kit/src/components/space/core.ts",
      "createExport": "createSpace",
      "coreProps": [
        {
          "name": "size",
          "type": "string | any[] | number",
          "description": "size"
        },
        {
          "name": "direction",
          "type": "string",
          "default": "horizontal",
          "description": "direction"
        },
        {
          "name": "alignment",
          "type": "string",
          "default": "center",
          "description": "alignment"
        },
        {
          "name": "wrap",
          "type": "boolean",
          "description": "wrap"
        },
        {
          "name": "fill",
          "type": "boolean",
          "description": "fill"
        }
      ],
      "features": {}
    }
  ]
}
