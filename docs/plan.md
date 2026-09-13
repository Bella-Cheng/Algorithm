# Header + MainLayout 規劃文件

## 目的

這份文件記錄 `src/layout` 底下 Header 與 MainLayout 的設計決策與實作重點，供實作與後續維護參考。使用者自行實作各演算法的邏輯，這部分只涵蓋 UI／版面架構。

## 目錄結構

```
src/layout/
  Header.vue       // 純 UI：logo (ALGO ATELIER) + 首頁/演算法庫導覽 + 右側演算法名稱標籤
  MainLayout.vue    // <Header /> + <router-view />，App.vue 直接使用
```

Header 是全站唯一、每頁都存在的頂部 chrome，因此只需要一個頂層 layout（MainLayout）負責渲染它，不需要兩個互斥的頂層 layout 各自重複渲染 header。

`ToolLayout.vue`（側欄/footer 的 slot 殼）留待未來頁面需要時再實作，不在本次範圍，設計方向見文末「後續待辦」。

## Header.vue 設計重點

對照截圖 `螢幕擷取畫面 2026-09-13 215409.png`：

- **左側**：`//` 圖示方塊（lime 底色、圓角）+「ALGO ATELIER」文字
- **右側**：「首頁」「演算法庫」導覽 + 一顆綠色 pill 徽章顯示目前演算法名稱
- **導覽連結**：
  - 「首頁」用 `router-link` 指到現有的 `/` 路由
  - 「演算法庫」目前無對應路由，先用不可點擊的靜態文字，不因此新增路由
- **演算法名稱徽章**：開放一個 prop（例如 `algorithmName: string`，可給預設值），讓不同頁面代入不同名稱，而非寫死「QUICK SORT」
- **樣式**：沿用既有 `src/scss/_variables.scss` 的變數（`$header-height`、`$accent-lime`、`$surface`、`$border`、`$font-mono` 等），不新增新的色彩/字體變數
- **分隔線**：底部 1px 分隔線，背景使用 `$canvas`

## MainLayout.vue 設計重點

- 極簡結構：`<Header :algorithm-name="..." /> <router-view />`
- `algorithmName` 先以簡單方式帶入（例如讀取 `route.meta.algorithmName`），不做額外狀態管理
- `App.vue` 之後要改成直接渲染 `<MainLayout />`（實際改動待下一步實作階段）

## 後續待辦（Not in scope）

- `ToolLayout.vue`：左右側欄 + footer 的具名 slot 殼，供需要工作區外觀的頁面（如演算法練習頁）在自己的 template 內引用；不透過巢狀路由實作，而是頁面元件直接引用此元件並用 slot 組合內容。此項目標註為未來項目，本次不實作。
