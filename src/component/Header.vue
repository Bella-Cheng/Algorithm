<script setup lang="ts">
withDefaults(
  defineProps<{
    headerBtnText?: string
    /** 顯示「首頁、演算法庫」導覽與徽章；false 時右側只放「開始探索」按鈕（首頁用） */
    showNav?: boolean
    /** 徽章改用實心 lime 底 */
    badgeFilled?: boolean
  }>(),
  {
    headerBtnText: '開始探索',
    showNav: true,
    badgeFilled: false,
  },
)
</script>

<template>
  <header class="app-header">
    <RouterLink to="/" class="app-header__brand">
      <img class="app-header__logo" src="/favicon.svg" alt="" />
      <span class="app-header__title">ALGO ATELIER</span>
    </RouterLink>

    <nav v-if="showNav" class="app-header__nav">
      <RouterLink to="/" class="app-header__link" exact-active-class="app-header__link--active">
        首頁
      </RouterLink>
      <RouterLink to="/Library" class="app-header__link" exact-active-class="app-header__link--active">
        演算法庫
      </RouterLink>
      <span
        v-if="headerBtnText"
        class="app-header__badge"
        :class="{ 'app-header__badge--filled': badgeFilled }"
      >
        {{ headerBtnText }}
      </span>
    </nav>

    <RouterLink v-else to="/Library" class="app-header__btn">
      開始探索
    </RouterLink>
  </header>
</template>

<style scoped lang="scss" src="@/scss/Header.scss"></style>
