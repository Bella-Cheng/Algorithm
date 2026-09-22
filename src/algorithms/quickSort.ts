import type { BarState, SortStep } from '@/types/sort'

export type QuickSortPhase = 'start' | 'pivot' | 'compare' | 'swap' | 'partition' | 'done'

export type QuickSortStep = SortStep<QuickSortPhase>

/** 各階段在畫面上顯示的標籤 */
export const QUICK_SORT_PHASE_LABEL: Record<QuickSortPhase, string> = {
  start: 'READY',
  pivot: 'PIVOT',
  compare: 'COMPARE',
  swap: 'SWAP',
  partition: 'PARTITION',
  done: 'SORTED',
}

/** 右側程式碼面板顯示的程式碼（行號從 1 開始，對應 highlightLines） */
export const QUICK_SORT_CODE = [
  'function quickSort(arr: number[], low = 0, high = arr.length - 1) {',
  '  if (low >= high) return arr;',
  '  const pivot = arr[high];',
  '  let i = low;',
  '  for (let j = low; j < high; j++) {',
  '    if (arr[j] < pivot) {',
  '      [arr[i], arr[j]] = [arr[j], arr[i]];',
  '      i++;',
  '    }',
  '  }',
  '  [arr[i], arr[high]] = [arr[high], arr[i]];',
  '  quickSort(arr, low, i - 1);',
  '  quickSort(arr, i + 1, high);',
  '  return arr;',
  '}',
]

/**
 * 目前這一步要標色的區間資訊（都以索引表示）
 *
 * 例：arr = [3, 1, 7, 9, 2, 6, 5]，pivot = 5，正在比較 j = 4
 *
 * ```
 *   index:  0   1   2   3   4   5   6
 *         [ 3,  1,  7,  9,  2,  6,  5 ]
 *           ↑       ↑   ↑   ↑       ↑
 *          low      i   │   j      high
 *                    scanned
 *
 *   less       [low, boundary - 1] = [0, 1]  3、1 比 pivot 小
 *   greater    [boundary, scanned] = [2, 3]  7、9 比 pivot 大
 *   comparing  [j]                 = [4]     2 正在和 pivot 比較
 *   default    [j + 1, high - 1]   = [5]     6 還沒掃描
 *   active     [high]              = [6]     pivot 5
 * ```
 *
 * boundary 就是 i：arr[i] 是第一個比 pivot 大的數字，i 左邊都比 pivot 小。
 */
interface PartitionView {
  /** 目前處理區間的左右界 */
  low: number
  high: number
  /** pivot 目前所在的索引 */
  pivotIndex: number
  /** [low, boundary - 1] 已確認比 pivot 小 */
  boundary: number
  /** [boundary, scanned] 已確認比 pivot 大 */
  scanned: number
  /** 正在與 pivot 比較的索引 */
  comparingIndex: number
}

/**
 * 執行快速排序（Lomuto 分割，取最右邊的值當 pivot），
 * 並把每個關鍵時刻記錄成步驟快照。
 * - active（lime）：pivot
 * - less（cyan）：比 pivot 小的元素，以及已固定在最終位置的元素
 * - greater（text muted）：比 pivot 大的元素
 * - comparing（pink）：正在與 pivot 比較的元素
 */
