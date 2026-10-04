# 快速排序動畫開發文件

## 目的

記錄快速排序頁面（`src/page/QuickSortPage.vue`）的架構、步驟產生規則與新增的顏色狀態。

這是第二個使用同一套渲染架構的頁面，**共用的部分（資料流、各元件 props）不再重複說明**，請先看 [bubble-sort-animation.md](./bubble-sort-animation.md)；版面殼請看 [layout-architecture.md](./layout-architecture.md)。本文只記錄快速排序特有的部分，以及為了它而調整的共用程式碼。

## 這次新增 / 改動的檔案

```
src/algorithms/quickSort.ts        // 新增：快速排序步驟產生器 + 程式碼常數 + 階段標籤
src/page/QuickSortPage.vue         // 改寫：接上 quickSort，換掉 ToolHeader 資訊與圖例
src/types/sort.ts                  // BarState 新增 less / greater；新增 LegendItem 型別
src/component/InputPanel.vue       // 圖例改成 legends prop（預設值維持氣泡排序那組）
src/scss/BarChart.scss             // 新增 --less（cyan）、--greater（text muted）長條樣式
src/scss/InputPanel.scss           // 新增對應的圖例圓點顏色
```

`BarChart`、`CodePanel`、`ToolLayout` 完全沒有改。

## 演算法選擇：Lomuto 分割（in-place）

設計稿上的程式碼是「建立 left / right 兩個新陣列再遞迴合併」的寫法，但那個版本每一層都會產生新陣列，**長條的索引會跟原陣列對不起來**，動畫無法連續。

所以實作改用 **Lomuto 分割法、取最右邊的元素當 pivot、就地交換**：

```ts
function quickSort(arr: number[], low = 0, high = arr.length - 1) {   // 1
  if (low >= high) return arr;                                        // 2
  const pivot = arr[high];                                            // 3
  let i = low;                                                        // 4
  for (let j = low; j < high; j++) {                                  // 5
    if (arr[j] < pivot) {                                             // 6
      [arr[i], arr[j]] = [arr[j], arr[i]];                            // 7
      i++;                                                            // 8
    }                                                                 // 9
  }                                                                   // 10
  [arr[i], arr[high]] = [arr[high], arr[i]];                          // 11
  quickSort(arr, low, i - 1);                                         // 12
  quickSort(arr, i + 1, high);                                        // 13
  return arr;                                                         // 14
}                                                                     // 15
```

好處：

- 陣列長度與每根長條的位置從頭到尾固定，每一步的畫面可以連續銜接
- 右側 `QUICK_SORT_CODE` 顯示的就是實際跑的邏輯，高亮行才有意義
- 空間複雜度確實是 `O(log n)`（只有遞迴堆疊），跟 ToolHeader 標示一致

兩個關鍵變數：

- `i`：**分界線**，`[low, i-1]` 是已確認比 pivot 小的區間，也是下一個小元素要放的位置
- `j`：往右掃描的游標，`[i, j-1]` 是已確認比 pivot 大的區間

## 步驟產生器：`src/algorithms/quickSort.ts`

`createQuickSortSteps(input)` 內部用遞迴函式 `sort(low, high)`，在關鍵時刻呼叫 `push()` 記錄快照。

| Phase | 標籤 | 時機 | 高亮行 |
| --- | --- | --- | --- |
| `start` | `READY` | 開始前 | 1, 2 |
| `pivot` | `PIVOT` | 選定 pivot，準備掃描 | 3, 4 |
| `compare` | `COMPARE` | 比較 `arr[j]` 與 pivot | 5, 6 |
| `swap` | `SWAP` | 把較小值換到分界線（`i === j` 時不產生此步） | 7, 8 |
| `partition` | `PARTITION` | pivot 與分界線交換、就定位；區間只剩 1 個元素時也用這個 | 11 / 2 |
| `done` | `SORTED` | 全部結束 | 14 |

其他規則：

- `pass` 放的是**第幾次分割**（`partitionCount`），所以卡片標籤會顯示成 `PARTITION  /  03`
- `i === j` 時元素本來就在分界線上，不需要交換，**只產生 compare 一步**，避免動畫出現「換了但畫面沒變」的空拍
- `low > high`（空區間）直接 return，不產生步驟
- `low === high`（只剩一個元素）產生一個 `partition` 步驟，說明它直接就定位
- 空陣列只會產生 `start` 一步
- 專案有開 `noUncheckedIndexedAccess`，讀取 `arr[i]` 時用 `?? 0` 處理 `undefined`

同檔案另外匯出 `QUICK_SORT_CODE`（右側程式碼面板的每一行）與 `QUICK_SORT_PHASE_LABEL`（phase → 畫面標籤）。**改程式碼常數內容時要一起檢查高亮行號。**

### 長條狀態怎麼算

`push()` 的第二個參數是 `Partial<PartitionView>`，描述這一步的區間狀態：

| 欄位 | 意義 |
| --- | --- |
| `low` / `high` | 目前處理的區間 |
| `pivotIndex` | pivot 目前所在索引 |
| `boundary` | 分界線 `i`，`[low, boundary-1]` 比 pivot 小 |
| `scanned` | 已掃描到的最後一個索引，`[boundary, scanned]` 比 pivot 大 |
| `comparingIndex` | 正在與 pivot 比較的索引 |

判斷順序（先命中先決定）：

```
comparingIndex          → comparing
pivotIndex              → active
區間內 index < boundary → less
區間內 index <= scanned → greater
placed 有這個 index     → sorted
其他                     → default
```

