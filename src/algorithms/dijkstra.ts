import { edgeKey } from '@/types/graph'
import type { EdgeState, GraphEdge, GraphNode, GraphStep, NodeState } from '@/types/graph'

/**
 * 無向圖的鄰接表：節點 → { 鄰居節點: 距離 }
 * 每條邊兩個方向都要寫，所以每個節點一定是 data 的 key
 */
export type DijkstraGraph = Record<string, Record<string, number>>

/** Distance Table 的一列 */
export interface TableNode {
  distance: number
  /** 最短路徑上的前一個節點，起點與尚未抵達的節點為 null */
  previous: string | null
}

/** 演算法執行中的狀態，onStep 收到的是同一份參考（不是複本） */
export interface DijkstraState {
  table: Map<string, TableNode>
  /** 已經處理完成的節點 */
  visited: Set<string>
  /** 等待處理的節點，距離一律從 table 讀，不另外存 */
  queue: Set<string>
}

/** 演算法每個關鍵時刻送出的事件，給動畫用 */
export type DijkstraEvent =
  | { type: 'start' }
  /** 從 queue 取出距離最小的節點 */
  | { type: 'visit'; node: string }
  /** 取出的是終點，提早結束 */
  | { type: 'found'; node: string }
  /** 鄰居已處理完成，跳過 */
  | { type: 'skip'; node: string; next: string }
  /** 檢查鄰居，updated 表示距離是否有變短 */
  | {
      type: 'relax'
      node: string
      next: string
      weight: number
      total: number
      oldDistance: number
      updated: boolean
    }

export interface DijkstraResult {
  table: Map<string, TableNode>
  /** 起點到終點的完整路徑，無法抵達時為空陣列 */
  route: string[]
  /** 起點到終點的最短距離，無法抵達時為 Infinity */
  distance: number
}

/**
 * Dijkstra 最短路徑：負責執行
 */
export function dijkstra(
  data: DijkstraGraph,
  startNode: string,
  endNode: string,
  onStep?: (event: DijkstraEvent, state: DijkstraState) => void,
): DijkstraResult {
  /** 記錄各節點目前的 Distance 與 Previous */
  const table = new Map<string, TableNode>()
  for (const node in data) {
    table.set(node, { distance: node === startNode ? 0 : Infinity, previous: null })
  }

  /** 已確認的節點 */
  const visited = new Set<string>()
  /** 起點不在圖裡時 queue 為空，直接回傳無法抵達 */
  const queue = new Set<string>(table.has(startNode) ? [startNode] : [])
  /** 當前的狀態 */
  const state: DijkstraState = { table, visited, queue }

  onStep?.({ type: 'start' }, state)

  /** 取得當前節點的距離 */
  const distanceOf = (node: string) => table.get(node)?.distance ?? Infinity

  while (queue.size > 0) {
    /** 找出 queue 中 Distance 最小的節點，同距離時取先加入的 */
    let node = ''
    for (const candidate of queue) {
      if (!node || distanceOf(candidate) < distanceOf(node)) node = candidate
    }
    queue.delete(node)
    visited.add(node)

    /** 最小的已經是終點，它的距離不會再變短 */
    if (node === endNode) {
      onStep?.({ type: 'found', node }, state)
      break
    }
    onStep?.({ type: 'visit', node }, state)

    const distance = distanceOf(node)
    for (const [next, weight] of Object.entries(data[node] ?? {})) {
      if (visited.has(next)) {
        onStep?.({ type: 'skip', node, next }, state)
        continue
      }

      /** 總和 = 當前節點 + 目前的鄰近節點權重 */
      const total = distance + weight
      /** 目前的鄰近節點距離 */
      const oldDistance = distanceOf(next)
      /** 距離是否比較小 (回傳 boolean ) */
      const updated = total < oldDistance

      /** 找到更短的路徑時，Distance 與 Previous 一起更新 */
      if (updated) {
        table.set(next, { distance: total, previous: node })
        queue.add(next)
      }
      onStep?.({ type: 'relax', node, next, weight, total, oldDistance, updated }, state)
    }
  }

  /** 從終點透過 Previous 一路回推到起點 */
  const route: string[] = []
  const distance = distanceOf(endNode)
  if (distance !== Infinity) {
    for (let current: string | null = endNode; current !== null; current = table.get(current)?.previous ?? null) {
      route.unshift(current)
    }
  }

  return { table, route, distance }
}

