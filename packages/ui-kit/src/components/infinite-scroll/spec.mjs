export default {
  "id": "infinite-scroll",
  "title": "InfiniteScroll 无限滚动",
  "description": "对齐主流组件库的 InfiniteScroll，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "InfiniteScroll",
      "module": "packages/ui-kit/src/components/infinite-scroll/core.ts",
      "createExport": "createInfiniteScroll",
      "coreProps": [
        {
          "name": "distance",
          "type": "number",
          "description": "distance",
          "default": 0
        },
        {
          "name": "delay",
          "type": "number",
          "description": "delay",
          "default": 200
        },
        {
          "name": "immediate",
          "type": "boolean",
          "description": "immediate",
          "default": true
        },
        {
          "name": "disabled",
          "type": "boolean",
          "description": "disabled"
        },
        {
          "name": "loading",
          "type": "boolean",
          "description": "loading"
        }
      ],
      "features": {}
    }
  ]
}
