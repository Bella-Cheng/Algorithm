<script setup lang="ts">
withDefaults(
  defineProps<{
    headerBtnText?: string
    /** 顯示「首頁、演算法庫」導覽與徽章；false 時右側只放「開始探索」按鈕（首頁用） */
    showNav?: boolean
  }>(),
  {
    headerBtnText: '開始探索',
    showNav: true,
  },
)
</script>

<template>
  <header class="app-header">
    <RouterLink to="/" class="app-header__brand">
      <span class="app-header__logo">//</span>
      <span class="app-header__title">ALGO ATELIER</span>
    </RouterLink>

    <nav v-if="showNav" class="app-header__nav">
      <RouterLink to="/" class="app-header__link">首頁</RouterLink>
      <span class="app-header__link app-header__link--disabled">演算法庫</span>
      <span v-if="headerBtnText" class="app-header__badge">{{ headerBtnText }}</span>
    </nav>

    <RouterLink v-else to="/BubbleSort" class="app-header__btn">
      開始探索
    </RouterLink>
  </header>
</template>

<style scoped lang="scss" src="@/scss/Header.scss"></style>
