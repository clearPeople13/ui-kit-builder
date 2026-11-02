export default {
  "id": "progress",
  "title": "Progress 进度条",
  "description": "对齐主流组件库的 Progress，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Progress",
      "module": "packages/ui-kit/src/components/progress/core.ts",
      "createExport": "createProgress",
      "coreProps": [
        {
          "name": "type",
          "type": "string",
          "default": "line",
          "description": "type"
        },
        {
          "name": "percentage",
          "type": "number",
          "default": 0,
          "description": "percentage"
        },
        {
          "name": "status",
          "type": "string",
          "default": "",
          "description": "status"
        },
        {
          "name": "indeterminate",
          "type": "boolean",
          "description": "indeterminate"
        },
        {
          "name": "strokeWidth",
          "type": "number",
          "default": 6,
          "description": "strokeWidth"
        },
        {
          "name": "width",
          "type": "number",
          "default": 126,
          "description": "width"
        },
        {
          "name": "showText",
          "type": "boolean",
          "default": true,
          "description": "showText"
        },
        {
          "name": "color",
          "type": "string | any[] | (...args: any[]) => any",
          "default": "",
          "description": "color"
        }
      ],
      "features": {}
    }
  ]
}
