# Dijkstra 最短路徑動畫開發文件

## 目的

記錄 Dijkstra 頁面（`src/page/DijkstraPage.vue`）的架構、演算法、步驟產生規則、節點 / 邊的顏色狀態，以及為了它而調整的共用程式碼。

這是第一個**圖論**頁面，播放架構（`useStepPlayer`、`ToolFooter`、`CodePanel`、ToolLayout slot）和排序頁完全相同，**共用的部分不再重複說明**，請先看 [bubble-sort-animation.md](./bubble-sort-animation.md)；版面殼請看 [layout-architecture.md](./layout-architecture.md)。本文只記錄 Dijkstra 特有的部分。

## 這次新增 / 改動的檔案

```
src/types/graph.ts                 // 新增：Graph / GraphStep 型別、NodeState / EdgeState、edgeKey()
src/algorithms/dijkstra.ts         // 新增：dijkstra() 本體 + 步驟產生器 + 程式碼常數 + 預設圖
src/component/GraphChart.vue       // 新增：SVG 加權圖視覺化（取代 BarChart 的位置）
src/scss/GraphChart.scss           // 新增：節點、邊、權重、距離標籤樣式
src/page/DijkstraPage.vue          // 新增：頁面組合
src/router/index.ts                // 新增 /Dijkstra 路由
src/types/sort.ts                  // LegendItem.state 放寬為 BarState | NodeState
src/component/InputPanel.vue       // 新增 title / dataLabel / dataText props
src/scss/InputPanel.scss           // 新增 path / visited / frontier 圖例顏色；資料文字支援換行
```

`BarChart`、`CodePanel`、`ToolFooter`、`ToolHeader`、`ToolLayout`、`useStepPlayer` 完全沒有改。

## 預設圖

**唯一的資料來源是鄰接表 `DIJKSTRA_DATA`**，演算法直接用它，畫面要的邊清單也從它整理出來：

```ts
export const DIJKSTRA_DATA: DijkstraGraph = {
  A: { B: 4, C: 2, D: 7 },
  B: { A: 4, C: 3, E: 1, F: 5 },
  C: { A: 2, B: 3, D: 6, F: 8 },
  D: { A: 7, C: 6, G: 4 },
  E: { B: 1, F: 2, G: 7 },
  F: { B: 5, C: 8, E: 2, G: 3 },
  G: { D: 4, E: 7, F: 3 },
}
```

資料怎麼流到各處：

```
DIJKSTRA_DATA（鄰接表，每條邊寫兩次）
  ├─ dijkstra(data, ...)                      → 演算法直接用
  ├─ toEdges(data)  → 12 條不重複的邊
  │    ├─ GraphChart 畫線、權重數字
  │    ├─ snapshot 決定每條邊的顏色
  │    └─ 左側「12 edges」
  └─ for (const id in data)                   → snapshot 決定每個節點的顏色
```

`toEdges(data)` 會把 `A: { B: 4 }` 和 `B: { A: 4 }` 視為同一條邊（用 `edgeKey` 判斷），只保留先出現的那筆，所以 12 條邊在鄰接表裡出現 24 次，畫面只會畫 12 條線。

⚠️ 改 `DIJKSTRA_DATA` 時，**兩個方向的權重要一樣**。`toEdges` 只取先出現的那筆，兩邊不一致時畫面顯示的權重可能跟演算法實際走的方向對不起來。

鄰接表裡沒有座標，所以節點位置另外存在 `NODE_POSITIONS`（座標系是 GraphChart 的 SVG `viewBox="0 0 820 520"`）。**`DIJKSTRA_DATA` 新增節點時，這裡也要加**，否則那個節點和連到它的線不會畫出來：

| 節點 | x | y |
| --- | --- | --- |
| A | 60 | 236 |
| B | 280 | 50 |
| C | 280 | 236 |
| D | 280 | 414 |
| E | 545 | 50 |
| F | 545 | 244 |
| G | 760 | 380 |

邊（無向，共 12 條）：`A-B 4`、`A-C 2`、`A-D 7`、`B-C 3`、`B-E 1`、`B-F 5`、`C-D 6`、`C-F 8`、`D-G 4`、`E-F 2`、`E-G 7`、`F-G 3`。

- `createRandomData()`：**節點與連線不變，只把每條邊的權重重新隨機成 1–9**，回傳新的鄰接表。以邊為單位產生（先 `toEdges`），所以 A → B 與 B → A 一定拿到同一個權重；「產生新資料」後圖一定連通、版面也不會亂掉
- 起點 `DEFAULT_START = 'A'`、終點 `DEFAULT_END = 'G'`
- 頁面只會把 `data` 整個換成新物件，不會去改 `DIJKSTRA_DATA` 本身

