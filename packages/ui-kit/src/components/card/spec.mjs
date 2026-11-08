export default {
  "id": "card",
  "title": "Card 卡片",
  "description": "对齐主流组件库的 Card，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Card",
      "module": "packages/ui-kit/src/components/card/core.ts",
      "createExport": "createCard",
      "coreProps": [
        {
          "name": "header",
          "type": "string",
          "default": "",
          "description": "header"
        },
        {
          "name": "footer",
          "type": "string",
          "default": "",
          "description": "footer"
        },
        {
          "name": "cover",
          "type": "string",
          "default": "",
          "description": "封面图地址（渲染于卡片顶部，也可用 cover 插槽自定义）"
        },
        {
          "name": "bodyStyle",
          "type": "string | Record<string, any> | any[] | boolean",
          "default": "",
          "description": "bodyStyle"
        },
        {
          "name": "headerClass",
          "type": "string | any[] | Record<string, any> | boolean",
          "default": null,
          "description": "headerClass"
        },
        {
          "name": "bodyClass",
          "type": "string | any[] | Record<string, any> | boolean",
          "default": null,
          "description": "bodyClass"
        },
        {
          "name": "footerClass",
          "type": "string | any[] | Record<string, any> | boolean",
          "default": null,
          "description": "footerClass"
        }
      ],
      "slots": [
        {
          "name": "cover",
          "scope": null,
          "fallback": true,
          "description": "封面内容，渲染在 ui-card__cover-wrap；无插槽且 cover 属性非空时回退为封面图"
        },
        {
          "name": "default",
          "scope": null,
          "fallback": false,
          "description": "卡片主体内容，渲染在 ui-card__body（无默认内容）"
        },
        {
          "name": "footer",
          "scope": null,
          "fallback": true,
          "description": "底部内容，渲染在 ui-card__footer；无插槽时回退 footer 属性"
        },
        {
          "name": "header",
          "scope": null,
          "fallback": true,
          "description": "头部内容，渲染在 ui-card__header；无插槽时回退 header 属性"
        }
      ],
      "features": {
        "card.appearance": {
          "title": "外观变体",
          "description": "外观变体：shadow",
          "module": "packages/ui-kit/src/components/card/features/appearance/index.ts",
          "exportName": "cardAppearanceFeature",
          "requires": [],
          "props": [
            {
              "name": "shadow",
              "type": "string",
              "default": null
            }
          ]
        }
      }
    }
  ]
}
