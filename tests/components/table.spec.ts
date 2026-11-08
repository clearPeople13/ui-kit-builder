import { mount } from '@vue/test-utils'
import { h, nextTick, toRaw } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Table, TableColumn, ConfigProvider } from '@ui-kit-full'

const rows = [
  { id: 1, name: 'A', age: 20 },
  { id: 2, name: 'B', age: 21 },
  { id: 3, name: 'C', age: 22 }
]

/** findAll('input') 拿到的是 VueNode<Element>，勾选态要按 HTMLInputElement 读 */
function inputOf(node: { element: Element }): HTMLInputElement {
  return node.element as HTMLInputElement
}

/** emitted 的载荷是 unknown，排序事件按声明的形状收一次再断言字段 */
function sortEvents(wrapper: { emitted: (name: string) => unknown[][] | undefined }) {
  return (wrapper.emitted('sort-change') ?? []) as Array<[{ prop?: string; order?: string; sorts?: unknown[] }]>
}

function columns(
  list: Record<string, any>[] = [
    { prop: 'id', label: 'ID', width: 60 },
    { prop: 'name', label: '名称', minWidth: 80, sortable: true },
    { prop: 'age', label: '年龄', align: 'right' }
  ]
) {
  return () => list.map((column) => h(TableColumn, column))
}

function mountTable(props: Record<string, any> = {}, slots: Record<string, any> = { default: columns() }) {
  const wrapper = mount(Table, { props: { data: rows, ...props }, slots, attachTo: document.body })
  return wrapper
}

function bodyTexts(wrapper: ReturnType<typeof mountTable>) {
  return wrapper.findAll('tbody tr').map((row) => row.text())
}

