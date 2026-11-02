export default {
  "id": "segmented",
  "title": "Segmented 分段控制器",
  "description": "对齐主流组件库的 Segmented，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Segmented",
      "module": "packages/ui-kit/src/components/segmented/core.ts",
      "createExport": "createSegmented",
      "coreProps": [
        {
          "name": "disabled",
          "type": "boolean",
          "default": null,
          "description": "disabled"
        },
        {
          "name": "options",
          "type": "any[]",
          "description": "options"
        },
        {
          "name": "modelValue",
          "type": "string | number | boolean",
          "default": null,
          "description": "modelValue"
        },
        {
          "name": "size",
          "type": "string",
          "description": "size"
        },
        {
          "name": "label",
          "type": "any",
          "description": "label"
        },
        {
          "name": "direction",
          "type": "string",
          "default": "horizontal",
          "description": "direction"
        },
        {
          "name": "props",
          "type": "Record<string, any>",
          "description": "props"
        },
        {
          "name": "block",
          "type": "boolean",
          "description": "block"
        },
        {
          "name": "id",
          "type": "string",
          "description": "id"
        }
      ],
      "features": {}
    }
  ]
}
