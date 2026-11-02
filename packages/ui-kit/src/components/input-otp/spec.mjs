export default {
  "id": "input-otp",
  "title": "InputOtp 验证码输入框",
  "description": "对齐主流组件库的 InputOtp，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "InputOtp",
      "module": "packages/ui-kit/src/components/input-otp/core.ts",
      "createExport": "createInputOtp",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "string | number",
          "description": "modelValue",
          "default": ""
        },
        {
          "name": "length",
          "type": "number",
          "description": "length",
          "default": 6
        },
        {
          "name": "size",
          "type": "string",
          "description": "size",
          "default": ""
        },
        {
          "name": "type",
          "type": "string",
          "description": "type",
          "default": "text"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "description": "disabled"
        },
        {
          "name": "separator",
          "type": "string",
          "description": "separator",
          "default": ""
        },
        {
          "name": "mask",
          "type": "boolean",
          "description": "mask"
        },
        {
          "name": "pattern",
          "type": "string",
          "description": "pattern",
          "default": ""
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
