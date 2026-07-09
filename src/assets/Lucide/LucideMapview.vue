<script setup>
import { computed } from 'vue'
import * as icons from 'lucide-vue-next'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 24 },
  color: { type: String, default: '#0f172a' },
  strokeWidth: { type: Number, default: 2 },
})

const icon = computed(() => icons[props.name])
</script>

<template>
  <component :is="icon" :size="size" :color="color" :stroke-width="strokeWidth" />
</template>
