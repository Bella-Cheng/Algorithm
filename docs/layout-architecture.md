# 版面架構開發文件

## 目的

記錄 `src/layout`、`src/component` 底下 Header、MainLayout、ToolHeader、ToolFooter、ToolLayout 的設計決策與實作重點，供實作與後續維護參考（例如之後新增快速排序、合併排序等頁面時）。使用者自行實作各演算法的邏輯與步驟資料，這份文件只涵蓋 UI／版面架構。

## 目錄結構

```
src/component/
  Header.vue        // 全站頂部 chrome：logo (ALGO ATELIER) + 首頁/演算法庫導覽 + 右側徽章
  ToolHeader.vue     // 單一演算法頁面頂部的資訊列（編號 + 中英文標題 + TIME/SPACE/STABLE）
  ToolFooter.vue      // 底部執行控制列（重置/上一步/執行/下一步 + 進度條 + 速度切換）
src/layout/
  MainLayout.vue     // <Header /> + <router-view />，App.vue 直接使用
  ToolLayout.vue      // 左右欄位（slot，目前留空）+ ToolFooter 的殼
```

Header 是全站唯一、每頁都存在的頂部 chrome，因此只需要一個頂層 layout（MainLayout）負責渲染它，不需要兩個互斥的頂層 layout 各自重複渲染 header。

`ToolHeader` 跟 `ToolLayout` 是分開的：`ToolHeader` 放在各演算法頁面（如 `src/page/BubbleSortPage.vue`）裡使用，不放進 `ToolLayout`。原因見「設計決策：ToolHeader 為什麼不放進 ToolLayout」。

## Header.vue 設計重點

對照截圖 `螢幕擷取畫面 2026-09-13 215409.png`：

- **左側**：`//` 圖示方塊（lime 底色、圓角）+「ALGO ATELIER」文字
- **右側**：「首頁」「演算法庫」導覽 + 一顆 pill 徽章顯示目前演算法名稱（或 `headerBtnText`）
- **導覽連結**：
  - 「首頁」用 `router-link` 指到現有的 `/` 路由
  - 「演算法庫」目前無對應路由，先用不可點擊的靜態文字，不因此新增路由
- **演算法名稱徽章**：開放一個 prop（`headerBtnText: string`，可給預設值），讓不同頁面代入不同名稱，而非寫死「QUICK SORT」
- **徽章配色**：`app-header__badge` 用「dim 底 + 亮字」（`background: $color-primary-soft`、`color: $color-primary`），跟 `ToolHeader` 的 status chip 視覺一致，而不是實心亮色底配深色字
- **樣式**：沿用既有 `src/scss/_variables.scss` 的變數（`$header-height`、`$accent-lime`、`$surface`、`$border`、`$font-mono` 等），不新增新的色彩/字體變數
- **分隔線**：底部 1px 分隔線，背景使用 `$canvas`

## MainLayout.vue 設計重點

- 極簡結構：`<Header /> <router-view />`
- `.main-layout` 為 `flex; flex-direction: column; min-height: 100vh`，`.main-layout__content` 補上 `display: flex; flex-direction: column; min-height: 0`，讓 `<RouterView />` 渲染出來的頁面（如 `BubbleSortPage.vue`）可以用 `flex: 1` 撐滿剩餘高度，`ToolFooter` 才會貼齊視窗底部而不是浮在內容下面
- `App.vue` 直接渲染 `<MainLayout />`

## ToolHeader.vue 設計重點

對照截圖 `螢幕擷取畫面 2026-09-13 215409.png` 的第二列（快速排序範例）與 Figma 稿的 STABLE 徽章樣式。

Props：

| Prop | 說明 | 預設值 |
| --- | --- | --- |
| `index` | 左側編號 | `'01'` |
| `titleZh` | 中文標題（必填） | - |
| `titleEn` | 英文副標題（必填） | - |
| `time` | TIME 複雜度 Big-O 字串（必填） | - |
| `space` | SPACE 複雜度 Big-O 字串（必填） | - |
| `statusLabel` | 最後一顆 chip 的標籤，如 `STABLE`、`WEIGHT` | `'STABLE'` |
| `statusValue` | 最後一顆 chip 的值，如 `YES`、`NO`、`≥ 0` | `'YES'` |
| `statusVariant` | 最後一顆 chip 的色彩變體：`primary` / `comparing` / `warning` | `'primary'` |

