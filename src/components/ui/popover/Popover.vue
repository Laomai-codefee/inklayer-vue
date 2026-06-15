<script setup lang="ts">
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'radix-vue'
import { cn } from '@/lib/utils'

defineProps<{
  open?: boolean
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  class?: string
}>()

defineEmits<{ 'update:open': [value: boolean]; 'focus-outside': [event: Event] }>()
</script>

<template>
  <PopoverRoot :open="open" @update:open="$emit('update:open', $event)">
    <PopoverTrigger as-child>
      <slot name="trigger" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :side="side || 'bottom'"
        :align="align || 'center'"
        :side-offset="4"
        @focus-outside="$emit('focus-outside', $event)"
        :class="cn(
          'z-999 rounded-md border border-[rgba(0,0,0,0.1)] bg-popover text-popover-foreground shadow-[0_2px_12px_rgba(0,0,0,0.1)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          $props.class
        )"
      >
        <slot />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
