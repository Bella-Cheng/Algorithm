<script setup lang="ts">
import Header from '@/component/Header.vue'
</script>

<template>
  <div class="main-layout">
    <Header />
    <main class="main-layout__content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped lang="scss" src="@/scss/MainLayout.scss"></style>
