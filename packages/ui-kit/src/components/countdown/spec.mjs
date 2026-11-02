export default {
  "id": "countdown",
  "title": "Countdown 倒计时",
  "description": "对齐主流组件库的 Countdown，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Countdown",
      "module": "packages/ui-kit/src/components/countdown/core.ts",
      "createExport": "createCountdown",
      "coreProps": [
        {
          "name": "value",
          "type": "number | Record<string, any>",
          "default": 0,
          "description": "value"
        },
        {
          "name": "format",
          "type": "string",
          "default": "HH:mm:ss",
          "description": "format"
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
      "features": {}
    }
  ]
}
