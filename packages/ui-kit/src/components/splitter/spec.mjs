export default {
  "id": "splitter",
  "title": "Splitter 分隔面板",
  "description": "对齐主流组件库的 Splitter / SplitterPanel，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Splitter",
      "module": "packages/ui-kit/src/components/splitter/core.ts",
      "createExport": "createSplitter",
      "coreProps": [
        {
          "name": "layout",
          "type": "string",
          "default": "horizontal",
          "description": "layout"
        }
      ],
      "features": {
        "splitter.lazy": {
          "title": "懒加载与展开",
          "description": "懒加载与展开：lazy",
          "module": "packages/ui-kit/src/components/splitter/features/lazy/index.ts",
          "exportName": "splitterLazyFeature",
          "requires": [],
          "props": [
            {
              "name": "lazy",
              "type": "boolean"
            }
          ]
        }
      }
    },
    {
      "name": "SplitterPanel",
      "module": "packages/ui-kit/src/components/splitter/core.ts",
      "createExport": "createSplitterPanel",
      "coreProps": [
        {
          "name": "size",
          "type": "string | number",
          "description": "size"
        },
        {
          "name": "min",
          "type": "string | number",
          "description": "min"
        },
        {
          "name": "max",
          "type": "string | number",
          "description": "max"
        }
      ],
      "features": {
        "splitter.splitter-panel-draggable": {
          "title": "拖拽与缩放",
          "description": "拖拽与缩放：resizable",
          "module": "packages/ui-kit/src/components/splitter/features/splitter-panel-draggable/index.ts",
          "exportName": "splitterPanelDraggableFeature",
          "requires": [],
          "props": [
            {
              "name": "resizable",
              "type": "boolean",
              "default": true
            }
          ]
        }
      }
    }
  ]
}
