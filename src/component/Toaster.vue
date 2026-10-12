<script setup lang="ts">
import {
  ToastClose,
  ToastDescription,
  ToastPortal,
  ToastRoot,
  ToastTitle,
  ToastViewport,
  useToastManager,
} from 'reka-ui'

/** 列出 ToastProvider 裡的 toast，任何子元件呼叫 useToastManager().add() 就會出現在這裡 */
const { toasts } = useToastManager()
</script>

<template>
  <ToastPortal>
    <ToastViewport class="toaster">
      <ToastRoot v-for="toast in toasts" :key="toast.id" :toast="toast" class="toaster__toast">
        <div class="toaster__body">
          <ToastTitle class="toaster__title" />
          <ToastDescription v-if="toast.description" class="toaster__description" />
        </div>
        <ToastClose class="toaster__close" aria-label="關閉">✕</ToastClose>
      </ToastRoot>
    </ToastViewport>
  </ToastPortal>
</template>

<style lang="scss" src="@/scss/Toaster.scss"></style>
