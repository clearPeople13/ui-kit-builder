export default {
  "id": "color-picker-panel",
  "title": "ColorPickerPanel 颜色面板",
  "description": "对齐主流组件库的 ColorPickerPanel，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "ColorPickerPanel",
      "module": "packages/ui-kit/src/components/color-picker-panel/core.ts",
      "createExport": "createColorPickerPanel",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "string",
          "default": null,
          "description": "modelValue"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "description": "disabled"
        },
        {
          "name": "showAlpha",
          "type": "boolean",
          "description": "showAlpha"
        },
        {
          "name": "colorFormat",
          "type": "string",
          "description": "colorFormat"
        },
        {
          "name": "predefine",
          "type": "any[]",
          "description": "predefine"
        },
        {
          "name": "hueSliderClass",
          "type": "string | any[] | Record<string, any> | boolean",
          "default": null,
          "description": "hueSliderClass"
        },
        {
          "name": "hueSliderStyle",
          "type": "string | any[] | Record<string, any> | boolean",
          "default": null,
          "description": "hueSliderStyle"
        }
      ],
      "features": {
        "color-picker-panel.appearance": {
          "title": "外观变体",
          "description": "外观变体：border",
          "module": "packages/ui-kit/src/components/color-picker-panel/features/appearance/index.ts",
          "exportName": "colorPickerPanelAppearanceFeature",
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
