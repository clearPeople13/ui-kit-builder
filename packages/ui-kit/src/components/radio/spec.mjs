export default {
  "id": "radio",
  "title": "Radio 单选框",
  "description": "对齐主流组件库的 Radio / RadioButton / RadioGroup，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Radio",
      "module": "packages/ui-kit/src/components/radio/core.ts",
      "createExport": "createRadio",
      "coreProps": [
        {
          "name": "value",
          "type": "string | number | boolean",
          "default": null,
          "description": "value"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "default": null,
          "description": "disabled"
        },
        {
          "name": "modelValue",
          "type": "string | number | boolean",
          "default": null,
          "description": "modelValue"
        },
        {
          "name": "size",
          "type": "string",
          "description": "size"
        },
        {
          "name": "label",
          "type": "string | number | boolean",
          "default": null,
          "description": "label"
        },
        {
          "name": "name",
          "type": "string",
          "default": null,
          "description": "name"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": true,
          "description": "单选框文本内容，渲染在控件之后的 label 区域，缺省回退到 label 属性"
        }
      ],
      "features": {
        "radio.appearance": {
          "title": "外观变体",
          "description": "外观变体：border",
          "module": "packages/ui-kit/src/components/radio/features/appearance/index.ts",
          "exportName": "radioAppearanceFeature",
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
      "name": "RadioButton",
      "module": "packages/ui-kit/src/components/radio/core.ts",
      "createExport": "createRadioButton",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "string | number | boolean",
          "default": null,
          "description": "modelValue"
        },
        {
          "name": "size",
          "type": "string",
          "description": "size"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "default": null,
          "description": "disabled"
        },
        {
          "name": "value",
          "type": "string | number | boolean",
          "default": null,
          "description": "value"
        },
        {
          "name": "label",
          "type": "string | number | boolean",
          "default": null,
          "description": "label"
        },
        {
          "name": "name",
          "type": "string",
          "default": null,
          "description": "name"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": true,
          "description": "按钮文本内容，渲染在控件之后的 label 区域，缺省回退到 label 属性"
        }
      ],
      "features": {}
    },
    {
      "name": "RadioGroup",
      "module": "packages/ui-kit/src/components/radio/core.ts",
      "createExport": "createRadioGroup",
      "coreProps": [
        {
          "name": "size",
          "type": "string",
          "description": "size"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "default": null,
          "description": "disabled"
        },
        {
          "name": "modelValue",
          "type": "string | number | boolean",
          "default": null,
          "description": "modelValue"
        },
        {
          "name": "options",
          "type": "any[]",
          "description": "options"
        },
        {
          "name": "type",
          "type": "string",
          "default": "radio",
          "description": "type"
        },
        {
          "name": "id",
          "type": "string",
          "default": null,
          "description": "id"
        },
        {
          "name": "fill",
          "type": "string",
          "default": "",
          "description": "fill"
        },
        {
          "name": "textColor",
          "type": "string",
          "default": "",
          "description": "textColor"
        },
        {
          "name": "name",
          "type": "string",
          "default": null,
          "description": "name"
        },
        {
          "name": "props",
          "type": "Record<string, any>",
          "description": "props"
        },
        {
          "name": "ariaLabel",
          "type": "string",
          "description": "ariaLabel"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": false,
          "description": "单选组合内容，仅在未配置 options 时渲染包裹的 Radio/RadioButton（无默认内容）"
        }
      ],
      "features": {}
    }
  ]
}
