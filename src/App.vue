<script setup lang="ts">
import { ToastProvider } from 'reka-ui'
import MainLayout from '@/layout/MainLayout.vue'
import Toaster from '@/component/Toaster.vue'
</script>

<template>
  <!-- 置頂顯示，往上滑關閉 -->
  <ToastProvider :duration="2500" swipe-direction="up" label="通知">
    <MainLayout />
    <Toaster />
  </ToastProvider>
</template>

<style scoped></style>
