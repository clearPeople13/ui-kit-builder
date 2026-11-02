export default {
  "id": "calendar",
  "title": "Calendar 日历",
  "description": "对齐主流组件库的 Calendar，基础 props 与可选特性拆分。",
  "order": 10,
  "exports": [
    {
      "name": "Calendar",
      "module": "packages/ui-kit/src/components/calendar/core.ts",
      "createExport": "createCalendar",
      "coreProps": [
        {
          "name": "modelValue",
          "type": "any",
          "description": "modelValue"
        },
        {
          "name": "controllerType",
          "type": "string",
          "default": "button",
          "description": "controllerType"
        }
      ],
      "features": {
        "calendar.range": {
          "title": "范围选择",
          "description": "范围选择：range",
          "module": "packages/ui-kit/src/components/calendar/features/range/index.ts",
          "exportName": "calendarRangeFeature",
          "requires": [],
          "props": [
            {
              "name": "range",
              "type": "any[]"
            }
          ]
        }
      }
    }
  ]
}
