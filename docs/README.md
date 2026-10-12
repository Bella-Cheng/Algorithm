# 開發文件目錄

這個資料夾記錄演算法平台前端（`website/`）的架構、設計決策與實作細節。

## 建議閱讀順序

1. [layout-architecture.md](./layout-architecture.md)：先了解整個頁面的版面殼
2. [bubble-sort-animation.md](./bubble-sort-animation.md)：第一個動畫頁面，說明所有頁面共用的「步驟快照」渲染架構
3. [step-player.md](./step-player.md)：底部播放器怎麼控制 `currentStep`
4. [mobile-layout.md](./mobile-layout.md)：改手機版畫面前先看
5. 其他演算法頁面的文件只記錄自己特有的部分，需要時再看

## 文件列表

### 共用架構

| 文件 | 內容 |
| --- | --- |
| [layout-architecture.md](./layout-architecture.md) | 版面架構：`Header`、`MainLayout`、`ToolHeader`、`ToolFooter`、`ToolLayout` 的設計決策與實作重點 |
| [step-player.md](./step-player.md) | 步驟播放器：`useStepPlayer` composable 與 `ToolFooter`，負責執行、暫停、重置、上一步、下一步與倍速 |
| [mobile-layout.md](./mobile-layout.md) | 手機版版面：上下分配比例、疊在圖表上的播放器、各元件的手機版差異、加權圖的尺寸怎麼調 |

### 排序演算法

| 文件 | 內容 |
| --- | --- |
| [bubble-sort-animation.md](./bubble-sort-animation.md) | 氣泡排序動畫：步驟產生器、整體資料流、`BarChart` / `InputPanel` / `CodePanel` 的 props 與樣式規則 |
| [quick-sort-animation.md](./quick-sort-animation.md) | 快速排序動畫：Lomuto 分割法、步驟產生規則、新增的 `less` / `greater` 顏色狀態 |

### 圖論演算法

| 文件 | 內容 |
| --- | --- |
| [dijkstra-animation.md](./dijkstra-animation.md) | Dijkstra 最短路徑動畫：預設圖 `DIJKSTRA_DATA`、步驟產生規則、`GraphChart` / `GraphCanvas` 的節點 / 邊顏色狀態 |
| [dijkstra-grid-layout.md](./dijkstra-grid-layout.md) | ⚠️ **已停用，保留參考**：棋盤樣式隨機圖的設計（使用者自訂節點數量、起點、終點），目前程式碼沒有使用 |

## 文件之間的關係

```
layout-architecture.md        版面殼
        │
        ▼
bubble-sort-animation.md      共用渲染架構（步驟快照、BarChart、InputPanel、CodePanel）
        │
        ├──► quick-sort-animation.md
        ├──► dijkstra-animation.md ──► dijkstra-grid-layout.md（已停用）
        │
        ▼
step-player.md                播放器（三個頁面共用）

mobile-layout.md              手機版版面（橫跨上面所有元件）
```

## 新增文件時

- 新的演算法頁面請沿用現有文件的結構：**目的 → 這次新增 / 改動的檔案 → 演算法 / 步驟產生規則 → 顏色狀態 → 設計決策**
- 共用的部分不要重複說明，改用連結指回 [bubble-sort-animation.md](./bubble-sort-animation.md) 或 [layout-architecture.md](./layout-architecture.md)
- 新增文件後，記得更新這份 README 的文件列表
