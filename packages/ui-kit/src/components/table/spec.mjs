export default {
  "id": "table",
  "title": "Table 表格",
  "description": "对齐主流组件库的 Table / TableColumn，基础渲染与排序、选择、汇总特性拆分。",
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
          "description": "列宽自撑满"
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
          "description": "空数据文案"
        },
        {
          "name": "tableLayout",
          "type": "string",
          "default": "fixed",
          "description": "表格布局"
        },
        {
          "name": "showOverflowTooltip",
          "type": "boolean",
          "default": false,
          "description": "溢出省略"
        }
      ],
      "features": {
        "table.sort": {
          "title": "排序",
          "description": "表头点击排序，支持默认排序、自定义比较与排序序列。",
          "module": "packages/ui-kit/src/components/table/features/sort/index.ts",
          "exportName": "tableSortFeature",
          "requires": [],
          "props": [
            {
              "name": "defaultSort",
              "type": "Record<string, any>",
              "default": {},
              "description": "默认排序 { prop, order }"
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
              "default": "Sum",
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
          "description": "列宽"
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
          "description": "固定列"
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
          "description": "表头对齐"
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
          "description": "内容溢出省略"
        },
        {
          "name": "index",
          "type": "number | Function",
          "description": "索引列起始值或计算函数"
        },
        {
          "name": "formatter",
          "type": "Function",
          "description": "单元格格式化函数"
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
          "description": "为 selection 列配置可选行判断与跨页保留选择。",
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
