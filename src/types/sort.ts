import type { GraphLegendState } from '@/types/graph'

/**
 * 長條圖的顯示狀態
 * - active（lime）：正在處理的元素，快速排序中代表 pivot
 * - comparing（pink）：正在被比較的元素
 * - less（cyan）：比 pivot 小的元素
 * - greater（text muted）：比 pivot 大的元素
 * - sorted（cyan）：已排好或已固定在最終位置
 */
export type BarState = 'default' | 'active' | 'comparing' | 'less' | 'greater' | 'sorted'

/** 快速排序選擇基準值的位置 */
export type PivotStrategy = 'right' | 'left' | 'middle' | 'random'

/** 左側面板的顏色圖例（排序頁用 BarState，圖論頁用 GraphLegendState） */
export interface LegendItem {
  state: BarState | GraphLegendState
  label: string
}

/** 排序動畫的單一步驟快照 */
export interface SortStep<Phase extends string = string> {
  /** 這一步的陣列內容 */
  arr: number[]
  /** 每根長條的狀態，與 arr 一一對應 */
  barStates: BarState[]
  /** 程式碼面板要高亮的行號（從 1 開始） */
  highlightLines: number[]
  /** 目前階段，例如 compare、swap */
  phase: Phase
  /** 第幾輪 */
  pass: number
  /** 左側 CURRENT STEP 卡片的簡短說明 */
  summary: string
  /** 視覺化區塊下方的詳細說明 */
  detail: string
}
