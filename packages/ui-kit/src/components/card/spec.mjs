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
