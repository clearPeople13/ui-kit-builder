export default {
  "id": "carousel",
  "title": "Carousel 走马灯",
  "description": "对齐主流组件库的 Carousel / CarouselItem，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Carousel",
      "module": "packages/ui-kit/src/components/carousel/core.ts",
      "createExport": "createCarousel",
      "coreProps": [
        {
          "name": "type",
          "type": "string",
          "default": "",
          "description": "type"
        },
        {
          "name": "height",
          "type": "string",
          "default": "",
          "description": "height"
        },
        {
          "name": "trigger",
          "type": "string",
          "default": "hover",
          "description": "trigger"
        },
        {
          "name": "autoplay",
          "type": "boolean",
          "default": true,
          "description": "autoplay"
        },
        {
          "name": "interval",
          "type": "number",
          "default": 3000,
          "description": "interval"
        },
        {
          "name": "indicatorPosition",
          "type": "string",
          "default": "",
          "description": "指示器位置：'' 悬浮在画面底部，outside 移到卡片下方并自动预留 26px 空间"
        },
        {
          "name": "arrow",
          "type": "string",
          "default": "hover",
          "description": "arrow"
        },
        {
          "name": "direction",
          "type": "string",
          "default": "horizontal",
          "description": "排列方向：vertical 时切换改为纵向推移（上下滑入滑出），指示器竖排靠右、箭头改上下指向"
        },
        {
          "name": "pauseOnHover",
          "type": "boolean",
          "default": true,
          "description": "pauseOnHover"
        },
        {
          "name": "modelValue",
          "type": "string | number",
          "default": null,
          "description": "当前条目，支持 v-model：取条目的 name、label 或序号；内部切换（箭头、指示器、autoplay、实例方法）会抛 update:modelValue 与 change（新值，旧值）"
        }
      ],
      "features": {
        "carousel.methods": {
          "title": "实例方法",
          "description": "通过 ref 控制走马灯：next、prev、setActiveItem。",
          "module": "packages/ui-kit/src/components/carousel/features/methods/index.ts",
          "exportName": "carouselMethodsFeature",
          "requires": [],
          "props": [],
          "methods": [
            {
              "name": "next",
              "signature": "() => void",
              "description": "切换到下一项"
            },
            {
              "name": "prev",
              "signature": "() => void",
              "description": "切换到上一项"
            },
            {
              "name": "setActiveItem",
              "signature": "(index: number) => void",
              "description": "切换到指定项"
            }
          ]
        }
      }
    },
    {
      "name": "CarouselItem",
      "module": "packages/ui-kit/src/components/carousel/core.ts",
      "createExport": "createCarouselItem",
      "coreProps": [
        {
          "name": "name",
          "type": "string",
          "default": "",
          "description": "条目标识，可作为 Carousel 的 modelValue；未传时内部自动生成随机名，不用于读屏文案"
        },
        {
          "name": "label",
          "type": "string | number",
          "default": "",
          "description": "label"
        }
      ],
      "features": {}
    }
  ]
}
