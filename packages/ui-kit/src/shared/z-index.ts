const BASE_Z_INDEX = 2000

let currentZIndex = BASE_Z_INDEX

export const DEFAULT_Z_INDEX = BASE_Z_INDEX

export function nextZIndex(): number {
  currentZIndex += 1
  return currentZIndex
}

export function resetZIndex(base = BASE_Z_INDEX): void {
  currentZIndex = base
}

export function resolveZIndex(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
