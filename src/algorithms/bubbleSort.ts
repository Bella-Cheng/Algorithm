import type { BarState, SortStep } from '@/types/sort'

export type BubbleSortPhase = 'start' | 'compare' | 'swap' | 'pass' | 'done'

export type BubbleSortStep = SortStep<BubbleSortPhase>

/** 各階段在畫面上顯示的標籤 */
export const BUBBLE_SORT_PHASE_LABEL: Record<BubbleSortPhase, string> = {
  start: 'READY',
  compare: 'COMPARE',
  swap: 'SWAP',
  pass: 'PASS DONE',
  done: 'SORTED',
}

/** 右側程式碼面板顯示的程式碼（行號從 1 開始，對應 highlightLines） */
export const BUBBLE_SORT_CODE = [
  'function bubbleSort(arr: number[]) {',
  '  if (arr.length === 0) return arr;',
  '  let temp = 0;',
  '  for (let j = arr.length; j > 1; j--) {',
  '    for (let i = 0; i < j - 1; i++) {',
  '      if (arr[i] > arr[i + 1]) {',
  '        temp = arr[i];',
  '        arr[i] = arr[i + 1];',
  '        arr[i + 1] = temp;',
  '      }',
  '    }',
  '  }',
  '  return arr;',
  '}',
]

/**
 * 執行氣泡排序，並把每個關鍵時刻記錄成步驟快照。
 * - active（lime）：正在往右冒泡的較大值
 * - comparing（pink）：與它比較的另一個值
 * - sorted（cyan）：索引 >= sortedFrom 的已排序區間
 */
export function createBubbleSortSteps(input: number[]): BubbleSortStep[] {
  const arr = [...input]
  /** arr 長度 */
  const n = arr.length
  const steps: BubbleSortStep[] = []
  let sortedFrom = n

  const push = (
    step: Omit<BubbleSortStep, 'arr' | 'barStates'>, // Omit<型別, 要拿掉的欄位>
    activeIndex = -1,
    comparingIndex = -1,
  ) => {
    const barStates = arr.map<BarState>((_, index) => {
      if (index >= sortedFrom) return 'sorted'
      if (index === activeIndex) return 'active'
      if (index === comparingIndex) return 'comparing'
      return 'default'
    })
    steps.push({ ...step, arr: [...arr], barStates })
  }

  push({
    phase: 'start',
    pass: 0,
    highlightLines: [1, 2],
    summary: `共 ${n} 筆資料\n準備開始氣泡排序。`,
    detail: '按下「執行」開始，每一輪會把未排序區間中最大的數字推到最右邊。',
  })
  if (n === 0) return steps

  let temp = 0
  for (let j = n; j > 1; j--) {
    const pass = n - j + 1

    for (let i = 0; i < j - 1; i++) {
      const left = arr[i] ?? 0
      const right = arr[i + 1] ?? 0

      push(
        {
          phase: 'compare',
          pass,
          highlightLines: [5, 6],
          summary: `比較 [${i}] ${left} 與 [${i + 1}] ${right}`,
          detail:
            left > right
              ? `${left} > ${right}，順序錯誤，接下來交換兩者位置。`
              : `${left} ≤ ${right}，順序正確，不需要交換。`,
        },
        i,
        i + 1,
      )

      if (left > right) {
        temp = left
        arr[i] = right
        arr[i + 1] = temp

        // 交換後較大值移到 i + 1，選中狀態跟著它走
        push(
          {
            phase: 'swap',
            pass,
            highlightLines: [7, 8, 9],
            summary: `交換 ${left} 與 ${right}\n較大值往右移。`,
            detail: `${left} 移到 [${i + 1}]，繼續和右邊的數字比較。`,
          },
          i + 1,
          i,
        )
      }
    }

    sortedFrom = j - 1
    push({
      phase: 'pass',
      pass,
      highlightLines: [4],
      summary: `第 ${pass} 輪結束\n${arr[j - 1]} 已排好。`,
      detail:
        j > 2
          ? `本輪最大值 ${arr[j - 1]} 固定在 [${j - 1}]，下一輪只需處理 [0] ~ [${j - 2}]。`
          : `${arr[j - 1]} 固定在 [${j - 1}]，剩下的 [0] 自然也就排好了。`,
    })
  }

  sortedFrom = 0
  push({
    phase: 'done',
    pass: Math.max(n - 1, 0),
    highlightLines: [13],
    summary: '排序完成！',
    detail: `所有數字已由小到大排好：${arr.join(', ')}。`,
  })

  return steps
}
