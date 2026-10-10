import {
  DEFAULT_END,
  DEFAULT_START,
  DIJKSTRA_DATA,
  NODE_POSITIONS,
  createDijkstraSteps,
  toEdges,
} from '@/algorithms/dijkstra'
import type { Graph } from '@/types/graph'
import type { BarState } from '@/types/sort'

// 首頁與演算法庫卡片預覽共用的資料

/** 排序卡片：由矮到高的長條 */
export const PREVIEW_BARS = [14, 20, 26, 32, 38, 44, 50, 56]

/** 第 6 根長條用指定的狀態色，其他維持預設 */
export function createPreviewStates(state: BarState) {
  return PREVIEW_BARS.map<BarState>((_, i) => (i === 5 ? state : 'default'))
}

/** Dijkstra 卡片：和工作台同一張圖，顯示最後找出的最短路徑 */
export function createDijkstraPreview() {
  const graph: Graph = { nodes: NODE_POSITIONS, edges: toEdges(DIJKSTRA_DATA) }
  const result = createDijkstraSteps(DIJKSTRA_DATA, DEFAULT_START, DEFAULT_END).at(-1)!
  return { graph, nodeStates: result.nodeStates, edgeStates: result.edgeStates }
}
