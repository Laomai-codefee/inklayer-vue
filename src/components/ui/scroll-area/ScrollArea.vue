<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  viewportClass?: HTMLAttributes['class']
  type?: 'auto' | 'always' | 'scroll' | 'hover'
}>(), { type: 'auto' })
</script>

<template>
  <ScrollAreaRoot :type="type" :class="cn('relative overflow-hidden', props.class)">
    <ScrollAreaViewport :class="cn('h-full w-full rounded-[inherit]', viewportClass)">
      <slot />
    </ScrollAreaViewport>
    <ScrollAreaScrollbar
      orientation="vertical"
      class="flex touch-none select-none transition-colors h-full w-2.5 border-l border-l-transparent p-[1px]"
    >
      <ScrollAreaThumb class="relative flex-1 rounded-full bg-border" />
    </ScrollAreaScrollbar>
    <ScrollAreaScrollbar
      orientation="horizontal"
      class="flex touch-none select-none transition-colors h-2.5 flex-col border-t border-t-transparent p-[1px]"
    >
      <ScrollAreaThumb class="relative flex-1 rounded-full bg-border" />
    </ScrollAreaScrollbar>
    <ScrollAreaCorner class="bg-border" />
  </ScrollAreaRoot>
</template>
