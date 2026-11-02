export default {
  "id": "table-v2",
  "title": "TableV2 虚拟化表格",
  "description": "对齐主流组件库的 AutoResizer / TableV2，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "AutoResizer",
      "module": "packages/ui-kit/src/components/table-v2/core.ts",
      "createExport": "createAutoResizer",
      "coreProps": [],
      "features": {}
    },
    {
      "name": "TableV2",
      "module": "packages/ui-kit/src/components/table-v2/core.ts",
      "createExport": "createTableV2",
      "coreProps": [
        {
          "name": "columns",
          "type": "any[]",
          "required": true,
          "description": "columns"
        },
        {
          "name": "data",
          "type": "any[]",
          "required": true,
          "description": "data"
        },
        {
          "name": "width",
          "type": "number",
          "required": true,
          "description": "width"
        },
        {
          "name": "height",
          "type": "number",
          "required": true,
          "description": "height"
        },
        {
          "name": "cache",
          "type": "number",
          "default": 2,
          "description": "cache"
        },
        {
          "name": "rowKey",
          "type": "string | number | any",
          "default": "id",
          "description": "rowKey"
        },
        {
          "name": "headerClass",
          "type": "string | (...args: any[]) => any",
          "description": "headerClass"
        },
        {
          "name": "headerHeight",
          "type": "number | any[]",
          "default": 50,
          "description": "headerHeight"
        },
        {
          "name": "rowClass",
          "type": "string | (...args: any[]) => any",
          "description": "rowClass"
        },
        {
          "name": "rowProps",
          "type": "Record<string, any> | (...args: any[]) => any",
          "description": "rowProps"
        },
        {
          "name": "rowHeight",
          "type": "number",
          "default": 50,
          "description": "rowHeight"
        },
        {
          "name": "dataGetter",
          "type": "(...args: any[]) => any",
          "description": "dataGetter"
        },
        {
          "name": "class",
          "type": "string",
          "description": "class"
        },
        {
          "name": "fixed",
          "type": "boolean",
          "description": "fixed"
        },
        {
          "name": "style",
          "type": "Record<string, any>",
          "description": "style"
        },
        {
          "name": "maxHeight",
          "type": "number",
          "description": "maxHeight"
        },
        {
          "name": "onColumnSort",
          "type": "(...args: any[]) => any",
          "description": "onColumnSort"
        },
        {
          "name": "onScroll",
          "type": "(...args: any[]) => any",
          "description": "onScroll"
        }
      ],
      "features": {
        "table-v2.table-v2-sortable": {
          "title": "排序",
          "description": "排序：sortBy",
          "module": "packages/ui-kit/src/components/table-v2/features/table-v2-sortable/index.ts",
          "exportName": "tableV2SortableFeature",
          "requires": [],
          "props": [
            {
              "name": "sortBy",
              "type": "Record<string, any>"
            }
          ]
        }
      }
    }
  ]
}
