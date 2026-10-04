# Dijkstra 棋盤樣式隨機圖（已停用，保留參考）

> ⚠️ **這份設計目前沒有在程式碼裡使用。** 目前實作 Dijkstra 頁面現在用的是 [dijkstra-animation.md](./dijkstra-animation.md)。
>
> 文件中提到的 `createRandomGraph()`、`toNodeId()`、`NumberField.vue`、GraphChart 的自動縮放等都**不存在於目前的程式碼**。

## 目的

提供使用者自行輸入**節點數量、起始點、終點**，動態產生 Graph 圖，再依起訖點執行 Dijkstra 最短路徑動畫。

本文記錄這個功能的設計與實作：節點座標怎麼排、節點之間的連線怎麼產生、權重怎麼給，以及為了支援最多 99 個節點而調整的畫面元件。

演算法本體、步驟產生器、顏色規則沒有變，請看 [dijkstra-animation.md](./dijkstra-animation.md)。

## 這次新增 / 改動的檔案

```
src/algorithms/dijkstra.ts      // 新增 createRandomGraph()、toNodeId()、節點數量常數；移除 DIJKSTRA_DATA、NODE_POSITIONS、createRandomData、DEFAULT_START / DEFAULT_END
src/page/DijkstraPage.vue       // 圖與起訖點改成一個 config ref；彈窗的節點數量 / 起點 / 終點接上 regenerate
src/component/NumberField.vue   // 新增：數字輸入欄位，外觀與 SelectField 一致
src/scss/NumberField.scss       // 新增：NumberField 樣式
src/component/GraphChart.vue    // 移除節點下方的距離（dist）；節點變密時自動縮小圓圈與文字
src/scss/GraphChart.scss        // 移除 dist 樣式；font-size 改由元件 inline style 設定
src/types/graph.ts              // GraphStep 移除 dist 欄位
```

## 需求

- 使用者輸入節點數量（2–99）
- 節點名稱是流水號
- 每條邊的權重隨機
- 節點座標不再寫死
- 畫面只畫圓圈和線，**不畫棋盤外框、格線，也不顯示節點的距離**

## 為什麼用棋盤排座標，而不是依權重排

曾考慮過「權重越大，兩點畫得越遠」，最後沒有採用：

| | 依權重排座標 | 棋盤排座標（採用） |
| --- | --- | --- |
| 能不能畫出來 | 常常不行。線長要等於權重，三角形就必須符合「兩邊和大於第三邊」。隨機權重常違反這個條件，例如 A-B = 1、B-C = 1、A-C = 9，平面上找不到滿足的位置 | 一定可以 |
| 版面 | 只能用 force-directed 之類的演算法近似，節點可能重疊、線會交錯，每次刷新版面都跳動 | 等距排列，不重疊 |
| 線穿過節點 | 可能 | 只連相鄰點，不會 |
| 對學習的影響 | 線長和權重「有點像又不完全對」，會讓人用眼睛判斷最短路，反而誤導 | 權重只看數字 |

棋盤用的是**直棋（Alquerque）**的畫法：斜線只從 `row + col` 為偶數的點出發，所以一格裡只會有一條斜線，斜線之間不會交叉成 X。

**棋盤本身不會畫出來**，只用來決定兩件事：節點放在哪裡、哪兩個點之間「可以」連線。

## 資料流

```
使用者在彈窗輸入節點數量、選起點 / 終點
  └─ regenerate()
       └─ createRandomGraph(count) → { data, positions }
            ├─ data（鄰接表）
            │    ├─ createDijkstraSteps(data, start, end)  → 動畫步驟
            │    └─ toEdges(data)                          → GraphChart 畫線、權重
            └─ positions（節點座標）                       → GraphChart 畫圓圈
```

`data` 和 `positions` 分開回傳：演算法只在乎「誰連到誰、多遠」，不需要知道節點畫在哪裡；座標只有畫面用得到。

## 常數

都在 `src/algorithms/dijkstra.ts`：

| 常數 | 值 | 說明 |
| --- | --- | --- |
| `MIN_NODE_COUNT` | `2` | 至少 2 個，起點和終點才能不同 |
| `MAX_NODE_COUNT` | `99` | 輸入上限 |
| `DEFAULT_NODE_COUNT` | `7` | 頁面載入時的節點數 |
| `MIN_WEIGHT` / `MAX_WEIGHT` | `1` / `9` | 權重範圍 |
| `VIEW_WIDTH` / `VIEW_HEIGHT` | `820` / `520` | 版面座標系，**必須和 GraphChart 的 SVG `viewBox` 一致** |
| `PADDING` | `60` | 最外圈節點中心離邊界的距離（半徑 34 + 留白） |
| `EXTRA_EDGE_RATE` | `0.5` | 除了「一定要的線」以外，其他鄰居被連起來的機率，見下方步驟 ④ |

