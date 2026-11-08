export default {
  "id": "image-viewer",
  "title": "ImageViewer 图片预览",
  "description": "对齐主流组件库的 ImageViewer，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "ImageViewer",
      "module": "packages/ui-kit/src/components/image-viewer/core.ts",
      "createExport": "createImageViewer",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "boolean",
          "description": "modelValue"
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
          "fallback": false,
          "description": "面板正文，渲染在 body 区（无 props 回退）"
        },
        {
          "name": "footer",
          "scope": null,
          "fallback": false,
          "description": "面板底部，渲染在正文之后（无默认内容）"
        },
        {
          "name": "header",
          "scope": null,
          "fallback": false,
          "description": "面板标题区，未提供时标题为空（组件无 title 属性可回退）"
        },
        {
          "name": "close",
          "scope": {
            "close": "() => void"
          },
          "fallback": true,
          "description": "关闭按钮内容，渲染在面板 header 的关闭按钮内；无插槽时回退 closeIcon 或内置关闭图标。提供插槽会强制显示关闭按钮"
        }
      ],
      "features": {
        "image-viewer.popper": {
          "title": "浮层传送",
          "description": "浮层传送：teleported",
          "module": "packages/ui-kit/src/components/image-viewer/features/popper/index.ts",
          "exportName": "imageViewerPopperFeature",
          "requires": [],
          "props": [
            {
              "name": "teleported",
              "type": "boolean"
            }
          ]
        },
        "image-viewer.modal": {
          "title": "遮罩与关闭行为",
          "description": "遮罩与关闭行为：closeOnPressEscape、lockScroll",
          "module": "packages/ui-kit/src/components/image-viewer/features/modal/index.ts",
          "exportName": "imageViewerModalFeature",
          "requires": [],
          "props": [
            {
              "name": "lockScroll",
              "type": "boolean",
              "default": true
            },
            {
              "name": "closeOnPressEscape",
              "type": "boolean",
              "default": true
            }
          ]
        }
      }
    }
  ]
}
