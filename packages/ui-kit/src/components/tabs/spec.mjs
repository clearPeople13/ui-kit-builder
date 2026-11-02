export default {
  "id": "tabs",
  "title": "Tabs 标签页",
  "description": "对齐主流组件库的 TabPane / Tabs，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "TabPane",
      "module": "packages/ui-kit/src/components/tabs/core.ts",
      "createExport": "createTabPane",
      "coreProps": [
        {
          "name": "type",
          "type": "string",
          "default": "",
          "description": "type"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "description": "disabled"
        },
        {
          "name": "stretch",
          "type": "boolean",
          "description": "stretch"
        },
        {
          "name": "tabindex",
          "type": "string | number",
          "default": null,
          "description": "tabindex"
        },
        {
          "name": "label",
          "type": "string",
          "default": "",
          "description": "label"
        },
        {
          "name": "name",
          "type": "string | number",
          "description": "name"
        }
      ],
      "features": {
        "tabs.closable": {
          "title": "可关闭",
          "description": "可关闭：closable",
          "module": "packages/ui-kit/src/components/tabs/features/closable/index.ts",
          "exportName": "tabPaneClosableFeature",
          "requires": [],
          "props": [
            {
              "name": "closable",
              "type": "boolean",
              "default": null
            }
          ]
        },
        "tabs.lazy": {
          "title": "面板懒渲染",
          "description": "未激活面板首次激活前不渲染：lazy",
          "module": "packages/ui-kit/src/components/tabs/features/lazy/index.ts",
          "exportName": "tabPaneLazyFeature",
          "requires": [],
          "props": [
            {
              "name": "lazy",
              "type": "boolean"
            }
          ]
        },
        "tabs.editable": {
          "title": "编辑与新增",
          "description": "编辑与新增：editable",
          "module": "packages/ui-kit/src/components/tabs/features/editable/index.ts",
          "exportName": "tabPaneEditableFeature",
          "requires": [],
          "props": [
            {
              "name": "editable",
              "type": "boolean"
            }
          ]
        }
      }
    },
    {
      "name": "Tabs",
      "module": "packages/ui-kit/src/components/tabs/core.ts",
      "createExport": "createTabs",
      "coreProps": [
        {
          "name": "type",
          "type": "string",
          "default": "",
          "description": "type"
        },
        {
          "name": "modelValue",
          "type": "string | number",
          "description": "modelValue"
        },
        {
          "name": "defaultValue",
          "type": "string | number",
          "description": "defaultValue"
        },
        {
          "name": "tabPosition",
          "type": "string",
          "default": "top",
          "description": "tabPosition"
        },
        {
          "name": "stretch",
          "type": "boolean",
          "description": "stretch"
        },
        {
          "name": "tabindex",
          "type": "string | number",
          "default": 0,
          "description": "tabindex"
        }
      ],
      "features": {
        "tabs.tabs-closable": {
          "title": "可关闭",
          "description": "可关闭：closable",
          "module": "packages/ui-kit/src/components/tabs/features/tabs-closable/index.ts",
          "exportName": "tabsClosableFeature",
          "requires": [],
          "props": [
            {
              "name": "closable",
              "type": "boolean"
            }
          ]
        },
        "tabs.tabs-editable": {
          "title": "编辑与新增",
          "description": "编辑与新增：editable、addable、beforeLeave",
          "module": "packages/ui-kit/src/components/tabs/features/tabs-editable/index.ts",
          "exportName": "tabsEditableFeature",
          "requires": [],
          "props": [
            {
              "name": "editable",
              "type": "boolean"
            },
            {
              "name": "addable",
              "type": "boolean"
            },
            {
              "name": "beforeLeave",
              "type": "(...args: any[]) => any"
            }
          ]
        }
      }
    }
  ]
}
