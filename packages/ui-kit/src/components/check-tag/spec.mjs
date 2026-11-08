export default {
  "id": "check-tag",
  "title": "CheckTag 可选标签",
  "description": "对齐主流组件库的 CheckTag，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "CheckTag",
      "module": "packages/ui-kit/src/components/check-tag/core.ts",
      "createExport": "createCheckTag",
      "coreProps": [
        {
          "name": "disabled",
          "type": "boolean",
          "description": "disabled"
        },
        {
          "name": "type",
          "type": "string",
          "default": "primary",
          "description": "type"
        },
        {
          "name": "checked",
          "type": "boolean",
          "description": "checked"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": false,
          "description": "可选标签内容，渲染在标签文本节点内；无默认内容"
        }
      ],
      "features": {}
    }
  ]
}
