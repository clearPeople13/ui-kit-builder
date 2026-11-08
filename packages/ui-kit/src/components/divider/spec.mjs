export default {
  "id": "divider",
  "title": "Divider 分割线",
  "description": "对齐主流组件库的 Divider，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Divider",
      "module": "packages/ui-kit/src/components/divider/core.ts",
      "createExport": "createDivider",
      "coreProps": [
        {
          "name": "direction",
          "type": "string",
          "default": "horizontal",
          "description": "direction"
        },
        {
          "name": "contentPosition",
          "type": "string",
          "default": "center",
          "description": "contentPosition"
        },
        {
          "name": "borderStyle",
          "type": "string",
          "default": "solid",
          "description": "borderStyle"
        },
        {
          "name": "content",
          "type": "string",
          "default": "",
          "description": "分割线文案"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": true,
          "description": "分割线文字，渲染在 ui-divider__text 内；无插槽时回退 content 属性"
        }
      ],
      "features": {}
    }
  ]
}
