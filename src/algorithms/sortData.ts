import type { SelectOption } from '@/types/select'

/** 排序頁「產生新資料」彈窗的設定 */
export interface SortDataSettings {
  /** 資料筆數 */
  count: number
  min: number
  max: number
}

export const DEFAULT_SORT_SETTINGS: SortDataSettings = { count: 8, min: 1, max: 99 }

const toOptions = (values: number[]): SelectOption<number>[] =>
  values.map((value) => ({ label: String(value), value }))

/** 建議 4–12 筆 */
export const COUNT_OPTIONS = toOptions(Array.from({ length: 9 }, (_, index) => index + 4))
/** 最小值與最大值的選項沒有重疊，值域至少 20 個數字，一定夠產生 12 筆不重複資料 */
export const MIN_OPTIONS = toOptions([1, 10, 20, 30, 40])
export const MAX_OPTIONS = toOptions([60, 70, 80, 90, 99])

export const SORT_DATA_HINT = '建議 4–12 筆、值域 1–99；系統會自動產生不重複資料。'

/** 在 [min, max] 之間產生 count 個不重複的整數 */
export function createUniqueArray({ count, min, max }: SortDataSettings): number[] {
  const pool = Array.from({ length: max - min + 1 }, (_, index) => min + index)
  // Fisher–Yates 洗牌後取前 count 個
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }
  return pool.slice(0, count)
}
