<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  modelValue?: string | number
  placeholder?: string
  disabled?: boolean
  type?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
  (e: 'keydown', payload: KeyboardEvent): void
}>()
</script>

<template>
  <input
    :type="type || 'text'"
    :placeholder="placeholder"
    :disabled="disabled"
    :value="modelValue"
    :class="cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-foreground file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    @keydown="emit('keydown', $event)"
  />
</template>
