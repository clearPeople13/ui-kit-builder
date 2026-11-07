export default {
  "id": "dialog",
  "title": "Dialog 对话框",
  "description": "对齐主流组件库的 Dialog，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Dialog",
      "module": "packages/ui-kit/src/components/dialog/core.ts",
      "createExport": "createDialog",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "boolean",
          "description": "modelValue"
        },
        {
          "name": "center",
          "type": "boolean",
          "description": "center"
        },
        {
          "name": "alignCenter",
          "type": "boolean",
          "default": null,
          "description": "alignCenter"
        },
        {
          "name": "overflow",
          "type": "boolean",
          "default": null,
          "description": "overflow"
        },
        {
          "name": "title",
          "type": "string",
          "default": "",
          "description": "title"
        },
        {
          "name": "top",
          "type": "string",
          "description": "top"
        },
        {
          "name": "width",
          "type": "string | number",
          "description": "width"
        },
        {
          "name": "zIndex",
          "type": "number",
          "description": "zIndex"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": true,
          "description": "对话框主体内容，渲染在面板 body 区域，缺省回退到 message 属性（两者都无为空）"
        },
        {
          "name": "header",
          "scope": null,
          "fallback": true,
          "description": "标题栏内容，渲染在面板 header 的标题位置，缺省回退到 title 属性"
        },
        {
          "name": "footer",
          "scope": null,
          "fallback": false,
          "description": "底部操作区，仅在提供时渲染于面板 footer（无默认内容，不提供则不渲染 footer）"
        }
      ],
      "features": {
        "dialog.closable": {
          "title": "可关闭",
          "description": "可关闭：showClose、beforeClose、closeIcon",
          "module": "packages/ui-kit/src/components/dialog/features/closable/index.ts",
          "exportName": "dialogClosableFeature",
          "requires": [],
          "props": [
            {
              "name": "showClose",
              "type": "boolean",
              "default": true
            },
            {
              "name": "beforeClose",
              "type": "(...args: any[]) => any"
            },
            {
              "name": "closeIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any"
            }
          ]
        },
        "dialog.popper": {
          "title": "浮层定位",
          "description": "浮层定位：appendTo、appendToBody、transition",
          "module": "packages/ui-kit/src/components/dialog/features/popper/index.ts",
          "exportName": "dialogPopperFeature",
          "requires": [],
          "props": [
            {
              "name": "appendTo",
              "type": "string | Record<string, any>",
              "default": "body"
            },
            {
              "name": "appendToBody",
              "type": "boolean"
            }
          ]
        },
        "dialog.draggable": {
          "title": "拖拽与缩放",
          "description": "拖拽与缩放：draggable（按住标题栏拖动，位置限制在视口内）",
          "module": "packages/ui-kit/src/components/dialog/features/draggable/index.ts",
          "exportName": "dialogDraggableFeature",
          "requires": [],
          "props": [
            {
              "name": "draggable",
              "type": "boolean",
              "default": null
            }
          ]
        },
        "dialog.modal": {
          "title": "遮罩与关闭行为",
          "description": "遮罩与关闭行为：modal、lockScroll、closeOnClickModal、closeOnPressEscape",
          "module": "packages/ui-kit/src/components/dialog/features/modal/index.ts",
          "exportName": "dialogModalFeature",
          "requires": [],
          "props": [
            {
              "name": "modal",
              "type": "boolean",
              "default": true
            },
            {
              "name": "lockScroll",
              "type": "boolean",
              "default": true
            },
            {
              "name": "closeOnClickModal",
              "type": "boolean",
              "default": true
            },
            {
              "name": "closeOnPressEscape",
              "type": "boolean",
              "default": true
            }
          ]
        },
        "dialog.fullscreen": {
          "title": "全屏",
          "description": "全屏：fullscreen（面板铺满视口）",
          "module": "packages/ui-kit/src/components/dialog/features/fullscreen/index.ts",
          "exportName": "dialogFullscreenFeature",
          "requires": [],
          "props": [
            {
              "name": "fullscreen",
              "type": "boolean"
            }
          ]
        }
      }
    }
  ]
}
