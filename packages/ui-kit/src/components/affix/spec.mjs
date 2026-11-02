export default {
  "id": "affix",
  "title": "Affix 固钉",
  "description": "对齐主流组件库的 Affix，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Affix",
      "module": "packages/ui-kit/src/components/affix/core.ts",
      "createExport": "createAffix",
      "coreProps": [
        {
          "name": "zIndex",
          "type": "number | string",
          "default": 100,
          "description": "zIndex"
        },
        {
          "name": "target",
          "type": "string",
          "default": "",
          "description": "target"
        },
        {
          "name": "position",
          "type": "string",
          "default": "top",
          "description": "position"
        },
        {
          "name": "offset",
          "type": "number",
          "default": 0,
          "description": "offset"
        }
      ],
      "features": {}
    }
  ]
}
