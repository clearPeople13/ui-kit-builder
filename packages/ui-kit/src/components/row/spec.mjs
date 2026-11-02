export default {
  "id": "row",
  "title": "Row 行",
  "description": "对齐主流组件库的 Row，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Row",
      "module": "packages/ui-kit/src/components/row/core.ts",
      "createExport": "createRow",
      "coreProps": [
        {
          "name": "tag",
          "type": "string",
          "default": "div",
          "description": "tag"
        },
        {
          "name": "gutter",
          "type": "number | [number, number]",
          "default": 0,
          "description": "水平间距，或 [水平, 垂直] 间距"
        },
        {
          "name": "justify",
          "type": "string",
          "default": "start",
          "description": "justify"
        },
        {
          "name": "align",
          "type": "string",
          "description": "align"
        }
      ],
      "features": {}
    }
  ]
}
