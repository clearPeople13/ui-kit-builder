export default {
  "id": "form",
  "title": "Form 表单",
  "description": "对齐主流组件库的 Form / FormItem，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Form",
      "module": "packages/ui-kit/src/components/form/core.ts",
      "createExport": "createForm",
      "coreProps": [
        {
          "name": "size",
          "type": "string",
          "description": "size"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "description": "disabled"
        },
        {
          "name": "model",
          "type": "Record<string, any>",
          "description": "model"
        },
        {
          "name": "labelPosition",
          "type": "string",
          "default": "right",
          "description": "labelPosition"
        },
        {
          "name": "labelWidth",
          "type": "string | number",
          "default": "",
          "description": "labelWidth"
        },
        {
          "name": "inline",
          "type": "boolean",
          "description": "inline"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": {
            "model": "Record<string, any> | undefined",
            "disabled": "boolean",
            "size": "string | undefined",
            "labelWidth": "string | number | undefined",
            "labelPosition": "string"
          },
          "fallback": false,
          "description": "表单字段容器，渲染在 form 内并透出表单上下文"
        }
      ],
      "features": {
        "form.validate": {
          "title": "表单校验",
          "description": "表单校验：rules、showMessage、inlineMessage、statusIcon、validateOnRuleChange、scrollToError、scrollIntoViewOptions、requireAsteriskPosition、hideRequiredAsterisk、labelSuffix",
          "module": "packages/ui-kit/src/components/form/features/validate/index.ts",
          "exportName": "formValidateFeature",
          "requires": [],
          "props": [
            {
              "name": "rules",
              "type": "Record<string, any>"
            },
            {
              "name": "showMessage",
              "type": "boolean",
              "default": true
            },
            {
              "name": "inlineMessage",
              "type": "boolean"
            },
            {
              "name": "statusIcon",
              "type": "boolean"
            },
            {
              "name": "validateOnRuleChange",
              "type": "boolean",
              "default": true
            },
            {
              "name": "scrollToError",
              "type": "boolean"
            },
            {
              "name": "scrollIntoViewOptions",
              "type": "Record<string, any> | boolean",
              "default": true
            },
            {
              "name": "requireAsteriskPosition",
              "type": "string",
              "default": "left"
            },
            {
              "name": "hideRequiredAsterisk",
              "type": "boolean"
            },
            {
              "name": "labelSuffix",
              "type": "string",
              "default": ""
            }
          ]
        }
      }
    },
    {
      "name": "FormItem",
      "module": "packages/ui-kit/src/components/form/core.ts",
      "createExport": "createFormItem",
      "coreProps": [
        {
          "name": "size",
          "type": "string",
          "description": "size"
        },
        {
          "name": "label",
          "type": "string",
          "description": "label"
        },
        {
          "name": "labelWidth",
          "type": "string | number",
          "description": "labelWidth"
        },
        {
          "name": "labelPosition",
          "type": "string",
          "default": "",
          "description": "labelPosition"
        },
        {
          "name": "prop",
          "type": "string | any[]",
          "description": "prop"
        },
        {
          "name": "required",
          "type": "boolean",
          "default": null,
          "description": "required"
        },
        {
          "name": "error",
          "type": "string",
          "description": "error"
        },
        {
          "name": "validateStatus",
          "type": "string",
          "description": "validateStatus"
        },
        {
          "name": "for",
          "type": "string",
          "description": "for"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": false,
          "description": "字段内容，渲染在内容区（无默认内容）"
        },
        {
          "name": "label",
          "scope": null,
          "fallback": true,
          "description": "标签内容，渲染在 label 内，回退 label prop"
        }
      ],
      "features": {
        "form.form-item-validate": {
          "title": "表单校验",
          "description": "表单校验：rules、showMessage、inlineMessage",
          "module": "packages/ui-kit/src/components/form/features/form-item-validate/index.ts",
          "exportName": "formItemValidateFeature",
          "requires": [],
          "props": [
            {
              "name": "rules",
              "type": "Record<string, any> | any[]"
            },
            {
              "name": "showMessage",
              "type": "boolean",
              "default": null
            },
            {
              "name": "inlineMessage",
              "type": "boolean",
              "default": null
            }
          ]
        }
      }
    }
  ]
}
