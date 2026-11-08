export default {
  "id": "dropdown",
  "title": "Dropdown 下拉菜单",
  "description": "对齐主流组件库的 Dropdown / DropdownItem / DropdownMenu，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Dropdown",
      "module": "packages/ui-kit/src/components/dropdown/core.ts",
      "createExport": "createDropdown",
      "coreProps": [
        {
          "name": "size",
          "type": "string",
          "default": "",
          "description": "size"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "description": "disabled"
        },
        {
          "name": "trigger",
          "type": "string | any[]",
          "default": "hover",
          "description": "trigger"
        },
        {
          "name": "effect",
          "type": "string",
          "default": "light",
          "description": "effect"
        },
        {
          "name": "id",
          "type": "string",
          "description": "id"
        },
        {
          "name": "hideOnClick",
          "type": "boolean",
          "default": true,
          "description": "hideOnClick"
        },
        {
          "name": "showTimeout",
          "type": "number",
          "default": 150,
          "description": "hover 显示延迟（毫秒）"
        },
        {
          "name": "hideTimeout",
          "type": "number",
          "default": 150,
          "description": "hover 隐藏延迟（毫秒）"
        },
        {
          "name": "modelValue",
          "type": "boolean",
          "description": "受控显示（v-model），true 常显 / false 强制收起"
        },
        {
          "name": "tabindex",
          "type": "number | string",
          "default": 0,
          "description": "tabindex"
        },
        {
          "name": "maxHeight",
          "type": "number | string",
          "default": "",
          "description": "maxHeight"
        },
        {
          "name": "role",
          "type": "string",
          "default": "menu",
          "description": "role"
        }
      ],
      "features": {
        "dropdown.popper": {
          "title": "浮层定位",
          "description": "浮层定位：teleported、appendTo、persistent、popperClass、popperStyle、placement、fallbackPlacements、offset、showArrow、panelScroll",
          "module": "packages/ui-kit/src/components/dropdown/features/popper/index.ts",
          "exportName": "dropdownPopperFeature",
          "requires": [],
          "props": [
            {
              "name": "teleported",
              "type": "boolean",
              "default": true,
              "description": "浮层是否传送到 body"
            },
            {
              "name": "appendTo",
              "type": "string | Record<string, any>",
              "description": "浮层挂载目标，默认 body"
            },
            {
              "name": "persistent",
              "type": "boolean",
              "default": true,
              "description": "收起后是否保留浮层 DOM"
            },
            {
              "name": "popperClass",
              "type": "string | any[] | Record<string, any> | boolean",
              "description": "浮层附加类名"
            },
            {
              "name": "popperStyle",
              "type": "string | any[] | Record<string, any> | boolean",
              "description": "浮层附加样式"
            },
            {
              "name": "showArrow",
              "type": "boolean",
              "default": true,
              "description": "是否显示箭头"
            },
            {
              "name": "placement",
              "type": "string",
              "default": "bottom"
            },
            {
              "name": "fallbackPlacements",
              "type": "any[]"
            },
            {
              "name": "offset",
              "type": "number"
            },
            {
              "name": "panelScroll",
              "type": "string",
              "description": "滚动策略：follow 跟随 / close 关闭",
              "default": "follow"
            }
          ]
        }
      }
    },
    {
      "name": "DropdownItem",
      "module": "packages/ui-kit/src/components/dropdown/core.ts",
      "createExport": "createDropdownItem",
      "coreProps": [
        {
          "name": "disabled",
          "type": "boolean",
          "description": "disabled"
        },
        {
          "name": "divided",
          "type": "boolean",
          "description": "divided"
        }
      ],
      "features": {
        "dropdown.dropdown-item-icons": {
          "title": "图标",
          "description": "图标：icon",
          "module": "packages/ui-kit/src/components/dropdown/features/dropdown-item-icons/index.ts",
          "exportName": "dropdownItemIconsFeature",
          "requires": [],
          "props": [
            {
              "name": "icon",
              "type": "string | Record<string, any> | (...args: any[]) => any"
            }
          ]
        }
      }
    },
    {
      "name": "DropdownMenu",
      "module": "packages/ui-kit/src/components/dropdown/core.ts",
      "createExport": "createDropdownMenu",
      "coreProps": [],
      "features": {}
    }
  ]
}
