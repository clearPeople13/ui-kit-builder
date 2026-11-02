export default {
  "id": "message",
  "title": "Message 消息提示",
  "description": "对齐主流组件库的 Message，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Message",
      "module": "packages/ui-kit/src/components/message/core.ts",
      "createExport": "createMessage",
      "coreProps": [
        {
          "name": "type",
          "type": "string",
          "default": "info",
          "description": "type"
        },
        {
          "name": "customClass",
          "type": "string | any[] | Record<string, any> | boolean",
          "default": "",
          "description": "customClass"
        },
        {
          "name": "dangerouslyUseHTMLString",
          "type": "boolean",
          "default": false,
          "description": "dangerouslyUseHTMLString"
        },
        {
          "name": "id",
          "type": "string",
          "default": "",
          "description": "id"
        },
        {
          "name": "message",
          "type": "string | Record<string, any> | (...args: any[]) => any",
          "default": "",
          "description": "message"
        },
        {
          "name": "zIndex",
          "type": "number",
          "default": 0,
          "description": "zIndex"
        },
        {
          "name": "center",
          "type": "boolean",
          "default": false,
          "description": "center"
        }
      ],
      "features": {
        "message.icons": {
          "title": "图标",
          "description": "图标：icon",
          "module": "packages/ui-kit/src/components/message/features/icons/index.ts",
          "exportName": "messageIconsFeature",
          "requires": [],
          "props": [
            {
              "name": "icon",
              "type": "string | Record<string, any> | (...args: any[]) => any",
              "default": null
            }
          ]
        },
        "message.closable": {
          "title": "可关闭",
          "description": "可关闭：showClose",
          "module": "packages/ui-kit/src/components/message/features/closable/index.ts",
          "exportName": "messageClosableFeature",
          "requires": [],
          "props": [
            {
              "name": "showClose",
              "type": "boolean",
              "default": false
            }
          ]
        },
        "message.popper": {
          "title": "浮层定位",
          "description": "浮层定位：placement、offset",
          "module": "packages/ui-kit/src/components/message/features/popper/index.ts",
          "exportName": "messagePopperFeature",
          "requires": [],
          "props": [
            {
              "name": "placement",
              "type": "string",
              "default": null
            },
            {
              "name": "offset",
              "type": "number",
              "default": 16
            }
          ]
        },
        "message.appearance": {
          "title": "外观变体",
          "description": "外观变体：plain",
          "module": "packages/ui-kit/src/components/message/features/appearance/index.ts",
          "exportName": "messageAppearanceFeature",
          "requires": [],
          "props": [
            {
              "name": "plain",
              "type": "boolean"
            }
          ]
        }
      }
    }
  ]
}
