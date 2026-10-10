import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** Header 右側徽章文字，通常是演算法的英文名稱 */
    headerBtnText?: string
    /** 徽章改用實心 lime 底（演算法庫用） */
    headerBadgeFilled?: boolean
  }
}

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/page/HomePage.vue'),
  },
  {
    path: '/Library',
    name: 'Library',
    component: () => import('@/page/LibraryPage.vue'),
    meta: { headerBtnText: '03 MODULES', headerBadgeFilled: true },
  },
  {
    path: '/BubbleSort',
    name: 'BubbleSort',
    component: () => import('@/page/BubbleSortPage.vue'),
    meta: { headerBtnText: 'BUBBLE SORT' },
  },
  {
    path: '/QuickSort',
    name: 'QuickSort',
    component: () => import('@/page/QuickSortPage.vue'),
    meta: { headerBtnText: 'QUICK SORT' },
  },
  {
    path: '/Dijkstra',
    name: 'Dijkstra',
    component: () => import('@/page/DijkstraPage.vue'),
    meta: { headerBtnText: 'DIJKSTRA' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

export default router
