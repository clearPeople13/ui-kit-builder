import { ref, watch, type Ref } from 'vue'
import { createHighlighter, type HighlighterCore } from 'shiki'

let highlighterPromise: Promise<HighlighterCore> | null = null

function loadHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light'],
      langs: ['vue']
    })
  }
  return highlighterPromise
}

export function useVueHighlight(source: Ref<string>): Ref<string> {
  const html = ref('')
  watch(
    source,
    async (code) => {
      const highlighter = await loadHighlighter()
      if (code === source.value) {
        html.value = highlighter.codeToHtml(code, { lang: 'vue', theme: 'github-light' })
      }
    },
    { immediate: true }
  )
  return html
}
