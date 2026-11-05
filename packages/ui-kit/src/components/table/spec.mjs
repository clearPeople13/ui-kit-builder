export default {
  "id": "table",
  "title": "Table 表格",
  "description": "单表结构渲染，纯 CSS sticky 冻结列，支持排序、多列排序、树形、合并单元格、列宽拖拽、加载态、选择与汇总。",
  "order": 10,
  "exports": [
    {
      "name": "Table",
      "module": "packages/ui-kit/src/components/table/core.ts",
      "createExport": "createTable",
      "coreProps": [
        {
          "name": "data",
          "type": "any[]",
          "default": [],
          "description": "表格数据"
        },
        {
          "name": "height",
          "type": "string | number",
          "description": "固定高度"
        },
        {
          "name": "maxHeight",
          "type": "string | number",
          "description": "最大高度"
        },
        {
          "name": "stripe",
          "type": "boolean",
          "default": false,
          "description": "斑马纹"
        },
        {
          "name": "border",
          "type": "boolean",
          "default": false,
          "description": "纵向边框"
        },
        {
          "name": "size",
          "type": "string",
          "description": "表格尺寸"
        },
        {
          "name": "fit",
          "type": "boolean",
          "default": true,
          "description": "自动铺满容器宽度：显式 width 保持，未设 width 的列均分剩余空间"
        },
        {
          "name": "showHeader",
          "type": "boolean",
          "default": true,
          "description": "显示表头"
        },
        {
          "name": "highlightCurrentRow",
          "type": "boolean",
          "default": false,
          "description": "高亮当前行"
        },
        {
          "name": "rowKey",
          "type": "string | Function",
          "description": "行数据唯一键"
        },
        {
          "name": "rowClassName",
          "type": "string | Function",
          "default": "",
          "description": "行类名"
        },
        {
          "name": "rowStyle",
          "type": "Record<string, any> | Function",
          "description": "行样式"
        },
        {
          "name": "emptyText",
          "type": "string",
          "default": "暂无数据",
          "description": "空数据文案"
        },
        {
          "name": "tableLayout",
          "type": "string",
          "default": "fixed",
          "description": "表格布局算法：fixed 固定列宽 / auto 内容撑开"
        },
        {
          "name": "showOverflowTooltip",
          "type": "boolean",
          "default": false,
          "description": "单元格内容溢出时以省略号显示并带 title 提示"
        }
      ],
      "features": {
        "table.sort": {
          "title": "排序",
          "description": "表头点击排序，支持默认排序、多列排序、自定义比较与排序序列。",
          "module": "packages/ui-kit/src/components/table/features/sort/index.ts",
          "exportName": "tableSortFeature",
          "requires": [],
          "props": [
            {
              "name": "defaultSort",
              "type": "Record<string, any> | any[]",
              "default": {},
              "description": "默认排序，单个 { prop, order } 或数组"
            },
            {
              "name": "multiSort",
              "type": "boolean",
              "default": false,
              "description": "开启多列排序"
            }
          ]
        },
        "table.tree": {
          "title": "树形数据",
          "description": "按 children 字段展开树形行，支持默认展开、缩进与展开控制方法。",
          "module": "packages/ui-kit/src/components/table/features/tree/index.ts",
          "exportName": "tableTreeFeature",
          "requires": [],
          "props": [
            {
              "name": "treeProps",
              "type": "Record<string, any>",
              "default": {
                "children": "children"
              },
              "description": "子节点字段映射 { children, hasChildren }"
            },
            {
              "name": "defaultExpandAll",
              "type": "boolean",
              "default": false,
              "description": "默认展开全部节点"
            },
            {
              "name": "treeIndent",
              "type": "number",
              "default": 16,
              "description": "每级缩进像素"
            }
          ],
          "methods": [
            {
              "name": "toggleTreeExpand",
              "signature": "(row: any, expanded?: boolean) => boolean",
              "description": "展开或收起指定树节点"
            },
            {
              "name": "setAllTreeExpansion",
              "signature": "(expanded: boolean) => void",
              "description": "展开或收起全部树节点"
            }
          ]
        },
        "table.resize": {
          "title": "列宽拖拽",
          "description": "拖拽表头右侧手柄调整列宽，双击手柄恢复默认宽度。",
          "module": "packages/ui-kit/src/components/table/features/resize/index.ts",
          "exportName": "tableResizeFeature",
          "requires": [],
          "props": [
            {
              "name": "resizable",
              "type": "boolean",
              "default": false,
              "description": "开启列宽拖拽"
            },
            {
              "name": "minColumnWidth",
              "type": "number",
              "default": 60,
              "description": "拖拽最小列宽"
            }
          ]
        },
        "table.span": {
          "title": "合并单元格",
          "description": "通过 spanMethod 返回 [rowspan, colspan] 合并单元格。",
          "module": "packages/ui-kit/src/components/table/features/span/index.ts",
          "exportName": "tableSpanFeature",
          "requires": [],
          "props": [
            {
              "name": "spanMethod",
              "type": "Function",
              "description": "合并方法，返回 [rowspan, colspan]"
            }
          ]
        },
        "table.loading": {
          "title": "加载状态",
          "description": "在表格区域展示加载遮罩，可自定义加载文案。",
          "module": "packages/ui-kit/src/components/table/features/loading/index.ts",
          "exportName": "tableLoadingFeature",
          "requires": [],
          "props": [
            {
              "name": "loading",
              "type": "boolean",
              "default": false,
              "description": "显示加载遮罩"
            },
            {
              "name": "loadingText",
              "type": "string",
              "default": "",
              "description": "加载文案"
            }
          ]
        },
        "table.summary": {
          "title": "合计行",
          "description": "在表格底部展示数值合计，支持自定义汇总方法。",
          "module": "packages/ui-kit/src/components/table/features/summary/index.ts",
          "exportName": "tableSummaryFeature",
          "requires": [],
          "props": [
            {
              "name": "showSummary",
              "type": "boolean",
              "default": false,
              "description": "显示合计行"
            },
            {
              "name": "sumText",
              "type": "string",
              "default": "合计",
              "description": "合计文案"
            },
            {
              "name": "summaryMethod",
              "type": "Function",
              "description": "自定义汇总方法"
            }
          ]
        },
        "table.methods": {
          "title": "实例方法",
          "description": "通过 ref 操作选择：clearSelection、getSelectionRows、toggleRowSelection、toggleAllSelection。",
          "module": "packages/ui-kit/src/components/table/features/methods/index.ts",
          "exportName": "tableMethodsFeature",
          "requires": [],
          "props": [],
          "methods": [
            {
              "name": "clearSelection",
              "signature": "() => void",
              "description": "清空选择"
            },
            {
              "name": "getSelectionRows",
              "signature": "() => any[]",
              "description": "获取已选行数据"
            },
            {
              "name": "toggleRowSelection",
              "signature": "(row: any, selected?: boolean) => void",
              "description": "切换指定行的选中状态"
            },
            {
              "name": "toggleAllSelection",
              "signature": "() => void",
              "description": "切换全选"
            }
          ]
        }
      }
    },
    {
      "name": "TableColumn",
      "module": "packages/ui-kit/src/components/table/core.ts",
      "createExport": "createTableColumn",
      "coreProps": [
        {
          "name": "type",
          "type": "string",
          "default": "default",
          "description": "列类型：default / selection / index / expand"
        },
        {
          "name": "label",
          "type": "string",
          "default": "",
          "description": "列标题"
        },
        {
          "name": "prop",
          "type": "string",
          "default": "",
          "description": "字段名"
        },
        {
          "name": "width",
          "type": "string | number",
          "description": "列宽，数字按 px 处理；不设时按 minWidth 参与剩余空间分配"
        },
        {
          "name": "minWidth",
          "type": "string | number",
          "default": 80,
          "description": "最小列宽"
        },
        {
          "name": "fixed",
          "type": "boolean | string",
          "default": false,
          "description": "冻结列：true / left 靠左，right 靠右，纯 CSS sticky 实现"
        },
        {
          "name": "align",
          "type": "string",
          "default": "left",
          "description": "内容对齐"
        },
        {
          "name": "headerAlign",
          "type": "string",
          "default": "",
          "description": "表头对齐，留空时跟随 align"
        },
        {
          "name": "className",
          "type": "string",
          "default": "",
          "description": "单元格类名"
        },
        {
          "name": "labelClassName",
          "type": "string",
          "default": "",
          "description": "表头单元格类名"
        },
        {
          "name": "showOverflowTooltip",
          "type": "boolean",
          "default": false,
          "description": "该列内容溢出时省略并显示 title 提示"
        },
        {
          "name": "index",
          "type": "number | Function",
          "description": "索引列起始偏移（数字）或 (index) => number 计算函数"
        },
        {
          "name": "formatter",
          "type": "Function",
          "description": "单元格格式化函数 (row, column, value, index) => any"
        }
      ],
      "features": {
        "table.column-sort": {
          "title": "列排序配置",
          "description": "为列开启排序并配置比较方法、排序字段与排序序列；依赖表格排序特性。",
          "module": "packages/ui-kit/src/components/table/features/column-sort/index.ts",
          "exportName": "tableColumnSortFeature",
          "requires": [
            "table.sort"
          ],
          "props": [
            {
              "name": "sortable",
              "type": "boolean | string",
              "default": false,
              "description": "是否可排序"
            },
            {
              "name": "sortMethod",
              "type": "Function",
              "description": "自定义比较方法"
            },
            {
              "name": "sortOrders",
              "type": "any[]",
              "default": [
                "ascending",
                "descending",
                null
              ],
              "description": "排序序列"
            }
          ]
        },
        "table.selection": {
          "title": "选择列配置",
          "description": "为 selection 列配置 selectable 判断哪些行可勾选。",
          "module": "packages/ui-kit/src/components/table/features/selection/index.ts",
          "exportName": "tableSelectionFeature",
          "requires": [],
          "props": [
            {
              "name": "selectable",
              "type": "Function",
              "description": "行是否可选"
            }
          ]
        }
      }
    }
  ]
}
