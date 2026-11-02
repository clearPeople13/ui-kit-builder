export default {
  "id": "scrollbar",
  "title": "Scrollbar 滚动条",
  "description": "对齐主流组件库的 Scrollbar 实现，自定义 wrap/view、双向滑块、拖拽与原生滚动回退。",
  "order": 10,
  "exports": [
    {
      "name": "Scrollbar",
      "module": "packages/ui-kit/src/components/scrollbar/core.ts",
      "createExport": "createScrollbar",
      "coreProps": [
        {
          "name": "distance",
          "type": "number",
          "default": 0,
          "description": "滚动条与容器边缘的距离（px）"
        },
        {
          "name": "height",
          "type": "string | number",
          "default": "",
          "description": "滚动区域高度"
        },
        {
          "name": "maxHeight",
          "type": "string | number",
          "default": "",
          "description": "滚动区域最大高度"
        },
        {
          "name": "native",
          "type": "boolean",
          "default": false,
          "description": "使用浏览器原生滚动条"
        },
        {
          "name": "wrapStyle",
          "type": "string | Record<string, any> | any[]",
          "default": "",
          "description": "wrap 元素样式"
        },
        {
          "name": "wrapClass",
          "type": "string | any[] | Record<string, any>",
          "default": "",
          "description": "wrap 元素类名"
        },
        {
          "name": "viewClass",
          "type": "string | any[] | Record<string, any>",
          "default": "",
          "description": "view 元素类名"
        },
        {
          "name": "viewStyle",
          "type": "string | Record<string, any> | any[]",
          "default": "",
          "description": "view 元素样式"
        },
        {
          "name": "noresize",
          "type": "boolean",
          "default": false,
          "description": "不监听容器尺寸变化"
        },
        {
          "name": "tag",
          "type": "string",
          "default": "div",
          "description": "view 元素的标签名"
        },
        {
          "name": "always",
          "type": "boolean",
          "default": false,
          "description": "始终显示滚动条"
        },
        {
          "name": "minSize",
          "type": "number",
          "default": 20,
          "description": "滑块最小尺寸（px）"
        },
        {
          "name": "tabindex",
          "type": "string | number",
          "default": null,
          "description": "容器 tabindex"
        },
        {
          "name": "id",
          "type": "string",
          "description": "容器 id"
        },
        {
          "name": "role",
          "type": "string",
          "description": "容器 role"
        },
        {
          "name": "ariaLabel",
          "type": "string",
          "description": "容器 aria-label"
        },
        {
          "name": "ariaOrientation",
          "type": "string",
          "description": "容器 aria-orientation，可选 horizontal / vertical"
        }
      ],
      "features": {
        "scrollbar.methods": {
          "title": "实例方法",
          "description": "通过 ref 控制滚动：update、handleScroll、setScrollTop、setScrollLeft。",
          "module": "packages/ui-kit/src/components/scrollbar/features/methods/index.ts",
          "exportName": "scrollbarMethodsFeature",
          "requires": [],
          "props": [],
          "methods": [
            {
              "name": "update",
              "signature": "() => void",
              "description": "重新计算滑块尺寸与位置"
            },
            {
              "name": "handleScroll",
              "signature": "() => void",
              "description": "同步滚动状态"
            },
            {
              "name": "setScrollTop",
              "signature": "(value: number) => void",
              "description": "设置垂直滚动位置"
            },
            {
              "name": "setScrollLeft",
              "signature": "(value: number) => void",
              "description": "设置水平滚动位置"
            }
          ]
        }
      }
    }
  ]
}