async function setup(props: Record<string, any> = {}, slots?: Record<string, any>) {
  const wrapper = mountTable(props, slots)
  await nextTick()
  return wrapper
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Table', () => {
  it('渲染表头与数据行', async () => {
    const wrapper = await setup()
    expect(wrapper.classes()).toContain('ui-table')
    expect(wrapper.findAll('thead th').map((item) => item.text())).toEqual(['ID', '名称', '年龄'])
    expect(wrapper.findAll('tbody td')).toHaveLength(9)
    expect(bodyTexts(wrapper)).toEqual(['1A20', '2B21', '3C22'])
    expect(wrapper.findAll('.ui-table__header-view colgroup col').map((item) => item.attributes('style'))).toEqual([
      'width: 60px;',
      'width: 80px;',
      'width: 80px;'
    ])
  })

  it('stripe / border / size 映射类名', async () => {
    expect((await setup({ stripe: true, border: true, size: 'small' })).classes()).toEqual(
      expect.arrayContaining(['ui-table', 'ui-table--striped', 'ui-table--bordered', 'ui-table--size-small'])
    )
  })

  it('showHeader=false 不渲染表头', async () => {
    const wrapper = await setup({ showHeader: false })
    expect(wrapper.findAll('th')).toHaveLength(0)
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
  })

  it('height / maxHeight 写入根容器样式', async () => {
    const wrapper = await setup({ height: 120, maxHeight: 200 })
    expect(wrapper.attributes('style')).toContain('height: 120px')
    expect(wrapper.attributes('style')).toContain('max-height: 200px')
    expect((await setup()).attributes('style') ?? '').not.toContain('height')
  })

  it('空数据渲染占位行并跨满列', async () => {
    const wrapper = await setup({ data: [], emptyText: '没有数据' })
    const emptyCell = wrapper.find('.ui-table__empty-row td')
    expect(emptyCell.text()).toBe('没有数据')
    expect(emptyCell.attributes('colspan')).toBe('3')
    expect((await setup({ data: [] })).find('.ui-table__empty-row td').text()).toBe('暂无数据')
  })

  it('align / headerAlign / className 落到单元格', async () => {
    const wrapper = await setup(
      {},
      {
        default: () => [
          h(TableColumn, {
            prop: 'name',
            label: '名称',
            align: 'center',
            headerAlign: 'right',
            className: 'cell-a',
            labelClassName: 'head-a'
          })
        ]
      }
    )
    expect(wrapper.find('th').classes()).toEqual(expect.arrayContaining(['is-right', 'head-a']))
    expect(wrapper.find('tbody td').classes()).toEqual(expect.arrayContaining(['is-center', 'cell-a']))
  })

  it('fixed 列带冻结类与偏移样式', async () => {
    const wrapper = await setup(
      {},
      {
        default: () => [
          h(TableColumn, { prop: 'id', label: 'ID', fixed: 'left', width: 50 }),
          h(TableColumn, { prop: 'name', label: '名称', width: 70 }),
          h(TableColumn, { prop: 'age', label: '年龄', fixed: 'right', width: 60 })
        ]
      }
    )
    const heads = wrapper.findAll('th')
    expect(heads[0].classes()).toEqual(expect.arrayContaining(['is-fixed-left', 'is-fixed-left-edge']))
    expect(heads[2].classes()).toEqual(expect.arrayContaining(['is-fixed-right', 'is-fixed-right-edge']))
    expect(heads[2].attributes('style')).toContain('right: 0px')
    expect(heads[0].attributes('style')).toContain('left: 0px')
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['has-fixed-left', 'has-fixed-right']))
  })

  it('formatter / index / 单元格插槽', async () => {
    const wrapper = await setup(
      {},
      {
        default: () => [
          h(TableColumn, { type: 'index', label: '#', index: 7, width: 40 }),
          h(TableColumn, { prop: 'age', label: '年龄', formatter: (row: any) => `${row.age} 岁` }),
          h(TableColumn, { label: '操作' }, { default: (scope: any) => `op:${scope.row.id}` })
        ]
      }
    )
    expect(wrapper.findAll('tbody tr')[0].text()).toBe('720 岁op:1')
    expect(wrapper.findAll('tbody tr')[2].text()).toBe('922 岁op:3')
  })

  it('rowClassName 与 rowStyle 作用到行', async () => {
    const wrapper = await setup({
      rowClassName: ({ rowIndex }: any) => (rowIndex === 0 ? 'first-row' : ''),
      rowStyle: ({ rowIndex }: any) => (rowIndex === 0 ? { color: 'red' } : {})
    })
    expect(wrapper.findAll('tbody tr')[0].classes()).toContain('first-row')
    expect(wrapper.findAll('tbody tr')[0].attributes('style')).toContain('color: red')
    expect(wrapper.findAll('tbody tr')[1].attributes('style') ?? '').not.toContain('color')
  })

  it('点击可排序表头循环升序、降序、取消', async () => {
    const wrapper = await setup({ data: [...rows].reverse() })
    const head = wrapper.findAll('th')[1]
    expect(head.classes()).toContain('is-sortable')
    expect(head.find('.ui-table__sort-caret').exists()).toBe(true)
    await head.trigger('click')
    expect(sortEvents(wrapper)[0]?.[0]?.prop).toBe('name')
    expect(sortEvents(wrapper)[0]?.[0]?.order).toBe('ascending')
    expect(bodyTexts(wrapper)).toEqual(['1A20', '2B21', '3C22'])
    await head.trigger('click')
    expect(sortEvents(wrapper)[1]?.[0]?.order).toBe('descending')
    expect(wrapper.find('.ui-table__sort-caret').classes()).toContain('is-descending')
    await head.trigger('click')
    expect(sortEvents(wrapper)[2]?.[0]?.order).toBe('')
    expect(bodyTexts(wrapper)).toEqual(['3C22', '2B21', '1A20'])
  })

  it('sortOrders 限定排序循环', async () => {
    const wrapper = await setup(
      {},
      { default: () => [h(TableColumn, { prop: 'age', label: '年龄', sortable: true, sortOrders: ['descending'] })] }
    )
    const head = wrapper.find('th')
    await head.trigger('click')
    expect(sortEvents(wrapper)[0]?.[0]?.order).toBe('descending')
    await head.trigger('click')
    expect(sortEvents(wrapper)[1]?.[0]?.order).toBe('descending')
    expect(bodyTexts(wrapper)).toEqual(['22', '21', '20'])
  })

  it('defaultSort 初始即排序', async () => {
    const wrapper = await setup(
      { defaultSort: { prop: 'age', order: 'descending' } },
      { default: () => h(TableColumn, { prop: 'age', label: '年龄', sortable: true }) }
    )
    expect(bodyTexts(wrapper)).toEqual(['22', '21', '20'])
    expect(wrapper.find('.ui-table__sort-caret').classes()).toContain('is-descending')
  })

  it('sortMethod 自定义比较', async () => {
    const wrapper = await setup(
      {},
      {
        default: () => [
          h(TableColumn, {
            prop: 'age',
            label: '年龄',
            sortable: true,
            sortMethod: (a: any, b: any) => String(a.age).length - String(b.age).length || a.age - b.age
          })
        ]
      }
    )
    await wrapper.find('th').trigger('click')
    expect(bodyTexts(wrapper)).toEqual(['20', '21', '22'])
  })

  it('multiSort 叠加多列排序', async () => {
    const data = [
      { id: 1, name: 'B', age: 2 },
      { id: 2, name: 'A', age: 2 },
      { id: 3, name: 'A', age: 1 }
    ]
    const wrapper = await setup(
      { data, multiSort: true },
      {
        default: () => [
          h(TableColumn, { prop: 'name', label: '名称', sortable: true }),
          h(TableColumn, { prop: 'age', label: '年龄', sortable: true })
        ]
      }
    )
    const heads = wrapper.findAll('th')
    await heads[1].trigger('click')
    await heads[0].trigger('click')
    const change = sortEvents(wrapper).slice(-1)[0]?.[0]
    expect(change?.sorts).toEqual([
      { prop: 'age', order: 'ascending' },
      { prop: 'name', order: 'ascending' }
    ])
    expect(wrapper.findAll('tbody tr').map((row) => row.text())).toEqual(['A1', 'A2', 'B2'])
  })

  it('highlightCurrentRow 配合 rowKey 标记当前行', async () => {
    const wrapper = await setup({ highlightCurrentRow: true, rowKey: 'id', stripe: true })
    await wrapper.findAll('tbody tr')[1].trigger('click')
    await nextTick()
    expect(wrapper.findAll('tbody tr').map((row) => row.classes())).toEqual([[], ['is-striped', 'current-row'], []])
    expect(wrapper.emitted('current-change')?.[0]).toEqual([rows[1]])
    expect(wrapper.emitted('row-click')?.[0]).toEqual([rows[1]])
  })

  it('选择列：单行勾选与表头全选', async () => {
    const wrapper = await setup(
      { rowKey: 'id' },
      {
        default: () => [
          h(TableColumn, { type: 'selection', width: 40 }),
          ...columns([{ prop: 'name', label: '名称' }])()
        ]
      }
    )
    expect(wrapper.findAll('thead th')[0].find('.ui-table__checkbox input').exists()).toBe(true)
    await wrapper.findAll('tbody input')[0].setValue(true)
    await nextTick()
    expect(wrapper.emitted('selection-change')?.[0]).toEqual([[rows[0]]])
    await wrapper.find('thead input').setValue(true)
    await nextTick()
    expect(wrapper.emitted('selection-change')?.slice(-1)?.[0]).toEqual([rows])
    expect(wrapper.findAll('tbody input').map((item) => inputOf(item).checked)).toEqual([true, true, true])
    await wrapper.find('thead input').setValue(false)
    await nextTick()
    expect(wrapper.findAll('tbody input').map((item) => inputOf(item).checked)).toEqual([false, false, false])
  })

  it('selectable=false 的行不可勾选', async () => {
    const wrapper = await setup(
      { rowKey: 'id' },
      {
        default: () => [
          h(TableColumn, { type: 'selection', selectable: (row: any) => row.id !== 2, width: 40 }),
          ...columns([{ prop: 'name', label: '名称' }])()
        ]
      }
    )
    expect(wrapper.findAll('tbody input')[1].attributes('disabled')).toBeDefined()
    await wrapper.find('thead input').setValue(true)
    await nextTick()
    expect(wrapper.emitted('selection-change')?.slice(-1)?.[0]).toEqual([[rows[0], rows[2]]])
  })

  it('选择相关对外接口', async () => {
    const wrapper = await setup(
      { rowKey: 'id' },
      { default: () => [h(TableColumn, { type: 'selection' }), ...columns([{ prop: 'name', label: '名称' }])()] }
    )
    const api = wrapper.vm as unknown as Record<string, any>
    api.toggleAllSelection()
    await nextTick()
    expect(api.getSelectionRows()).toHaveLength(3)
    api.clearSelection()
    await nextTick()
    expect(wrapper.emitted('selection-change')?.slice(-1)?.[0]).toEqual([[]])
    expect(wrapper.findAll('tbody input').map((item) => inputOf(item).checked)).toEqual([false, false, false])
  })

  // 原缺陷 F-8：toggleRowSelection 用 indexOf 定位行，调用方持有原始对象而渲染行是
  // reactive 代理（数据源本身是 reactive 时必然如此）时 index < 0，既不勾选也不抛事件；
  // 现在先按 toRaw 身份匹配，再按 rowKey 兜底，并统一用列表内的那一份继续走勾选
  it('toggleRowSelection 同时接受原始对象与渲染代理', async () => {
    const wrapper = await setup(
      { rowKey: 'id' },
      { default: () => [h(TableColumn, { type: 'selection' }), ...columns([{ prop: 'name', label: '名称' }])()] }
    )
    const api = wrapper.vm as unknown as Record<string, any>
    const proxyRow = (wrapper.vm.$props as unknown as { data: Array<Record<string, any>> }).data[0]
    expect(proxyRow).not.toBe(rows[0])

    api.toggleRowSelection(rows[0], true)
    await nextTick()
    expect(api.getSelectionRows()).toHaveLength(1)
    expect(toRaw(api.getSelectionRows()[0])).toBe(rows[0])
    expect(wrapper.emitted('selection-change')).toHaveLength(1)
    expect(inputOf(wrapper.findAll('tbody input')[0]).checked).toBe(true)

    // 代理引用命中同一行，不产生第二条选择
    api.toggleRowSelection(proxyRow, true)
    await nextTick()
    expect(api.getSelectionRows()).toHaveLength(1)

    api.toggleRowSelection(rows[0], false)
    await nextTick()
    expect(api.getSelectionRows()).toHaveLength(0)
  })

  it('toggleRowSelection 按 rowKey 兜底匹配同键的拷贝对象', async () => {
    const wrapper = await setup(
      { rowKey: 'id' },
      { default: () => [h(TableColumn, { type: 'selection' }), ...columns([{ prop: 'name', label: '名称' }])()] }
    )
    const api = wrapper.vm as unknown as Record<string, any>
    api.toggleRowSelection({ id: 3, name: 'C', age: 22 }, true)
    await nextTick()
    expect(api.getSelectionRows()).toHaveLength(1)
    expect(toRaw(api.getSelectionRows()[0])).toBe(rows[2])
  })

  it('toggleRowSelection 对无法定位的行保持不勾选且不抛事件', async () => {
    const wrapper = await setup(
      { rowKey: 'id' },
      { default: () => [h(TableColumn, { type: 'selection' }), ...columns([{ prop: 'name', label: '名称' }])()] }
    )
    const api = wrapper.vm as unknown as Record<string, any>
    api.toggleRowSelection({ id: 99 }, true)
    await nextTick()
    expect(api.getSelectionRows()).toHaveLength(0)
    expect(wrapper.emitted('selection-change')).toBeUndefined()
  })

  it('树形数据可展开并抛出 tree-expand', async () => {
    const treeData = [
      { id: 1, name: '父', children: [{ id: 11, name: '子' }] },
      { id: 2, name: '叶' }
    ]
    const wrapper = await setup(
      { data: treeData },
      { default: () => h(TableColumn, { prop: 'name', label: '名称', width: 120 }) }
    )
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.findAll('.ui-table__tree-toggle')[0].attributes('aria-expanded')).toBe('false')
    await wrapper.findAll('.ui-table__tree-toggle')[0].trigger('click')
    await nextTick()
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    expect(wrapper.emitted('tree-expand')?.[0]).toEqual([{ row: treeData[0], expanded: true }])
    expect(wrapper.findAll('tbody tr')[1].find('.ui-table__tree-leaf').exists()).toBe(true)
    expect(wrapper.findAll('tbody tr')[1].find('.ui-table__tree-indent').attributes('style')).toContain('width: 16px')
  })

  it('defaultExpandAll 直接展开全部树形子行', async () => {
    const wrapper = await setup({
      data: [{ id: 1, name: '父', children: [{ id: 11, name: '子' }] }],
      defaultExpandAll: true
    })
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.findAll('.ui-table__tree-toggle')[0].classes()).toContain('is-expanded')
  })

  it('treeProps 自定义子级字段', async () => {
    const wrapper = await setup({
      data: [{ id: 1, name: '父', rows: [{ id: 11, name: '子' }] }],
      treeProps: { children: 'rows' },
      defaultExpandAll: true
    })
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
  })

  it('spanMethod 合并单元格', async () => {
    const wrapper = await setup({
      spanMethod: ({ rowIndex, columnIndex }: any) =>
        rowIndex === 0 && columnIndex === 0 ? { rowspan: 2, colspan: 1 } : { rowspan: 1, colspan: 1 }
    })
    const first = wrapper.findAll('tbody tr')[0].findAll('td')[0]
    expect(first.attributes('rowspan')).toBe('2')
    expect(wrapper.findAll('tbody tr')[1].findAll('td')).toHaveLength(2)
  })

  it('合计行默认求和与 summaryMethod 自定义', async () => {
    const wrapper = await setup({ showSummary: true, sumText: '小计' })
    const cells = wrapper.findAll('.ui-table__footer td')
    expect(cells.map((cell) => cell.text())).toEqual(['小计', '63'])
    expect(cells[0].attributes('colspan')).toBe('2')

    const custom = await setup({
      showSummary: true,
      summaryMethod: ({ columns: cols }: any) => cols.map((_: any, index: number) => `C${index}`)
    })
    expect(custom.findAll('.ui-table__footer td').map((cell) => cell.text())).toEqual(['C0', 'C1', 'C2'])
  })

  it('loading 遮罩与文案', async () => {
    const wrapper = await setup({ loading: true })
    expect(wrapper.classes()).toContain('is-loading')
    expect(wrapper.find('.ui-table__loading').exists()).toBe(true)
    expect(wrapper.find('.ui-table__loading-spinner').exists()).toBe(true)
    expect(wrapper.find('.ui-table__loading-text').exists()).toBe(false)
    expect((await setup({ loading: true, loadingText: '请稍候' })).find('.ui-table__loading-text').text()).toBe(
      '请稍候'
    )
    expect((await setup()).find('.ui-table__loading').exists()).toBe(false)
  })

  it('virtual 仅渲染可视行', async () => {
    const big = Array.from({ length: 300 }, (_, index) => ({ id: index, name: `N${index}`, age: index }))
    const wrapper = await setup(
      { data: big, virtual: true, height: 100 },
      { default: () => h(TableColumn, { prop: 'name', label: '名称', width: 80 }) }
    )
    expect(wrapper.findAll('tbody tr').length).toBeLessThan(40)
    expect(wrapper.findAll('tbody tr').length).toBeGreaterThan(1)
  })

  it('showOverflowTooltip 写入 title 与类名', async () => {
    const wrapper = await setup({ showOverflowTooltip: true })
    expect(wrapper.classes()).toContain('ui-table--overflow-tooltip')
    expect(wrapper.findAll('tbody tr')[0].findAll('td')[1].attributes('title')).toBe('A')
    const off = await setup({})
    expect(off.findAll('tbody tr')[0].findAll('td')[1].attributes('title')).toBeUndefined()
  })

  it('tableLayout 影响内层表格布局', async () => {
    const wrapper = await setup({ tableLayout: 'auto' })
    expect(wrapper.find('table.ui-table__inner').attributes('style')).toContain('table-layout: auto')
    expect((await setup()).find('table.ui-table__inner').attributes('style')).toContain('table-layout: fixed')
  })

  it('fit=false 时不铺满宽度', async () => {
    const wrapper = await setup({ fit: false })
    expect(wrapper.find('table.ui-table__inner').attributes('style')).toContain('width: 220px')
  })

  it('文案走 ConfigProvider 注入的 locale，未注入的键回退中文', async () => {
    const expandColumns = () => [h(TableColumn, { type: 'expand' }), h(TableColumn, { prop: 'name', label: '名称' })]
    const wrapper = mount(ConfigProvider, {
      props: { locale: { table: { emptyText: 'Nothing', collapseRow: 'Collapse' } } },
      slots: { default: () => h(Table, { data: rows }, { default: expandColumns }) },
      attachTo: document.body
    })
    await nextTick()
    // expandRow 未注入 → 默认中文；collapseRow 注入 → 生效
    expect(wrapper.find('.ui-table__expand').attributes('aria-label')).toBe('展开行')
    await wrapper.find('.ui-table__expand').trigger('click')
    expect(wrapper.find('.ui-table__expand').attributes('aria-label')).toBe('Collapse')

    const empty = mount(ConfigProvider, {
      props: { locale: { table: { emptyText: 'Nothing' } } },
      slots: { default: () => h(Table, { data: [] }, { default: expandColumns }) },
      attachTo: document.body
    })
    await nextTick()
    expect(empty.find('.ui-table__empty-row td').text()).toBe('Nothing')
  })
})

