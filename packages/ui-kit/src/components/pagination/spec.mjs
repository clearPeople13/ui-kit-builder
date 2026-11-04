export default {
  "id": "pagination",
  "title": "Pagination 分页",
  "description": "对齐主流组件库的 Pagination，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Pagination",
      "module": "packages/ui-kit/src/components/pagination/core.ts",
      "createExport": "createPagination",
      "coreProps": [
        {
          "name": "size",
          "type": "string",
          "description": "size"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "description": "disabled"
        },
        {
          "name": "pageSize",
          "type": "number",
          "description": "pageSize"
        },
        {
          "name": "total",
          "type": "number",
          "description": "total"
        },
        {
          "name": "pageCount",
          "type": "number",
          "description": "pageCount"
        },
        {
          "name": "pagerCount",
          "type": "number",
          "default": 7,
          "description": "pagerCount"
        },
        {
          "name": "currentPage",
          "type": "number",
          "description": "currentPage"
        },
        {
          "name": "prevText",
          "type": "string",
          "default": "",
          "description": "prevText"
        },
        {
          "name": "nextText",
          "type": "string",
          "default": "",
          "description": "nextText"
        },
        {
          "name": "background",
          "type": "boolean",
          "default": false,
          "description": "background"
        },
        {
          "name": "hideOnSinglePage",
          "type": "boolean",
          "default": false,
          "description": "hideOnSinglePage"
        }
      ],
      "features": {
        "pagination.icons": {
          "title": "图标",
          "description": "图标：prevIcon、nextIcon",
          "module": "packages/ui-kit/src/components/pagination/features/icons/index.ts",
          "exportName": "paginationIconsFeature",
          "requires": [],
          "props": [
            {
              "name": "prevIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any"
            },
            {
              "name": "nextIcon",
              "type": "string | Record<string, any> | (...args: any[]) => any"
            }
          ]
        },
        "pagination.layout": {
          "title": "布局",
          "description": "布局：layout（total、sizes、prev、pager、next、jumper、slot）、pageSizes",
          "module": "packages/ui-kit/src/components/pagination/features/layout/index.ts",
          "exportName": "paginationLayoutFeature",
          "requires": [],
          "props": [
            {
              "name": "layout",
              "type": "string"
            },
            {
              "name": "pageSizes",
              "type": "unknown[]"
            }
          ]
        }
      }
    }
  ]
}
