import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Pagination } from '@ui-kit-full'

async function setup(props: Record<string, unknown> = {}) {
  const wrapper = mount(Pagination, {
    props: { total: 95, currentPage: 1, pageSize: 10, ...props },
    attachTo: document.body
  })
  await nextTick()
  return wrapper
}

function pagers(wrapper: Awaited<ReturnType<typeof setup>>) {
  return wrapper.findAll('.ui-pagination__pager')
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Pagination', () => {
  it('渲染上一页、页码与下一页', async () => {
    const wrapper = await setup({ currentPage: 5 })
    expect(wrapper.classes()).toEqual(['ui-pagination'])
    expect(wrapper.findAll('button')).toHaveLength(9)
    expect(pagers(wrapper).map((item) => item.text())).toEqual(['1', '2', '3', '4', '5', '10'])
    expect(pagers(wrapper)[4].classes()).toContain('is-active')
    expect(pagers(wrapper)[4].attributes('aria-current')).toBe('page')
    expect(wrapper.find('.ui-pagination__prev').attributes('aria-label')).toBe('Previous page')
    expect(wrapper.find('.ui-pagination__next').attributes('aria-label')).toBe('Next page')
  })

  it('pagerCount 触发省略号收拢', async () => {
    const wrapper = await setup({ currentPage: 5, pagerCount: 5 })
    expect(pagers(wrapper).map((item) => item.text())).toEqual(['1', '5', '10'])
    expect(wrapper.findAll('.ui-pagination__more').map((item) => item.text())).toEqual(['•••', '•••'])
    expect(wrapper.findAll('.ui-pagination__more').map((item) => item.attributes('aria-label'))).toEqual([
      'Previous pages',
      'Next pages'
    ])
  })

  it('页总数由 total 与 pageSize 推导', async () => {
    expect(pagers(await setup()).map((item) => item.text())).toEqual(['1', '2', '3', '4', '5', '10'])
    expect(pagers(await setup({ total: 30 })).map((item) => item.text())).toEqual(['1', '2', '3'])
  })

  it('窗口随当前页左右移动', async () => {
    expect(pagers(await setup({ currentPage: 1 })).map((item) => item.text())).toEqual(['1', '2', '3', '4', '5', '10'])
    expect(pagers(await setup({ currentPage: 8 })).map((item) => item.text())).toEqual(['1', '6', '7', '8', '9', '10'])
  })

  it('pageCount 可直接指定页数', async () => {
    const wrapper = await setup({ total: undefined, pageCount: 7, currentPage: 7 })
    expect(pagers(wrapper).map((item) => item.text())).toEqual(['1', '2', '3', '4', '5', '6', '7'])
    expect(pagers(wrapper)[6].classes()).toContain('is-active')
  })

  it('点击页码抛出 update:currentPage 与 current-change', async () => {
    const wrapper = await setup({ currentPage: 2 })
    await pagers(wrapper)[3].trigger('click')
    expect(wrapper.emitted('update:currentPage')?.[0]).toEqual([4])
    expect(wrapper.emitted('current-change')?.[0]).toEqual([4])
  })

  it('当前页重复点击不抛事件', async () => {
    const wrapper = await setup({ currentPage: 2 })
    await pagers(wrapper)[1].trigger('click')
    expect(wrapper.emitted('current-change')).toBeUndefined()
  })

  it('上一页下一页抛事件并带页码', async () => {
    const wrapper = await setup({ currentPage: 5 })
    await wrapper.find('.ui-pagination__prev').trigger('click')
    await wrapper.find('.ui-pagination__next').trigger('click')
    expect(wrapper.emitted('update:currentPage')).toEqual([[4], [6]])
    expect(wrapper.emitted('prev-click')?.[0]).toEqual([4])
    expect(wrapper.emitted('next-click')?.[0]).toEqual([6])
  })

  it('首页禁用上一页、末页禁用下一页', async () => {
    const first = await setup({ currentPage: 1 })
    expect(first.find('.ui-pagination__prev').attributes('disabled')).toBe('')
    expect(first.find('.ui-pagination__next').attributes('disabled')).toBeUndefined()
    await first.find('.ui-pagination__prev').trigger('click')
    expect(first.emitted('current-change')).toBeUndefined()

    const last = await setup({ currentPage: 10 })
    expect(last.find('.ui-pagination__next').attributes('disabled')).toBe('')
    await last.find('.ui-pagination__next').trigger('click')
    expect(last.emitted('current-change')).toBeUndefined()
  })

  it('点击省略号按窗口跳转', async () => {
    const wrapper = await setup({ currentPage: 5, pagerCount: 5 })
    await wrapper.findAll('.ui-pagination__more')[0].trigger('click')
    expect(wrapper.emitted('update:currentPage')?.[0]).toEqual([2])
    const right = await setup({ currentPage: 5, pagerCount: 5 })
    await right.findAll('.ui-pagination__more')[1].trigger('click')
    expect(right.emitted('update:currentPage')?.[0]).toEqual([8])
  })

  it('hideOnSinglePage 只留空容器', async () => {
    const wrapper = await setup({ total: 5, hideOnSinglePage: true })
    expect(wrapper.find('.ui-pagination__prev').exists()).toBe(false)
    expect(wrapper.text()).toBe('')
    expect((await setup({ total: 5, hideOnSinglePage: false })).find('.ui-pagination__prev').exists()).toBe(true)
  })

  it('background 与 size 映射类名', async () => {
    expect((await setup({ background: true, size: 'large' })).classes()).toEqual([
      'ui-pagination',
      'ui-pagination--size-large',
      'ui-pagination--background'
    ])
    expect((await setup({ size: 'small' })).classes()).toContain('ui-pagination--size-small')
  })

  it('disabled 整体禁用', async () => {
    const wrapper = await setup({ currentPage: 3, disabled: true })
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.findAll('button').every((item) => item.attributes('disabled') !== undefined)).toBe(true)
    await pagers(wrapper)[0].trigger('click')
    await wrapper.find('.ui-pagination__next').trigger('click')
    expect(wrapper.emitted('current-change')).toBeUndefined()
  })

  it('layout 渲染条数选择、跳页与总数', async () => {
    const wrapper = await setup({ layout: 'sizes, prev, pager, next, jumper, total', pageSizes: [10, 20, 50] })
    expect(wrapper.find('.ui-pagination__sizes').exists()).toBe(true)
    expect(wrapper.findAll('.ui-pagination__sizes-select option').map((item) => item.text())).toEqual([
      '10 条/页',
      '20 条/页',
      '50 条/页'
    ])
    expect(wrapper.find('.ui-pagination__total').text()).toBe('共 95 条')
    expect(wrapper.find('.ui-pagination__jump').text()).toContain('前往')
    expect(wrapper.find('.ui-pagination__jump-input').attributes('inputmode')).toBe('numeric')
  })

  it('切换每页条数抛出 update:pageSize 与 size-change', async () => {
    const wrapper = await setup({ layout: 'sizes', pageSizes: [10, 20] })
    await wrapper.find('.ui-pagination__sizes-select').setValue('20')
    expect(wrapper.emitted('update:pageSize')?.[0]).toEqual([20])
    expect(wrapper.emitted('size-change')?.[0]).toEqual([20])
  })

  it('跳页输入回车确认后抛事件', async () => {
    const wrapper = await setup({ layout: 'jumper', currentPage: 1 })
    const input = wrapper.find('.ui-pagination__jump-input')
    await input.setValue('4')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:currentPage')?.[0]).toEqual([4])
    expect(wrapper.emitted('current-change')?.[0]).toEqual([4])
  })

  it('跳页输入失焦同样提交', async () => {
    const wrapper = await setup({ layout: 'jumper', currentPage: 1 })
    const input = wrapper.find('.ui-pagination__jump-input')
    await input.setValue('6')
    await input.trigger('blur')
    expect(wrapper.emitted('update:currentPage')?.[0]).toEqual([6])
  })

  it('跳页越界夹取到首末页，非法值忽略', async () => {
    const over = await setup({ layout: 'jumper', currentPage: 1 })
    await over.find('.ui-pagination__jump-input').setValue('99')
    await over.find('.ui-pagination__jump-input').trigger('keydown', { key: 'Enter' })
    expect(over.emitted('update:currentPage')?.[0]).toEqual([10])

    const under = await setup({ layout: 'jumper', currentPage: 3 })
    await under.find('.ui-pagination__jump-input').setValue('0')
    await under.find('.ui-pagination__jump-input').trigger('keydown', { key: 'Enter' })
    expect(under.emitted('update:currentPage')?.[0]).toEqual([1])

    const nan = await setup({ layout: 'jumper', currentPage: 3 })
    await nan.find('.ui-pagination__jump-input').setValue('abc')
    await nan.find('.ui-pagination__jump-input').trigger('keydown', { key: 'Enter' })
    expect(nan.emitted('update:currentPage')).toBeUndefined()

    const decimal = await setup({ layout: 'jumper', currentPage: 1 })
    await decimal.find('.ui-pagination__jump-input').setValue('5.7')
    await decimal.find('.ui-pagination__jump-input').trigger('keydown', { key: 'Enter' })
    expect(decimal.emitted('update:currentPage')?.[0]).toEqual([5])
  })

  it('prevText / nextText 用文案替换图标', async () => {
    const wrapper = await setup({ currentPage: 1, prevText: '上一页', nextText: '下一页' })
    expect(wrapper.find('.ui-pagination__prev').text()).toBe('上一页')
    expect(wrapper.find('.ui-pagination__next').text()).toBe('下一页')
    expect(wrapper.find('.ui-pagination__prev').find('.ui-icon').exists()).toBe(false)
  })

  it('prevText 存在时禁用态仍保留 disabled 属性', async () => {
    const wrapper = await setup({ currentPage: 1, prevText: '上一页' })
    expect(wrapper.find('.ui-pagination__prev').attributes('disabled')).toBe('')
  })

  it('pagerCount 偶数自动校正为奇数窗口', async () => {
    const wrapper = await setup({ currentPage: 5, pagerCount: 6 })
    expect(pagers(wrapper).map((item) => item.text())).toEqual(['1', '5', '10'])
  })

  it('pageCount 小于窗口时铺满页码', async () => {
    const wrapper = await setup({ total: undefined, pageCount: 3 })
    expect(pagers(wrapper).map((item) => item.text())).toEqual(['1', '2', '3'])
    expect(wrapper.findAll('.ui-pagination__more')).toHaveLength(0)
  })

  it('外部 currentPage 变化同步高亮', async () => {
    const wrapper = await setup({ currentPage: 1 })
    await wrapper.setProps({ currentPage: 3 })
    await nextTick()
    expect(pagers(wrapper)[2].classes()).toContain('is-active')
  })
})
