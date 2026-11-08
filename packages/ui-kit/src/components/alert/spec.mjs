export default {
  "id": "alert",
  "title": "Alert 警告",
  "description": "对齐主流组件库的 Alert，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Alert",
      "module": "packages/ui-kit/src/components/alert/core.ts",
      "createExport": "createAlert",
      "coreProps": [
        {
          "name": "type",
          "type": "string",
          "default": "info",
          "description": "type"
        },
        {
          "name": "title",
          "type": "string",
          "default": "",
          "description": "title"
        },
        {
          "name": "description",
          "type": "string",
          "default": "",
          "description": "description"
        },
        {
          "name": "center",
          "type": "boolean",
          "description": "center"
        },
        {
          "name": "effect",
          "type": "string",
          "default": "light",
          "description": "effect"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": true,
          "description": "描述内容，渲染在 ui-alert__description；无插槽时回退 description 属性"
        },
        {
          "name": "title",
          "scope": null,
          "fallback": true,
          "description": "标题内容，渲染在 ui-alert__title；无插槽时回退 title 属性"
        }
      ],
      "features": {
        "alert.icons": {
          "title": "图标",
          "description": "图标：showIcon",
          "module": "packages/ui-kit/src/components/alert/features/icons/index.ts",
          "exportName": "alertIconsFeature",
          "requires": [],
          "props": [
            {
              "name": "showIcon",
              "type": "boolean"
            }
          ]
        },
        "alert.closable": {
          "title": "可关闭",
          "description": "可关闭：closable、closeText",
          "module": "packages/ui-kit/src/components/alert/features/closable/index.ts",
          "exportName": "alertClosableFeature",
          "requires": [],
          "props": [
            {
              "name": "closable",
              "type": "boolean",
              "default": true
            },
            {
              "name": "closeText",
              "type": "string",
              "default": ""
            }
          ]
        }
      }
    }
  ]
}
