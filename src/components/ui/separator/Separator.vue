<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { Separator } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
  class?: HTMLAttributes['class']
}>(), {
  orientation: 'horizontal',
  decorative: true,
})
</script>

<template>
  <Separator
    :orientation="orientation"
    :decorative="decorative"
    :class="cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      props.class
    )"
  />
</template>
