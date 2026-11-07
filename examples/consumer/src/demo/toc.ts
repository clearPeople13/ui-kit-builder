import { reactive } from 'vue'

export interface TocItem {
  id: string
  title: string
  /** 子级条目缩进显示 */
  level?: number
}

interface TocState {
  title: string
  items: TocItem[]
}

/**
 * 页面级目录（右侧锚点）的共享状态。
 * 由当前挂载的页面（总览页 / 组件示例页）写入，右侧 PageAnchor 组件读取并做滚动联动。
 * 两个页面互斥挂载，切换时由新页面立即覆盖，无需手动清理。
 */
export const tocState = reactive<TocState>({
  title: '',
  items: []
})

export function setToc(title: string, items: TocItem[]): void {
  tocState.title = title
  tocState.items = items
}
