export default {
  "id": "roving-focus-group",
  "title": "RovingFocusGroup 焦点组",
  "description": "对齐主流组件库的 RovingFocusGroup / RovingFocusItem，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "RovingFocusGroup",
      "module": "packages/ui-kit/src/components/roving-focus-group/core.ts",
      "createExport": "createRovingFocusGroup",
      "coreProps": [
        {
          "name": "currentTabStopId",
          "type": "string | null",
          "description": "currentTabStopId",
          "default": null
        },
        {
          "name": "orientation",
          "type": "'horizontal' | 'vertical'",
          "description": "orientation"
        },
        {
          "name": "dir",
          "type": "'ltr' | 'rtl'",
          "description": "dir"
        },
        {
          "name": "loop",
          "type": "boolean",
          "description": "loop"
        }
      ],
      "features": {}
    },
    {
      "name": "RovingFocusItem",
      "module": "packages/ui-kit/src/components/roving-focus-group/core.ts",
      "createExport": "createRovingFocusItem",
      "coreProps": [
        {
          "name": "tabStopId",
          "type": "string",
          "description": "tabStopId",
          "default": ""
        },
        {
          "name": "focusable",
          "type": "boolean",
          "description": "focusable",
          "default": true
        },
        {
          "name": "active",
          "type": "boolean",
          "description": "active"
        }
      ],
      "features": {}
    }
  ]
}