⚠️ 節點座標要留空間給距離標籤（畫在節點下方 `r + 24`），最下面的節點 y 不要超過約 450，最上面的節點 y 不要小於約 40（半徑 34）。

## 演算法：`dijkstra(data, startNode, endNode, onStep?)`

演算法本體只有這一份，頁面動畫也是呼叫它（透過 `onStep` 記錄步驟），不會有「畫面跑的」和「實際邏輯」兩套程式碼。

### 資料格式

```ts
/** 無向圖：節點 → { 鄰居節點: 距離 } */
type DijkstraGraph = Record<string, Record<string, number>>

const data: DijkstraGraph = {
  A: { B: 4, C: 2, D: 7 },
  B: { A: 4, C: 3, E: 1, F: 5 },
  // ...
}
```

- **本專案只處理無向圖**：每條邊兩個方向都要寫（`A: { B: 4 }` 和 `B: { A: 4 }`），所以每個節點一定是 `data` 的 key，distance table 直接用 `for (const node in data)` 建立
- 演算法直接吃這個格式；畫面需要的「每條邊一筆」清單由 `toEdges(data)` 產生（見上方「預設圖」）
- 如果之後要支援單向圖，有些節點會只出現在鄰居裡、沒有自己的 key，建立 table 時要把鄰居也收進來，不然那些節點會找不到

### 回傳值

```ts
interface DijkstraResult {
  table: Map<string, { distance: number; previous: string | null }>
  route: string[]   // 起點 → 終點的路徑，無法抵達時為 []
  distance: number  // 最短距離，無法抵達時為 Infinity
}
```

### 流程（對應右側程式碼面板）

```js
function dijkstra(data, startNode, endNode) {                            // 1
  const table = {};                                                       // 2
  for (const node in data) {                                              // 3
    table[node] = { distance: Infinity, previous: null };                 // 4
  }                                                                       // 5
  table[startNode].distance = 0;                                          // 6
  const visited = new Set();                                              // 7
  const queue = new Set([startNode]);                                     // 8
  while (queue.size > 0) {                                                // 9
    const node = popMin(queue, table);                                    // 10
    visited.add(node);                                                    // 11
    if (node === endNode) break;                                          // 12
    for (const [next, weight] of Object.entries(data[node])) {           // 13
      if (visited.has(next)) continue;                                    // 14
      const total = table[node].distance + weight;                        // 15
      if (total < table[next].distance) {                                 // 16
        table[next] = { distance: total, previous: node };                // 17
        queue.add(next);                                                  // 18
      }                                                                   // 19
    }                                                                     // 20
  }                                                                       // 21
  if (table[endNode].distance === Infinity) return { table, route: [] };  // 22
  const route = [];                                                       // 23
  for (let n = endNode; n; n = table[n].previous) {                       // 24
    route.unshift(n);                                                     // 25
  }                                                                       // 26
  return { table, route };                                                // 27
}                                                                         // 28
```

設計重點：

- **queue 只存節點名稱**（`Set`），距離統一從 `table` 讀。找到更短的距離時改 `table` 就好，不會有 queue 和 table 兩份距離不同步的問題
- **起點直接放進 queue**，第一圈就會被取出處理，不需要另外寫「第一輪」
- 起點不在圖裡時 queue 一開始就是空的，直接回傳無法抵達
- **取出終點就提早結束**：終點被取出時已是 queue 中最小的距離，不會再變短。代價是此時 `table` 只有「比終點近」的節點是最終結果，其他節點的距離可能還不是最短
- `popMin` 是線性掃描 queue，**同距離時取先加入 queue 的節點**（`Set` 依加入順序走訪）。距離被改短的節點維持原本的位置
- 時間複雜度 `O(V²)`（每次線性找最小值）。節點數很小，不需要 heap；ToolHeader 上的 `O(E log V)` 是 heap 版的理論值

### 和原始寫法的差異

演算法最早是以下面這個版本為基礎（distance table + previous、visited、queue、找到終點就停、從終點回推路徑），流程不變，只做了這些調整：

