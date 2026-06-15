<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { TabsContent } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  value: string
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <TabsContent
    :value="value"
    :class="cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', props.class)"
  >
    <slot />
  </TabsContent>
</template>
