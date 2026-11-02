export default {
  "id": "tag",
  "title": "Tag 标签",
  "description": "对齐主流组件库的 Tag，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Tag",
      "module": "packages/ui-kit/src/components/tag/core.ts",
      "createExport": "createTag",
      "coreProps": [
        {
          "name": "type",
          "type": "string",
          "default": "primary",
          "description": "type"
        },
        {
          "name": "size",
          "type": "string",
          "description": "size"
        },
        {
          "name": "color",
          "type": "string",
          "description": "color"
        },
        {
          "name": "effect",
          "type": "string",
          "default": "light",
          "description": "effect"
        }
      ],
      "features": {
        "tag.closable": {
          "title": "可关闭",
          "description": "可关闭：closable",
          "module": "packages/ui-kit/src/components/tag/features/closable/index.ts",
          "exportName": "tagClosableFeature",
          "requires": [],
          "props": [
            {
              "name": "closable",
              "type": "boolean"
            }
          ]
        },
        "tag.appearance": {
          "title": "外观变体",
          "description": "外观变体：round、hit",
          "module": "packages/ui-kit/src/components/tag/features/appearance/index.ts",
          "exportName": "tagAppearanceFeature",
          "requires": [],
          "props": [
            {
              "name": "round",
              "type": "boolean"
            },
            {
              "name": "hit",
              "type": "boolean"
            }
          ]
        }
      }
    }
  ]
}
