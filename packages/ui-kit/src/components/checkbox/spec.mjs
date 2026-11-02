export default {
  "id": "checkbox",
  "title": "Checkbox 多选框",
  "description": "对齐主流组件库的 Checkbox / CheckboxButton / CheckboxGroup，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Checkbox",
      "module": "packages/ui-kit/src/components/checkbox/core.ts",
      "createExport": "createCheckbox",
      "coreProps": [
        {
          "name": "value",
          "type": "string | boolean | number | Record<string, any>",
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
          "type": "number | string | boolean",
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
          "type": "string | boolean | number | Record<string, any>",
          "default": null,
          "description": "label"
        },
        {
          "name": "indeterminate",
          "type": "boolean",
          "description": "indeterminate"
        },
        {
          "name": "checked",
          "type": "boolean",
          "description": "checked"
        },
        {
          "name": "name",
          "type": "string",
          "default": null,
          "description": "name"
        },
        {
          "name": "trueValue",
          "type": "string | number",
          "default": null,
          "description": "trueValue"
        },
        {
          "name": "falseValue",
          "type": "string | number",
          "default": null,
          "description": "falseValue"
        },
        {
          "name": "trueLabel",
          "type": "string | number",
          "default": null,
          "description": "trueLabel"
        },
        {
          "name": "falseLabel",
          "type": "string | number",
          "default": null,
          "description": "falseLabel"
        },
        {
          "name": "id",
          "type": "string",
          "default": null,
          "description": "id"
        },
        {
          "name": "tabindex",
          "type": "string | number",
          "description": "tabindex"
        },
        {
          "name": "ariaLabel",
          "type": "string",
          "description": "ariaLabel"
        },
        {
          "name": "ariaControls",
          "type": "string",
          "description": "ariaControls"
        }
      ],
      "features": {
        "checkbox.appearance": {
          "title": "外观变体",
          "description": "外观变体：border",
          "module": "packages/ui-kit/src/components/checkbox/features/appearance/index.ts",
          "exportName": "checkboxAppearanceFeature",
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
      "name": "CheckboxButton",
      "module": "packages/ui-kit/src/components/checkbox/core.ts",
      "createExport": "createCheckboxButton",
      "coreProps": [
        {
          "name": "value",
          "type": "string | boolean | number | Record<string, any>",
          "description": "value"
        },
        {
          "name": "label",
          "type": "string | boolean | number | Record<string, any>",
          "description": "label"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "description": "disabled"
        },
        {
          "name": "modelValue",
          "type": "number | string | boolean",
          "description": "modelValue"
        },
        {
          "name": "size",
          "type": "string",
          "description": "size"
        },
        {
          "name": "checked",
          "type": "boolean",
          "description": "checked"
        },
        {
          "name": "name",
          "type": "string",
          "description": "name"
        },
        {
          "name": "trueValue",
          "type": "string | number",
          "description": "trueValue"
        },
        {
          "name": "falseValue",
          "type": "string | number",
          "description": "falseValue"
        },
        {
          "name": "trueLabel",
          "type": "string | number",
          "description": "trueLabel"
        },
        {
          "name": "falseLabel",
          "type": "string | number",
          "description": "falseLabel"
        },
        {
          "name": "id",
          "type": "string",
          "description": "id"
        },
        {
          "name": "tabindex",
          "type": "string | number",
          "description": "tabindex"
        },
        {
          "name": "ariaLabel",
          "type": "string",
          "description": "ariaLabel"
        },
        {
          "name": "ariaControls",
          "type": "string",
          "description": "ariaControls"
        }
      ],
      "features": {}
    },
    {
      "name": "CheckboxGroup",
      "module": "packages/ui-kit/src/components/checkbox/core.ts",
      "createExport": "createCheckboxGroup",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "any[]",
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
          "name": "options",
          "type": "any[]",
          "description": "options"
        },
        {
          "name": "type",
          "type": "string",
          "default": "checkbox",
          "description": "type"
        },
        {
          "name": "min",
          "type": "number",
          "description": "min"
        },
        {
          "name": "max",
          "type": "number",
          "description": "max"
        },
        {
          "name": "tag",
          "type": "string",
          "default": "div",
          "description": "tag"
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
      "features": {}
    }
  ]
}
