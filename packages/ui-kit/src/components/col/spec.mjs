export default {
  "id": "col",
  "title": "Col 列",
  "description": "对齐主流组件库的 Col，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Col",
      "module": "packages/ui-kit/src/components/col/core.ts",
      "createExport": "createCol",
      "coreProps": [
        {
          "name": "tag",
          "type": "string",
          "default": "div",
          "description": "tag"
        },
        {
          "name": "span",
          "type": "number",
          "default": 24,
          "description": "span"
        },
        {
          "name": "pull",
          "type": "number",
          "default": 0,
          "description": "pull"
        },
        {
          "name": "push",
          "type": "number",
          "default": 0,
          "description": "push"
        }
      ],
      "features": {
        "col.popper": {
          "title": "栅格偏移",
          "description": "栅格偏移：offset",
          "module": "packages/ui-kit/src/components/col/features/popper/index.ts",
          "exportName": "colPopperFeature",
          "requires": [],
          "props": [
            {
              "name": "offset",
              "type": "number",
              "default": 0
            }
          ]
        }
      }
    }
  ]
}