describe('Table slot 契约', () => {
  it('empty 插槽替换空数据文案，未提供时回退 emptyText', async () => {
    const withSlot = await setup(
      { data: [] },
      { default: columns(), empty: () => h('div', { class: 'empty-slot' }, '自定义空态') }
    )
    expect(withSlot.find('.ui-table__empty-row .empty-slot').text()).toBe('自定义空态')

    const fallback = await setup({ data: [], emptyText: '没有数据' }, { default: columns() })
    expect(fallback.find('.ui-table__empty-row td').text()).toBe('没有数据')
  })

  it('TableColumn default / header 插槽拿到作用域并替换单元格内容', async () => {
    const slotColumns = () => [
      h(
        TableColumn,
        { prop: 'name', label: '名称' },
        {
          default: ({ row, $index, rowIndex, columnIndex }: Record<string, any>) =>
            h('span', { class: 'cell-slot' }, `${row.name}-${$index}-${rowIndex}-${columnIndex}`),
          header: ({ column, $index }: Record<string, any>) =>
            h('span', { class: 'header-slot' }, `${column.label}-${$index}`)
        }
      ),
      h(TableColumn, { prop: 'age', label: '年龄' })
    ]
    const wrapper = await setup({}, { default: slotColumns })
    expect(wrapper.find('thead .header-slot').text()).toBe('名称-0')
    expect(wrapper.findAll('tbody .cell-slot').map((item) => item.text())).toEqual(['A-0-0-0', 'B-1-1-0', 'C-2-2-0'])
    // 未提供插槽的列回退 label 与行字段原值
    expect(wrapper.findAll('thead th')[1].text()).toBe('年龄')
    expect(wrapper.findAll('tbody tr')[0].findAll('td')[1].text()).toBe('20')
  })
})
