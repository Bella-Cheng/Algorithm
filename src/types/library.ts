import type { BarState } from '@/types/sort'

/** 演算法模組的強調色：卡片編號、hover 外框、學習順序 */
export type ModuleAccent = 'lime' | 'cyan' | 'amber'

/** 模組類別 */
export type ModuleCategory = 'sorting' | 'graph'

/** 模組難度 */
export type ModuleLevel = 'basic' | 'advanced'

/** 演算法庫的篩選值：全部、某個類別或某個難度 */
export type ModuleFilter = 'all' | ModuleCategory | ModuleLevel

/** 首頁與演算法庫共用的模組資料 */
export interface LibraryModule {
  index: string
  title: string
  description: string
  /** 時間複雜度，如 O(n²) */
  complexity: string
  to: string
  accent: ModuleAccent
  category: ModuleCategory
  level: ModuleLevel
  /** 搜尋用的額外關鍵字（英文名、別名等） */
  keywords: string[]
  /** 排序卡片預覽長條的強調狀態；圖論卡片不用 */
  previewState?: BarState
}
