import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/BubbleSort',
    name: 'BubbleSort',
    component: () => import('@/page/BubbleSortPage.vue'),
  },
  {
    path: '/QuickSort',
    name: 'QuickSort',
    component: () => import('@/page/QuickSortPage.vue'),
  },
  {
    path: '/Dijkstra',
    name: 'Dijkstra',
    component: () => import('@/page/DijkstraPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

export default router
