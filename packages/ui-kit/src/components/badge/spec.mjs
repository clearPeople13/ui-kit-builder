export default {
  "id": "badge",
  "title": "Badge 徽章",
  "description": "对齐主流组件库的 Badge，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Badge",
      "module": "packages/ui-kit/src/components/badge/core.ts",
      "createExport": "createBadge",
      "coreProps": [
        {
          "name": "value",
          "type": "string | number",
          "default": "",
          "description": "value"
        },
        {
          "name": "type",
          "type": "string",
          "default": "danger",
          "description": "type"
        },
        {
          "name": "max",
          "type": "number",
          "default": 99,
          "description": "max"
        },
        {
          "name": "isDot",
          "type": "boolean",
          "description": "isDot"
        },
        {
          "name": "hidden",
          "type": "boolean",
          "description": "hidden"
        },
        {
          "name": "showZero",
          "type": "boolean",
          "default": true,
          "description": "showZero"
        },
        {
          "name": "color",
          "type": "string",
          "description": "color"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": false,
          "description": "徽章包裹内容，渲染在圆点标记之前（无默认内容）"
        }
      ],
      "features": {
        "badge.popper": {
          "title": "徽章偏移",
          "description": "徽章偏移：offset",
          "module": "packages/ui-kit/src/components/badge/features/popper/index.ts",
          "exportName": "badgePopperFeature",
          "requires": [],
          "props": [
            {
              "name": "offset",
              "type": "any[]"
            }
          ]
        }
      }
    }
  ]
}
