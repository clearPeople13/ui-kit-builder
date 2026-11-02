export default {
  "id": "collapse-transition",
  "title": "CollapseTransition 折叠动画",
  "description": "对齐主流组件库的 CollapseTransition，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "CollapseTransition",
      "module": "packages/ui-kit/src/components/collapse-transition/core.ts",
      "createExport": "createCollapseTransition",
      "coreProps": [
        {
          "name": "name",
          "type": "string",
          "description": "name",
          "default": "ui-collapse-transition"
        }
      ],
      "features": {}
    }
  ]
}
