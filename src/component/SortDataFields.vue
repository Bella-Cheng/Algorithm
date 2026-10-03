<script setup lang="ts">
import SelectField from '@/component/SelectField.vue'
import {
  COUNT_OPTIONS,
  MAX_OPTIONS,
  MIN_OPTIONS,
  type SortDataSettings,
} from '@/algorithms/sortData'

/** 排序頁共用的三個欄位：資料筆數、最小值、最大值，放在 DataModal 的預設 slot */
const settings = defineModel<SortDataSettings>({ required: true })
</script>

<template>
  <SelectField v-model="settings.count" label="資料筆數" :options="COUNT_OPTIONS" />
  <SelectField v-model="settings.min" label="最小值" :options="MIN_OPTIONS" />
  <SelectField v-model="settings.max" label="最大值" :options="MAX_OPTIONS" />
</template>
