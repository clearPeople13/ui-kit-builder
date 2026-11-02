export default {
  "id": "image",
  "title": "Image 图片",
  "description": "对齐主流组件库的 Image，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Image",
      "module": "packages/ui-kit/src/components/image/core.ts",
      "createExport": "createImage",
      "coreProps": [
        {
          "name": "src",
          "type": "string",
          "default": "",
          "description": "src"
        },
        {
          "name": "fit",
          "type": "string",
          "default": "",
          "description": "fit"
        },
        {
          "name": "alt",
          "type": "string",
          "default": "",
          "description": "原生 alt 描述文本"
        },
        {
          "name": "zIndex",
          "type": "number",
          "description": "zIndex"
        },
        {
          "name": "crossorigin",
          "type": "string",
          "description": "crossorigin"
        }
      ],
      "features": {
        "image.loading": {
          "title": "加载状态",
          "description": "原生 loading 属性：loading（eager/lazy）",
          "module": "packages/ui-kit/src/components/image/features/loading/index.ts",
          "exportName": "imageLoadingFeature",
          "requires": [],
          "props": [
            {
              "name": "loading",
              "type": "string"
            }
          ]
        },
        "image.lazy": {
          "title": "懒加载与展开",
          "description": "原生懒加载：lazy（输出 loading=\"lazy\"）",
          "module": "packages/ui-kit/src/components/image/features/lazy/index.ts",
          "exportName": "imageLazyFeature",
          "requires": [],
          "props": [
            {
              "name": "lazy",
              "type": "boolean"
            }
          ]
        },
        "image.preview": {
          "title": "图片预览",
          "description": "点击图片打开预览层：previewSrcList、previewTeleported、initialIndex、infinite、zoomRate、minScale、maxScale、hideOnClickModal、showProgress、closeOnPressEscape",
          "module": "packages/ui-kit/src/components/image/features/preview/index.ts",
          "exportName": "imagePreviewFeature",
          "requires": [],
          "props": [
            {
              "name": "previewSrcList",
              "type": "string[]",
              "default": [],
              "description": "预览图列表，空列表时回退为当前 src"
            },
            {
              "name": "previewTeleported",
              "type": "boolean",
              "default": true,
              "description": "预览层是否传送到 body"
            },
            {
              "name": "initialIndex",
              "type": "number",
              "default": 0,
              "description": "打开时定位的图片索引"
            },
            {
              "name": "infinite",
              "type": "boolean",
              "default": true,
              "description": "首尾循环切换"
            },
            {
              "name": "zoomRate",
              "type": "number",
              "default": 1.2,
              "description": "每次滚轮缩放的倍率"
            },
            {
              "name": "minScale",
              "type": "number",
              "default": 0.2,
              "description": "最小缩放比例"
            },
            {
              "name": "maxScale",
              "type": "number",
              "default": 7,
              "description": "最大缩放比例"
            },
            {
              "name": "hideOnClickModal",
              "type": "boolean",
              "default": false,
              "description": "点击遮罩关闭预览"
            },
            {
              "name": "showProgress",
              "type": "boolean",
              "default": false,
              "description": "多图时显示页码进度"
            },
            {
              "name": "closeOnPressEscape",
              "type": "boolean",
              "default": true,
              "description": "按 Esc 关闭预览"
            }
          ]
        }
      }
    }
  ]
}
