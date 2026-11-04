export default {
  "id": "button",
  "title": "Button 按钮",
  "description": "对齐主流组件库的 Button / ButtonGroup，基础交互与外观、加载、图标、背景色等特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Button",
      "module": "packages/ui-kit/src/components/button/core.ts",
      "createExport": "createButton",
      "coreProps": [
        {
          "name": "size",
          "type": "'large' | 'default' | 'small' | ''",
          "default": "''",
          "description": "按钮尺寸，未设置时继承 ConfigProvider"
        },
        {
          "name": "type",
          "type": "'default' | 'primary' | 'success' | 'warning' | 'info' | 'danger' | ''",
          "default": "''",
          "description": "按钮类型"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "default": false,
          "description": "是否禁用"
        },
        {
          "name": "nativeType",
          "type": "'button' | 'submit' | 'reset'",
          "default": "'button'",
          "description": "原生 type 属性"
        },
        {
          "name": "autofocus",
          "type": "boolean",
          "default": false,
          "description": "是否自动聚焦"
        },
        {
          "name": "tag",
          "type": "string | Component",
          "default": "'button'",
          "description": "自定义渲染标签"
        }
      ],
      "features": {
        "button.appearance": {
          "title": "外观变体",
          "description": "朴素、文字、链接、虚线、圆形、圆角与自定义颜色。",
          "module": "packages/ui-kit/src/components/button/features/appearance/index.ts",
          "exportName": "buttonAppearanceFeature",
          "requires": [],
          "props": [
            {
              "name": "plain",
              "type": "boolean",
              "default": false,
              "description": "朴素按钮"
            },
            {
              "name": "text",
              "type": "boolean",
              "default": false,
              "description": "文字按钮"
            },
            {
              "name": "link",
              "type": "boolean",
              "default": false,
              "description": "链接按钮"
            },
            {
              "name": "bg",
              "type": "boolean",
              "default": false,
              "description": "背景色按钮"
            },
            {
              "name": "dark",
              "type": "boolean",
              "default": false,
              "description": "深色按钮"
            },
            {
              "name": "round",
              "type": "boolean",
              "default": false,
              "description": "圆角按钮"
            },
            {
              "name": "circle",
              "type": "boolean",
              "default": false,
              "description": "圆形按钮"
            },
            {
              "name": "dashed",
              "type": "boolean",
              "default": false,
              "description": "虚线边框"
            },
            {
              "name": "color",
              "type": "string",
              "description": "自定义颜色"
            }
          ]
        },
        "button.icon": {
          "title": "图标",
          "description": "在内容前渲染图标组件。",
          "module": "packages/ui-kit/src/components/button/features/icon/index.ts",
          "exportName": "buttonIconFeature",
          "requires": [],
          "props": [
            {
              "name": "icon",
              "type": "Component | string",
              "description": "图标组件或内置图标名"
            }
          ]
        },
        "button.loading": {
          "title": "加载状态",
          "description": "显示加载指示器并自动禁用按钮。",
          "module": "packages/ui-kit/src/components/button/features/loading/index.ts",
          "exportName": "buttonLoadingFeature",
          "requires": [],
          "props": [
            {
              "name": "loading",
              "type": "boolean",
              "default": false,
              "description": "是否加载中"
            },
            {
              "name": "loadingIcon",
              "type": "Component | string",
              "description": "自定义加载图标或内置图标名"
            }
          ]
        },
        "button.auto-insert-space": {
          "title": "两字自动空格",
          "description": "两个汉字时自动插入空格。",
          "module": "packages/ui-kit/src/components/button/features/auto-insert-space/index.ts",
          "exportName": "buttonAutoInsertSpaceFeature",
          "requires": [],
          "props": [
            {
              "name": "autoInsertSpace",
              "type": "boolean",
              "default": true,
              "description": "两字中文自动插入空格"
            }
          ]
        },
        "button.bg-color": {
          "title": "背景色",
          "description": "自定义背景色，并可自动计算前景对比色；引入 chroma-js 做亮度计算。",
          "module": "packages/ui-kit/src/components/button/features/bg-color/index.ts",
          "exportName": "bgColorFeature",
          "requires": [],
          "props": [
            {
              "name": "bgColor",
              "type": "string",
              "description": "背景色"
            },
            {
              "name": "autoContrast",
              "type": "boolean",
              "default": false,
              "description": "自动对比色"
            }
          ]
        },
        "button.gradient": {
          "title": "渐变背景",
          "description": "在背景色之上生成渐变，补充渐变角度属性；依赖背景色特性。",
          "module": "packages/ui-kit/src/components/button/features/gradient/index.ts",
          "exportName": "gradientFeature",
          "requires": [
            "button.bg-color"
          ],
          "props": [
            {
              "name": "gradient",
              "type": "boolean",
              "default": false,
              "description": "渐变背景"
            },
            {
              "name": "gradientAngle",
              "type": "number",
              "default": 90,
              "description": "渐变角度"
            }
          ]
        },
        "button.wave": {
          "title": "点击水波",
          "description": "点击时从触点扩散水波动画，水波颜色取按钮文字色保证对比；引入特性即默认开启，可用 wave=false 按按钮关闭。未引入特性的构建完全没有动画代码。",
          "module": "packages/ui-kit/src/components/button/features/wave/index.ts",
          "exportName": "buttonWaveFeature",
          "requires": [],
          "props": [
            {
              "name": "wave",
              "type": "boolean",
              "default": true,
              "description": "点击水波动画（引入特性后默认开启）"
            }
          ]
        }
      }
    },
    {
      "name": "ButtonGroup",
      "module": "packages/ui-kit/src/components/button/button-group/core.ts",
      "createExport": "createButtonGroup",
      "coreProps": [
        {
          "name": "size",
          "type": "string",
          "description": "size",
          "default": ""
        },
        {
          "name": "type",
          "type": "string",
          "description": "type",
          "default": ""
        },
        {
          "name": "tag",
          "type": "string",
          "description": "tag",
          "default": "div"
        },
        {
          "name": "dir",
          "type": "string",
          "description": "dir",
          "default": ""
        }
      ],
      "features": {}
    }
  ]
}