`statusVariant` 對應色彩（底色為對應主色的低透明度／dim 版本，文字為對應主色本身，兩色同色相疊加，而非實心底配反白字）：

| Variant | 底色 | 文字色 | 對應場景 |
| --- | --- | --- | --- |
| `primary` | `$color-primary-soft` | `$color-primary`（亮綠） | STABLE YES |
| `comparing` | `rgba($accent-pink, 0.16)` | `$color-comparing`（粉紅） | STABLE NO |
| `warning` | `rgba($accent-amber, 0.16)` | `$color-warning`（琥珀） | WEIGHT ≥ 0 等非穩定排序的替代指標 |

使用範例（`src/page/BubbleSortPage.vue`）：

```vue
<ToolHeader
  index="01"
  title-zh="氣泡排序"
  title-en="BUBBLE SORT"
  time="O(n²)"
  space="O(1)"
  status-label="STABLE"
  status-value="YES"
  status-variant="primary"
/>
```

## ToolFooter.vue 設計重點

對照截圖底部的執行控制列。純展示用元件，**尚未接上任何播放邏輯**（按鈕沒有 click handler / emit，純 UI）。

結構（由左到右）：

1. `__controls`：重置（↺）、上一步（‹）、執行（▶ 執行，綠色 pill，視覺主按鈕）、下一步（›）
2. `__progress`：「執行進度」標籤 + 進度條，依 `currentStep / totalSteps` 算填色比例
3. `__step-count`：目前步數 / 總步數，如 `06 / 16`
4. `__speed`：「速度」標籤 + 速度切換按鈕（依 `speedOptions` 產生，`activeSpeed` 決定哪顆是亮綠底的選中狀態）

Props：

| Prop | 說明 | 預設值 |
| --- | --- | --- |
| `currentStep` | 目前步驟（demo 資料） | `6` |
| `totalSteps` | 總步驟數（demo 資料） | `16` |
| `speedOptions` | 可選速度清單 | `[0.5, 1, 2]` |
| `activeSpeed` | 目前選中的速度 | `1` |

> `06 / 16` 這組數字目前是寫死的示範資料，代表「這次演算法動畫總共拆成幾個步驟、目前顯示第幾步」。之後接上真正的排序步驟資料後，要把即時的步數傳入 `current-step` / `total-steps`，進度條才會跟著動。

## ToolLayout.vue 設計重點

- 結構：`左側欄位（slot #left）` + `主內容（預設 slot）` + `右側欄位（slot #right）`，下方接 `ToolFooter`
- 左右欄位**目前只搭版面，不放內容**（寬度分別 280px / 360px，用邊框跟主內容區隔），對應截圖左側 INPUT DATA 面板與右側程式碼面板的位置，實際內容留給之後的頁面開發
- 不透過巢狀路由實作，而是頁面元件（如 `BubbleSortPage.vue`）直接引用 `ToolLayout` 並用 slot 組合內容

使用範例：

```vue
<ToolLayout>
  <template #left></template>
  <template #right></template>
</ToolLayout>
```

## 設計決策：ToolHeader 為什麼不放進 ToolLayout

1. **每個演算法頁面的 ToolHeader 內容都不同**：`time`、`space`、`statusValue` 等都是「跟該演算法綁定的資料」，本質上屬於頁面資料，不是共用版面結構。
2. **`ToolLayout` 定位是純結構殼**（側欄 + footer），沒有涵蓋 header；如果把 `ToolHeader` 塞進去，`ToolLayout` 就要多開一整組 pass-through props 幫忙轉傳演算法資訊，混淆了「共用版面」與「頁面資料」兩種職責。
3. 這樣分層後，之後新增演算法頁面（如快速排序）只需要新建頁面元件，各自帶入專屬的 `ToolHeader` props，`ToolLayout` 完全不用改。

## 後續待辦（Not in scope）

- `ToolFooter` 的播放邏輯：執行/暫停狀態、上一步/下一步/重置的實際行為、速度切換的即時生效，都還沒實作
- 左右欄位實際內容：左側 INPUT DATA（陣列輸入、產生新資料、目前步驟說明、圖例）、右側程式碼高亮面板，都還沒實作
- `ToolFooter` 的 `currentStep` / `totalSteps` 需要接上真正的演算法步驟資料來源