## 節點名稱：`toNodeId(index)`

```ts
export const toNodeId = (index: number) => String(index + 1)
```

使用 **index + 1 當作節點名稱（ index 都是從 0 開始）** 

## `createRandomGraph(count)` 流程

```
① 決定幾列幾行 → ② 算每個節點的座標
→ ③ 準備鄰接表和 connect() → ④ 每個點牽線回前面的鄰居
```

以下用預設的 7 個節點當例子。

### ① 決定幾列幾行、間距多大

```ts
const rows = Math.max(1, Math.round(Math.sqrt(count / (VIEW_WIDTH / VIEW_HEIGHT))))
const cols = Math.ceil(count / rows)
const stepX = cols > 1 ? (VIEW_WIDTH - PADDING * 2) / (cols - 1) : 0
const stepY = rows > 1 ? (VIEW_HEIGHT - PADDING * 2) / (rows - 1) : 0
```

**列數**：目標是讓每一格接近正方形，橫向和縱向間距差不多，圖才不會被壓扁或拉長。

```
ratio = 畫面長寬比 = VIEW_WIDTH / VIEW_HEIGHT = 820 / 520 ≈ 1.58

cols ≈ ratio × rows      （行數是列數的 ratio 倍，格子才會是正方形）
cols × rows ≈ count      （格子數要放得下所有節點）

代入：ratio × rows² = count
      rows = √(count / ratio)
```

- `Math.round`：列數必須是整數，四捨五入取最接近的，格子最接近正方形
- `Math.max(1, …)`：保底至少 1 列，避免下一行 `count / rows` 除以 0。在 2–99 的範圍內不會觸發，單純是保險

**行數**：用 `Math.ceil` 無條件進位，才放得下所有節點。最後一列沒排滿沒關係。

**間距**：

- `VIEW_WIDTH - PADDING * 2`：左右各留 60，節點中心可以放的範圍是 x = 60 到 760，共 700
- `/ (cols - 1)`：種樹問題。n 個點之間只有 n − 1 個間隔，這樣第一個點會貼齊左邊界、最後一個點貼齊右邊界

```
4 行 → 3 個間隔

●───────●───────●───────●
60     293     527     760
   233     233     233
```

- 只有 1 行或 1 列時 `cols - 1 = 0`，會除以 0，所以間距直接給 0，座標改放在畫面正中間（見步驟 ②）

| 節點數 | 列 × 行 | 橫向間距 | 縱向間距 |
| --- | --- | --- | --- |
| 2 | 1 × 2 | 700 | — |
| 7 | 2 × 4 | 233 | 400 |
| 10 | 3 × 4 | 233 | 200 |
| 50 | 6 × 9 | 88 | 80 |
| 99 | 8 × 13 | 58 | 57 |

**以 7 個點為例**：`rows = round(√(7 / 1.58)) = round(2.1) = 2`，`cols = ceil(7 / 2) = 4`，所以是 2 列 × 4 行。

為什麼不是其他排法？

- **1 × 7**：7 個點排成一直線，只能左右連，沒有上下和斜線，圖太單調
- **3 × 3**：格子變成又扁又長（橫向 350、縱向 200），而且 9 格只放 7 個點，最後一列只剩 1 個
- **2 × 4**：最接近畫面的長寬比，格子最接近正方形，8 格放 7 個點，空格也最少

### ② 算每個節點的座標

```ts
const positions: GraphNode[] = Array.from({ length: count }, (_, index) => ({
  id: toNodeId(index),
  x: cols > 1 ? PADDING + (index % cols) * stepX : VIEW_WIDTH / 2,
  y: rows > 1 ? PADDING + Math.floor(index / cols) * stepY : VIEW_HEIGHT / 2,
}))
```

從 index 算出它在棋盤上的位置：

- **第幾行**：`index % cols`（取餘數，每 `cols` 個一循環）
- **第幾列**：`Math.floor(index / cols)`（除完捨去，滿 `cols` 個換下一列）

7 個節點、4 行：

