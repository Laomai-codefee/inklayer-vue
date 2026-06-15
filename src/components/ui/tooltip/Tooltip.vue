<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  content?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  class?: HTMLAttributes['class']
  contentClass?: HTMLAttributes['class']
}>()
</script>

<template>
  <TooltipProvider>
    <TooltipRoot>
      <TooltipTrigger as-child>
        <slot name="trigger" />
      </TooltipTrigger>
      <TooltipContent
        :side="side || 'top'"
        :class="cn(
          'z-50 overflow-hidden rounded-md border border-border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          contentClass || props.class
        )"
      >
        {{ content }}
        <slot />
      </TooltipContent>
    </TooltipRoot>
  </TooltipProvider>
</template>
