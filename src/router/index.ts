import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** Header 右側徽章文字，通常是演算法的英文名稱 */
    headerBtnText?: string
  }
}

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/page/HomePage.vue'),
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
