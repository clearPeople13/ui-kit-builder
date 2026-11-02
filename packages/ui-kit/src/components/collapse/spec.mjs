export default {
  "id": "collapse",
  "title": "Collapse 折叠面板",
  "description": "对齐主流组件库的 Collapse / CollapseItem，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Collapse",
      "module": "packages/ui-kit/src/components/collapse/core.ts",
      "createExport": "createCollapse",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "any[] | string | number",
          "description": "modelValue"
        },
        {
          "name": "accordion",
          "type": "boolean",
          "description": "accordion"
        },
        {
          "name": "expandIconPosition",
          "type": "string",
          "default": "right",
          "description": "expandIconPosition"
        },
        {
          "name": "beforeCollapse",
          "type": "(...args: any[]) => any",
          "description": "beforeCollapse"
        }
      ],
      "features": {}
    },
    {
      "name": "CollapseItem",
      "module": "packages/ui-kit/src/components/collapse/core.ts",
      "createExport": "createCollapseItem",
      "coreProps": [
        {
          "name": "disabled",
          "type": "boolean",
          "description": "disabled"
        },
        {
          "name": "title",
          "type": "string",
          "default": "",
          "description": "title"
        },
        {
          "name": "name",
          "type": "string | number",
          "default": null,
          "description": "name"
        }
      ],
      "features": {
        "collapse.collapse-item-icons": {
          "title": "图标",
          "description": "图标：icon",
          "module": "packages/ui-kit/src/components/collapse/features/collapse-item-icons/index.ts",
          "exportName": "collapseItemIconsFeature",
          "requires": [],
          "props": [
            {
              "name": "icon",
              "type": "string | Record<string, any> | (...args: any[]) => any",
              "default": {
                "name": "ArrowRight",
                "__name": "arrow-right"
              }
            }
          ]
        }
      }
    }
  ]
}
