<script setup lang="ts">
withDefaults(
  defineProps<{
    headerBtnText?: string
  }>(),
  {
    headerBtnText: '開始探索',
  },
)
</script>

<template>
  <header class="app-header">
    <RouterLink to="/" class="app-header__brand">
      <span class="app-header__logo">//</span>
      <span class="app-header__title">ALGO ATELIER</span>
    </RouterLink>

    <nav class="app-header__nav">
      <RouterLink to="/" class="app-header__link">首頁</RouterLink>
      <span class="app-header__link app-header__link--disabled">演算法庫</span>
      <span v-if="headerBtnText" class="app-header__badge">{{ headerBtnText }}</span>
    </nav>
  </header>
</template>

<style scoped lang="scss" src="@/scss/Header.scss"></style>
