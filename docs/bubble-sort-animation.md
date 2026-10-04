# 氣泡排序動畫開發文件

## 目的

記錄氣泡排序頁面（`src/page/BubbleSortPage.vue`）從靜態長條圖改成「依步驟渲染的排序動畫」時的架構、資料流與樣式規則。之後新增快速排序、合併排序等頁面時，可以沿用同一套元件與渲染方式。

版面殼（Header、ToolHeader、ToolLayout 的基本結構）請參考 [layout-architecture.md](./layout-architecture.md)。

## 目錄結構

```
src/types/sort.ts                  // 共用型別：BarState、SortStep
src/algorithms/bubbleSort.ts       // 氣泡排序步驟產生器 + 程式碼常數 + 階段標籤
src/component/BarChart.vue         // 中間：長條圖 + 步驟說明框（新增 barStates / title / message）
src/component/InputPanel.vue       // 左欄：INPUT DATA、產生新資料、CURRENT STEP、圖例
src/component/CodePanel.vue        // 右欄：程式碼、高亮行、狀態列
src/scss/BarChart.scss
src/scss/InputPanel.scss
src/scss/CodePanel.scss
```

## 整體資料流

```
arr（隨機陣列）
  │
  ▼ computed
createBubbleSortSteps(arr) ──► steps: SortStep[]（一次算完所有步驟）
                                   │
                                   ▼
                     step = steps[currentStep]
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
    InputPanel                 BarChart                  CodePanel
  summary/label           arr/barStates/detail      highlightLines/phase
```

`currentStep` 是目前要顯示第幾步的索引，畫面只看 `steps[currentStep]` 這一份快照來渲染。

### 設計決策：為什麼先把所有步驟算好

- 排序只在陣列變動時跑一次，把每個關鍵時刻存成快照（`SortStep`）
- 要顯示哪一步只需要換索引，不需要反向還原交換
- 畫面完全由 `step` 決定，元件都是純顯示，容易除錯
- 代價是記憶體：8 筆資料最多約 60 多步，每步複製一份陣列，量級可以忽略

## 型別：`src/types/sort.ts`

```ts
// less / greater 是快速排序加的，氣泡排序用不到
type BarState = 'default' | 'active' | 'comparing' | 'less' | 'greater' | 'sorted'

interface SortStep<Phase extends string = string> {
  arr: number[]            // 這一步的陣列內容
  barStates: BarState[]    // 每根長條的狀態，與 arr 一一對應
  highlightLines: number[] // 程式碼面板要高亮的行號（從 1 開始）
  phase: Phase             // 目前階段
  pass: number             // 第幾輪
  summary: string          // 左側 CURRENT STEP 卡片的簡短說明（可含 \n）
  detail: string           // 長條圖下方說明框的詳細文字
}
```

`Phase` 用泛型，因為每個演算法的階段不同（氣泡排序是 compare / swap，快速排序會有 partition）。

## 步驟產生器：`src/algorithms/bubbleSort.ts`

沿用原本的雙層迴圈寫法：

```ts
for (let j = arr.length; j > 1; j--)
  for (let i = 0; i < j - 1; i++)
    if (arr[i] > arr[i + 1]) { /* 交換 */ }
```

在迴圈中的關鍵時刻呼叫 `push()` 記錄快照：

| Phase | 標籤 | 時機 | 高亮行 | 長條狀態 |
| --- | --- | --- | --- | --- |
| `start` | `READY` | 開始前 | 1, 2 | 全部 `default` |
| `compare` | `COMPARE` | 比較 `arr[i]` 與 `arr[i+1]` | 5, 6 | `i` → active、`i+1` → comparing |
| `swap` | `SWAP` | 交換完成後 | 7, 8, 9 | `i+1` → active、`i` → comparing |
| `pass` | `PASS DONE` | 每一輪內層迴圈結束 | 4 | 索引 `>= j-1` 變 sorted |
| `done` | `SORTED` | 全部結束 | 13 | 全部 `sorted` |

重點：

- **選中（active）代表「正在往右冒泡的較大值」**。交換後較大值移到 `i+1`，所以 swap 步驟的 active / comparing 位置會對調，讓 lime 色的長條看起來一路往右移動
- 已排序區間用 `sortedFrom` 記錄，索引 `>= sortedFrom` 一律顯示 sorted（優先於 active / comparing）
- 最後一輪（`j = 2`）結束時只剩 `[0]`，`done` 步驟把 `sortedFrom` 設為 0，全部變成 cyan
- 空陣列只會產生 `start` 一步
- 專案有開 `noUncheckedIndexedAccess`，所以讀取 `arr[i]` 時用 `?? 0` 處理 `undefined`

同檔案另外匯出：

