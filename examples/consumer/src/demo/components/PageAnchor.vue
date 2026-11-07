<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { tocState } from '../toc'

const activeId = ref('')

let observer: IntersectionObserver | null = null

function disconnect(): void {
  observer?.disconnect()
  observer = null
}

function buildObserver(): void {
  disconnect()
  const items = tocState.items
  if (!items.length) {
    activeId.value = ''
    return
  }
  activeId.value = items[0].id
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible.length) {
        activeId.value = visible[0].target.id
      }
    },
    // 激活带落在顶栏下方约 30% 视口高度内：顶部 72px 避开 sticky 顶栏，底部 -65% 让"当前区块"更早切换
    { rootMargin: '-72px 0px -65% 0px', threshold: 0 }
  )
  for (const item of items) {
    const el = document.getElementById(item.id)
    if (el) {
      observer.observe(el)
    }
  }
}

function scrollTo(id: string): void {
  const el = document.getElementById(id)
  if (!el) {
    return
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  activeId.value = id
}

watch(() => tocState.items, buildObserver, { flush: 'post' })

onBeforeUnmount(disconnect)
</script>

<template>
  <nav v-if="tocState.items.length" class="pg-anchor" aria-label="本页目录">
    <p class="pg-anchor__title">{{ tocState.title || '本页目录' }}</p>
    <ul class="pg-anchor__list">
      <li
        v-for="item in tocState.items"
        :key="item.id"
        :class="[
          'pg-anchor__item',
          {
            'is-active': activeId === item.id,
            'is-sub': item.level === 1,
            'is-sub2': item.level === 2
          }
        ]"
      >
        <a :href="`#${item.id}`" @click.prevent="scrollTo(item.id)">{{ item.title }}</a>
      </li>
    </ul>
  </nav>
</template>
