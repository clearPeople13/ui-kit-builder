export default {
  "id": "backtop",
  "title": "Backtop 回到顶部",
  "description": "滚动超过阈值后浮现的回到顶部按钮，可指定滚动容器与右下偏移。",
  "order": 10,
  "exports": [
    {
      "name": "Backtop",
      "module": "packages/ui-kit/src/components/backtop/core.ts",
      "createExport": "createBacktop",
      "coreProps": [
        {
          "name": "target",
          "type": "string",
          "default": "",
          "description": "滚动容器选择器：按钮贴在该容器可视区域的右下角，容器随页面滚动时位置跟随；留空时监听 window"
        },
        {
          "name": "right",
          "type": "number",
          "default": 40,
          "description": "距右缘的距离（px）：设定 target 时以容器右缘为基准，否则以视口右缘"
        },
        {
          "name": "bottom",
          "type": "number",
          "default": 40,
          "description": "距下缘的距离（px）：设定 target 时以容器下缘为基准，否则以视口下缘"
        },
        {
          "name": "visibilityHeight",
          "type": "number",
          "default": 200,
          "description": "滚动高度达到该值时显示按钮"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": true,
          "description": "按钮内容，渲染在 ui-backtop__button 内；无插槽时回退内置 ChevronUp 图标"
        }
      ],
      "features": {}
    }
  ]
}
