export default {
  "id": "skeleton",
  "title": "Skeleton 骨架屏",
  "description": "对齐主流组件库的 Skeleton / SkeletonItem，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Skeleton",
      "module": "packages/ui-kit/src/components/skeleton/core.ts",
      "createExport": "createSkeleton",
      "coreProps": [
        {
          "name": "animated",
          "type": "boolean",
          "description": "animated"
        },
        {
          "name": "count",
          "type": "number",
          "default": 1,
          "description": "count"
        },
        {
          "name": "rows",
          "type": "number",
          "default": 3,
          "description": "rows"
        },
        {
          "name": "throttle",
          "type": "number | Record<string, any>",
          "description": "throttle"
        },
        {
          "name": "loading",
          "type": "boolean",
          "default": true,
          "description": "loading"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": true,
          "description": "实际内容，loading=false 或提供插槽时渲染；无插槽且加载中时回退骨架行"
        }
      ],
      "features": {
        "skeleton.loading": {
          "title": "加载状态",
          "description": "加载状态：loading",
          "module": "packages/ui-kit/src/components/skeleton/features/loading/index.ts",
          "exportName": "skeletonLoadingFeature",
          "requires": [],
          "props": []
        }
      }
    },
    {
      "name": "SkeletonItem",
      "module": "packages/ui-kit/src/components/skeleton/core.ts",
      "createExport": "createSkeletonItem",
      "coreProps": [
        {
          "name": "variant",
          "type": "string",
          "default": "text",
          "description": "variant"
        }
      ],
      "features": {}
    }
  ]
}
