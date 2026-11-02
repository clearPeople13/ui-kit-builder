export default {
  "id": "cascader-panel",
  "title": "CascaderPanel 级联面板",
  "description": "对齐主流组件库的 CascaderPanel，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "CascaderPanel",
      "module": "packages/ui-kit/src/components/cascader-panel/core.ts",
      "createExport": "createCascaderPanel",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "number | string | any[] | Record<string, any>",
          "description": "modelValue"
        },
        {
          "name": "options",
          "type": "any[]",
          "description": "options"
        },
        {
          "name": "value",
          "type": "any",
          "description": "value"
        },
        {
          "name": "disabled",
          "type": "any",
          "description": "disabled"
        },
        {
          "name": "props",
          "type": "Record<string, any>",
          "description": "props"
        },
        {
          "name": "height",
          "type": "number",
          "default": 204,
          "description": "height"
        },
        {
          "name": "label",
          "type": "any",
          "description": "label"
        },
        {
          "name": "children",
          "type": "any",
          "description": "children"
        },
        {
          "name": "leaf",
          "type": "any",
          "description": "leaf"
        }
      ],
      "features": {
        "cascader-panel.multiple": {
          "title": "多选",
          "description": "多选：multiple",
          "module": "packages/ui-kit/src/components/cascader-panel/features/multiple/index.ts",
          "exportName": "cascaderPanelMultipleFeature",
          "requires": [],
          "props": [
            {
              "name": "multiple",
              "type": "any"
            }
          ]
        },
        "cascader-panel.lazy": {
          "title": "懒加载与展开",
          "description": "懒加载与展开：lazy、checkOnClickNode",
          "module": "packages/ui-kit/src/components/cascader-panel/features/lazy/index.ts",
          "exportName": "cascaderPanelLazyFeature",
          "requires": [],
          "props": [
            {
              "name": "lazy",
              "type": "any"
            }
          ]
        },
        "cascader-panel.selection": {
          "title": "高亮与勾选",
          "description": "高亮与勾选：checkStrictly、checkOnClickLeaf",
          "module": "packages/ui-kit/src/components/cascader-panel/features/selection/index.ts",
          "exportName": "cascaderPanelSelectionFeature",
          "requires": [],
          "props": [
            {
              "name": "checkStrictly",
              "type": "any"
            },
            {
              "name": "checkOnClickLeaf",
              "type": "any"
            }
          ]
        },
        "cascader-panel.virtualized": {
          "title": "虚拟滚动",
          "description": "虚拟滚动：itemSize",
          "module": "packages/ui-kit/src/components/cascader-panel/features/virtualized/index.ts",
          "exportName": "cascaderPanelVirtualizedFeature",
          "requires": [],
          "props": [
            {
              "name": "itemSize",
              "type": "number",
              "default": 34
            }
          ]
        },
        "cascader-panel.appearance": {
          "title": "外观变体",
          "description": "外观变体：border",
          "module": "packages/ui-kit/src/components/cascader-panel/features/appearance/index.ts",
          "exportName": "cascaderPanelAppearanceFeature",
          "requires": [],
          "props": [
            {
              "name": "border",
              "type": "boolean",
              "default": true
            }
          ]
        }
      }
    }
  ]
}
