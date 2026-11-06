import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Upload } from '@ui-kit-full'

const mounted: ReturnType<typeof mount>[] = []

function file(name: string, type = ''): File {
  return new File(['x'], name, { type: type || guessType(name) })
}

function guessType(name: string): string {
  if (name.endsWith('.png')) {
    return 'image/png'
  }
  if (name.endsWith('.jpg')) {
    return 'image/jpeg'
  }
  return 'text/plain'
}

function mountUpload(props: Record<string, any> = {}, slots: Record<string, () => unknown> = {}) {
  const wrapper = mount(Upload, { props: { ...props }, slots, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

function fileInput(wrapper: ReturnType<typeof mountUpload>) {
  return wrapper.find('input[type="file"]')
}

async function pickFiles(wrapper: ReturnType<typeof mountUpload>, files: File[]) {
  Object.defineProperty(fileInput(wrapper).element, 'files', { value: files, configurable: true })
  await fileInput(wrapper).trigger('change')
}

async function dropFiles(wrapper: ReturnType<typeof mountUpload>, files: File[]) {
  const event = new Event('drop', { bubbles: true, cancelable: true }) as Event & { dataTransfer: unknown }
  event.dataTransfer = { files }
  wrapper.find('.ui-upload__trigger').element.dispatchEvent(event)
  await nextTick()
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()!.unmount()
  }
  document.body.innerHTML = ''
})

describe('Upload 上传', () => {
  it('文本列表渲染文件名与状态文案', async () => {
    const wrapper = mountUpload({
      fileList: [
        { name: '说明.txt', status: 'success', uid: 1 },
        { name: '截图.png', status: 'uploading', uid: 2 },
        { name: '附件.pdf', status: 'fail', uid: 3 }
      ]
    })
    await nextTick()
    expect(wrapper.classes()).toContain('ui-upload')
    expect(wrapper.classes()).toContain('is-text')
    const list = wrapper.find('.ui-upload__list')
    expect(list.attributes('role')).toBe('list')
    const rows = wrapper.findAll('.ui-upload__item')
    expect(rows.map((row) => row.classes())).toEqual([
      ['ui-upload__item', 'is-success'],
      ['ui-upload__item', 'is-uploading'],
      ['ui-upload__item', 'is-fail']
    ])
    expect(rows.map((row) => row.find('.ui-upload__file-name').text())).toEqual(['说明.txt', '截图.png', '附件.pdf'])
    // success 不显示状态文案，其余按状态映射
    expect(rows[0].find('.ui-upload__status').exists()).toBe(false)
    expect(rows[1].find('.ui-upload__status').text()).toBe('上传中')
    expect(rows[2].find('.ui-upload__status').text()).toBe('失败')
    expect(wrapper.findAll('.ui-upload__remove')).toHaveLength(3)
    expect(wrapper.findAll('.ui-upload__thumb')).toHaveLength(0)
  })

  it('未识别的状态原样展示，缺少状态则无节点', async () => {
    const wrapper = mountUpload({ fileList: [{ name: 'a.txt', status: 'queued' }, { name: 'b.txt' }] })
    await nextTick()
    expect(wrapper.findAll('.ui-upload__item')[0].classes()).toEqual(['ui-upload__item', 'is-queued'])
    expect(wrapper.findAll('.ui-upload__item')[0].find('.ui-upload__status').text()).toBe('queued')
    expect(wrapper.findAll('.ui-upload__item')[1].classes()).toEqual(['ui-upload__item'])
    expect(wrapper.findAll('.ui-upload__item')[1].find('.ui-upload__status').exists()).toBe(false)
  })

  it('缺省结构只有触发区与选择文案', async () => {
    const wrapper = mountUpload()
    await nextTick()
    expect(wrapper.findAll('.ui-upload__item')).toHaveLength(0)
    expect(wrapper.find('.ui-upload__list').exists()).toBe(false)
    expect(wrapper.find('.ui-upload__hint').text()).toBe('选择文件')
    expect(fileInput(wrapper).attributes('type')).toBe('file')
  })

  it('showFileList 为 false 时隐藏已有列表', async () => {
    const wrapper = mountUpload({ fileList: [{ name: 'a.txt' }], showFileList: false })
    await nextTick()
    expect(wrapper.find('.ui-upload__list').exists()).toBe(false)
  })

  it('picture-card 用遮罩显示状态并给出加号触发区', async () => {
    const wrapper = mountUpload({
      listType: 'picture-card',
      fileList: [{ name: '头像.jpg', status: 'fail', url: 'http://cdn/a.jpg' }]
    })
    await nextTick()
    expect(wrapper.classes()).toContain('is-picture-card')
    expect(wrapper.find('.ui-upload__list').classes()).toEqual(['ui-upload__list', 'is-picture-card'])
    expect(wrapper.find('.ui-upload__item img').attributes('src')).toBe('http://cdn/a.jpg')
    expect(wrapper.find('.ui-upload__mask').text()).toBe('失败')
    expect(wrapper.find('.ui-upload__status').exists()).toBe(false)
    expect(wrapper.find('.ui-upload__trigger-icon').exists()).toBe(true)
    expect(wrapper.find('.ui-upload__hint').text()).toBe('上传')
  })

  it('无地址的图片项用扩展名占位，未知扩展名回退 FILE', async () => {
    const wrapper = mountUpload({
      listType: 'picture',
      fileList: [{ name: 'photo.jpg' }, { name: 'archive' }]
    })
    await nextTick()
    expect(wrapper.findAll('.ui-upload__thumb')[0].text()).toBe('JPG')
    expect(wrapper.findAll('.ui-upload__thumb')[1].text()).toBe('FILE')
    expect(wrapper.findAll('img')).toHaveLength(0)
    expect(wrapper.findAll('.ui-upload__status')).toHaveLength(0)
    expect(wrapper.findAll('.ui-upload__item').map((row) => row.classes())).toEqual([
      ['ui-upload__item'],
      ['ui-upload__item']
    ])
  })

  it('选择文件后抛出 change 与 update:file-list', async () => {
    const wrapper = mountUpload({ fileList: [{ name: '已有.txt' }] })
    await pickFiles(wrapper, [file('新增.png')])
    expect(wrapper.emitted('change')).toEqual([[[expect.objectContaining({ name: '新增.png' })]]])
    const next = wrapper.emitted('update:file-list')?.[0]?.[0] as unknown[]
    expect(next).toHaveLength(2)
    expect((next[1] as File).name).toBe('新增.png')
  })

  it('未选择文件时不产生事件', async () => {
    const wrapper = mountUpload()
    await pickFiles(wrapper, [])
    expect(wrapper.emitted()).not.toHaveProperty('change')
    expect(wrapper.emitted()).not.toHaveProperty('update:file-list')
  })

  it('accept 按扩展名、MIME 前缀与完整类型过滤', async () => {
    const byExtension = mountUpload({ accept: '.png' })
    await pickFiles(byExtension, [file('a.png'), file('b.txt')])
    expect(byExtension.emitted('change')?.[0]?.[0]).toHaveLength(1)

    byExtension.unmount()
    document.body.innerHTML = ''
    const byWildcard = mountUpload({ accept: 'image/*' })
    await pickFiles(byWildcard, [file('a.png'), file('b.txt')])
    expect(byWildcard.emitted('change')?.[0]?.[0]).toHaveLength(1)

    byWildcard.unmount()
    document.body.innerHTML = ''
    const byExact = mountUpload({ accept: 'text/plain' })
    await pickFiles(byExact, [file('a.txt'), file('b.png')])
    expect(byExact.emitted('change')?.[0]?.[0]).toHaveLength(1)
    expect((byExact.emitted('change')?.[0]?.[0] as File[])[0].name).toBe('a.txt')
  })

  it('beforeUpload 返回 false 的文件被丢弃', async () => {
    const seen: string[] = []
    const wrapper = mountUpload({
      beforeUpload: (item: File) => {
        seen.push(item.name)
        return item.name !== 'skip.txt'
      }
    })
    await pickFiles(wrapper, [file('keep.txt'), file('skip.txt')])
    expect(seen).toEqual(['keep.txt', 'skip.txt'])
    expect(wrapper.emitted('change')?.[0]?.[0]).toHaveLength(1)
    expect(wrapper.emitted('update:file-list')?.[0]?.[0]).toHaveLength(1)
  })

  it('超出 limit 时回调 onExceed 并只保留可用名额', async () => {
    const calls: unknown[][] = []
    const wrapper = mountUpload({
      limit: 2,
      fileList: [{ name: '已有.txt' }],
      onExceed: (picked: unknown[], current: unknown[]) => calls.push([picked, current])
    })
    await pickFiles(wrapper, [file('a.txt'), file('b.txt'), file('c.txt')])
    expect(calls).toHaveLength(1)
    expect((calls[0][0] as File[]).map((item) => item.name)).toEqual(['a.txt', 'b.txt', 'c.txt'])
    expect((calls[0][1] as unknown[]).map((item) => (item as { name: string }).name)).toEqual(['已有.txt'])
    expect(wrapper.emitted('update:file-list')?.[0]?.[0]).toHaveLength(2)
  })

  it('未超限不触发 onExceed', async () => {
    const wrapper = mountUpload({ limit: 3, onExceed: () => undefined })
    await pickFiles(wrapper, [file('a.txt')])
    expect(wrapper.emitted()).not.toHaveProperty('onExceed')
    expect(wrapper.emitted('update:file-list')?.[0]?.[0]).toHaveLength(1)
  })

  it('移除文件抛出剩余列表并回调 onRemove', async () => {
    const removed: unknown[][] = []
    const wrapper = mountUpload({
      fileList: [
        { name: 'a.txt', uid: 1 },
        { name: 'b.txt', uid: 2 }
      ],
      onRemove: (item: unknown, list: unknown[]) => removed.push([item, list])
    })
    await wrapper.findAll('.ui-upload__remove')[0].trigger('click')
    expect(wrapper.emitted('update:file-list')?.[0]?.[0]).toEqual([{ name: 'b.txt', uid: 2 }])
    expect((removed[0][0] as { name: string }).name).toBe('a.txt')
    expect(removed[0][1]).toHaveLength(2)
  })

  it('beforeRemove 返回 false 时不移除', async () => {
    const wrapper = mountUpload({
      fileList: [{ name: 'a.txt' }],
      beforeRemove: () => false
    })
    await wrapper.find('.ui-upload__remove').trigger('click')
    expect(wrapper.emitted()).not.toHaveProperty('update:file-list')
  })

  it('禁用态屏蔽选择与移除', async () => {
    const wrapper = mountUpload({ fileList: [{ name: 'a.txt' }], disabled: true })
    expect(fileInput(wrapper).attributes('disabled')).toBeDefined()
    expect(wrapper.find('.ui-upload__remove').attributes('disabled')).toBeDefined()
    await pickFiles(wrapper, [file('b.txt')])
    await wrapper.find('.ui-upload__remove').trigger('click')
    expect(wrapper.emitted()).not.toHaveProperty('change')
    expect(wrapper.emitted()).not.toHaveProperty('update:file-list')
  })

  it('multiple 决定文件输入是否允许多选', async () => {
    const single = mountUpload()
    expect(fileInput(single).element.hasAttribute('multiple')).toBe(false)
    single.unmount()
    document.body.innerHTML = ''
    const many = mountUpload({ multiple: true })
    expect(fileInput(many).attributes('multiple')).toBeDefined()
  })

  it('拖拽模式给出拖拽提示并在进入时高亮', async () => {
    const wrapper = mountUpload({ drag: true })
    await nextTick()
    expect(wrapper.classes()).toContain('is-drag')
    expect(wrapper.find('.ui-upload__trigger').classes()).toContain('is-drag')
    expect(wrapper.find('.ui-upload__hint').text()).toBe('将文件拖到此处，或点击上传')
    await wrapper.find('.ui-upload__trigger').trigger('dragenter')
    expect(wrapper.find('.ui-upload__trigger').classes()).toContain('is-dragover')
    await wrapper.find('.ui-upload__trigger').trigger('dragleave')
    expect(wrapper.find('.ui-upload__trigger').classes()).not.toContain('is-dragover')
  })

  it('拖入文件后按 drag 开关决定是否接收', async () => {
    const droppable = mountUpload({ drag: true })
    await dropFiles(droppable, [file('拖入.png')])
    expect(droppable.emitted('update:file-list')?.[0]?.[0]).toHaveLength(1)
    expect(droppable.find('.ui-upload__trigger').classes()).not.toContain('is-dragover')

    droppable.unmount()
    document.body.innerHTML = ''
    const plain = mountUpload()
    await dropFiles(plain, [file('拖入.png')])
    expect(plain.emitted()).not.toHaveProperty('update:file-list')
  })

  it('自定义默认插槽替换触发内容', async () => {
    const wrapper = mountUpload({}, { default: () => h('span', { class: 'mine' }, '自己选') })
    await nextTick()
    expect(wrapper.find('.mine').exists()).toBe(true)
    expect(wrapper.find('.ui-upload__hint').exists()).toBe(false)
  })
})
