/**
 * 節點的填色（一個節點同時只會有一種）
 * - current（pink 實心）：目前正在處理的節點
 * - queued（muted 實心）：在 queue 裡等待處理
 * - visited（cyan 實心）：已確認最短距離
 * - path（lime 實心）：最後回推出來的最短路徑
 * - default：尚未抵達（距離為 ∞）
 *
 * 「正在被檢查的鄰居」是另外疊上的 amber 外框（GraphStep.checkingNode），可以和任何填色並存
 */
export type NodeState = 'default' | 'current' | 'queued' | 'visited' | 'path'

/** 圖例用：節點填色 + 檢查中的外框 */
export type GraphLegendState = NodeState | 'checking'

/**
 * 邊的顯示狀態
 * - checking（amber）：目前節點正在檢查的那條邊
 * - path（lime 粗線）：最後回推出來的最短路徑
 * - default：一般的邊
 */
export type EdgeState = 'default' | 'checking' | 'path'

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
  nodeStates: Record<string, NodeState>
  /** 正在被檢查的鄰居（畫 amber 外框），沒有時為 null */
  checkingNode: string | null
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
