export default {
  "id": "loading",
  "title": "Loading 加载",
  "description": "对齐主流组件库的 Loading，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Loading",
      "module": "packages/ui-kit/src/components/loading/core.ts",
      "createExport": "createLoading",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "boolean",
          "description": "是否显示加载态（v-model）",
          "default": true
        },
        {
          "name": "text",
          "type": "string",
          "description": "text",
          "default": ""
        },
        {
          "name": "size",
          "type": "number | string",
          "description": "size",
          "default": ""
        },
        {
          "name": "color",
          "type": "string",
          "description": "color",
          "default": ""
        },
        {
          "name": "background",
          "type": "string",
          "description": "background",
          "default": ""
        },
        {
          "name": "fullscreen",
          "type": "boolean",
          "description": "fullscreen"
        },
        {
          "name": "lock",
          "type": "boolean",
          "description": "lock"
        },
        {
          "name": "customClass",
          "type": "string",
          "description": "customClass",
          "default": ""
        },
        {
          "name": "target",
          "type": "string",
          "description": "target",
          "default": ""
        }
      ],
      "features": {}
    }
  ]
}
