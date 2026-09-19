/** 長條圖的顯示狀態 */
export type BarState = 'default' | 'active' | 'comparing' | 'sorted'

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
