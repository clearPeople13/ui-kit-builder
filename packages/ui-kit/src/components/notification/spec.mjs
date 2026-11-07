export default {
  id: 'notification',
  title: 'Notification 通知',
  description: '对齐主流组件库的 Notification，基础 props 与可选特性拆分。',
  order: 10,
  exports: [
    {
      name: 'Notification',
      module: 'packages/ui-kit/src/components/notification/core.ts',
      createExport: 'createNotification',
      coreProps: [
        {
          name: 'modelValue',
          type: 'boolean',
          default: true,
          description: '可见性受控值，点击关闭抛 update:modelValue(false)'
        },
        {
          name: 'type',
          type: 'string',
          default: '',
          description: 'type'
        },
        {
          name: 'id',
          type: 'string',
          default: '',
          description: 'id'
        },
        {
          name: 'message',
          type: 'string | Record<string, any> | (...args: any[]) => any',
          default: '',
          description: 'message'
        },
        {
          name: 'onClick',
          type: '(...args: any[]) => any',
          description: 'onClick'
        },
        {
          name: 'position',
          type: 'string',
          default: 'top-right',
          description: 'position'
        },
        {
          name: 'title',
          type: 'string',
          default: '',
          description: 'title'
        },
        {
          name: 'zIndex',
          type: 'number',
          description: 'zIndex'
        }
      ],
      features: {
        'notification.icons': {
          title: '图标',
          description: '图标：icon',
          module: 'packages/ui-kit/src/components/notification/features/icons/index.ts',
          exportName: 'notificationIconsFeature',
          requires: [],
          props: [
            {
              name: 'icon',
              type: 'string | Record<string, any> | (...args: any[]) => any'
            }
          ]
        },
        'notification.closable': {
          title: '可关闭',
          description: '可关闭：showClose、closeIcon',
          module: 'packages/ui-kit/src/components/notification/features/closable/index.ts',
          exportName: 'notificationClosableFeature',
          requires: [],
          props: [
            {
              name: 'showClose',
              type: 'boolean',
              default: true
            },
            {
              name: 'closeIcon',
              type: 'string | Record<string, any> | (...args: any[]) => any',
              default: {
                name: 'Close',
                __name: 'close'
              }
            }
          ]
        },
        'notification.popper': {
          title: '边缘偏移',
          description: '边缘偏移：offset',
          module: 'packages/ui-kit/src/components/notification/features/popper/index.ts',
          exportName: 'notificationPopperFeature',
          requires: [],
          props: [
            {
              name: 'offset',
              type: 'number',
              default: 0
            }
          ]
        }
      }
    }
  ]
}
