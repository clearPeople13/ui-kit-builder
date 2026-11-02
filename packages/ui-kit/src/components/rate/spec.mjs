export default {
  "id": "rate",
  "title": "Rate 评分",
  "description": "对齐主流组件库的 Rate，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Rate",
      "module": "packages/ui-kit/src/components/rate/core.ts",
      "createExport": "createRate",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "number",
          "default": 0,
          "description": "modelValue"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "default": null,
          "description": "disabled"
        },
        {
          "name": "size",
          "type": "string",
          "description": "size"
        },
        {
          "name": "id",
          "type": "string",
          "default": null,
          "description": "id"
        },
        {
          "name": "max",
          "type": "number",
          "default": 5,
          "description": "max"
        },
        {
          "name": "lowThreshold",
          "type": "number",
          "default": 2,
          "description": "低档阈值，colors/texts 分段起点"
        },
        {
          "name": "highThreshold",
          "type": "number",
          "default": 4,
          "description": "高档阈值，colors/texts 分段起点"
        },
        {
          "name": "colors",
          "type": "any[] | Record<string, any>",
          "description": "选中颜色，可按档位分段"
        },
        {
          "name": "voidColor",
          "type": "string",
          "default": "",
          "description": "未选中图标颜色"
        },
        {
          "name": "disabledVoidColor",
          "type": "string",
          "default": "",
          "description": "禁用态未选中图标颜色"
        },
        {
          "name": "icons",
          "type": "any[] | Record<string, any>",
          "description": "icons"
        },
        {
          "name": "voidIcon",
          "type": "string | Record<string, any> | (...args: any[]) => any",
          "description": "未选中图标"
        },
        {
          "name": "disabledVoidIcon",
          "type": "string | Record<string, any> | (...args: any[]) => any",
          "description": "禁用态未选中图标"
        },
        {
          "name": "allowHalf",
          "type": "boolean",
          "description": "允许半选"
        },
        {
          "name": "showText",
          "type": "boolean",
          "description": "显示对应文案"
        },
        {
          "name": "showScore",
          "type": "boolean",
          "description": "显示当前分数"
        },
        {
          "name": "textColor",
          "type": "string",
          "default": "",
          "description": "辅助文字颜色"
        },
        {
          "name": "texts",
          "type": "any[]",
          "description": "各档位文案"
        },
        {
          "name": "scoreTemplate",
          "type": "string",
          "default": "{value}",
          "description": "分数模板，{value} 替换为当前分"
        },
        {
          "name": "ariaLabel",
          "type": "string",
          "description": "无障碍标签"
        }
      ],
      "features": {
        "rate.clearable": {
          "title": "可清空",
          "description": "可清空：clearable",
          "module": "packages/ui-kit/src/components/rate/features/clearable/index.ts",
          "exportName": "rateClearableFeature",
          "requires": [],
          "props": [
            {
              "name": "clearable",
              "type": "boolean"
            }
          ]
        }
      }
    }
  ]
}
