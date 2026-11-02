import { onBeforeUnmount, watch } from 'vue'

let lockCount = 0
let savedHtmlOverflow = ''
let savedBodyOverflow = ''
let savedBodyPaddingRight = ''

function scrollbarWidth(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 0
  }
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth)
}

function acquire(): void {
  if (typeof document === 'undefined') {
    return
  }
  lockCount += 1
  if (lockCount > 1) {
    return
  }
  const html = document.documentElement
  const body = document.body
  savedHtmlOverflow = html.style.overflow
  savedBodyOverflow = body.style.overflow
  savedBodyPaddingRight = body.style.paddingRight
  const width = scrollbarWidth()
  html.style.overflow = 'hidden'
  body.style.overflow = 'hidden'
  if (width > 0) {
    const paddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0
    body.style.paddingRight = `${paddingRight + width}px`
  }
}

function release(): void {
  if (typeof document === 'undefined' || lockCount === 0) {
    return
  }
  lockCount -= 1
  if (lockCount > 0) {
    return
  }
  document.documentElement.style.overflow = savedHtmlOverflow
  document.body.style.overflow = savedBodyOverflow
  document.body.style.paddingRight = savedBodyPaddingRight
}

export function useScrollLock(active: () => boolean): void {
  let locked = false

  function sync(value: boolean): void {
    if (value === locked) {
      return
    }
    locked = value
    if (value) {
      acquire()
    } else {
      release()
    }
  }

  watch(active, sync, { immediate: true })

  onBeforeUnmount(() => {
    if (locked) {
      locked = false
      release()
    }
  })
}