- `placed` 是一個 `Set`，記錄「已經固定在最終位置」的索引；每次分割完成加入 pivot 的位置，單一元素區間也會加入
- 不傳第二個參數時，預設 `low = 0, high = -1`（空區間），每根長條只會是 `sorted` 或 `default`，用在 `start` / `done` 步驟
- 收尾前會把所有索引加進 `placed`，確保 `done` 步驟一定整排變 cyan

## 長條圖顏色規則

依設計稿指定的三個狀態色：

| 狀態 | 意義 | 長條 | 數字 |
| --- | --- | --- | --- |
| `active` | 基準值 pivot | `$accent-lime` | `$accent-lime` |
| `less` | 比 pivot 小 | `$accent-cyan` | `$accent-cyan` |
| `greater` | 比 pivot 大 | `$text-muted` | `$text-muted` |
| `comparing` | 正在與 pivot 比較 | `$accent-pink` | `$accent-pink` |
| `sorted` | 已固定在最終位置 | `$accent-cyan` | 預設文字色 |
| `default` | 區間外 / 尚未處理 | `$border` | 預設文字色 |

說明：

- `comparing`（pink）是額外加的過場色：掃描到某根長條時先變粉紅，下一步才依比較結果變成 cyan 或 muted 灰，讓「比較」這個動作看得見
- `sorted` 與 `less` 同樣是 cyan，因為兩者語意相近（已確定 / 偏小），左欄圖例合併成一行「小於 pivot・已定位」
- 區間外且還沒定位的長條維持灰色，視覺上會清楚看到「目前只在處理這一段」

## 共用程式碼的調整

### `src/types/sort.ts`

```ts
type BarState = 'default' | 'active' | 'comparing' | 'less' | 'greater' | 'sorted'

interface LegendItem {
  state: BarState
  label: string
}
```

`SortStep` 沒有改，`Phase` 泛型直接吃 `QuickSortPhase`。

### `InputPanel.vue`

圖例從寫死改成 `legends?: LegendItem[]` prop：

- 預設值是氣泡排序那四項，所以 `BubbleSortPage` 不用改也維持原樣
- `QuickSortPage` 傳入自己的五項圖例

⚠️ **`withDefaults` 的預設值會被提升到 `setup()` 外面**，不能引用 `<script setup>` 裡宣告的變數（會報 `defineProps() in <script setup> cannot reference locally declared variables`），所以預設圖例是直接寫成字面值放在工廠函式裡，不能抽成 `const`。

## 頁面組合：QuickSortPage.vue

跟 `BubbleSortPage.vue` 完全同一個骨架，只換掉這些：

```ts
const sortResult = computed(() => {
  const start = performance.now()
  const steps = createQuickSortSteps(arr.value)   // ← 換成 quickSort
  return { steps, duration: performance.now() - start }
})
```

```vue
<ToolHeader index="02" title-zh="快速排序" title-en="QUICK SORT"
            time="O(n log n)" space="O(log n)"
            status-label="STABLE" status-value="NO" status-variant="comparing" />

<InputPanel ... :legends="LEGENDS" />     <!-- 五色圖例 -->
<BarChart title="PARTITION" ... />        <!-- 標題列顯示 VISUALIZATION / PARTITION -->
<CodePanel file-name="quickSort.ts" :lines="QUICK_SORT_CODE" ... />
```

root class 為 `.quick-sort-page`（樣式內容與 `.bubble-sort-page` 相同）。

## 實際步驟長相

以 `[34, 42, 56, 92, 68, 78, 84, 12]` 為例（`a` = active/pivot、`c` = comparing、`l` = less、`g` = greater、`s` = sorted、`.` = default）：

```
00 start      34 42 56 92 68 78 84 12  ........   共 8 筆資料，準備開始
01 pivot      34 42 56 92 68 78 84 12  .......a   以 12 作為 pivot
01 compare    34 42 56 92 68 78 84 12  c......a   比較 [0] 34 與 pivot 12
01 compare    34 42 56 92 68 78 84 12  gc.....a   34 ≥ 12 留在右半邊
...
01 partition  12 42 56 92 68 78 84 34  aggggggg   pivot 12 固定在 [0]
02 pivot      12 42 56 92 68 78 84 34  s......a   以 34 作為 pivot
...
05 compare    12 34 42 56 68 78 84 92  sssslc.a   [5] 78 < pivot 92 → 變 less
...
07 partition  12 34 42 56 68 78 84 92  ssssssss   [4] 只剩 68，位置已確定
07 done       12 34 42 56 68 78 84 92  ssssssss   排序完成
```

8 筆資料約 45 步（氣泡排序同樣長度約 60 多步）。

## 驗證狀態

- `npm run type-check`：通過
- `npm run build-only`（vite build）：通過，SCSS 編譯正常
- 步驟產生器腳本測試：通過。用 Node 直接跑 `createQuickSortSteps`，測了 8 組輸入（一般亂序、空陣列、單一元素、`[2,1]`、`[1,2]`、全部相同、完全逆序、已排序），每一組都檢查：
  - 最後一步的 `arr` 等於 `[...input].sort()`
  - 最後一步所有長條都是 `sorted`
  - 每一步 `arr.length === barStates.length`
  - 每一步的數字集合沒有增減（交換沒寫壞）
- 瀏覽器實際畫面：尚未確認

## 後續待辦（Not in scope）

- 快速排序在「已排序 / 完全逆序」的輸入下會退化成 `O(n²)`（取最右邊當 pivot），之後可以做一個「最壞情況」示範或改成三數取中
- 分割步驟目前沒有畫出遞迴樹，左右子陣列的關係只靠文字說明
- 手動輸入陣列、手機版版面（與氣泡排序共用的待辦）