- `BUBBLE_SORT_CODE`：右側程式碼面板顯示的每一行，行號與 `highlightLines` 對應，**改程式碼內容時要一起檢查高亮行號**
- `BUBBLE_SORT_PHASE_LABEL`：phase → 畫面標籤

## 元件

### BarChart.vue

新增 / 調整的 props：

| Prop | 說明 | 預設值 |
| --- | --- | --- |
| `arr` | 要顯示的數字陣列 | `[]` |
| `barStates` | 每根長條的狀態 | `[]`（缺值時視為 `default`） |
| `title` | 標題列文字，顯示為 `VISUALIZATION / {title}` | `'BAR CHART'` |
| `currentStep` / `totalSteps` | 右上角 `STEP 06 / 16` | `0` |
| `message` | 下方說明框文字 | `''` |

長條以 `bar-chart__bar--{state}` class 切換顏色，高度與顏色都有 transition。

### InputPanel.vue（左欄）

| Prop / Event | 說明 |
| --- | --- |
| `arr` | 原始輸入陣列，顯示在 INPUT DATA 框 |
| `stepLabel` | CURRENT STEP 卡片標籤，如 `COMPARE  /  03` |
| `stepText` | 卡片說明，支援 `\n` 換行（`white-space: pre-line`） |
| `legends` | 顏色圖例；不傳就用預設的氣泡排序四項（選中 / 比較中 / 已排序 / 尚未處理） |
| `@regenerate` | 點「產生新資料」 |

圖例顏色與長條狀態一致；快速排序頁面會傳入自己的五項圖例，詳見 [quick-sort-animation.md](./quick-sort-animation.md)。

### CodePanel.vue（右欄）

| Prop | 說明 | 預設值 |
| --- | --- | --- |
| `fileName` | 左上檔名（必填） | - |
| `language` | 右上語言標籤 | `'TYPESCRIPT'` |
| `lines` | 程式碼每一行 | `[]` |
| `highlightLines` | 高亮行號（從 1 開始） | `[]` |
| `statusLabel` | 底部狀態列左側，如 `COMPARE` | `''` |
| `statusMeta` | 底部狀態列右側，目前顯示排序步驟產生的耗時 | `''` |

長行會水平捲動，高亮背景用 `min-width: max-content` 跟著延伸。

## 長條圖顏色規則

| 狀態 | 長條 | 數字 | index |
| --- | --- | --- | --- |
| `sorted` 已排序 | `$accent-cyan` | 預設文字色 | `$text-muted` |
| `active` 正在選中 | `$accent-lime` | `$accent-lime` | `$text-muted` |
| `comparing` 被選中比較 | `$accent-pink` | `$accent-pink` | `$text-muted` |
| `default` 未排序 | `$border` | 預設文字色 | `$text-muted` |

## 頁面組合：BubbleSortPage.vue

```ts
const arr = ref(randomArray(...))

const sortResult = computed(() => {
  const start = performance.now()
  const steps = createBubbleSortSteps(arr.value)
  return { steps, duration: performance.now() - start }
})
const steps = computed(() => sortResult.value.steps)
const lastStep = computed(() => steps.value.length - 1) // 第 0 步為初始狀態

const step = computed(() => steps.value[currentStep.value] ?? steps.value[0]!)

function regenerate() {
  arr.value = randomArray(...) // steps 會自動重算
}
```

- 換新陣列時要讓 `currentStep` 回到 0，避免索引超出新的步驟數
- 長條圖顯示的是 `step.arr`（當下快照），左欄 INPUT DATA 顯示的是原始 `arr`
- 各元件拿到的資料對應：
  - `InputPanel`：`arr`、`stepLabel`、`step.summary`、`LEGENDS`
  - `BarChart`：`step.arr`、`step.barStates`、`step.detail`、`currentStep` / `lastStep`
  - `CodePanel`：`BUBBLE_SORT_CODE`、`step.highlightLines`、階段標籤、`sortResult.duration`

## 新增其他排序頁面的步驟

1. 在 `src/algorithms/` 新增 `xxxSort.ts`：定義自己的 `Phase`、`createXxxSteps()`、程式碼常數、階段標籤
2. 新增頁面元件，複製 `BubbleSortPage.vue` 的組合方式，換成新的步驟產生器與 `ToolHeader` 資訊
3. `BarChart`、`InputPanel`、`CodePanel` 都不用改
4. 如果需要新的長條狀態（例如快速排序的 pivot），在 `BarState` 加值，並在 `BarChart.scss`、`InputPanel` 圖例補上對應樣式

## 驗證狀態

- `npm run type-check`：通過
- `vite build`：通過（SCSS 編譯正常）
- 步驟產生器的排序結果腳本測試：尚未執行（執行時被中斷），建議在瀏覽器實際確認每一步的畫面

## 後續待辦（Not in scope）

- 手動輸入陣列（目前只能隨機產生）
- 手機版版面（三欄在窄螢幕尚未調整）
