import type { InjectionKey } from 'vue'

export type RowGutter = [number, number]

export const ROW_GUTTER: InjectionKey<() => RowGutter> = Symbol('ui-row-gutter')
