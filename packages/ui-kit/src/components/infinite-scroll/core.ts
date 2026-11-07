import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import './core.css'

const infiniteScrollBaseProps = {
  distance: { type: Number, default: 0 },
  delay: { type: Number, default: 200 },
  immediate: { type: Boolean, default: true },
  disabled: Boolean,
  loading: Boolean
}

interface ScrollMetrics {
  scrollTop: number
  clientHeight: number
  scrollHeight: number
}

const SCROLL_OVERFLOW = ['auto', 'scroll', 'overlay']

function isScrollable(element: HTMLElement) {
  const { overflowY } = window.getComputedStyle(element)
  return SCROLL_OVERFLOW.includes(overflowY) && element.scrollHeight > element.clientHeight + 1
}

function getDocumentMetrics(): ScrollMetrics | null {
  const doc = document.documentElement
  const clientHeight = window.innerHeight
  const scrollHeight = Math.max(doc.scrollHeight, document.body.scrollHeight)
  if (scrollHeight <= clientHeight + 1) {
    return null
  }
  return { scrollTop: doc.scrollTop || document.body.scrollTop, clientHeight, scrollHeight }
}

export function createInfiniteScroll(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiInfiniteScroll',
      baseClass: 'ui-infinite-scroll',
      props: infiniteScrollBaseProps,
      emits: ['load'],
      classes: (props) => [props.disabled ? 'is-disabled' : '', props.loading ? 'is-loading' : ''],
      setup(props, { emit, root }) {
        const rootRef = root
        let timer: ReturnType<typeof setTimeout> | null = null
        let armed = true
        let lastHeight = 0

        function getMetrics(): ScrollMetrics | null {
          const host = rootRef.value
          if (!host) {
            return getDocumentMetrics()
          }
          if (isScrollable(host)) {
            return { scrollTop: host.scrollTop, clientHeight: host.clientHeight, scrollHeight: host.scrollHeight }
          }
          let parent = host.parentElement
          while (parent && parent !== document.body && parent !== document.documentElement) {
            if (isScrollable(parent)) {
              return {
                scrollTop: parent.scrollTop,
                clientHeight: parent.clientHeight,
                scrollHeight: parent.scrollHeight
              }
            }
            parent = parent.parentElement
          }
          return getDocumentMetrics()
        }

        function isNearBottom() {
          const metrics = getMetrics()
          if (!metrics) {
            return true
          }
          return metrics.scrollTop + metrics.clientHeight + props.distance >= metrics.scrollHeight
        }

        function clearTimer() {
          if (timer) {
            clearTimeout(timer)
            timer = null
          }
        }

        function check() {
          if (props.disabled) {
            return
          }
          if (!isNearBottom()) {
            armed = true
            return
          }
          if (!armed) {
            return
          }
          if (props.loading) {
            armed = false
            return
          }
          armed = false
          lastHeight = getMetrics()?.scrollHeight ?? 0
          emit('load')
        }

        function handleScroll() {
          clearTimer()
          timer = setTimeout(() => {
            timer = null
            check()
          }, props.delay)
        }

        function onResize() {
          handleScroll()
        }

        // 加载结束后内容可能仍未撑满容器，此时不会再有滚动事件，需要主动复检；
        // 仅在内容真的变长后重新授权，避免没有新数据的接口被反复触发
        watch(
          () => props.loading,
          (value, previous) => {
            if (previous && !value) {
              nextTick(() => {
                if ((getMetrics()?.scrollHeight ?? 0) > lastHeight) {
                  armed = true
                }
                check()
              })
            }
          }
        )

        onMounted(() => {
          window.addEventListener('scroll', handleScroll, true)
          window.addEventListener('resize', onResize)
          if (props.immediate) {
            nextTick(check)
          }
        })

        onBeforeUnmount(() => {
          clearTimer()
          window.removeEventListener('scroll', handleScroll, true)
          window.removeEventListener('resize', onResize)
        })

        return { check }
      },
      expose: ({ state }) => ({ check: state.check })
    },
    features
  )
}
