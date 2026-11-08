const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

function isVisible(element: HTMLElement) {
  return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement
}

// dialog/drawer/message-box 的焦点闭环共用同一套可聚焦收集逻辑，口径与 focus-trap 保持一致
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => isVisible(element))
}
