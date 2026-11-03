export default {
  "id": "input-tag",
  "title": "InputTag 标签输入框",
  "description": "对齐主流组件库的 InputTag，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "InputTag",
      "module": "packages/ui-kit/src/components/input-tag/core.ts",
      "createExport": "createInputTag",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "any[]",
          "description": "modelValue"
        },
        {
          "name": "size",
          "type": "string",
          "description": "size"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "default": null,
          "description": "disabled"
        },
        {
          "name": "max",
          "type": "number",
          "description": "max"
        },
        {
          "name": "effect",
          "type": "string",
          "default": "light",
          "description": "标签效果：light / dark / plain"
        },
        {
          "name": "tagType",
          "type": "string",
          "default": "primary",
          "description": "标签类型：primary / success / warning / danger / info"
        },
        {
          "name": "trigger",
          "type": "string",
          "default": "Enter",
          "description": "生成标签按键：Enter / Space / Both"
        },
        {
          "name": "readonly",
          "type": "boolean",
          "description": "readonly"
        },
        {
          "name": "id",
          "type": "string",
          "default": null,
          "description": "id"
        },
        {
          "name": "tabindex",
          "type": "string | number",
          "default": 0,
          "description": "tabindex"
        },
        {
          "name": "maxlength",
          "type": "string | number",
          "description": "maxlength"
        },
        {
          "name": "minlength",
          "type": "string | number",
          "description": "minlength"
        },
        {
          "name": "placeholder",
          "type": "string",
          "description": "placeholder"
        },
        {
          "name": "autocomplete",
          "type": "string",
          "default": "off",
          "description": "autocomplete"
        },
        {
          "name": "saveOnBlur",
          "type": "boolean",
          "default": true,
          "description": "saveOnBlur"
        },
        {
          "name": "ariaLabel",
          "type": "string",
          "description": "ariaLabel"
        }
      ],
      "features": {
        "input-tag.clearable": {
          "title": "可清空",
          "description": "可清空：clearable、clearIcon；点击清空按钮全部移除并触发 clear",
          "module": "packages/ui-kit/src/components/input-tag/features/clearable/index.ts",
          "exportName": "inputTagClearableFeature",
          "requires": [],
          "props": [
            {
              "name": "clearable",
              "type": "boolean"
            },
            {
              "name": "clearIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any"
            }
          ]
        },
        "input-tag.separator": {
          "title": "分隔符批量添加",
          "description": "分隔符批量添加：separator（输入分隔符或粘贴含分隔符文本时一次生成多个标签）",
          "module": "packages/ui-kit/src/components/input-tag/features/separator/index.ts",
          "exportName": "inputTagSeparatorFeature",
          "requires": [],
          "props": [
            {
              "name": "separator",
              "type": "string"
            }
          ]
        },
        "input-tag.draggable": {
          "title": "拖拽排序",
          "description": "拖拽排序：draggable（拖动标签调整顺序）",
          "module": "packages/ui-kit/src/components/input-tag/features/draggable/index.ts",
          "exportName": "inputTagDraggableFeature",
          "requires": [],
          "props": [
            {
              "name": "draggable",
              "type": "boolean"
            }
          ]
        }
      }
    }
  ]
}