| 原始寫法 | 現在 | 原因 |
| --- | --- | --- |
| 鄰接表 `Record<string, number>[]`，例如 `A: [{ B: 4 }, { C: 2 }]`，取值用 `Object.keys(neighbor)[0]` | `Record<string, Record<string, number>>`，例如 `A: { B: 4, C: 2 }`，用 `Object.entries` | 不用每次處理 `undefined`，比較好讀 |
| 起點那一輪另外寫一段，再進 while | 起點直接放進 queue | 少一整段和 while 內幾乎相同的程式碼 |
| queue 存 `{ node, distance }`，table 也存 distance | queue 只存節點名稱（`Set`），距離只存在 table | 不會有兩份距離要同步更新 |
| table 是陣列，每次用 `find` 查 | `Map` | 查詢直接 |
| `if (!nextNodeData) break` | `data[node] ?? {}` | 無向圖不會碰到，但 `noUncheckedIndexedAccess` 需要處理 `undefined`，而且不該整個中斷 |
| 遞迴回推路徑 | `for` 迴圈 + `unshift` | 更簡單，不需要再 `reverse()` |
| 回傳 `{ table, routesNode }` | 回傳 `{ table, route, distance }` | 多回傳終點距離，畫面不用再查 table |

保留不變的：只處理無向圖、`for (const node in data)` 建 table、`visited` 的鄰居直接跳過、取出終點就提早結束、同距離時取先加入 queue 的節點。

### 已驗證的邊界情況

| 輸入 | 結果 |
| --- | --- |
| 起點 = 終點 | `route = ['A']`，`distance = 0` |
| 無法抵達（C 沒有連到 A、B） | `route = []`，`distance = Infinity` |
| 起點不在圖裡 | `route = []`，`distance = Infinity` |

限制：

- **只處理無向圖**（見上方資料格式）
- **權重必須 ≥ 0**。有負權重要改用 Bellman-Ford

## 步驟產生器：`createDijkstraSteps(data, start, end)`

先用 `toEdges(data)` 整理出邊清單（每張快照都要用它決定邊的顏色），再呼叫 `dijkstra(data, start, end, onStep)`，每收到一個事件就用當下的 `table` / `visited` / `queue` 產生一個快照，最後再補一個 `done` 步驟。步驟本身不需要節點座標，座標只有畫面（GraphChart）用得到。

| 事件 | Phase | 標籤 | 時機 | 高亮行 |
| --- | --- | --- | --- | --- |
| `start` | `start` | `READY` | 初始化 table、visited、queue | 2–8 |
| `visit` | `visit` | `VISIT` | 從 queue 取出距離最小的節點 | 9, 10, 11 |
| `found` | `found` | `FOUND` | 取出的是終點，結束搜尋 | 10, 11, 12 |
| `skip` | `skip` | `SKIP` | 鄰居已處理完成，跳過 | 13, 14 |
| `relax`（`updated`） | `update` | `UPDATE` | 找到更短的距離，更新 distance / previous | 15–18 |
| `relax`（未更新） | `relax` | `RELAX` | 檢查鄰居，距離沒變短 | 15, 16 |
| — | `done` | `ROUTE` | 從終點回推路徑；無法抵達時高亮第 22 行 | 23–27 / 22 |

其他規則：

- `onStep` 收到的 `state` 是**同一份參考**，快照時要把需要的值複製出來（`snapshot()` 會建立新的 `dist` / `nodeStates` / `edgeStates` 物件）
- `focus` 是這一步的主角節點，顯示在左側卡片標籤與程式碼面板狀態列，例如 `VISIT  D  /  05`、`UPDATE D`；`done` 步驟的 focus 是終點
- 卡片標籤最後的數字是**已處理完成的節點數**（`visitedCount = visited.size`），和視覺化標題列的 `VISITED 05 / 07` 一致
- 鄰居的檢查順序就是 `DIJKSTRA_DATA` 裡寫的順序，例如 A 會依序檢查 B、C、D

同檔案另外匯出 `DIJKSTRA_CODE`（右側程式碼的每一行）與 `DIJKSTRA_PHASE_LABEL`（phase → 畫面標籤）。**改程式碼常數內容時要一起檢查高亮行號。**

### `GraphStep` 快照內容（`src/types/graph.ts`）

| 欄位 | 意義 |
| --- | --- |
| `dist` | 每個節點目前的距離，`Infinity` 轉成 `null`（畫面顯示 `∞`） |
| `nodeStates` | 每個節點的顯示狀態 |
| `edgeStates` | 每條邊的顯示狀態，key 由 `edgeKey(a, b)` 產生 |
| `visitedCount` | 已處理完成的節點數 |
| `focus` | 這一步的主角節點 |
| `highlightLines` / `phase` / `summary` / `detail` | 與排序頁的 `SortStep` 相同 |

`edgeKey(a, b)` 會把兩端點排序後組合（`A-B`），所以 `A → B` 和 `B → A` 查到的是同一條無向邊。

### 節點 / 邊狀態怎麼算

