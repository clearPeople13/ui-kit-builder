import { ref, watch, type Ref } from 'vue'
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'
import githubLight from '@shikijs/themes/github-light'
import vue from '@shikijs/langs/vue'
import wasm from 'shiki/wasm'

let highlighterPromise: Promise<HighlighterCore> | null = null

// 超过该长度的源码不做语法高亮：shiki 是同步解析，数 MB 的文本会阻塞主线程数秒，
// 降级成纯文本展示，至少保证点击示例不卡顿
const MAX_HIGHLIGHT_CHARS = 300_000

function loadHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [githubLight],
      langs: [vue],
      engine: createOnigurumaEngine(wasm)
    })
  }
  return highlighterPromise
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function useVueHighlight(source: Ref<string>, enabled?: Ref<boolean>): Ref<string> {
  const html = ref('')
  let version = 0

  async function render(code: string): Promise<void> {
    const current = ++version
    if (!code) {
      html.value = ''
      return
    }
    if (code.length > MAX_HIGHLIGHT_CHARS) {
      html.value = `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`
      return
    }
    const highlighter = await loadHighlighter()
    if (current !== version) {
      return
    }
    html.value = highlighter.codeToHtml(code, { lang: 'vue', theme: 'github-light' })
  }

  watch(
    source,
    (code) => {
      // 代码面板收起时不做高亮：大示例源码可达数 MB，白跑一次高亮就会卡住交互
      if (enabled && !enabled.value) {
        version += 1
        html.value = ''
        return
      }
      void render(code)
    },
    { immediate: true }
  )

  if (enabled) {
    watch(enabled, (active) => {
      if (active) {
        void render(source.value)
        return
      }
      version += 1
      html.value = ''
    })
  }

  return html
}
