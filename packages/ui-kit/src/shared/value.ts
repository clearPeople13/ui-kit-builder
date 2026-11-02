export function sameValue(left: any, right: any): boolean {
  if (left === right) {
    return true
  }
  if (left && right && typeof left === 'object' && typeof right === 'object') {
    return JSON.stringify(left) === JSON.stringify(right)
  }
  return false
}
