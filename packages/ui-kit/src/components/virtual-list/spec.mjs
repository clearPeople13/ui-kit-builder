export default {
  "id": "virtual-list",
  "title": "VirtualList 虚拟列表",
  "description": "对齐主流组件库的 VirtualList，固定行高窗口化渲染，支持缓存区与自定义 item key。",
  "order": 10,
  "exports": [
    {
      "name": "VirtualList",
      "module": "packages/ui-kit/src/components/virtual-list/core.ts",
      "createExport": "createVirtualList",
      "coreProps": [
        {
          "name": "data",
          "type": "any[]",
          "default": [],
          "description": "列表数据"
        },
        {
          "name": "height",
          "type": "number",
          "default": 200,
          "description": "可视区域高度（px）"
        },
        {
          "name": "itemSize",
          "type": "number",
          "default": 30,
          "description": "每项高度（px）"
        },
        {
          "name": "estimatedItemSize",
          "type": "number",
          "default": 0,
          "description": "未指定 itemSize 时的估算行高"
        },
        {
          "name": "itemKey",
          "type": "string",
          "default": "",
          "description": "数据项的唯一键字段"
        },
        {
          "name": "cache",
          "type": "number",
          "default": 2,
          "description": "可视区域上下缓冲的行数"
        },
        {
          "name": "total",
          "type": "number",
          "default": 0,
          "description": "数据总条数，默认取 data.length"
        }
      ],
      "features": {}
    }
  ]
}
