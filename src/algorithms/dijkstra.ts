import { edgeKey } from '@/types/graph'
import type { EdgeState, Graph, GraphEdge, GraphStep, NodeState } from '@/types/graph'

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

  console.log("table", table)

  return { table, route, distance }
}

/** 把畫面用的 Graph（無向邊）轉成鄰接表，兩個方向都要加 */
export function toAdjacency(graph: Graph): DijkstraGraph {
  console.log("graph", graph)
  
  const data: DijkstraGraph = {}
  for (const { id } of graph.nodes) data[id] = {}
  for (const { from, to, weight } of graph.edges) {
    data[from] = { ...data[from], [to]: weight }
    data[to] = { ...data[to], [from]: weight }
  }
  return data
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

/** 固定的節點位置（SVG viewBox 820 × 520），版面對照設計稿 */
const NODES = [
  { id: 'A', x: 60, y: 236 },
  { id: 'B', x: 280, y: 50 },
  { id: 'C', x: 280, y: 236 },
  { id: 'D', x: 280, y: 414 },
  { id: 'E', x: 545, y: 50 },
  { id: 'F', x: 545, y: 244 },
  { id: 'G', x: 760, y: 380 },
]

/** 設計稿上的邊與權重，作為頁面載入時的預設圖 */
const DEFAULT_EDGES: GraphEdge[] = [
  { from: 'A', to: 'B', weight: 4 },
  { from: 'A', to: 'C', weight: 2 },
  { from: 'A', to: 'D', weight: 7 },
  { from: 'B', to: 'C', weight: 3 },
  { from: 'B', to: 'E', weight: 1 },
  { from: 'B', to: 'F', weight: 5 },
  { from: 'C', to: 'D', weight: 6 },
  { from: 'C', to: 'F', weight: 8 },
  { from: 'D', to: 'G', weight: 4 },
  { from: 'E', to: 'F', weight: 2 },
  { from: 'E', to: 'G', weight: 7 },
  { from: 'F', to: 'G', weight: 3 },
]

/** 隨機權重範圍 */
const MIN_WEIGHT = 1
const MAX_WEIGHT = 9

export const DEFAULT_START = 'A'
export const DEFAULT_END = 'G'

export function createDefaultGraph(): Graph {
  return { nodes: NODES.map((node) => ({ ...node })), edges: DEFAULT_EDGES.map((edge) => ({ ...edge })) }
}

/** 保留同樣的節點與連線，只重新產生每條邊的權重 */
export function createRandomGraph(): Graph {
  const randomWeight = () => Math.floor(Math.random() * (MAX_WEIGHT - MIN_WEIGHT + 1)) + MIN_WEIGHT
  return {
    nodes: NODES.map((node) => ({ ...node })),
    edges: DEFAULT_EDGES.map((edge) => ({ ...edge, weight: randomWeight() })),
  }
}

const formatDistance = (distance: number) => (distance === Infinity ? '∞' : String(distance))

/**
 * 執行 dijkstra()，把每個事件記錄成步驟快照。
 * - path（lime）：起點到焦點節點的最短路徑；最後一步為起點到終點的路徑
 * - visited（cyan）：已處理完成的節點
 * - frontier（amber）：還在 queue 裡的節點
 * - comparing（pink）：正在檢查、但距離沒有更新（或已處理過而跳過）的鄰居與邊
 */
export function createDijkstraSteps(graph: Graph, start: string, end: string): DijkstraStep[] {
  const steps: DijkstraStep[] = []

  /**
   * 依目前狀態產生快照
   * @param pathTo 要畫出最短路徑的節點（從 previous 回推到起點）
   * @param checking 正在檢查的邊與鄰居；距離沒更新時標成 comparing
   */
  const snapshot = (
    { table, visited, queue }: DijkstraState,
    step: Omit<DijkstraStep, 'dist' | 'nodeStates' | 'edgeStates' | 'visitedCount'>,
    pathTo: string,
    checking?: { node: string; next: string; updated: boolean },
  ) => {
    /** 紀錄經過的每個節點 例如目前是 C，會從 C 回推到起點 */
    const pathNodes = new Set<string>()
    /** 紀錄經過的每個節點路線 例如: A-C */
    const pathEdges = new Set<string>()
    for (let current: string | null = pathTo; current !== null; current = table.get(current)?.previous ?? null) {
      pathNodes.add(current)
      const before = table.get(current)?.previous
      if (before) pathEdges.add(edgeKey(before, current))
    }

    const dist: Record<string, number | null> = {}
    const nodeStates: Record<string, NodeState> = {}
    for (const { id } of graph.nodes) {
      const distance = table.get(id)?.distance ?? Infinity
      dist[id] = distance === Infinity ? null : distance
      if (checking && !checking.updated && id === checking.next) nodeStates[id] = 'comparing'
      else if (visited.has(id)) nodeStates[id] = pathNodes.has(id) ? 'path' : 'visited'
      else if (queue.has(id)) nodeStates[id] = 'frontier'
      else nodeStates[id] = 'default'
    }

    const checkingKey = checking && edgeKey(checking.node, checking.next)
    const edgeStates: Record<string, EdgeState> = {}
    for (const { from, to } of graph.edges) {
      const key = edgeKey(from, to)
      if (pathEdges.has(key)) edgeStates[key] = 'path'
      else if (key === checkingKey) edgeStates[key] = 'comparing'
      else edgeStates[key] = 'default'
    }

    steps.push({ ...step, dist, nodeStates, edgeStates, visitedCount: visited.size })
  }

  let lastState: DijkstraState | undefined

  const { route, distance } = dijkstra(toAdjacency(graph), start, end, (event, state) => {

    console.log("graph", graph)
    console.log("toAdjacency", toAdjacency(graph))

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
          start,
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
              `不會再有更短的路，${node} 處理完成，接著檢查它的鄰居。`,
          },
          node,
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
          node,
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
            summary: `${next} 已處理完成\n跳過。`,
            detail: `${next} 的最短距離已確定為 ${distanceOf(next)}，不用再從 ${node} 檢查。`,
          },
          node,
          { node, next, updated: false },
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
            next,
            { node, next, updated },
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
            node,
            { node, next, updated },
          )
        }
        break
      }
    }
  })

  // 收尾：畫出起點到終點的路徑
  if (lastState) {
    const reachable = route.length > 0
    snapshot(
      lastState,
      {
        phase: 'done',
        focus: end,
        highlightLines: reachable ? [23, 24, 25, 26, 27] : [22],
        summary: reachable
          ? `最短路徑 ${route.join(' → ')}\n總距離 ${distance}。`
          : `${end} 無法抵達。`,
        detail: reachable
          ? `從 ${end} 沿著 previous 一路回推到 ${start}，得到最短路徑 ${route.join(' → ')}，總距離為 ${distance}。`
          : `queue 已經清空，${end} 的距離仍是 ∞，代表從 ${start} 沒有路可以到 ${end}。`,
      },
      end,
    )
  }

  return steps
}
