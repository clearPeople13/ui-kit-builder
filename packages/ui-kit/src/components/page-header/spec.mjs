export default {
  "id": "page-header",
  "title": "PageHeader 页头",
  "description": "对齐主流组件库的 PageHeader，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "PageHeader",
      "module": "packages/ui-kit/src/components/page-header/core.ts",
      "createExport": "createPageHeader",
      "coreProps": [
        {
          "name": "title",
          "type": "string",
          "description": "页面标题，也可用 title 插槽自定义"
        },
        {
          "name": "content",
          "type": "string",
          "default": "",
          "description": "标题下方的一行说明文字，也可用 content 插槽自定义"
        }
      ],
      "features": {
        "page-header.icons": {
          "title": "图标",
          "description": "左侧返回按钮：默认渲染 arrowLeft 箭头，可替换图标名或自定义渲染函数，传空字符串则隐藏",
          "module": "packages/ui-kit/src/components/page-header/features/icons/index.ts",
          "exportName": "pageHeaderIconsFeature",
          "requires": [],
          "props": [
            {
              "name": "icon",
              "type": "string | Record<string, any> | (...args: any[]) => any",
              "default": "arrowLeft",
              "offValue": "",
              "description": "左侧返回按钮的图标，默认 arrowLeft；传空字符串隐藏返回按钮，未开启本特性时也不渲染；点击按钮触发 back 事件"
            }
          ]
        }
      }
    }
  ]
}