**先決定要畫哪一條路徑**（`pathTo`），從 `table` 的 `previous` 回推到起點：

- `update` 步驟：被更新的鄰居（路徑會延伸到它身上）
- `done` 步驟：終點，也就是最後的最短路徑
- 其他步驟：目前取出的節點

**節點**判斷順序（先命中先決定）：

```
skip / relax 中被檢查的鄰居 → comparing
已處理完成 且在路徑上        → path
已處理完成                    → visited
在 queue 裡                   → frontier
其他                          → default
```

**邊**判斷順序：

```
在路徑上                      → path
skip / relax / update 中正在檢查的這條 → comparing
其他                          → default
```

- `update` 時被檢查的邊一定在路徑上，所以會是 lime 而不是 pink，視覺上就是「路徑延伸過去了」
- 最後的 `done` 步驟只畫出**起點到終點的那一條路徑**，其他處理過的節點維持 cyan

## GraphChart 元件

取代排序頁 `BarChart` 的位置，標題列與下方說明框的樣式和 BarChart 相同，中間改成 SVG 圖（`viewBox="0 0 820 520"`，寬度隨容器縮放）。

| Prop | 型別 | 說明 |
| --- | --- | --- |
| `graph` | `Graph` | 必填，節點座標與無向邊 |
| `dist` | `Record<string, number \| null>` | 節點下方的距離，`null` 顯示 `∞` |
| `nodeStates` | `Record<string, NodeState>` | 節點狀態，沒給的節點視為 `default` |
| `edgeStates` | `Record<string, EdgeState>` | 邊狀態，key 為 `edgeKey(from, to)` |
| `title` | `string` | 標題列 `VISUALIZATION / {title}` |
| `visitedCount` | `number` | 右上角 `VISITED 05 / 07`，分母是節點總數 |
| `currentStep` | `number` | 說明框左側的步驟編號 |
| `message` | `string` | 說明框文字，支援 `\n` 換行 |

- 節點半徑 34，距離標籤畫在節點下方 `r + 24`
- 元件只負責畫，**不知道演算法**，之後其他圖論演算法（BFS、Prim…）可以直接沿用，只要產生自己的 `nodeStates` / `edgeStates`

## 顏色規則

| 狀態 | 意義 | 節點 | 邊 |
| --- | --- | --- | --- |
| `path` | 最短路徑 | `$accent-lime` 實心，字變 `$canvas` | `$accent-lime` 粗線（5px） |
| `visited` | 已處理完成（不在目前路徑上） | `$accent-cyan` 實心，字變 `$canvas` | — |
| `frontier` | 邊界節點：在 queue 裡、尚未處理 | `$accent-amber` 外框 | — |
| `comparing` | 正在檢查、距離沒變 / 已處理而跳過 | `$accent-pink` 外框 | `$accent-pink` 線與權重數字 |
| `default` | 尚未抵達 / 一般的邊 | `$surface` 底、`$border` 外框 | `$text-muted` 細線（2px） |

說明：

- 左欄圖例只放 `path` / `visited` / `frontier` 三項；`comparing` 是過場色，和快速排序一樣不列入圖例
- `frontier` 的圖例圓點是 amber 外框、透明底，對應節點的樣子
- path 邊在 GraphChart 裡會排序到最後才畫（`sortedEdges`），避免被灰色的邊蓋住
- 權重標籤畫在邊的中點，沿法向量偏移 14px；法向量統一朝上，標籤不會一條在上、一條在下

## 共用程式碼的調整

### `src/types/sort.ts`

```ts
interface LegendItem {
  state: BarState | NodeState
  label: string
}
```

排序頁不受影響。

### `InputPanel.vue`

新增三個 props，都有預設值，所以排序頁不用改：

| Prop | 預設值 | Dijkstra 頁傳入 |
| --- | --- | --- |
| `title` | `INPUT DATA` | `GRAPH DATA` |
| `dataLabel` | `陣列` | `起點 → 終點 / 節點` |
| `dataText` | `''`（空字串時改顯示 `arr.join(', ')`） | `A → G  /  7 nodes · 12 edges` |

`&__data-values` 加上 `white-space: pre-line`，之後資料文字可以換行。

## 頁面組合：DijkstraPage.vue

和排序頁同一個骨架，差別：

```ts
/** 鄰接表是頁面唯一的狀態 */
const data = ref(DIJKSTRA_DATA)

/** 畫面用的圖：節點座標 + 從鄰接表整理出的不重複邊，data 一換就跟著重算 */
const graph = computed<Graph>(() => ({ nodes: NODE_POSITIONS, edges: toEdges(data.value) }))

const result = computed(() => {
  const start = performance.now()
  const steps = createDijkstraSteps(data.value, DEFAULT_START, DEFAULT_END)
  return { steps, duration: performance.now() - start }
})

function regenerate() {
  reset()
  data.value = createRandomData()
}
```

