export default {
  "id": "overlay",
  "title": "Overlay 遮罩层",
  "description": "对齐主流组件库的 Overlay，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Overlay",
      "module": "packages/ui-kit/src/components/overlay/core.ts",
      "createExport": "createOverlay",
      "coreProps": [
        {
          "name": "zIndex",
          "type": "string | number",
          "description": "zIndex"
        }
      ],
      "features": {}
    }
  ]
}
