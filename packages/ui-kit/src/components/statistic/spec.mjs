export default {
  "id": "statistic",
  "title": "Statistic 统计数值",
  "description": "对齐主流组件库的 Statistic，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Statistic",
      "module": "packages/ui-kit/src/components/statistic/core.ts",
      "createExport": "createStatistic",
      "coreProps": [
        {
          "name": "value",
          "type": "number | Record<string, any>",
          "default": 0,
          "description": "value"
        },
        {
          "name": "decimalSeparator",
          "type": "string",
          "default": ".",
          "description": "decimalSeparator"
        },
        {
          "name": "groupSeparator",
          "type": "string",
          "default": ",",
          "description": "groupSeparator"
        },
        {
          "name": "precision",
          "type": "number",
          "default": 0,
          "description": "precision"
        },
        {
          "name": "prefix",
          "type": "string",
          "description": "prefix"
        },
        {
          "name": "suffix",
          "type": "string",
          "description": "suffix"
        },
        {
          "name": "title",
          "type": "string",
          "description": "title"
        },
        {
          "name": "valueStyle",
          "type": "string | Record<string, any> | any[] | boolean",
          "default": null,
          "description": "valueStyle"
        }
      ],
      "features": {
        "statistic.format": {
          "title": "格式化",
          "description": "格式化：formatter",
          "module": "packages/ui-kit/src/components/statistic/features/format/index.ts",
          "exportName": "statisticFormatFeature",
          "requires": [],
          "props": [
            {
              "name": "formatter",
              "type": "(...args: any[]) => any"
            }
          ]
        }
      }
    }
  ]
}
