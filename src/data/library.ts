import type { LibraryModule } from '@/types/library'

/** 首頁與演算法庫共用的模組清單；新增演算法時加在這裡 */
export const MODULES: LibraryModule[] = [
  {
    index: '01',
    title: '氣泡排序',
    description: '兩兩比較，讓最大值逐步浮出。',
    complexity: 'O(n²)',
    to: '/BubbleSort',
    accent: 'lime',
    category: 'sorting',
    level: 'basic',
    keywords: ['bubble sort', '交換', 'swap'],
    // lime 代表正在往右冒泡的值
    previewState: 'active',
  },
  {
    index: '02',
    title: '快速排序',
    description: '選定基準，將問題俐落地分割。',
    complexity: 'O(n log n)',
    to: '/QuickSort',
    accent: 'cyan',
    category: 'sorting',
    level: 'advanced',
    keywords: ['quick sort', 'pivot', '基準', '分治', 'divide and conquer'],
    // cyan 代表已固定位置的 pivot
    previewState: 'sorted',
  },
  {
    index: '03',
    title: 'Dijkstra 最短路徑',
    description: '從起點擴張，找出最小成本路徑。',
    complexity: 'O(E log V)',
    to: '/Dijkstra',
    accent: 'amber',
    category: 'graph',
    level: 'advanced',
    keywords: ['shortest path', '最短路徑', '圖', 'graph', 'greedy', '貪婪'],
  },
]
