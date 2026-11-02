export default {
  "id": "descriptions",
  "title": "Descriptions 描述列表",
  "description": "对齐主流组件库的 Descriptions / DescriptionsItem，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Descriptions",
      "module": "packages/ui-kit/src/components/descriptions/core.ts",
      "createExport": "createDescriptions",
      "coreProps": [
        {
          "name": "size",
          "type": "string",
          "description": "size"
        },
        {
          "name": "label",
          "type": "string",
          "default": "",
          "description": "label"
        },
        {
          "name": "span",
          "type": "number",
          "default": 1,
          "description": "span"
        },
        {
          "name": "width",
          "type": "string | number",
          "default": "",
          "description": "width"
        },
        {
          "name": "minWidth",
          "type": "string | number",
          "default": "",
          "description": "minWidth"
        },
        {
          "name": "labelWidth",
          "type": "string | number",
          "description": "labelWidth"
        },
        {
          "name": "align",
          "type": "string",
          "default": "left",
          "description": "align"
        },
        {
          "name": "labelAlign",
          "type": "string",
          "description": "labelAlign"
        },
        {
          "name": "className",
          "type": "string",
          "default": "",
          "description": "className"
        },
        {
          "name": "labelClassName",
          "type": "string",
          "default": "",
          "description": "labelClassName"
        },
        {
          "name": "column",
          "type": "number",
          "default": 3,
          "description": "column"
        },
        {
          "name": "title",
          "type": "string",
          "default": "",
          "description": "title"
        },
        {
          "name": "extra",
          "type": "string",
          "default": "",
          "description": "extra"
        }
      ],
      "features": {
        "descriptions.appearance": {
          "title": "外观变体",
          "description": "外观变体：border",
          "module": "packages/ui-kit/src/components/descriptions/features/appearance/index.ts",
          "exportName": "descriptionsAppearanceFeature",
          "requires": [],
          "props": [
            {
              "name": "border",
              "type": "boolean"
            }
          ]
        }
      }
    },
    {
      "name": "DescriptionsItem",
      "module": "packages/ui-kit/src/components/descriptions/core.ts",
      "createExport": "createDescriptionsItem",
      "coreProps": [
        {
          "name": "label",
          "type": "string",
          "description": "label",
          "default": ""
        },
        {
          "name": "span",
          "type": "number",
          "description": "span",
          "default": 1
        },
        {
          "name": "width",
          "type": "string | number",
          "description": "width",
          "default": ""
        },
        {
          "name": "minWidth",
          "type": "string | number",
          "description": "minWidth",
          "default": ""
        },
        {
          "name": "labelWidth",
          "type": "string | number",
          "description": "labelWidth",
          "default": ""
        },
        {
          "name": "align",
          "type": "string",
          "description": "align",
          "default": "left"
        },
        {
          "name": "labelAlign",
          "type": "string",
          "description": "labelAlign",
          "default": "right"
        },
        {
          "name": "className",
          "type": "string",
          "description": "className",
          "default": ""
        },
        {
          "name": "labelClassName",
          "type": "string",
          "description": "labelClassName",
          "default": ""
        }
      ],
      "features": {}
    }
  ]
}
