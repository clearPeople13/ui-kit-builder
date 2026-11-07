export default {
  "id": "drawer",
  "title": "Drawer 抽屉",
  "description": "对齐主流组件库的 Drawer，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Drawer",
      "module": "packages/ui-kit/src/components/drawer/core.ts",
      "createExport": "createDrawer",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "boolean",
          "description": "modelValue"
        },
        {
          "name": "size",
          "type": "string | number",
          "default": "30%",
          "description": "size"
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
        },
        {
          "name": "direction",
          "type": "string",
          "default": "rtl",
          "description": "direction"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": true,
          "description": "抽屉主体内容，渲染在面板 body 区域，缺省回退到 message 属性（两者都无为空）"
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
        "drawer.closable": {
          "title": "可关闭",
          "description": "可关闭：showClose、beforeClose、closeIcon",
          "module": "packages/ui-kit/src/components/drawer/features/closable/index.ts",
          "exportName": "drawerClosableFeature",
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
        "drawer.popper": {
          "title": "浮层定位",
          "description": "浮层定位：appendTo、appendToBody、transition",
          "module": "packages/ui-kit/src/components/drawer/features/popper/index.ts",
          "exportName": "drawerPopperFeature",
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
        "drawer.draggable": {
          "title": "拖拽与缩放",
          "description": "拖拽与缩放：draggable（按住标题栏拖动）、resizable（拖动内边缘调整尺寸）",
          "module": "packages/ui-kit/src/components/drawer/features/draggable/index.ts",
          "exportName": "drawerDraggableFeature",
          "requires": [],
          "props": [
            {
              "name": "draggable",
              "type": "boolean",
              "default": null
            },
            {
              "name": "resizable",
              "type": "boolean"
            }
          ]
        },
        "drawer.modal": {
          "title": "遮罩与关闭行为",
          "description": "遮罩与关闭行为：modal、lockScroll、closeOnClickModal、closeOnPressEscape",
          "module": "packages/ui-kit/src/components/drawer/features/modal/index.ts",
          "exportName": "drawerModalFeature",
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
        "drawer.fullscreen": {
          "title": "全屏",
          "description": "全屏：fullscreen（面板铺满视口）",
          "module": "packages/ui-kit/src/components/drawer/features/fullscreen/index.ts",
          "exportName": "drawerFullscreenFeature",
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
