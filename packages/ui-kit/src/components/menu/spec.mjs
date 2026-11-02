export default {
  "id": "menu",
  "title": "Menu 菜单",
  "description": "对齐主流组件库的 Menu / MenuItem / MenuItemGroup / SubMenu，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Menu",
      "module": "packages/ui-kit/src/components/menu/core.ts",
      "createExport": "createMenu",
      "coreProps": [
        {
          "name": "mode",
          "type": "string",
          "default": "vertical",
          "description": "菜单方向：vertical 纵向侧栏，horizontal 顶部导航条（子菜单浮出为面板）"
        },
        {
          "name": "defaultActive",
          "type": "string",
          "default": "",
          "description": "初始激活项的 index，需与某个 MenuItem 的 index 一致"
        },
        {
          "name": "defaultOpeneds",
          "type": "any[]",
          "description": "初始展开的子菜单 index 列表，可逐级填入以展示多层缩进"
        },
        {
          "name": "uniqueOpened",
          "type": "boolean",
          "description": "手风琴：展开一个子菜单时自动收起其余同级子菜单"
        },
        {
          "name": "collapse",
          "type": "boolean",
          "description": "折叠菜单：分组标题与子菜单内容整体收起，只保留顶级条目，此时点击、悬停均不展开子菜单"
        },
        {
          "name": "backgroundColor",
          "type": "string",
          "description": "菜单底色，如深色侧栏 #1f2937；留空使用主题默认白底"
        },
        {
          "name": "textColor",
          "type": "string",
          "description": "菜单项与子菜单标题的文字颜色，深色底需一并调亮；留空使用主题默认色"
        },
        {
          "name": "activeTextColor",
          "type": "string",
          "description": "激活/悬停文字色，同时决定激活高亮底色（按 12% 混色生成）；留空使用主题主色"
        },
        {
          "name": "showTimeout",
          "type": "number",
          "default": 300,
          "description": "悬停多少毫秒后自动展开子菜单，MenuItem 未单独设置时的默认值"
        },
        {
          "name": "hideTimeout",
          "type": "number",
          "default": 300,
          "description": "鼠标移出多少毫秒后自动收起悬停展开的子菜单；点击展开的子菜单不会自动收起"
        }
      ],
      "features": {}
    },
    {
      "name": "MenuItem",
      "module": "packages/ui-kit/src/components/menu/core.ts",
      "createExport": "createMenuItem",
      "coreProps": [
        {
          "name": "index",
          "type": "string",
          "required": true,
          "description": "菜单项唯一标识：参与激活与 select 事件，建议与路由或业务 ID 对应"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "description": "禁用菜单项：置灰且不响应点击激活"
        }
      ],
      "features": {}
    },
    {
      "name": "MenuItemGroup",
      "module": "packages/ui-kit/src/components/menu/core.ts",
      "createExport": "createMenuItemGroup",
      "coreProps": [
        {
          "name": "title",
          "type": "string",
          "description": "分组小标题；留空时不渲染标题行"
        }
      ],
      "features": {}
    },
    {
      "name": "SubMenu",
      "module": "packages/ui-kit/src/components/menu/core.ts",
      "createExport": "createSubMenu",
      "coreProps": [
        {
          "name": "index",
          "type": "string",
          "required": true,
          "description": "子菜单唯一标识，需与 Menu 的 defaultOpeneds / uniqueOpened 配合使用"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "description": "禁用子菜单：不响应点击与悬停展开"
        },
        {
          "name": "showTimeout",
          "type": "number",
          "description": "本项悬停展开延迟（ms），未设置时跟随 Menu.showTimeout"
        },
        {
          "name": "hideTimeout",
          "type": "number",
          "description": "本项移出收起延迟（ms），未设置时跟随 Menu.hideTimeout"
        }
      ],
      "features": {
        "menu.sub-menu-icons": {
          "title": "图标",
          "description": "图标：expandCloseIcon、expandOpenIcon、collapseCloseIcon、collapseOpenIcon",
          "module": "packages/ui-kit/src/components/menu/features/sub-menu-icons/index.ts",
          "exportName": "subMenuIconsFeature",
          "requires": [],
          "props": [
            {
              "name": "expandCloseIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any",
              "description": "纵向菜单收起时的箭头图标，图标名见图标库"
            },
            {
              "name": "expandOpenIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any",
              "description": "纵向菜单展开时的箭头图标，自定义图标不再旋转"
            },
            {
              "name": "collapseCloseIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any",
              "description": "水平菜单收起时的箭头图标"
            },
            {
              "name": "collapseOpenIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any",
              "description": "水平菜单展开时的箭头图标"
            }
          ]
        }
      }
    }
  ]
}
