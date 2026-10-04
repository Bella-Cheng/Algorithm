# 步驟播放器開發文件

## 目的

記錄演算法頁面底部播放器的架構與行為：執行、暫停、重置、上一步、下一步與倍速。氣泡排序、快速排序、Dijkstra 三個頁面共用同一套播放器。

各頁面怎麼把步驟算好、怎麼依 `steps[currentStep]` 渲染畫面，請看各演算法自己的文件（如 [bubble-sort-animation.md](./bubble-sort-animation.md)）。播放器只負責改變 `currentStep`。

## 目錄結構

```
src/composables/useStepPlayer.ts   // 播放邏輯：currentStep、isPlaying、speed 與各控制函式
src/component/ToolFooter.vue       // 底部控制列 UI，只發出事件，不持有狀態
src/layout/ToolLayout.vue          // #footer slot，頁面把 ToolFooter 放進來
src/scss/ToolFooter.scss           // 控制列樣式，進度條有 width transition
```

## 整體資料流

```
頁面 steps ──► lastStep = steps.length - 1
                     │
                     ▼
            useStepPlayer(lastStep)
     ┌───────────────┼────────────────┐
     ▼               ▼                ▼
currentStep      isPlaying          speed
     │               │                │
     ▼               ▼                ▼
 頁面渲染       ToolFooter props（current-step / total-steps / is-playing / active-speed）
                     │
                     ▼ 使用者點按鈕
            ToolFooter emits ──► togglePlay / reset / prev / next / setSpeed
```

- 狀態全部在 `useStepPlayer` 裡，`ToolFooter` 是純 UI
- `ToolFooter` 不知道「播放」怎麼實作，只負責顯示與發出事件，由頁面接到 composable 的函式

## 播放邏輯：`src/composables/useStepPlayer.ts`

```ts
const { currentStep, isPlaying, speed, togglePlay, next, prev, reset, setSpeed } =
  useStepPlayer(lastStep)
```

參數 `lastStep` 是**最後一步的索引**（步驟總數 - 1），型別為 `MaybeRefOrGetter<number>`，可以直接傳 `computed`，步驟數改變時會自動跟著變。

### 回傳的狀態

| 名稱 | 型別 | 初始值 | 說明 |
| --- | --- | --- | --- |
| `currentStep` | `Ref<number>` | `0` | 目前顯示第幾步，第 0 步為初始狀態 |
| `isPlaying` | `Ref<boolean>` | `false` | 是否正在自動播放 |
| `speed` | `Ref<number>` | `1` | 目前倍速 |

### 執行 / 暫停：`togglePlay()`

依 `isPlaying` 切換，內部分成 `play()` 與 `pause()`：

**執行（`play`）**

1. 如果已經在最後一步，先把 `currentStep` 設回 0，從頭重播
2. `isPlaying = true`
3. 呼叫 `scheduleNext()` 排定下一步

**自動前進（`scheduleNext`）**

```ts
timer = setTimeout(() => {
  if (!isLastStep.value) currentStep.value++
  if (isLastStep.value) pause()
  else scheduleNext()
}, BASE_INTERVAL / speed.value)
```

- 每次只排一個 `setTimeout`，時間到前進一步後再排下一個
- 前進後如果到了最後一步就自動暫停，否則繼續排
- 按下執行後，第一次前進會等一個間隔，不會立刻跳步

**暫停（`pause`）**

- `isPlaying = false`
- 清除計時器，`currentStep` 停在當下

### 重置：`reset()`

- 先暫停，再把 `currentStep` 設回 0
- 頁面重新產生資料時也會呼叫（見下方「頁面接法」）

### 上一步 / 下一步：`prev()` / `next()`

| 函式 | 行為 | 邊界 |
| --- | --- | --- |
| `prev()` | 先暫停，`currentStep - 1` | 已經是第 0 步就不動 |
| `next()` | 先暫停，`currentStep + 1` | 已經是最後一步就不動 |

手動切換步驟時一律先暫停，避免和計時器同時改動 `currentStep`。

### 倍速：`setSpeed(value)`

- 1× 速度每步 `700ms`（`BASE_INTERVAL`），實際間隔為 `BASE_INTERVAL / speed`

  | 倍速 | 每步間隔 |
  | --- | --- |
  | 0.5× | 1400ms |
  | 1× | 700ms |
  | 2× | 350ms |

