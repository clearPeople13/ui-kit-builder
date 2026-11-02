export default {
  "id": "upload",
  "title": "Upload 上传",
  "description": "对齐主流组件库的 Upload，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Upload",
      "module": "packages/ui-kit/src/components/upload/core.ts",
      "createExport": "createUpload",
      "coreProps": [
        {
          "name": "fileList",
          "type": "any[]",
          "description": "fileList"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "default": null,
          "description": "disabled"
        },
        {
          "name": "listType",
          "type": "string",
          "default": "text",
          "description": "listType"
        },
        {
          "name": "limit",
          "type": "number",
          "description": "limit"
        },
        {
          "name": "drag",
          "type": "boolean",
          "description": "拖拽上传"
        },
        {
          "name": "showFileList",
          "type": "boolean",
          "default": true,
          "description": "是否显示文件列表"
        },
        {
          "name": "accept",
          "type": "string",
          "default": "",
          "description": "接受的文件类型"
        },
        {
          "name": "beforeUpload",
          "type": "(...args: any[]) => any",
          "description": "上传前钩子，返回 false 阻止上传"
        },
        {
          "name": "onRemove",
          "type": "(...args: any[]) => any",
          "description": "文件移除回调"
        },
        {
          "name": "onExceed",
          "type": "(...args: any[]) => any",
          "description": "超出 limit 回调"
        },
        {
          "name": "beforeRemove",
          "type": "(...args: any[]) => any",
          "description": "移除前钩子，返回 false 阻止移除"
        }
      ],
      "features": {
        "upload.multiple": {
          "title": "多选",
          "description": "多选：multiple",
          "module": "packages/ui-kit/src/components/upload/features/multiple/index.ts",
          "exportName": "uploadMultipleFeature",
          "requires": [],
          "props": [
            {
              "name": "multiple",
              "type": "boolean"
            }
          ]
        },
        "upload.methods": {
          "title": "实例方法",
          "description": "通过 ref 清空文件列表：clearFiles。",
          "module": "packages/ui-kit/src/components/upload/features/methods/index.ts",
          "exportName": "uploadMethodsFeature",
          "requires": [],
          "props": [],
          "methods": [
            {
              "name": "clearFiles",
              "signature": "() => void",
              "description": "清空文件列表"
            }
          ]
        }
      }
    }
  ]
}
