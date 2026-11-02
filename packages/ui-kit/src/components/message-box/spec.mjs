export default {
  "id": "message-box",
  "title": "MessageBox 消息框",
  "description": "对齐主流组件库的 MessageBox，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "MessageBox",
      "module": "packages/ui-kit/src/components/message-box/core.ts",
      "createExport": "createMessageBox",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "boolean",
          "description": "modelValue"
        },
        {
          "name": "title",
          "type": "string",
          "description": "title",
          "default": ""
        },
        {
          "name": "message",
          "type": "string",
          "description": "message",
          "default": ""
        },
        {
          "name": "type",
          "type": "string",
          "description": "type",
          "default": ""
        },
        {
          "name": "showClose",
          "type": "boolean",
          "description": "showClose",
          "default": true
        },
        {
          "name": "showCancelButton",
          "type": "boolean",
          "description": "showCancelButton"
        },
        {
          "name": "confirmButtonText",
          "type": "string",
          "description": "confirmButtonText",
          "default": "确定"
        },
        {
          "name": "cancelButtonText",
          "type": "string",
          "description": "cancelButtonText",
          "default": "取消"
        },
        {
          "name": "closeOnClickModal",
          "type": "boolean",
          "description": "closeOnClickModal",
          "default": true
        },
        {
          "name": "closeOnPressEscape",
          "type": "boolean",
          "description": "closeOnPressEscape",
          "default": true
        },
        {
          "name": "lockScroll",
          "type": "boolean",
          "description": "lockScroll",
          "default": true
        },
        {
          "name": "center",
          "type": "boolean",
          "description": "center"
        },
        {
          "name": "overflow",
          "type": "boolean",
          "description": "overflow"
        },
        {
          "name": "customClass",
          "type": "string",
          "description": "customClass",
          "default": ""
        },
        {
          "name": "confirmButtonClass",
          "type": "string",
          "description": "confirmButtonClass",
          "default": ""
        },
        {
          "name": "cancelButtonClass",
          "type": "string",
          "description": "cancelButtonClass",
          "default": ""
        },
        {
          "name": "teleported",
          "type": "boolean",
          "description": "teleported",
          "default": true
        },
        {
          "name": "appendTo",
          "type": "string",
          "description": "appendTo",
          "default": "body"
        }
      ],
      "features": {
        "message-box.input": {
          "title": "输入框",
          "description": "输入框：showInput、inputPlaceholder、inputType、inputValue、inputPattern、inputValidator、inputErrorMessage、inputFormatter",
          "module": "packages/ui-kit/src/components/message-box/features/input/index.ts",
          "exportName": "messageBoxInputFeature",
          "requires": [],
          "props": [
            {
              "name": "showInput",
              "type": "boolean",
              "description": "showInput"
            },
            {
              "name": "inputPlaceholder",
              "type": "string",
              "description": "inputPlaceholder",
              "default": ""
            },
            {
              "name": "inputType",
              "type": "string",
              "description": "inputType",
              "default": "text"
            },
            {
              "name": "inputValue",
              "type": "string",
              "description": "inputValue",
              "default": ""
            },
            {
              "name": "inputValidator",
              "type": "(value: string) => boolean | string | undefined",
              "description": "inputValidator"
            },
            {
              "name": "inputErrorMessage",
              "type": "string",
              "description": "inputErrorMessage",
              "default": ""
            }
          ]
        }
      }
    }
  ]
}
