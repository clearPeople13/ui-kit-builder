export default {
  "id": "watermark",
  "title": "Watermark 水印",
  "description": "对齐主流组件库的 Watermark，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Watermark",
      "module": "packages/ui-kit/src/components/watermark/core.ts",
      "createExport": "createWatermark",
      "coreProps": [
        {
          "name": "zIndex",
          "type": "number",
          "default": 9,
          "description": "zIndex"
        },
        {
          "name": "rotate",
          "type": "number",
          "default": -22,
          "description": "rotate"
        },
        {
          "name": "width",
          "type": "number",
          "description": "width"
        },
        {
          "name": "height",
          "type": "number",
          "description": "height"
        },
        {
          "name": "image",
          "type": "string",
          "description": "image"
        },
        {
          "name": "content",
          "type": "string | any[]",
          "default": "UI Kit",
          "description": "content"
        },
        {
          "name": "font",
          "type": "Record<string, any>",
          "description": "font"
        },
        {
          "name": "gap",
          "type": "any[]",
          "description": "gap"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": false,
          "description": "水印覆盖的宿主内容，渲染在 ui-watermark__content（无默认内容）"
        }
      ],
      "features": {
        "watermark.popper": {
          "title": "水印偏移",
          "description": "水印偏移：offset",
          "module": "packages/ui-kit/src/components/watermark/features/popper/index.ts",
          "exportName": "watermarkPopperFeature",
          "requires": [],
          "props": [
            {
              "name": "offset",
              "type": "any[]"
            }
          ]
        }
      }
    }
  ]
}
