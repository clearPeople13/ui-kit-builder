<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { File, Repl, useStore, useVueImportMap, type Store } from '@vue/repl'
import CodeMirrorEditor from '@vue/repl/codemirror-editor'
import '@vue/repl/style.css'

defineOptions({ name: 'OnlinePlayground' })

const props = defineProps<{
  packageId: string
  exportName: string
  snippet: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { importMap: builtinImportMap } = useVueImportMap({
  runtimeDev: () => '/node_modules/vue/dist/vue.esm-browser.js',
  runtimeProd: () => '/node_modules/vue/dist/vue.esm-browser.prod.js'
})

const loading = ref(true)
const errorText = ref('')
const styleUrl = ref('')
const replStore = shallowRef<Store>()

const previewOptions = computed(() => ({
  headHTML: styleUrl.value ? `<link rel="stylesheet" href="${styleUrl.value}">` : ''
}))

function buildSeed(exportName: string, snippet: string): string {
  if (snippet.includes('<script')) {
    return snippet
  }
  const code = snippet || `<${exportName} />`
  return [
    '<script setup>',
    `import { ${exportName} } from '@demo/ui-kit'`,
    '</' + 'script>',
    '',
    '<template>',
    `  ${code.replaceAll('\n', '\n  ')}`,
    '</template>',
    ''
  ].join('\n')
}

onMounted(async () => {
  try {
    const response = await fetch('/api/packages', { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`包信息接口异常（HTTP ${response.status}）`)
    }
    const data = await response.json()
    const list = Array.isArray(data?.packages) ? data.packages : []
    const item = list.find((entry: { id?: string }) => entry.id === props.packageId)
    if (!item?.moduleUrl) {
      throw new Error(`当前包 ${props.packageId} 没有可用的运行时模块`)
    }
    styleUrl.value = item.styleUrl ?? ''
    const created = useStore({ builtinImportMap })
    // /@fs 模块被 Vite 重写裸导入，iframe 内必须用它（与 import map 解析出的 vue 保持同一副本），
    // 否则套件 vnode 与渲染器分属两个 Vue 副本，ref owner 上下文丢失
    const iframeModuleUrl = item.rawModuleUrl ?? item.moduleUrl
    created.setImportMap({ imports: { '@demo/ui-kit': iframeModuleUrl } }, true)
    created.addFile(new File('src/App.vue', buildSeed(props.exportName, props.snippet)))
    replStore.value = created
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : String(error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <teleport to="body">
    <div class="pg-repl-overlay" @click.self="emit('close')">
      <div class="pg-repl" role="dialog" aria-modal="true" :aria-label="`在线调试 ${exportName}`">
        <header class="pg-repl__bar">
          <strong class="pg-repl__title">在线调试 · {{ exportName }}</strong>
          <span class="pg-repl__pkg">{{ packageId }}</span>
          <span class="pg-repl__flex" />
          <button class="pg-repl__close" type="button" @click="emit('close')">关闭</button>
        </header>
        <div class="pg-repl__body">
          <p v-if="loading" class="pg-repl__state">加载调试器…</p>
          <p v-else-if="errorText" class="pg-repl__state">无法打开在线调试：{{ errorText }}</p>
          <Repl
            v-else-if="replStore"
            :store="replStore"
            :editor="CodeMirrorEditor"
            :ssr="false"
            :show-import-map="false"
            :show-ts-config="false"
            :show-compile-output="false"
            :preview-options="previewOptions"
            layout="horizontal"
            class="pg-repl__inner"
          />
        </div>
      </div>
    </div>
  </teleport>
</template>
