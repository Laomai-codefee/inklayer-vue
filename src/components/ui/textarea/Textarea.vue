<script setup lang="ts">
import { ref, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  modelValue?: string
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'keydown': [e: KeyboardEvent]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
defineExpose({ textareaRef })
</script>

<template>
  <textarea
    ref="textareaRef"
    :placeholder="placeholder"
    :disabled="disabled"
    :value="modelValue"
    :class="cn(
      'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      props.class
    )"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    @keydown="emit('keydown', $event)"
  />
</template>
