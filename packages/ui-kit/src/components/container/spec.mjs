export default {
  "id": "container",
  "title": "Container 布局容器",
  "description": "对齐主流组件库的 Aside / Container / Footer / Header / Main，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Aside",
      "module": "packages/ui-kit/src/components/container/core.ts",
      "createExport": "createAside",
      "coreProps": [
        {
          "name": "width",
          "type": "string | number",
          "description": "侧栏宽度：数字与纯数字字符串按 px 处理，字符串原样输出（如 28%、120px）；宽度由父容器横向排布时生效",
          "default": 300
        }
      ],
      "features": {}
    },
    {
      "name": "Container",
      "module": "packages/ui-kit/src/components/container/core.ts",
      "createExport": "createContainer",
      "coreProps": [
        {
          "name": "direction",
          "type": "string",
          "description": "布局方向：留空时按直接子项自动判断，含 Aside 则横向、否则纵向；可显式传 horizontal 或 vertical 覆盖",
          "default": ""
        },
        {
          "name": "tag",
          "type": "string",
          "description": "根元素标签，默认 section，可换成 div / nav / footer 等语义标签",
          "default": "section"
        }
      ],
      "features": {}
    },
    {
      "name": "Footer",
      "module": "packages/ui-kit/src/components/container/core.ts",
      "createExport": "createFooter",
      "coreProps": [
        {
          "name": "height",
          "type": "string | number",
          "description": "底部高度：数字与纯数字字符串按 px 处理，字符串原样输出（如 48px、4rem）；纵向容器中不参与伸缩",
          "default": 60
        }
      ],
      "features": {}
    },
    {
      "name": "Header",
      "module": "packages/ui-kit/src/components/container/core.ts",
      "createExport": "createHeader",
      "coreProps": [
        {
          "name": "height",
          "type": "string | number",
          "description": "顶部高度：数字与纯数字字符串按 px 处理，字符串原样输出（如 72px、4.5rem）；纵向容器中不参与伸缩",
          "default": 60
        }
      ],
      "features": {}
    },
    {
      "name": "Main",
      "module": "packages/ui-kit/src/components/container/core.ts",
      "createExport": "createMain",
      "coreProps": [
        {
          "name": "padding",
          "type": "string | number",
          "description": "主体区内边距：数字与纯数字字符串按 px 处理，字符串可用简写（如 12px 24px）；留空则不写内联 padding",
          "default": ""
        }
      ],
      "features": {}
    }
  ]
}