| index | id | row | col | x | y |
| --- | --- | --- | --- | --- | --- |
| 0 | '1' | 0 | 0 | 60 | 60 |
| 1 | '2' | 0 | 1 | 293 | 60 |
| 2 | '3' | 0 | 2 | 527 | 60 |
| 3 | '4' | 0 | 3 | 760 | 60 |
| 4 | '5' | 1 | 0 | 60 | 460 |
| 5 | '6' | 1 | 1 | 293 | 460 |
| 6 | '7' | 1 | 2 | 527 | 460 |

### ③ 準備鄰接表和 `connect()`

先建一個每個點都有、但還沒有鄰居的空表，再準備一個「把兩個點連起來」的小函式：

```ts
const randomWeight = () => Math.floor(Math.random() * (MAX_WEIGHT - MIN_WEIGHT + 1)) + MIN_WEIGHT
const data: DijkstraGraph = Object.fromEntries(positions.map((node) => [node.id, {}]))

/** 把 a、b 兩個點連起來：隨機一個權重，兩個方向都寫 */
const connect = (a: number, b: number) => {
  const weight = randomWeight()
  data[toNodeId(a)]![toNodeId(b)] = weight
  data[toNodeId(b)]![toNodeId(a)] = weight
}
```

- 空表長這樣：`{ '1': {}, '2': {}, … }`。先把每個點都放進去，`dijkstra()` 才找得到每一個點
- **兩個方向寫同一個權重**：1 → 2 和 2 → 1 一樣遠。一定要兩邊都寫，因為 `dijkstra()` 站在某個點時，只會看 `data[這個點]` 裡有哪些鄰居。如果只寫了 `data['1']['2']`，站在 1 看得到 2，但站在 2 時 `data['2']` 裡沒有 1，就不知道可以走回 1

### ④ 每個點牽線回「前面」的鄰居

照編號一個一個處理點，每個點做兩件事：

1. **一定要做**：從「前面的鄰居」裡隨機挑一個連起來
2. **看運氣**：其他前面的鄰居，每個擲一次骰子，`EXTRA_EDGE_RATE`（50%）的機率連起來

```ts
/** (row, col) 是第幾個點，超出棋盤回傳 -1 */
const getIndex = (row: number, col: number) =>
  row >= 0 && col >= 0 && col < cols ? row * cols + col : -1

for (let index = 1; index < count; index++) {
  const row = Math.floor(index / cols)
  const col = index % cols

  // 1. 找出前面的鄰居：左、上；偶數點再加左上、右上
  const neighbors = [getIndex(row, col - 1), getIndex(row - 1, col)]
  if ((row + col) % 2 === 0) {
    neighbors.push(getIndex(row - 1, col - 1), getIndex(row - 1, col + 1))
  }
  const valid = neighbors.filter((n) => n !== -1)

  // 2. 隨機挑一個「一定要連」的
  const must = valid[Math.floor(Math.random() * valid.length)]!

  // 3. 一定要的直接連，其他的看機率
  for (const n of valid) {
    if (n === must || Math.random() < EXTRA_EDGE_RATE) connect(index, n)
  }
}

return { data, positions }
```

**`getIndex(row, col)`**：步驟 ② 是「第幾個點 → 在哪一格」，這裡反過來，「在哪一格 → 第幾個點」：`row * cols + col`。超出棋盤左邊、右邊、上面時回傳 `-1`，代表那裡沒有點。

**什麼是「前面的鄰居」？** 棋盤上緊貼著自己，而且編號比自己小的格子：

| 方向 | 格子 | 誰有 |
| --- | --- | --- |
| 左 | (row, col − 1) | 每個點 |
| 上 | (row − 1, col) | 每個點 |
| 左上 | (row − 1, col − 1) | 只有 `row + col` 是偶數的點 |
| 右上 | (row − 1, col + 1) | 只有 `row + col` 是偶數的點 |

- **只看前面，不看後面**：右邊、下面的點之後輪到它們時，會回頭看到自己，所以每條線只會處理一次
- **只有偶數點有斜線**：這是直棋的規則。如果每一格的兩條斜線都畫，會交叉成 X，交叉的地方看起來像多了一個點，兩條斜線的權重數字也會擠在格子中間疊在一起。每格只畫一條斜線就不會有這些問題
- 因為只連緊貼著的格子，**線不會穿過其他點**
- 迴圈從 `index = 1` 開始：`index = 0` 是節點 1，在最左上角，前面沒有任何點

**為什麼一定全部連通？** 想像排隊牽手：**每個人都牽著前面某個人的手**。節點 7 牽著前面某個節點，那個節點又牽著更前面的節點……一路往前牽，最後一定牽到節點 1。所以每個節點都連得回節點 1，任選起點和終點都走得到。

