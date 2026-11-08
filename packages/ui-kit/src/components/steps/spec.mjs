export default {
  "id": "steps",
  "title": "Steps 步骤条",
  "description": "对齐主流组件库的 Step / Steps，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Step",
      "module": "packages/ui-kit/src/components/steps/core.ts",
      "createExport": "createStep",
      "coreProps": [
        {
          "name": "title",
          "type": "string",
          "default": "",
          "description": "title"
        },
        {
          "name": "description",
          "type": "string",
          "default": "",
          "description": "description"
        },
        {
          "name": "status",
          "type": "string",
          "default": "",
          "description": "status"
        },
        {
          "name": "icon",
          "type": "string | Record<string, any> | (...args: any[]) => any",
          "description": "icon"
        }
      ],
      "slots": [
        {
          "name": "title",
          "scope": null,
          "fallback": true,
          "description": "步骤标题，渲染在 ui-step__title 内，无 slot 时回退 title 属性"
        },
        {
          "name": "description",
          "scope": null,
          "fallback": true,
          "description": "步骤描述，渲染在 ui-step__description 内，无 slot 时回退 description 属性"
        }
      ],
      "features": {
        "steps.icons": {
          "title": "图标",
          "description": "图标：icon",
          "module": "packages/ui-kit/src/components/steps/features/icons/index.ts",
          "exportName": "stepIconsFeature",
          "requires": [],
          "props": []
        }
      }
    },
    {
      "name": "Steps",
      "module": "packages/ui-kit/src/components/steps/core.ts",
      "createExport": "createSteps",
      "coreProps": [
        {
          "name": "space",
          "type": "number | string",
          "default": "",
          "description": "space"
        },
        {
          "name": "active",
          "type": "number",
          "default": 0,
          "description": "active"
        },
        {
          "name": "direction",
          "type": "string",
          "default": "horizontal",
          "description": "direction"
        },
        {
          "name": "alignCenter",
          "type": "boolean",
          "description": "alignCenter"
        },
        {
          "name": "simple",
          "type": "boolean",
          "description": "simple"
        },
        {
          "name": "finishStatus",
          "type": "string",
          "default": "finish",
          "description": "finishStatus"
        },
        {
          "name": "processStatus",
          "type": "string",
          "default": "process",
          "description": "processStatus"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": false,
          "description": "步骤子项容器，渲染在 ui-steps__list 内，无默认内容"
        }
      ],
      "features": {}
    }
  ]
}
