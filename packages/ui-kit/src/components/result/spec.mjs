export default {
  "id": "result",
  "title": "Result 结果",
  "description": "对齐主流组件库的 Result，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Result",
      "module": "packages/ui-kit/src/components/result/core.ts",
      "createExport": "createResult",
      "coreProps": [
        {
          "name": "title",
          "type": "string",
          "default": "",
          "description": "title"
        },
        {
          "name": "subTitle",
          "type": "string",
          "default": "",
          "description": "subTitle"
        }
      ],
      "features": {
        "result.icons": {
          "title": "图标",
          "description": "图标：icon",
          "module": "packages/ui-kit/src/components/result/features/icons/index.ts",
          "exportName": "resultIconsFeature",
          "requires": [],
          "props": [
            {
              "name": "icon",
              "type": "string",
              "default": "info"
            }
          ]
        }
      }
    }
  ]
}