/**
 * 從鄰接表整理出不重複的邊清單，給畫面畫線用
 * 無向圖中 A: { B: 4 } 與 B: { A: 4 } 是同一條邊，只保留先出現的那筆
 */
export function toEdges(data: DijkstraGraph): GraphEdge[] {
  const edges: GraphEdge[] = []
  const seen = new Set<string>()
  for (const [from, neighbors] of Object.entries(data)) {
    for (const [to, weight] of Object.entries(neighbors)) {
      const key = edgeKey(from, to)
      if (seen.has(key)) continue
      seen.add(key)
      edges.push({ from, to, weight })
    }
  }
  return edges
}

// ---------------------------------------------------------------------------
// 以下為動畫用：預設圖、程式碼面板內容、步驟產生器
// ---------------------------------------------------------------------------

export type DijkstraPhase = 'start' | 'visit' | 'found' | 'skip' | 'relax' | 'update' | 'done'

export type DijkstraStep = GraphStep<DijkstraPhase>

/** 各階段在畫面上顯示的標籤 */
export const DIJKSTRA_PHASE_LABEL: Record<DijkstraPhase, string> = {
  start: 'READY',
  visit: 'VISIT',
  found: 'FOUND',
  skip: 'SKIP',
  relax: 'RELAX',
  update: 'UPDATE',
  done: 'ROUTE',
}

/** 右側程式碼面板顯示的程式碼（行號從 1 開始，對應 highlightLines） */
export const DIJKSTRA_CODE = [
  'function dijkstra(data, startNode, endNode) {',
  '  const table = {};',
  '  for (const node in data) {',
  '    table[node] = { distance: Infinity, previous: null };',
  '  }',
  '  table[startNode].distance = 0;',
  '  const visited = new Set();',
  '  const queue = new Set([startNode]);',
  '  while (queue.size > 0) {',
  '    const node = popMin(queue, table);',
  '    visited.add(node);',
  '    if (node === endNode) break;',
  '    for (const [next, weight] of Object.entries(data[node])) {',
  '      if (visited.has(next)) continue;',
  '      const total = table[node].distance + weight;',
  '      if (total < table[next].distance) {',
  '        table[next] = { distance: total, previous: node };',
  '        queue.add(next);',
  '      }',
  '    }',
  '  }',
  '  if (table[endNode].distance === Infinity) return { table, route: [] };',
  '  const route = [];',
  '  for (let n = endNode; n; n = table[n].previous) {',
  '    route.unshift(n);',
  '  }',
  '  return { table, route };',
  '}',
]

/** 設計稿上的圖，演算法與畫面共用的唯一資料來源 */
export const DIJKSTRA_DATA: DijkstraGraph = {
  A: { B: 4, C: 2, D: 7 },
  B: { A: 4, C: 3, E: 1, F: 5 },
  C: { A: 2, B: 3, D: 6, F: 8 },
  D: { A: 7, C: 6, G: 4 },
  E: { B: 1, F: 2, G: 7 },
  F: { B: 5, C: 8, E: 2, G: 3 },
  G: { D: 4, E: 7, F: 3 },
}

/**
 * 每個節點在畫面上的位置（SVG viewBox 820 × 520），版面對照設計稿
 * 鄰接表裡沒有座標，所以另外存；data 新增節點時這裡也要加
 */
export const NODE_POSITIONS: GraphNode[] = [
  { id: 'A', x: 60, y: 236 },
  { id: 'B', x: 280, y: 50 },
  { id: 'C', x: 280, y: 236 },
  { id: 'D', x: 280, y: 414 },
  { id: 'E', x: 545, y: 50 },
  { id: 'F', x: 545, y: 244 },
  { id: 'G', x: 760, y: 380 },
]

/** 隨機權重範圍 */
const MIN_WEIGHT = 1
const MAX_WEIGHT = 9

export const DEFAULT_START = 'A'
export const DEFAULT_END = 'G'

