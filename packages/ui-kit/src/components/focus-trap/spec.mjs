export default {
  "id": "focus-trap",
  "title": "FocusTrap 焦点陷阱",
  "description": "对齐主流组件库的 FocusTrap，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "FocusTrap",
      "module": "packages/ui-kit/src/components/focus-trap/core.ts",
      "createExport": "createFocusTrap",
      "coreProps": [
        {
          "name": "loop",
          "type": "boolean",
          "description": "loop"
        },
        {
          "name": "trapped",
          "type": "boolean",
          "description": "trapped"
        },
        {
          "name": "focusTrapEl",
          "type": "HTMLElement",
          "description": "focusTrapEl"
        },
        {
          "name": "focusStartEl",
          "type": "HTMLElement | 'container' | 'first' | 'last'",
          "description": "focusStartEl",
          "default": "first"
        }
      ],
      "features": {}
    }
  ]
}