- 播放中改速度會立刻呼叫 `scheduleNext()` 重新排定計時器，新速度馬上生效，不用等目前這一步跑完
- 暫停時改速度只更新 `speed`，下次按執行才套用

### 為什麼用 `setTimeout` 而不是 `setInterval`

`setInterval` 的間隔在建立時就固定了，改速度必須清掉重建；`setTimeout` 本來就是一次排一步，改速度時重新排一次即可，邏輯比較單純。

### 清除計時器

`onBeforeUnmount(clearTimer)`：離開頁面時清掉計時器，不會在背景繼續跑。

## 控制列 UI：`src/component/ToolFooter.vue`

### Props

| Prop | 說明 | 預設值 |
| --- | --- | --- |
| `currentStep` | 目前步驟索引 | `0` |
| `totalSteps` | 最後一步的索引（傳 `lastStep`） | `0` |
| `isPlaying` | 是否播放中，決定播放按鈕的文字 | `false` |
| `speedOptions` | 可選的倍速 | `[0.5, 1, 2]` |
| `activeSpeed` | 目前倍速，對應的按鈕會加上 `--active` 樣式 | `1` |

### Events

| Event | 參數 | 觸發按鈕 |
| --- | --- | --- |
| `reset` | - | ↺ 重置 |
| `prev` | - | ‹ 上一步 |
| `togglePlay` | - | ▶ 執行 / ❚❚ 暫停 |
| `next` | - | › 下一步 |
| `changeSpeed` | `speed: number` | 速度按鈕（0.5× / 1× / 2×） |

### 按鈕狀態

| 按鈕 | 顯示 | 停用條件 |
| --- | --- | --- |
| 重置 | `↺` | 不停用 |
| 上一步 | `‹` | `currentStep <= 0` |
| 執行 / 暫停 | `isPlaying` 為 `false` 時顯示「▶ 執行」，`true` 時顯示「❚❚ 暫停」 | 不停用（在最後一步按會從頭重播） |
| 下一步 | `›` | `currentStep >= totalSteps` |
| 速度 | `0.5×`、`1×`、`2×` | 不停用，目前倍速高亮 |

### 進度顯示

- 進度條寬度：`currentStep / totalSteps * 100%`，`totalSteps` 為 0 時直接給 0%，避免除以 0
- 進度條有 `transition: width 0.3s ease`，每步前進時平滑延伸
- 步數文字：`03 / 16` 格式，兩位數補 0
- 因為 `totalSteps` 傳的是最後一步的索引，所以停在最後一步時進度條剛好 100%

## 版面插槽：`src/layout/ToolLayout.vue`

`ToolLayout` 在三欄下方提供 `#footer` slot，頁面把 `ToolFooter` 放進去。slot 沒有預設內容，不傳就不會顯示控制列。

## 頁面接法

三個頁面（`BubbleSortPage.vue`、`QuickSortPage.vue`、`DijkstraPage.vue`）接法相同：

```ts
const steps = computed(() => sortResult.value.steps)
const lastStep = computed(() => steps.value.length - 1) // 第 0 步為初始狀態

const { currentStep, isPlaying, speed, togglePlay, next, prev, reset, setSpeed } =
  useStepPlayer(lastStep)

/** 套用彈窗設定、重新產生資料，並把步驟歸 0 */
function regenerate() {
  reset()
  // ...重新產生資料，steps 會自動重算
}
```

```vue
<template #footer>
  <ToolFooter
    :current-step="currentStep"
    :total-steps="lastStep"
    :is-playing="isPlaying"
    :active-speed="speed"
    @reset="reset"
    @prev="prev"
    @next="next"
    @toggle-play="togglePlay"
    @change-speed="setSpeed"
  />
</template>
```

注意：

- **重新產生資料前一定要先 `reset()`**。`useStepPlayer` 不會在 `lastStep` 變小時自動修正 `currentStep`，如果不歸 0，新步驟數比舊的少時索引會超出範圍
- 新增演算法頁面時，`useStepPlayer` 與 `ToolFooter` 都不用改，照上面的方式接上即可

## 後續待辦（Not in scope）

- 鍵盤快捷鍵（空白鍵播放 / 暫停、左右鍵切步驟）
- 拖曳進度條跳到指定步驟
- `lastStep` 變小時在 composable 內自動修正 `currentStep`，不必依賴頁面先呼叫 `reset()`
