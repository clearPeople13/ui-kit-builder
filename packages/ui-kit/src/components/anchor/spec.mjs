export default {
  "id": "anchor",
  "title": "Anchor 锚点",
  "description": "对齐主流组件库的 Anchor / AnchorLink，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Anchor",
      "module": "packages/ui-kit/src/components/anchor/core.ts",
      "createExport": "createAnchor",
      "coreProps": [
        {
          "name": "type",
          "type": "'default' | 'line' | 'dot'",
          "default": "default",
          "description": "展示形态：default 无导轨、靠文字变色；line 左侧连续导轨 + 激活滑块；dot 左侧圆点 + 激活光环"
        },
        {
          "name": "bound",
          "type": "number",
          "default": 15,
          "description": "激活判定阈值（px）：锚点目标顶部距滚动容器顶部不超过该值时，认为该锚点已到达"
        }
      ],
      "features": {
        "anchor.popper": {
          "title": "滚动偏移",
          "description": "滚动偏移：点击锚点时目标额外预留的顶部间距，由 offset 控制",
          "module": "packages/ui-kit/src/components/anchor/features/popper/index.ts",
          "exportName": "anchorPopperFeature",
          "requires": [],
          "props": [
            {
              "name": "offset",
              "type": "number",
              "default": 0,
              "description": "滚动定位后目标顶部距容器顶部的预留距离（px）"
            }
          ]
        }
      }
    },
    {
      "name": "AnchorLink",
      "module": "packages/ui-kit/src/components/anchor/core.ts",
      "createExport": "createAnchorLink",
      "coreProps": [
        {
          "name": "href",
          "type": "string",
          "description": "锚点目标：页内以 #id 形式书写时点击后平滑滚动；外链或空值时按原生链接行为跳转",
          "default": ""
        },
        {
          "name": "target",
          "type": "string",
          "description": "原生链接打开方式：_self 当前页，_blank 新窗口（此时不再走组件内滚动）",
          "default": "_self"
        },
        {
          "name": "title",
          "type": "string",
          "description": "链接文本；未提供默认插槽时作为内容显示",
          "default": ""
        },
        {
          "name": "underline",
          "type": "boolean",
          "description": "是否显示文字下划线（仅 default 形态生效，line / dot 形态不加下划线）",
          "default": true
        }
      ],
      "features": {}
    }
  ]
}
