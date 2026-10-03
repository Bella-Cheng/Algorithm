/**
 * 節點的顯示狀態
 * - path（lime 實心）：已確認，且在目前焦點的最短路徑上
 * - visited（cyan 實心）：已確認最短距離的節點
 * - frontier（amber 外框）：已有暫定距離、尚未確認的節點
 * - comparing（pink 外框）：正在檢查、但距離沒有更新的鄰居
 * - default：尚未抵達（距離為 ∞）
 */
export type NodeState = 'default' | 'frontier' | 'visited' | 'path' | 'comparing'

/**
 * 邊的顯示狀態
 * - path（lime 粗線）：目前焦點的最短路徑
 * - comparing（pink）：正在鬆弛（relax）的邊
 * - default：一般的邊
 */
export type EdgeState = 'default' | 'path' | 'comparing'

export interface GraphNode {
  id: string
  /** SVG 座標 */
  x: number
  y: number
}

/** 無向加權邊 */
export interface GraphEdge {
  from: string
  to: string
  weight: number
}

export interface Graph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

/** Dijkstra 動畫的單一步驟快照 */
export interface GraphStep<Phase extends string = string> {
  /** 每個節點目前的距離，尚未抵達為 null（畫面顯示 ∞） */
  dist: Record<string, number | null>
  nodeStates: Record<string, NodeState>
  /** key 為 edgeKey(from, to) */
  edgeStates: Record<string, EdgeState>
  /** 已確認的節點數 */
  visitedCount: number
  /** 這一步的主角節點，顯示在卡片標籤上 */
  focus: string
  /** 程式碼面板要高亮的行號（從 1 開始） */
  highlightLines: number[]
  phase: Phase
  /** 左側 CURRENT STEP 卡片的簡短說明 */
  summary: string
  /** 視覺化區塊下方的詳細說明 */
  detail: string
}

/** 無向邊的 key，兩端點排序後組合，確保 A-B 與 B-A 是同一條 */
export function edgeKey(a: string, b: string) {
  return a < b ? `${a}-${b}` : `${b}-${a}`
}
