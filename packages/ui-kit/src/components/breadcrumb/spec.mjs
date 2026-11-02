export default {
  "id": "breadcrumb",
  "title": "Breadcrumb 面包屑",
  "description": "对齐主流组件库的 Breadcrumb / BreadcrumbItem，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Breadcrumb",
      "module": "packages/ui-kit/src/components/breadcrumb/core.ts",
      "createExport": "createBreadcrumb",
      "coreProps": [
        {
          "name": "separator",
          "type": "string",
          "default": "/",
          "description": "separator"
        },
        {
          "name": "separatorIcon",
          "type": "string | Record<string, any> | (...args: any[]) => any",
          "description": "separatorIcon"
        }
      ],
      "features": {}
    },
    {
      "name": "BreadcrumbItem",
      "module": "packages/ui-kit/src/components/breadcrumb/core.ts",
      "createExport": "createBreadcrumbItem",
      "coreProps": [
        {
          "name": "to",
          "type": "string | Record<string, any>",
          "default": "",
          "description": "to"
        },
        {
          "name": "replace",
          "type": "boolean",
          "description": "replace"
        }
      ],
      "features": {}
    }
  ]
}
