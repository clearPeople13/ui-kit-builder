export default {
  "id": "avatar",
  "title": "Avatar 头像",
  "description": "对齐主流组件库的 Avatar / AvatarGroup，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Avatar",
      "module": "packages/ui-kit/src/components/avatar/core.ts",
      "createExport": "createAvatar",
      "coreProps": [
        {
          "name": "size",
          "type": "number | string",
          "description": "size"
        },
        {
          "name": "shape",
          "type": "string",
          "description": "shape"
        },
        {
          "name": "src",
          "type": "string",
          "default": "",
          "description": "src"
        },
        {
          "name": "alt",
          "type": "string",
          "description": "alt"
        },
        {
          "name": "srcSet",
          "type": "string",
          "description": "srcSet"
        },
        {
          "name": "fit",
          "type": "string",
          "default": "cover",
          "description": "fit"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": true,
          "description": "头像内容，渲染在 ui-avatar__text 内；无插槽时回退 icon 属性"
        }
      ],
      "features": {
        "avatar.icons": {
          "title": "图标",
          "description": "图标：icon",
          "module": "packages/ui-kit/src/components/avatar/features/icons/index.ts",
          "exportName": "avatarIconsFeature",
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
      "name": "AvatarGroup",
      "module": "packages/ui-kit/src/components/avatar/core.ts",
      "createExport": "createAvatarGroup",
      "coreProps": [
        {
          "name": "size",
          "type": "number | string",
          "description": "size"
        },
        {
          "name": "shape",
          "type": "string",
          "description": "shape"
        },
        {
          "name": "gap",
          "type": "number | string",
          "default": null,
          "description": "相邻头像的重叠间距（数字按 px 处理），写成根节点内联 CSS 变量 --ui-avatar-group-gap 驱动，缺省 8px"
        },
        {
          "name": "collapseAvatars",
          "type": "boolean",
          "description": "collapseAvatars"
        },
        {
          "name": "collapseAvatarsTooltip",
          "type": "boolean",
          "default": true,
          "description": "collapseAvatarsTooltip"
        },
        {
          "name": "maxCollapseAvatars",
          "type": "number",
          "default": 1,
          "description": "maxCollapseAvatars"
        },
        {
          "name": "effect",
          "type": "string",
          "default": "light",
          "description": "effect"
        },
        {
          "name": "collapseClass",
          "type": "string | any[] | Record<string, any> | boolean",
          "default": null,
          "description": "collapseClass"
        },
        {
          "name": "collapseStyle",
          "type": "string | any[] | Record<string, any> | boolean",
          "default": null,
          "description": "collapseStyle"
        }
      ],
      "slots": [
        {
          "name": "default",
          "scope": null,
          "fallback": false,
          "description": "头像组成员，渲染在组容器内；无默认内容"
        }
      ],
      "features": {
        "avatar.avatar-group-popper": {
          "title": "浮层定位",
          "description": "浮层定位：teleported、appendTo、popperClass、popperStyle、placement、offset、showArrow",
          "module": "packages/ui-kit/src/components/avatar/features/avatar-group-popper/index.ts",
          "exportName": "avatarGroupPopperFeature",
          "requires": [],
          "props": [
            {
              "name": "teleported",
              "type": "boolean",
              "default": true
            },
            {
              "name": "appendTo",
              "type": "string | Record<string, any>"
            },
            {
              "name": "popperClass",
              "type": "string | any[] | Record<string, any> | boolean",
              "default": null
            },
            {
              "name": "popperStyle",
              "type": "string | any[] | Record<string, any> | boolean",
              "default": null
            },
            {
              "name": "placement",
              "type": "string",
              "default": "top"
            },
            {
              "name": "offset",
              "type": "number",
              "default": 8
            },
            {
              "name": "showArrow",
              "type": "boolean",
              "default": true
            }
          ]
        }
      }
    }
  ]
}
