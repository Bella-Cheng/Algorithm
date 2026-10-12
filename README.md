# ALGO ATELIER

逐步視覺化演算法執行過程的互動式學習平台。每個演算法都會先把所有步驟算好，再透過播放器一步步呈現，並同步高亮對應的程式碼行。

🔗 線上版：<https://bella-cheng.github.io/Algorithm/>

## 功能

- **演算法庫**：可依分類（排序 / 圖論）、難度（基礎 / 進階）篩選，並支援關鍵字搜尋
- **步驟播放器**：執行 / 暫停、上一步、下一步、重置，支援 0.5× / 1× / 2× 倍速
- **程式碼同步高亮**：右側程式碼面板會依目前步驟標示正在執行的程式碼行
- **自訂資料**：排序頁可設定資料筆數（4–12 筆）與值域，自動產生不重複的隨機資料；Dijkstra 頁可重新產生邊的權重

### 目前收錄的演算法

| #  | 演算法            | 分類 | 時間複雜度  | 路由          |
| -- | ----------------- | ---- | ----------- | ------------- |
| 01 | 氣泡排序          | 排序 | O(n²)       | `/BubbleSort` |
| 02 | 快速排序          | 排序 | O(n log n)  | `/QuickSort`  |
| 03 | Dijkstra 最短路徑 | 圖論 | O(E log V)  | `/Dijkstra`   |

## 技術棧

- [Vue 3](https://vuejs.org/)（`<script setup>` + TypeScript）
- [Vite](https://vite.dev/)
- [Vue Router](https://router.vuejs.org/)（Hash 模式）
- [Pinia](https://pinia.vuejs.org/)
- [Reka UI](https://reka-ui.com/)
- SCSS

## 開始使用

需要 Node.js `^22.18.0` 或 `>=24.12.0`。

```sh
# 安裝套件
npm install

# 啟動開發伺服器
npm run dev

# 型別檢查 + 打包
npm run build

# 預覽打包結果
npm run preview
```

> Vite 的 `base` 設為 `/Algorithm/`（對應 GitHub Pages 路徑），開發時請開啟 `http://localhost:5173/Algorithm/`。

## 專案結構

```
src/
  algorithms/   // 各演算法的步驟產生器、程式碼常數、隨機資料產生
  component/    // 共用元件：Header、ToolHeader、ToolFooter、BarChart、GraphChart、CodePanel、InputPanel、DataModal…
  composables/  // useStepPlayer：播放器狀態與控制邏輯
  data/         // library.ts：首頁與演算法庫共用的模組清單
  layout/       // MainLayout（全站）、ToolLayout（演算法頁左右欄 + 底部播放器）
  page/         // 首頁、演算法庫、各演算法頁面
  router/       // 路由設定
  scss/         // 各元件樣式與共用變數（_variables.scss 會自動注入每個 SCSS 檔）
  stores/       // Pinia stores
  types/        // 型別定義（sort、graph、library…）
  utils/        // 格式化、預覽圖等小工具
docs/           // 開發文件
```

## 架構概念

```
演算法函式 ──► steps[]（每一步的完整快照）
                  │
                  ▼
        useStepPlayer ──► currentStep
                  │
                  ▼
   頁面依 steps[currentStep] 渲染圖表、資訊面板與程式碼高亮
```

- 演算法在載入時一次產生所有步驟快照，畫面只負責依 `currentStep` 渲染，因此上一步 / 下一步都能任意切換
- `ToolFooter` 是純 UI，只發出事件；播放狀態全部放在 `useStepPlayer`

## 新增演算法

1. 在 `src/algorithms/` 新增步驟產生器（回傳 `steps[]`）與程式碼行常數
2. 在 `src/page/` 新增頁面，組合 `ToolHeader`、`ToolLayout`、`InputPanel`、`CodePanel`、`ToolFooter` 與 `useStepPlayer`
3. 在 `src/router/index.ts` 新增路由，並設定 `meta.headerBtnText`
4. 在 `src/data/library.ts` 的 `MODULES` 加入模組資料，首頁與演算法庫就會自動顯示

詳細步驟請參考 [docs/bubble-sort-animation.md](docs/bubble-sort-animation.md)。

## 開發文件

請見 [docs/README.md](docs/README.md)。

## 部署

推送到 `main` 分支後，GitHub Actions（`.github/workflows/deploy.yml`）會自動執行 `npm run build`，並將 `dist/` 部署到 GitHub Pages。
