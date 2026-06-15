<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  defaultValue?: string
  modelValue?: string
  class?: HTMLAttributes['class']
  orientation?: 'horizontal' | 'vertical'
}>(), { orientation: 'horizontal' })

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <TabsRoot
    :default-value="defaultValue"
    :model-value="modelValue"
    :orientation="orientation"
    :class="props.class"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
  </TabsRoot>
</template>
