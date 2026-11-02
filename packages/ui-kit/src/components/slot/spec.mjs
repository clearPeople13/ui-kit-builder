export default {
  "id": "slot",
  "title": "Slot 插槽工具",
  "description": "对齐主流组件库的 OnlyChild，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "OnlyChild",
      "module": "packages/ui-kit/src/components/slot/core.ts",
      "createExport": "createOnlyChild",
      "coreProps": [],
      "features": {}
    }
  ]
}
