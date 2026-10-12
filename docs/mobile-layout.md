# 手機版版面開發文件

## 目的

記錄演算法工具頁（氣泡排序、快速排序、Dijkstra）在手機上的版面規則。手機版不是把桌機三欄縮小，而是重新排成上下結構。桌機版面請看 [layout-architecture.md](./layout-architecture.md)。

## 斷點

```scss
// src/scss/_variables.scss
$breakpoint-mobile: 768px;      // 寬度 ≤ 768px 套用手機版
$player-overlay-height: 76px;   // 疊在圖表上的播放器高度
```

手機版的差異**全部寫在各元件 SCSS 的 `@media (max-width: $breakpoint-mobile)` 裡**，元件的 JS 不判斷是不是手機。

## 版面結構（ToolLayout.scss）

```
┌─────────────────────┐
│  ToolHeader          │
├─────────────────────┤
│  main 圖表區  1.6fr  │
│                      │
│ ┌─────────────────┐ │
│ │ 播放器（疊上來） │ │ ← ToolFooter，grid-area 同為 main，align-self: end
│ └─────────────────┘ │
├─────────────────────┤
│ [步驟][程式碼][產生新資料] │ ← tabs，auto
├─────────────────────┤
│  panel 下方面板  1fr  │ ← 左欄 InputPanel 或右欄 CodePanel，一次只顯示一個
└─────────────────────┘
```

```scss
grid-template-areas: 'main' 'tabs' 'panel';
grid-template-rows: minmax(0, 1.6fr) auto minmax(0, 1fr);
```

- 圖表區和下方面板依 **1.6 : 1** 分配剩餘高度。要讓圖表區更高就把 `1.6fr` 調大
- `minmax(0, …)` 讓列可以比內容矮，內容放不下時在面板內捲動，比例才不會被撐開
- `__body` 設 `display: contents`，左欄、主內容、右欄直接變成 grid 的子項
- 「步驟 / 程式碼」切換的是 `activePanel`，沒選到的欄位加 `--inactive`（`display: none`）
- 「產生新資料」emit `regenerate`，頁面要在 `<ToolLayout @regenerate="...">` 接住

## 播放器疊在圖表上

ToolFooter 和圖表區共用 `main` 這格，貼齊底部，背景是由透明漸層到 `$canvas`。

⚠️ 因此 **BarChart / GraphChart 手機版的 `padding-bottom` 都是 `$player-overlay-height`**，圖才不會被播放器蓋住。改播放器高度時只要改這個變數。

播放器在手機上：進度條移到最上面、隱藏「執行進度」標籤與速度按鈕，速度改成下拉選單（`SelectMenu`）。

## 各元件在手機版的差異

| 元件 | 手機版 |
| --- | --- |
| Header | 高度 56px、隱藏演算法名稱徽章 |
| ToolHeader | 改成上下兩列；複雜度 chip 可橫向捲動 |
| BarChart / GraphChart | **隱藏標題列與下方說明框**，把高度留給圖 |
| GraphChart | 左右 padding 只留 4px，讓 SVG 拿到最多寬度 |
| BarCanvas | 調整底部數字與 index 的空間 |
| GraphCanvas | 節點、字級、線寬放大（見下方） |
| InputPanel | 「CURRENT STEP」排到最上面；隱藏面板內的「產生新資料」按鈕（改用 tabs 那顆） |
| CodePanel | 縮小 padding |

## 加權圖（GraphCanvas）的大小

### 為什麼手機要另外放大

SVG 會**等比例**縮放到容器寬度。手機寬度約 340px，整張圖大約只剩 0.4 倍，所以手機版要把節點、字、線在 SVG 座標裡畫得更大。

圖的大小是被**寬度**限制的：寬度用滿後，再把圖表區加高也不會讓圖變大，只會多出上下空白。

### 尺寸對照

數字都是 SVG 座標單位，實際顯示大小要再乘上縮放比例。

| 項目 | 桌機 | 手機 | 位置 |
| --- | --- | --- | --- |
| 節點半徑 | `40` | `48` | 桌機：`GraphCanvas.vue` 的 `NODE_RADIUS`；手機：`GraphCanvas.scss` 的 `r: 48px` |
| 節點文字 | `26px` | `32px` | `.graph-canvas__node-label` |
| 權重數字 | `22px` | `28px` | `.graph-canvas__weight` |
| 一般 / 路徑 / 檢查中的線 | `2` / `5` / `3` | `4` / `9` / `6` | `.graph-canvas__edge` |
| 節點外框 / 檢查中外框 | `3` / `5` | `4` / `8` | `.graph-canvas__node` |
| 權重離邊的距離 | `22` | 共用 | `GraphCanvas.vue` 的 `LABEL_OFFSET` |

手機版規則寫在 `.graph-canvas:not(.graph-canvas--compact)` 底下，所以首頁 / 演算法庫的卡片預覽（`compact`）不受影響。

### 調整時要一起改的值

1. **手機節點半徑 ↔ `VIEW_MARGIN`**：`VIEW_MARGIN`（目前 56）要大於「最大節點半徑 + 外框線寬的一半」，否則最外圈的節點會被切掉。例如手機 `r` 改成 56，`VIEW_MARGIN` 至少要 64
2. **權重字級 ↔ `LABEL_OFFSET`**：字放大後壓到線，就加大 `LABEL_OFFSET`
3. **節點半徑 ↔ 節點間距**：最短的邊（B-C）長 186，半徑太大相鄰節點會碰在一起。要拉開就改 `dijkstra.ts` 的 `NODE_POSITIONS`，viewBox 會自動跟著調整

## 設計決策

- **只用 CSS 判斷手機，不用 `matchMedia`**：斷點只寫在 `_variables.scss` 一個地方，元件不需要知道目前是不是手機。代價是 viewBox、`LABEL_OFFSET` 這些 SVG 屬性 CSS 改不到，只能桌機手機共用
- **節點半徑用 CSS 的 `r`**：舊版 Safari 不支援時會退回 HTML 屬性的 40，只是手機上小一點，不會壞
- **viewBox 依節點自動計算**：原本固定 `0 0 820 520`，節點沒用到的空白讓上下留白不對稱，改成貼齊節點後桌機手機都對稱，圖也變大
- **隱藏圖表標題列與說明框**：手機高度有限，優先留給圖。下方「步驟」面板仍有這一步的標籤（含已處理數量）與摘要（`step.summary`）；被隱藏的是較長的詳細說明（`step.detail`），手機上目前看不到
