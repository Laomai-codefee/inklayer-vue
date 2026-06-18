<template>
  <div class="flex items-center gap-3">
    <!-- Default: Print button -->
    <template v-if="!actions">
      <Tooltip :content="t('common.print')">
        <template #trigger>
          <Button variant="ghost" size="icon" class="size-8" @click="ctx.print()">
            <Icon name="print" :size="18" />
          </Button>
        </template>
      </Tooltip>
    </template>
    <!-- Custom: function gets context, component renders as-is -->
    <component v-else-if="typeof actions === 'function'" :is="(actions as any)(ctx)" />
    <component v-else :is="actions" />
  </div>
</template>
<script setup lang="ts">
import { inject, type Component } from 'vue'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import Icon from '@/components/Icon.vue'
import { PdfViewerContextKey, type PdfViewerContextValue } from '@/context/pdfViewerContext'
import { useT } from '@/composables/useT'
const { t } = useT()

const props = defineProps<{
  actions?: Component | ((ctx: PdfViewerContextValue) => any) | null
}>()

const ctx = inject(PdfViewerContextKey)!
</script>