```vue
<ToolHeader index="03" title-zh="Dijkstra 最短路徑" title-en="SHORTEST PATH"
            time="O(E log V)" space="O(V)"
            status-label="WEIGHT" status-value="≥ 0" status-variant="primary" />

<InputPanel title="GRAPH DATA" data-label="起點 → 終點 / 節點" :data-text="graphInfo" ... />
<GraphChart title="WEIGHTED GRAPH" :graph="graph" :dist="step.dist"
            :node-states="step.nodeStates" :edge-states="step.edgeStates"
            :visited-count="step.visitedCount" ... />
<CodePanel file-name="dijkstra.js" language="JAVASCRIPT" :lines="DIJKSTRA_CODE" ... />
```

root class 為 `.dijkstra-page`（樣式內容與排序頁相同）。路由是 `/Dijkstra`。

## 實際步驟長相

預設圖、A → G（`p` = path、`v` = visited、`f` = frontier、`c` = comparing、`d` = default，後面的數字是距離）：

```
00 start   A:f0 B:d∞ C:d∞ D:d∞ E:d∞ F:d∞  G:d∞    從 A 到 G，準備開始
01 visit   A:p0 B:d∞ C:d∞ D:d∞ E:d∞ F:d∞  G:d∞    取出 A，確定為 0
02 update  A:p0 B:f4 C:d∞ D:d∞ E:d∞ F:d∞  G:d∞    經由 A 前往 B，更新為 4
03 update  A:p0 B:f4 C:f2 D:d∞ E:d∞ F:d∞  G:d∞    經由 A 前往 C，更新為 2
04 update  A:p0 B:f4 C:f2 D:f7 E:d∞ F:d∞  G:d∞    經由 A 前往 D，更新為 7
05 visit   A:p0 B:f4 C:p2 D:f7 E:d∞ F:d∞  G:d∞    取出 C，確定為 2
06 skip    A:c0 B:f4 C:p2 D:f7 E:d∞ F:d∞  G:d∞    A 已處理完成，跳過
07 relax   A:p0 B:c4 C:p2 D:f7 E:d∞ F:d∞  G:d∞    檢查 C → B，不變
...
17 update  A:p0 B:p4 C:v2 D:f7 E:p5 F:f7  G:d∞    經由 E 前往 F，更新為 7
...
27 update  A:p0 B:p4 C:v2 D:v7 E:p5 F:p7  G:f10   經由 F 前往 G，更新為 10
28 found   A:p0 B:p4 C:v2 D:v7 E:p5 F:p7  G:p10   取出終點 G，結束搜尋
29 done    A:p0 B:p4 C:v2 D:v7 E:p5 F:p7  G:p10   最短路徑 A → B → E → F → G，總距離 10
```

預設圖共 30 步（0–29）。G 剛好是離 A 最遠的節點，所以這張圖不會提早結束；換成較近的終點（例如 A → E）步驟會少很多。

## 驗證狀態

- `npm run type-check`：通過
- `npm run build-only`（vite build）：通過，SCSS 編譯正常
- 腳本測試：通過。用 Node 直接跑：
  - 預設圖逐步輸出，比對距離、節點與邊的狀態符合預期
  - 上方「已驗證的邊界情況」表格中的每一組
  - `toEdges(DIJKSTRA_DATA)` 剛好整理出 12 條邊，權重與設計稿一致
  - `createRandomData()` 跑 200 次，每次都是 12 條邊，且每條邊兩個方向的權重相同
  - 用 `createRandomData()` 隨機產生 300 張圖，**每一組起點 × 終點**（49 組，共 14,700 組）都檢查：`distance` 等於 Bellman-Ford 暴力解、`route` 頭尾正確且邊權重加總等於 `distance`、步驟最後一步是 `done`
- 瀏覽器實際播放：尚未確認

## 後續待辦（Not in scope）

- 讓使用者選擇起點 / 終點（目前固定 A → G），或點擊節點切換終點
- 「產生新資料」只換權重，之後可以做隨機連線（需確保連通、邊不要交錯太多）
- 單向圖：table 要改成連鄰居一起收集，`toEdges` 不能再把 A→B、B→A 合併，GraphChart 的邊要加箭頭
- 顯示 queue 目前的內容與 distance table
- 手機版版面（與排序頁共用的待辦）
