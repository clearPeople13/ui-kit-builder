export default {
  "id": "text",
  "title": "Text 文本",
  "description": "对齐主流组件库的 Text，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Text",
      "module": "packages/ui-kit/src/components/text/core.ts",
      "createExport": "createText",
      "coreProps": [
        {
          "name": "type",
          "type": "string",
          "default": "",
          "description": "type"
        },
        {
          "name": "size",
          "type": "string",
          "default": "",
          "description": "size"
        },
        {
          "name": "truncated",
          "type": "boolean",
          "description": "truncated"
        },
        {
          "name": "lineClamp",
          "type": "string | number",
          "description": "lineClamp"
        },
        {
          "name": "tag",
          "type": "string",
          "default": "span",
          "description": "tag"
        }
      ],
      "features": {}
    }
  ]
}
