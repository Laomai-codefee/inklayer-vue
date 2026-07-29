<script setup lang="ts">
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { cn } from '@/lib/utils'

defineProps<{
  open?: boolean
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  collisionPadding?: number
  annotationHoverOwner?: string
  class?: string
}>()

defineEmits<{
  'update:open': [value: boolean]
  'focus-outside': [event: Event]
  'open-auto-focus': [event: Event]
  'close-auto-focus': [event: Event]
}>()
</script>

<template>
  <PopoverRoot :open="open" @update:open="$emit('update:open', $event)">
    <PopoverTrigger as-child>
      <slot name="trigger" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :data-annotation-hover-owner="annotationHoverOwner"
        :side="side || 'bottom'"
        :align="align || 'center'"
        :side-offset="sideOffset ?? 4"
        :collision-padding="collisionPadding"
        @focus-outside="$emit('focus-outside', $event)"
        @open-auto-focus="$emit('open-auto-focus', $event)"
        @close-auto-focus="$emit('close-auto-focus', $event)"
        :class="cn(
          'z-999 rounded-md border border-border bg-popover text-popover-foreground shadow-[0_2px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          $props.class
        )"
      >
        <slot />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
