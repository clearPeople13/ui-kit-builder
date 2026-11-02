export default {
  "id": "input-number",
  "title": "InputNumber 数字输入框",
  "description": "对齐主流组件库的 InputNumber，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "InputNumber",
      "module": "packages/ui-kit/src/components/input-number/core.ts",
      "createExport": "createInputNumber",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "number | null",
          "description": "modelValue"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "default": null,
          "description": "disabled"
        },
        {
          "name": "size",
          "type": "string",
          "description": "size"
        },
        {
          "name": "id",
          "type": "string",
          "default": null,
          "description": "id"
        },
        {
          "name": "step",
          "type": "number",
          "default": 1,
          "description": "step"
        },
        {
          "name": "max",
          "type": "number",
          "default": 9007199254740991,
          "description": "max"
        },
        {
          "name": "min",
          "type": "number",
          "default": -9007199254740991,
          "description": "min"
        },
        {
          "name": "readonly",
          "type": "boolean",
          "description": "readonly"
        },
        {
          "name": "controls",
          "type": "boolean",
          "default": true,
          "description": "controls"
        },
        {
          "name": "controlsPosition",
          "type": "string",
          "default": "",
          "description": "controlsPosition"
        },
        {
          "name": "name",
          "type": "string",
          "description": "name"
        },
        {
          "name": "placeholder",
          "type": "string",
          "description": "placeholder"
        },
        {
          "name": "precision",
          "type": "number",
          "description": "precision"
        },
        {
          "name": "align",
          "type": "string",
          "default": "center",
          "description": "align"
        },
        {
          "name": "tabindex",
          "type": "string | number",
          "default": 0,
          "description": "tabindex"
        }
      ],
      "features": {
        "input-number.methods": {
          "title": "实例方法",
          "description": "通过 ref 调用数字输入框方法：focus、blur。",
          "module": "packages/ui-kit/src/components/input-number/features/methods/index.ts",
          "exportName": "inputNumberMethodsFeature",
          "requires": [],
          "props": [],
          "methods": [
            {
              "name": "focus",
              "signature": "() => void",
              "description": "聚焦输入框"
            },
            {
              "name": "blur",
              "signature": "() => void",
              "description": "失焦输入框"
            }
          ]
        }
      }
    }
  ]
}