**為什麼不每條線都單純擲骰子？** 可能剛好某個點的線全部沒中，變成孤島，起點就走不到終點了。所以每個點先保證有一條「一定要的線」，其他的才擲骰子。

**用 7 個點跑一次**（「例如」和 骰子 是假設的隨機結果）：

```
1 ─ 2 ─ 3 ─ 4
│ ╲ │ ╱ │
5 ─ 6 ─ 7
```

| 節點 | (row, col) | 前面的鄰居 | 一定要連 | 其他的擲骰子 |
| --- | --- | --- | --- | --- |
| 2 | (0, 1) | 左 1 | 1（只有一個可選） | — |
| 3 | (0, 2) 偶數 | 左 2（上、左上、右上都超出棋盤） | 2 | — |
| 4 | (0, 3) | 左 3 | 3 | — |
| 5 | (1, 0) | 上 1 | 1 | — |
| 6 | (1, 1) 偶數 | 左 5、上 2、左上 1、右上 3 | 例如 2 | 5 骰子 中、1 骰子 沒中、3 骰子 中 |
| 7 | (1, 2) | 左 6、上 3 | 例如 6 | 3 骰子 沒中 |

一共 8 條線，畫出來：

```
1 ── 2 ── 3 ── 4
│    │  ╱
5 ── 6 ── 7
```

鄰接表（權重是隨機的）：

```ts
{
  '1': { '2': 4, '5': 7 },
  '2': { '1': 4, '3': 3, '6': 2 },
  '3': { '2': 3, '4': 5, '6': 1 },
  '4': { '3': 5 },
  '5': { '1': 7, '6': 3 },
  '6': { '2': 2, '3': 1, '5': 3, '7': 6 },
  '7': { '6': 6 },
}
```

`EXTRA_EDGE_RATE` 的效果：

| 值 | 結果 |
| --- | --- |
| `0` | 每個點只有「一定要的線」，任兩點之間只有一條路，Dijkstra 沒有東西可以比較 |
| `0.5` | 有些地方有好幾條路可以比較，畫面也不會太擠 |
| `1` | 緊貼的點全部連起來，完整的米字格 |

⚠️ 這個做法有一個小缺點：**最上面一排和最左邊一行每次都會連成一整排**（例如上面的 1─2─3─4 和 1─5），因為那些點前面只有一個鄰居可以選，一定會連到它。其他位置還是隨機的，對 Dijkstra 的動畫沒有影響。

> 另一種做法：先列出所有可以連的線、打亂順序，再用 Union-Find（併查集）一條一條檢查「這條線接的兩個點是不是已經走得到」，走不到的一定要、走得到的擲骰子。這樣第一排、第一行也會是隨機的，但需要懂洗牌和 Union-Find，比較難理解，所以這裡採用上面的簡單版。

## 節點數量輸入：`NumberField.vue`

彈窗裡的節點數量從 `SelectField`（4–10 的下拉選單）改成數字輸入框。

```vue
<NumberField v-model="draft.count" label="節點數量" :min="MIN_NODE_COUNT" :max="MAX_NODE_COUNT" />
```

| Prop | 型別 | 說明 |
| --- | --- | --- |
| `v-model` | `number` | 必填，目前的數值 |
| `label` | `string` | 卡片上方的小標籤 |
| `min` / `max` | `number` | 允許範圍，同時顯示在輸入框右側（`2–99`） |

輸入框內部另外存一份文字 `text`，和 `model` 分開，因為打字途中的內容可能暫時不合法（空白、`1` 準備打成 `15`）：

| 時機 | 行為 |
| --- | --- |
| 打字（`input`） | 是範圍內的整數才寫回 `model`，起點 / 終點選項會即時跟著變；不合法就先不動 |
| 離開輸入框（`blur`）或按 Enter | 修正回範圍內，再把文字同步成 `model` 的值 |

| 輸入 | 結果 |
| --- | --- |
| `15` | 15 |
| `150` | 99 |
| `0` | 2 |
| `7.6` | 8 |
| 空白 | 還原成原本的值 |

- 點「產生並套用」時，瀏覽器會先觸發輸入框的 `blur`，所以送出前一定已經修正過
- ⚠️ 輸入框用 `:value` + `@input` 自己讀值，**不用 `v-model`**：Vue 在 `type="number"` 的 input 上用 `v-model` 會自動把值轉成數字，`text` 就不一定是字串，`commit()` 裡的 `text.value.trim()` 會直接報錯
- 外觀和 `SelectField` 一致（卡片、hover / focus 邊框），樣式在 `src/scss/NumberField.scss`，瀏覽器內建的上下箭頭已隱藏