export function createQuickSortSteps(input: number[]): QuickSortStep[] {
  const arr = [...input]
  /** arr 長度 */
  const n = arr.length
  const steps: QuickSortStep[] = []
  /** 已經固定在最終位置的索引，先集合避免變回灰色 */
  const placed = new Set<number>()
  /** 第幾次分割，對應步驟卡片上的編號 */
  let partitionCount = 0

  const push = (
    step: Omit<QuickSortStep, 'arr' | 'barStates' | 'pass'>, // Omit<型別, 要拿掉的欄位>
    view?: Partial<PartitionView>,
  ) => {
    // 沒有傳入區間時一律視為空區間，這樣每根長條只會落在 sorted 或 default
    const {
      low = 0,
      high = -1,
      pivotIndex = -1,
      boundary = 0,
      scanned = -1,
      comparingIndex = -1,
    } = view ?? {}

    const barStates = arr.map<BarState>((_, index) => {
      if (index === comparingIndex) return 'comparing'
      if (index === pivotIndex) return 'active'
      if (index >= low && index <= high) {
        if (index < boundary) return 'less'
        if (index <= scanned) return 'greater'
      }
      if (placed.has(index)) return 'sorted'
      return 'default'
    })

    steps.push({ ...step, pass: partitionCount, arr: [...arr], barStates })
  }

  push({
    phase: 'start',
    highlightLines: [1, 2],
    summary: `共 ${n} 筆資料\n準備開始快速排序。`,
    detail: '按下「執行」開始，每一輪會挑一個 pivot，把比它小的排到左邊、比它大的排到右邊。',
  })
  if (n === 0) return steps

  /** 對 [low, high] 區間做一次分割，再遞迴處理左右兩側 */
  const sort = (low: number, high: number) => {
    if (low > high) return

    // 只剩一個元素時就地確定位置，不需要再分割
    if (low === high) {
      placed.add(low)
      push({
        phase: 'partition',
        highlightLines: [2],
        summary: `[${low}] 只剩 ${arr[low]} 一個元素\n位置已確定。`,
        detail: `區間只剩一個元素時不用再分割，${arr[low]} 直接固定在 [${low}]。`,
      })
      return
    }

    partitionCount += 1
    const pivot = arr[high] ?? 0

    push(
      {
        phase: 'pivot',
        highlightLines: [3, 4],
        summary: `以 ${pivot} 作為 pivot\n將較小元素移到左側。`,
        detail: `處理 [${low}] ~ [${high}]，取最右邊的 ${pivot} 當 pivot，接著由左往右逐一與它比較。`,
      },
      { low, high, pivotIndex: high, boundary: low, scanned: low - 1 },
    )

    /** 下一個「比 pivot 小」的元素該放的位置 */
    let i = low

    for (let j = low; j < high; j++) {
      const value = arr[j] ?? 0

      push(
        {
          phase: 'compare',
          highlightLines: [5, 6],
          summary: `比較 [${j}] ${value} 與 pivot ${pivot}`,
          detail:
            value < pivot
              ? i === j
                ? `${value} < ${pivot}，屬於左半邊，而且已經在分界線 [${i}] 上，不用交換。`
                : `${value} < ${pivot}，屬於左半邊，接下來和分界線 [${i}] 交換。`
              : `${value} ≥ ${pivot}，留在右半邊，分界線不動。`,
        },
        { low, high, pivotIndex: high, boundary: i, scanned: j - 1, comparingIndex: j },
      )

      if (value < pivot) {
        if (i !== j) {
          const moved = arr[i] ?? 0
          arr[i] = value
          arr[j] = moved

          push(
            {
              phase: 'swap',
              highlightLines: [7, 8],
              summary: `交換 [${i}] 與 [${j}]\n${value} 移到左半邊。`,
              detail: `${value} 換到 [${i}]，原本的 ${moved} 換到 [${j}]，分界線往右移到 [${i + 1}]。`,
            },
            { low, high, pivotIndex: high, boundary: i + 1, scanned: j },
          )
        }
        i++
      }
    }

    // pivot 與分界線交換，pivot 就落在它最終的位置
    const boundaryValue = arr[i] ?? 0
    arr[i] = pivot
    arr[high] = boundaryValue
    placed.add(i)

    push(
      {
        phase: 'partition',
        highlightLines: [11],
        summary: `pivot ${pivot} 就定位\n固定在 [${i}]。`,
        detail:
          `左邊 ${i - low} 個比 ${pivot} 小、右邊 ${high - i} 個比 ${pivot} 大，` +
          `${pivot} 的位置不會再變動，下一輪分別處理左右兩側子陣列。`,
      },
      { low, high, pivotIndex: i, boundary: i, scanned: high },
    )

    sort(low, i - 1)
    sort(i + 1, high)
  }

  sort(0, n - 1)

  // 收尾時全部標成已排序，避免有區間沒被標記到
  for (let index = 0; index < n; index++) placed.add(index)
  push({
    phase: 'done',
    highlightLines: [14],
    summary: '排序完成！',
    detail: `所有數字已由小到大排好：${arr.join(', ')}。`,
  })

  return steps
}
