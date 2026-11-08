export default {
  id: 'timeline',
  title: 'Timeline 时间线',
  description: '对齐主流组件库的 Timeline / TimelineItem，基础 props 与可选特性拆分。',
  order: 10,
  exports: [
    {
      name: 'Timeline',
      module: 'packages/ui-kit/src/components/timeline/core.ts',
      createExport: 'createTimeline',
      coreProps: [
        {
          name: 'mode',
          type: 'string',
          default: 'start',
          description: '节点排布：start 单侧 / center 居中 / alternate 左右交替'
        },
        {
          name: 'reverse',
          type: 'boolean',
          description: '倒序渲染节点'
        }
      ],
      slots: [
        {
          name: 'default',
          scope: null,
          fallback: false,
          description: '时间线子项容器，渲染在根节点内（无默认内容）'
        }
      ],
      features: {}
    },
    {
      name: 'TimelineItem',
      module: 'packages/ui-kit/src/components/timeline/core.ts',
      createExport: 'createTimelineItem',
      coreProps: [
        {
          name: 'type',
          type: 'string',
          default: '',
          description: 'type'
        },
        {
          name: 'size',
          type: 'string',
          default: 'normal',
          description: 'size'
        },
        {
          name: 'timestamp',
          type: 'string',
          default: '',
          description: 'timestamp'
        },
        {
          name: 'hideTimestamp',
          type: 'boolean',
          description: 'hideTimestamp'
        },
        {
          name: 'timestampPosition',
          type: 'string',
          default: 'bottom',
          description: '时间戳位置：top 在上方 / bottom 在下方'
        },
        {
          name: 'color',
          type: 'string',
          default: '',
          description: 'color'
        },
        {
          name: 'hollow',
          type: 'boolean',
          description: '空心节点'
        }
      ],
      slots: [
        {
          name: 'default',
          scope: null,
          fallback: false,
          description: '节点正文内容，渲染在 ui-timeline-item__content（无默认内容）'
        }
      ],
      features: {}
    }
  ]
}