## 頁面：`DijkstraPage.vue`

圖和起訖點合成一個 ref，是頁面唯一的狀態：

```ts
const config = ref({
  ...createRandomGraph(DEFAULT_NODE_COUNT),
  start: toNodeId(0),
  end: toNodeId(DEFAULT_NODE_COUNT - 1),
})

const graph = computed<Graph>(() => ({
  nodes: config.value.positions,
  edges: toEdges(config.value.data),
}))

const result = computed(() => {
  const { data, start, end } = config.value
  const startTime = performance.now()
  const steps = createDijkstraSteps(data, start, end)
  return { steps, duration: performance.now() - startTime }
})
```

彈窗按確認時，依 `draft` 重新產生整張圖：

```ts
function regenerate() {
  reset()
  const { count, start, end } = draft.value
  config.value = { ...createRandomGraph(count), start, end }
}
```

- 頁面載入：7 個節點，從 `'1'` 走到 `'7'`（左上到最後一個，通常是右下，路徑比較長，動畫比較完整）
- `draft` 是彈窗正在編輯的設定，**按確認才套用**，取消不會改到目前的圖
- 起點 / 終點選項依 `draft.count` 產生；節點數變少時，超出範圍的起點 / 終點會被 `watch` 修正回來（原本就有的邏輯）
- 「產生新資料」每次都會重新產生節點、連線和權重；目前沒有「只換權重、保留版面」的功能

## 畫面：`GraphChart.vue`

### 怎麼把 Node 和 Edge 畫出來

`GraphChart` 用 `v-for` 跑過每個點和每條線，把座標直接填進 SVG 的屬性：

```vue
<!-- 線：填入兩端點的座標 -->
<line :x1="from.x" :y1="from.y" :x2="to.x" :y2="to.y" />

<!-- 點：圓心座標 + 半徑，名稱寫在圓心 -->
<circle :cx="node.x" :cy="node.y" :r="nodeRadius" />
<text :x="node.x" :y="node.y">{{ node.id }}</text>
```

- **先畫線、再畫圓圈**：後畫的會蓋在上面，圓圈才會蓋住線頭
- SVG 設了 `viewBox="0 0 820 520"`，座標都用這個大小來算。畫面變大變小時，整張圖會一起縮放，不用自己換算螢幕像素

**權重數字**放在線的正中間（兩端點座標相加除以 2），再往線的旁邊推一點，數字才不會壓在線上：

```ts
labelX = (from.x + to.x) / 2 + 往旁邊推的距離
labelY = (from.y + to.y) / 2 + 往旁邊推的距離
```

推的方向統一朝上，不會有的線數字在上面、有的在下面。

### 節點變密時自動縮小

99 個節點時格子間距只剩約 57，原本直徑 68 的圓圈會互相重疊，所以依「最近兩個節點的距離」計算縮放比例：

```ts
const scale = computed(() => {
  // 兩兩比較所有節點，找出最近的距離 nearest
  return Math.min(1, nearest / BASE_SPACING)
})
```

| 常數 | 值 | 縮放方式 |
| --- | --- | --- |
| `BASE_SPACING` | `120` | 最近距離 ≥ 120 時用原尺寸（scale = 1） |
| `NODE_RADIUS` | `34` | × scale |
| `NODE_FONT_SIZE` | `20` | × scale |
| `WEIGHT_FONT_SIZE` | `13` | × scale，但不小於 `MIN_WEIGHT_FONT_SIZE = 9` |
| `LABEL_OFFSET` | `14` | × scale（權重標籤離線的距離） |

| 節點數 | 最近距離 | 半徑 | 圓圈之間的空隙 |
| --- | --- | --- | --- |
| 2–10 | ≥ 200 | 34 | ≥ 132 |
| 26 | 約 117 | 33 | 約 51 |
| 50 | 約 80 | 23 | 約 35 |
| 99 | 約 57 | 16 | 約 25 |

- 字級寫在 inline style（`:style="{ fontSize: … }"`），**SCSS 裡的 `.graph-chart__node-label` / `.graph-chart__weight` 不設 `font-size`**，避免兩邊各設一個
- 找最近距離是兩兩比較，99 個節點約 4,800 次，只在 `graph` 改變時重算，不影響播放
- 外框粗細（3 / 5）沒有跟著縮放