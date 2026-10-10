<script setup lang="ts">
import { useRoute } from 'vue-router'
import Header from '@/component/Header.vue'

const route = useRoute()
</script>

<template>
  <div class="main-layout">
    <!-- 首頁右側只放「開始探索」，工具頁才顯示導覽 -->
    <Header
      :show-nav="route.name !== 'Home'"
      :header-btn-text="route.meta.headerBtnText"
      :badge-filled="route.meta.headerBadgeFilled"
    />
    <main class="main-layout__content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped lang="scss" src="@/scss/MainLayout.scss"></style>
