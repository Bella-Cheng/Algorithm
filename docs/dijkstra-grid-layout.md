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
| `EXTRA_EDGE_RATE` | `0.5` | 生成樹以外的相鄰連線被保留的機率，見下方步驟 ⑤ |

## 節點名稱：`toNodeId(index)`

```ts
export const toNodeId = (index: number) => String(index + 1)
```

使用 **index + 1 當作節點名稱（ index 都是從 0 開始）** 

## `createRandomGraph(count)` 流程

```
① 決定幾列幾行 → ② 算每個節點的座標 → ③ 列出所有「可以連」的線
→ ④ 打亂順序 → ⑤ 挑出要畫的線 → ⑥ 配權重，寫成鄰接表
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

### ③ 列出所有「可以連」的線

先定義 ② 的反向函式，給 (row, col) 回傳那一格的 index：

```ts
const indexAt = (row: number, col: number) => {
  const index = row * cols + col
  return col >= 0 && col < cols && index < count ? index : -1
}
```

- `col >= 0 && col < cols`：防止往左右超出棋盤。少了這個檢查，(0, 4) 會算成 index 4，從右邊界繞到下一列去
- `index < count`：最後一列沒排滿的空格
- 不合法時回傳 `-1`

接著每個節點往右、往下找鄰居：

```ts
const candidates: [number, number][] = []
for (let index = 0; index < count; index++) {
  const row = Math.floor(index / cols)
  const col = index % cols
  const directions = [
    [0, 1],   // 右
    [1, 0],   // 下
  ]
  if ((row + col) % 2 === 0) directions.push([1, 1], [1, -1])   // 右下、左下

  for (const [dRow, dCol] of directions) {
    const next = indexAt(row + dRow!, col + dCol!)
    if (next !== -1) candidates.push([index, next])
  }
}
```

`directions` 裡的 `[0, 1]`、`[1, 0]` **不是座標，而是「往哪邊走一格」**，寫法是 `[列要加幾, 行要加幾]`。拿目前的位置加上它，就是旁邊那一格：

| directions | 方向 | 例：從 (1, 1) 出發 |
| --- | --- | --- |
| `[0, 1]` | 右 | (1, 2) |
| `[1, 0]` | 下 | (2, 1) |
| `[1, 1]` | 右下 | (2, 2) |
| `[1, -1]` | 左下 | (2, 0) |

- **只往右、往下找**：A 往右找到 B，B 就不用再往左找回 A，每條線只會列一次
- **只有 `row + col` 為偶數的點有斜線**：直棋的規則。如果每一格的兩條斜線都畫，會交叉成 X，交叉的地方看起來像多了一個點，兩條斜線的權重數字也會擠在格子中間疊在一起。每格只畫一條斜線就不會有這些問題
- 因為只連相鄰的格子，**線不會穿過其他節點**

7 個節點的棋盤與候選線：

```
0 ─ 1 ─ 2 ─ 3
│ ╲ │ ╱ │
4 ─ 5 ─ 6
```

| 節點 | (row, col) | 偶數？ | 找到的線 |
| --- | --- | --- | --- |
| 0 | (0, 0) | ✓ | `[0,1]` `[0,4]` `[0,5]`（左下超出棋盤） |
| 1 | (0, 1) | ✗ | `[1,2]` `[1,5]` |
| 2 | (0, 2) | ✓ | `[2,3]` `[2,6]` `[2,5]`（右下那格沒有節點） |
| 3 | (0, 3) | ✗ | 右邊、下面都沒有節點 |
| 4 | (1, 0) | ✗ | `[4,5]` |
| 5 | (1, 1) | ✓ | `[5,6]` |
| 6 | (1, 2) | ✗ | 右邊沒有節點 |

共 10 組。這只是「**可以**連的」，還沒決定「**要**連哪些」。

### ④ 打亂順序：`shuffle()`

```ts
function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}
```

Fisher–Yates 洗牌，每種排列出現的機率相同：

- `[...items]` 複製**外層**陣列，不改到傳進來的原陣列
- `i` 從最後一格往前走，每一輪從還沒定案的 `0`–`i` 隨機抽一格 `j`，和第 `i` 格交換，第 `i` 格就定案了
- `j` 只能抽 `0`–`i`，不能抽到後面已經定案的格子，否則結果會不平均
- `[a, b] = [b, a]` 是解構賦值的交換寫法，等同用暫存變數交換
- `!` 是因為專案開了 `noUncheckedIndexedAccess`，`result[j]` 的型別是 `T | undefined`
- 行首的 `;` 是因為專案不寫分號，這行又以 `[` 開頭，沒有 `;` 會被接到上一行，變成 `Math.floor(...)[...]`

打亂的目的：步驟 ⑤ 是「先看到的先處理」，順序不同，挑出來的圖就不同。

### ⑤ 挑出要畫的線（Union-Find）

```ts
const parent = positions.map((_, index) => index)
const find = (node: number): number => (parent[node] === node ? node : (parent[node] = find(parent[node]!)))
const picked = new Set<[number, number]>()
for (const pair of shuffle(candidates)) {
  const [a, b] = pair
  const isTreeEdge = find(a) !== find(b)
  if (!isTreeEdge && Math.random() >= EXTRA_EDGE_RATE) continue
  parent[find(a)] = find(b)
  picked.add(pair)
}
```

**為什麼不每條線都單純擲骰子？** 可能剛好某個節點的線全被丟掉，變成孤島，起點就走不到終點了。所以先保證所有節點連通，再隨機加線。

**Union-Find（併查集）**用來回答「這兩個點現在已經連通了嗎？」：

- 把節點分成「群組」，每個群組有一個代表（老大）
- `parent[x]`：x 的上一層是誰。一開始 `parent = [0, 1, 2, …]`，每個點的上一層都是自己，各自一群
- `find(x)`：一路往上找到 `parent[x] === x` 的老大。**兩點的 `find` 結果相同，就是同一群、已經連通**
- `parent[node] = find(...)`：路徑壓縮，找到老大後把沿路節點直接指向老大，下次查詢更快。拿掉結果一樣，只是比較慢

這裡說的「連通」，是指**到目前為止已經挑好的線**能不能從 a 走到 b，不是指最後的圖。一開始一條線都還沒挑，每個點都走不到別人，所以各自一群；之後每挑一條線，就把兩群合成一群。

每條線的判斷：

| 情況 | 意思 | 處理 |
| --- | --- | --- |
| `find(a) !== find(b)` | 兩群還沒連通，這條能接起來 | **一定要**（生成樹的邊） |
| `find(a) === find(b)` | 本來就走得到，這條是額外的 | 依 `EXTRA_EDGE_RATE` 擲骰子 |

要的話就合併群組，並把這條線記下來：

```ts
parent[find(a)] = find(b)   // 把 a 那群的老大，掛到 b 那群的老大底下
picked.add(pair)
```

⚠️ 合併時一定要用**老大**（`find(a)`），不能寫 `parent[a] = b`。如果 a 不是老大，這樣只會把 a 自己從原本的群組拆出來，接到 b 那邊；a 原本那群的其他點還是沒接上。

**實際跑一次**（假設洗牌後的順序如下，🎲 是假設的 `Math.random()` 結果）：

| 線 | find(a) | find(b) | 同群？ | 結果 | 目前的群組 |
| --- | --- | --- | --- | --- | --- |
| [2,5] | 2 | 5 | 否 | ✅ 必要 | {2,5} |
| [0,1] | 0 | 1 | 否 | ✅ 必要 | {0,1} {2,5} |
| [1,5] | 1 | 5 | 否 | ✅ 必要 | {0,1,2,5} |
| [4,5] | 4 | 5 | 否 | ✅ 必要 | {0,1,2,4,5} |
| [0,5] | 5 | 5 | 是 | 🎲 0.73 ≥ 0.5 → 跳過 | 不變 |
| [2,3] | 5 | 3 | 否 | ✅ 必要 | {0,1,2,3,4,5} |
| [5,6] | 3 | 6 | 否 | ✅ 必要 | **全部連通** |
| [0,4] | 6 | 6 | 是 | 🎲 0.21 < 0.5 → 保留 | 不變 |
| [1,2] | 6 | 6 | 是 | 🎲 0.88 → 跳過 | 不變 |
| [2,6] | 6 | 6 | 是 | 🎲 0.40 → 保留 | 不變 |

- 必要的線剛好 **n − 1 = 6** 條：7 個獨立的群組每合併一次少一群，合併 6 次剩 1 群。這 6 條就是隨機生成樹（等同隨機順序的 Kruskal 演算法）
- 額外保留 2 條，總共 8 條

`EXTRA_EDGE_RATE` 的效果：

| 值 | 結果 |
| --- | --- |
| `0` | 只剩生成樹，任兩點之間只有一條路，Dijkstra 沒有東西可以比較 |
| `0.5` | 有些地方有多條路可以比較，畫面也不會太擠 |
| `1` | 相鄰的點全部連起來，完整的米字格 |

### ⑥ 配權重，寫成鄰接表

```ts
const randomWeight = () => Math.floor(Math.random() * (MAX_WEIGHT - MIN_WEIGHT + 1)) + MIN_WEIGHT
const data: DijkstraGraph = Object.fromEntries(positions.map((node) => [node.id, {}]))
for (const pair of candidates) {
  if (!picked.has(pair)) continue
  const from = toNodeId(pair[0])
  const to = toNodeId(pair[1])
  const weight = randomWeight()
  data[from]![to] = weight
  data[to]![from] = weight
}

return { data, positions }
```

- 先用 `Object.fromEntries` 建一個每個節點都有、但還沒有鄰居的空表：`{ '1': {}, '2': {}, … }`。這樣即使是只有 1 條線的節點，也一定是 `data` 的 key（`dijkstra()` 用 `for (const node in data)` 建 distance table）
- 跑的是**原本的 `candidates`**（不是洗過的），寫入順序固定
- **兩個方向寫同一個權重**：無向圖，1 → 2 和 2 → 1 一樣遠。一定要兩邊都寫，因為 `dijkstra()` 站在某個點時，只會看 `data[這個點]` 裡有哪些鄰居。如果只寫了 `data['1']['2']`，站在 1 看得到 2，但站在 2 時 `data['2']` 裡沒有 1，就不知道可以走回 1

⚠️ `picked.has(pair)` 找得到，是因為 `Set` 比對的是**同一個陣列參考**，不是內容：

```ts
const s = new Set([[0, 1]])
s.has([0, 1])  // false：內容一樣，但這是另一個新陣列
```

`shuffle` 的 `[...items]` 只複製外層，裡面每一組 `[a, b]` 還是 `candidates` 原本那一個，所以 `picked` 存的和 `candidates` 裡的是同一個參考。**之後如果改成深拷貝，或在 ⑤ 重新建立 `[a, b]`，這裡就會全部找不到**，要改成用字串 key（例如 `edgeKey`）比對。

上面例子的結果（權重是隨機的）：

```ts
{
  '1': { '2': 4, '5': 7 },
  '2': { '1': 4, '6': 2 },
  '3': { '4': 5, '6': 1, '7': 8 },
  '4': { '3': 5 },
  '5': { '1': 7, '6': 3 },
  '6': { '2': 2, '3': 1, '5': 3, '7': 6 },
  '7': { '3': 8, '6': 6 },
}
```

```
1 ── 2    3 ── 4
│    │  ╱ │
5 ── 6 ── 7
```

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