/**
 * 保留同樣的節點與連線，只重新產生每條邊的權重
 * 以邊為單位產生，A → B 與 B → A 一定拿到同一個權重
 */
export function createRandomData(): DijkstraGraph {
  const randomWeight = () => Math.floor(Math.random() * (MAX_WEIGHT - MIN_WEIGHT + 1)) + MIN_WEIGHT
  const data: DijkstraGraph = {}
  for (const node in DIJKSTRA_DATA) data[node] = {}
  for (const { from, to } of toEdges(DIJKSTRA_DATA)) {
    const weight = randomWeight()
    data[from]![to] = weight
    data[to]![from] = weight
  }
  return data
}

const formatDistance = (distance: number) => (distance === Infinity ? '∞' : String(distance))

/**
 * 執行 dijkstra()，把每個事件記錄成步驟快照。
 * - current（pink 實心）：目前正在處理的節點
 * - checking（amber 外框 / amber 邊）：目前節點正在檢查的鄰居與那條邊
 * - queued（muted 實心）：在 queue 裡等待處理
 * - visited（cyan 實心）：已確認最短距離
 * - path（lime 實心 / lime 粗線）：搜尋結束後，從終點一個一個回推出來的最短路徑
 */
export function createDijkstraSteps(data: DijkstraGraph, start: string, end: string): DijkstraStep[] {
  const steps: DijkstraStep[] = []
  /** 每張快照都要決定每條邊的顏色，先整理好不重複的邊清單 */
  const edges = toEdges(data)

  /**
   * 依目前狀態產生快照
   * @param highlight 這一步要特別標色的東西，都可以不傳
   * - current：目前正在處理的節點（pink）
   * - checking：目前節點正在檢查的鄰居（amber 外框與 amber 邊）
   * - path：回推最短路徑時，已經亮起來的節點（lime）
   */
  const snapshot = (
    { visited, queue }: DijkstraState,
    step: Omit<DijkstraStep, 'nodeStates' | 'checkingNode' | 'edgeStates' | 'visitedCount'>,
    {
      current = null,
      checking,
      path = [],
    }: {
      current?: string | null
      checking?: { node: string; next: string }
      path?: string[]
    },
  ) => {
    const pathNodes = new Set(path)
    /** 路徑上相鄰兩個節點之間的邊，例如 ['E', 'F', 'G'] → E-F、F-G */
    const pathEdges = new Set<string>()
    for (let i = 1; i < path.length; i++) {
      pathEdges.add(edgeKey(path[i - 1]!, path[i]!))
    }

    const nodeStates: Record<string, NodeState> = {}
    for (const id in data) {
      if (pathNodes.has(id)) nodeStates[id] = 'path'
      else if (id === current) nodeStates[id] = 'current'
      else if (visited.has(id)) nodeStates[id] = 'visited'
      else if (queue.has(id)) nodeStates[id] = 'queued'
      else nodeStates[id] = 'default'
    }

    const checkingKey = checking && edgeKey(checking.node, checking.next)
    const edgeStates: Record<string, EdgeState> = {}
    for (const { from, to } of edges) {
      const key = edgeKey(from, to)
      if (pathEdges.has(key)) edgeStates[key] = 'path'
      else if (key === checkingKey) edgeStates[key] = 'checking'
      else edgeStates[key] = 'default'
    }

    steps.push({
      ...step,
      nodeStates,
      checkingNode: checking?.next ?? null,
      edgeStates,
      visitedCount: visited.size,
    })
  }

  let lastState: DijkstraState | undefined

  const { route, distance } = dijkstra(data, start, end, (event, state) => {
    lastState = state
    const distanceOf = (node: string) => state.table.get(node)?.distance ?? Infinity

    switch (event.type) {
      case 'start':
        snapshot(
          state,
          {
            phase: 'start',
            focus: start,
            highlightLines: [2, 3, 4, 5, 6, 7, 8],
            summary: `從 ${start} 到 ${end}\n準備開始尋找最短路徑。`,
            detail:
              `${start} 的距離設為 0，其他節點都是 ∞。每一輪從 queue 取出距離最小的節點，` +
              `更新它還沒處理過的鄰居，直到取出終點 ${end}。`,
          },
          {},
        )
        break

      case 'visit': {
        const { node } = event
        snapshot(
          state,
          {
            phase: 'visit',
            focus: node,
            highlightLines: [9, 10, 11],
            summary: `取出距離最小的 ${node}\n最短距離確定為 ${distanceOf(node)}。`,
            detail:
              `${node} 的距離 ${distanceOf(node)} 是 queue 中最小的，因為權重都 ≥ 0，` +
              `不會再有更短的路，${node} 的最短距離確定，接著檢查它的鄰居。`,
          },
          { current: node },
        )
        break
      }

      case 'found': {
        const { node } = event
        snapshot(
          state,
          {
            phase: 'found',
            focus: node,
            highlightLines: [10, 11, 12],
            summary: `取出終點 ${node}\n最短距離為 ${distanceOf(node)}，結束搜尋。`,
            detail: `${node} 已經是 queue 中距離最小的節點，它的距離不會再變短，不用再處理剩下的節點。`,
          },
          { current: node },
        )
        break
      }

      case 'skip': {
        const { node, next } = event
        snapshot(
          state,
          {
            phase: 'skip',
            focus: node,
            highlightLines: [13, 14],
            summary: `${next} 已確認\n跳過。`,
            detail: `${next} 的最短距離已確定為 ${distanceOf(next)}，不會再變短，不用再從 ${node} 檢查。`,
          },
          { current: node, checking: { node, next } },
        )
        break
      }

      case 'relax': {
        const { node, next, weight, total, oldDistance, updated } = event
        const base = `${node} 的距離 ${distanceOf(node)} + 邊權重 ${weight} = ${total}，`

        if (updated) {
          snapshot(
            state,
            {
              phase: 'update',
              focus: node,
              highlightLines: [15, 16, 17, 18],
              summary: `經由 ${node} 前往 ${next}\n距離更新為 ${total}。`,
              detail:
                base +
                `比原本的 ${formatDistance(oldDistance)} 更短，${next} 的 previous 改為 ${node}，` +
                (oldDistance === Infinity ? '並加入 queue。' : 'queue 裡的距離也跟著變短。'),
            },
            { current: node, checking: { node, next } },
          )
        } else {
          snapshot(
            state,
            {
              phase: 'relax',
              focus: node,
              highlightLines: [15, 16],
              summary: `檢查 ${node} → ${next}\n距離不變。`,
              detail: base + `沒有比 ${next} 目前的 ${formatDistance(oldDistance)} 更短，維持不變。`,
            },
            { current: node, checking: { node, next } },
          )
        }
        break
      }
    }
  })

  if (!lastState) return steps

  // 無法抵達：只補一步說明
  if (route.length === 0) {
    snapshot(
      lastState,
      {
        phase: 'done',
        focus: end,
        highlightLines: [22],
        summary: `${end} 無法抵達。`,
        detail: `queue 已經清空，${end} 的距離仍是 ∞，代表從 ${start} 沒有路可以到 ${end}。`,
      },
      {},
    )
    return steps
  }

  // 收尾：照程式碼的順序，從終點沿著 previous 往回走，一次亮一個節點
  for (let index = route.length - 1; index >= 0; index--) {
    const node = route[index]!
    const before = route[index - 1]
    const isFirst = index === route.length - 1
    const isLast = index === 0
    /** 目前已經亮起來的節點：從 node 到終點 */
    const lit = route.slice(index)

    snapshot(
      lastState,
      {
        phase: 'done',
        focus: node,
        highlightLines: isLast ? [24, 25, 26, 27] : isFirst ? [23, 24, 25] : [24, 25],
        summary: isLast
          ? `最短路徑 ${route.join(' → ')}\n總距離 ${distance}。`
          : `回推到 ${node}\n${node} 的 previous 是 ${before}。`,
        detail: isLast
          ? `${node} 是起點，previous 為 null，回推結束。最短路徑為 ${route.join(' → ')}，總距離 ${distance}。`
          : (isFirst ? `從終點 ${end} 開始，沿著 previous 一路往回走。` : '') +
            `${node} 是從 ${before} 過來的，下一站往 ${before} 走。目前路徑：${lit.join(' → ')}。`,
      },
      { path: lit },
    )
  }

  return steps
}
