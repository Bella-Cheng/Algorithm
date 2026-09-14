<script setup lang="ts">
import Header from '@/component/Header.vue'
import ToolHeader from '@/component/ToolHeader.vue'
</script>

<template>
  <div class="main-layout">
    <Header />
    <ToolHeader
      index="01"
      title-zh="氣泡排序"
      title-en="BUBBLE SORT"
      time="O(n²)"
      space="O(1)"
      status-label="STABLE"
      status-value="YES"
      status-variant="primary"
    />
    <aside class="left-sidebar">
      <h2>左側選單</h2>
    </aside>

    <main class="main-layout__content">
      <RouterView />
    </main>

    <aside class="right-sidebar">
      <h2>右側選單</h2>
    </aside>
    
  </div>
</template>

<style scoped lang="scss" src="@/scss/MainLayout.scss"></style>
