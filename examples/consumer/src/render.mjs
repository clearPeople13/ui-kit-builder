import assert from 'node:assert/strict'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Button as CoreButton, Input as CoreInput } from '@demo/ui-kit-core'
import {
  Button as FullButton,
  Scrollbar,
  Table,
  TableColumn,
  CollapseTransition,
  FocusTrap,
  InfiniteScroll,
  RovingFocusGroup,
  RovingFocusItem,
  OnlyChild,
  Collection,
  CollectionItem,
  VirtualList
} from '@demo/ui-kit-full'

function render(component, props, slots) {
  return renderToString(createSSRApp({ render: () => h(component, props, slots) }))
}

for (const pkg of ['@demo/ui-kit-core', '@demo/ui-kit-branded', '@demo/ui-kit-full']) {
  assert.match(import.meta.resolve(`${pkg}/style.css`), /ui-kit\.css$/, `${pkg} 应导出 style.css`)
}

const core = await render(
  CoreButton,
  { type: 'primary', bgColor: '#3366ff', gradient: true },
  { default: () => 'Core' }
)
assert.match(core, /<button/)
assert.match(core, />Core</)
assert.match(core, /ui-button--primary/)
assert.doesNotMatch(core, /background-color/)
assert.doesNotMatch(core, /ui-button--bg-color/)
assert.doesNotMatch(core, /ui-button--gradient/)

const bgOnly = await render(FullButton, { bgColor: '#3366ff', autoContrast: true }, { default: () => 'BG' })
assert.match(bgOnly, /background-color:\s*#3366ff/i)
assert.match(bgOnly, /color:\s*#ffffff/i)
assert.match(bgOnly, /ui-button--bg-color/)

const full = await render(
  FullButton,
  {
    bgColor: '#3366ff',
    autoContrast: true,
    gradient: true,
    gradientAngle: 45,
    loading: true,
    round: true
  },
  { default: () => 'Full' }
)
assert.match(full, /linear-gradient\(45deg/)
assert.match(full, /ui-button--gradient/)
assert.match(full, /is-round/)
assert.match(full, /disabled/)

const input = await render(CoreInput, { modelValue: 'hello', placeholder: 'Name' })
assert.match(input, /class="[^"]*ui-input/)
assert.match(input, /<input[^>]*placeholder="Name"/)
assert.doesNotMatch(input, /ui-input--clearable/)

const scrollbar = await render(Scrollbar, { height: 120 }, { default: () => 'scroll-content' })
assert.match(scrollbar, /ui-scrollbar__wrap/)
assert.match(scrollbar, /ui-scrollbar__view/)
assert.match(scrollbar, /scroll-content/)

const table = await render(
  Table,
  {
    data: [
      { name: 'A', score: 90 },
      { name: 'B', score: 80 }
    ],
    border: true,
    stripe: true
  },
  {
    default: () => [
      h(TableColumn, { prop: 'name', label: 'Name' }),
      h(TableColumn, { prop: 'score', label: 'Score', align: 'right' })
    ]
  }
)
assert.match(table, /class="[^"]*ui-table/)
assert.match(table, /ui-table--bordered/)
assert.match(table, /ui-table--striped/)
assert.match(table, />Name</)
assert.match(table, />Score</)
assert.match(table, />A</)
assert.match(table, />90</)

const suite = await renderToString(
  createSSRApp({
    render: () =>
      h('div', [
        h(CollapseTransition, null, { default: () => h('section', { class: 'collapsible' }, 'collapsible') }),
        h(FocusTrap, { trapped: true }, { default: () => 'focus-trap' }),
        h(InfiniteScroll, { distance: 10 }, { default: () => 'infinite-scroll' }),
        h(
          RovingFocusGroup,
          { orientation: 'vertical' },
          {
            default: () => [
              h(RovingFocusItem, { tabStopId: 'a' }, { default: () => 'roving-a' }),
              h(RovingFocusItem, { tabStopId: 'b' }, { default: () => 'roving-b' })
            ]
          }
        ),
        h(OnlyChild, null, { default: () => h('span', { class: 'only-child' }, 'only-child') }),
        h(Collection, null, {
          default: () => h(CollectionItem, { item: { id: 1 } }, { default: () => 'collection-item' })
        }),
        h(
          VirtualList,
          {
            data: [
              { id: 1, name: 'virtual-a' },
              { id: 2, name: 'virtual-b' }
            ],
            height: 100,
            itemSize: 20,
            itemKey: 'id'
          },
          { default: ({ item }) => h('span', null, item.name) }
        )
      ])
  })
)
assert.match(suite, /collapsible/)
assert.match(suite, /ui-focus-trap/)
assert.match(suite, /ui-infinite-scroll/)
assert.match(suite, /ui-roving-focus-group/)
assert.match(suite, /ui-roving-focus-item/)
assert.match(suite, />only-child</)
assert.match(suite, /ui-collection__item/)
assert.match(suite, /collection-item/)
assert.match(suite, /ui-virtual-list__spacer/)
assert.match(suite, /virtual-a/)
assert.match(suite, /virtual-b/)

console.log('运行时校验通过: Button(core/full) / Input / Scrollbar / Table / 内部组件套件')
console.log(`core 渲染: ${core}`)
