<template>
  <Popover :open="visible" side="bottom" class="!w-max shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]" @update:open="visible = $event" @focus-outside="close">
    <!-- Invisible trigger positioned at selection -->
    <template #trigger>
      <span class="fixed pointer-events-none" :style="{ left: x + 'px', top: y + 'px', width: '1px', height: '1px' }" />
    </template>

    <div class="flex items-center gap-0.5 p-1">
      <Button variant="ghost" size="sm" class="h-7 px-2 gap-1.5 text-xs" @click="handleAction('highlight')">
        <Icon name="highlight" :size="14" />
        <span>{{ t('annotator.tool.highlight') }}</span>
      </Button>
      <Button variant="ghost" size="sm" class="h-7 px-2 gap-1.5 text-xs" @click="handleAction('underline')">
        <Icon name="underline" :size="14" />
        <span>{{ t('annotator.tool.underline') }}</span>
      </Button>
      <Button variant="ghost" size="sm" class="h-7 px-2 gap-1.5 text-xs" @click="handleAction('strikeout')">
        <Icon name="strikeout" :size="14" />
        <span>{{ t('annotator.tool.strikeout') }}</span>
      </Button>
    </div>
  </Popover>
</template>

<script setup lang="ts">
import { computed, inject, ref, shallowRef, watch } from 'vue'
import { Popover } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import Icon from '@/components/Icon.vue'
import { annotationDefinitions } from '../../const/definitions'
import type { IAnnotationType } from '../../const/definitions'
import { useT } from '@/composables/useT'
import { UserContextKey } from '@/context/pdfViewerContext'
import type { AnnotationPermissions } from '../../types/annotator'
const { t } = useT()

const props = defineProps<{ annotationPermissions?: AnnotationPermissions }>()
const userContext = inject(UserContextKey)

const visible = ref(false)
const x = ref(0)
const y = ref(0)
let currentRange: Range | null = null
const painterRef = shallowRef<any>(null)

const canCreate = computed(() => {
  void props.annotationPermissions?.mode
  void props.annotationPermissions?.can
  void userContext?.user.value?.id
  return painterRef.value?.can('annotation.create') ?? true
})

function handleAction(name: string) {
  if (!canCreate.value) return
  const annotation = annotationDefinitions.find(a => a.name === name) as IAnnotationType
  if (annotation && currentRange) { painterRef.value?.highlightRange(currentRange, annotation) }
  close()
}

function open(range: Range | null) {
  if (!range || !canCreate.value) return
  currentRange = range
  const rect = range.getBoundingClientRect()
  x.value = rect.left + rect.width / 2
  y.value = rect.bottom
  visible.value = true
}
function close() { visible.value = false }
function setPainterRef(painter: any) { painterRef.value = painter }
watch(canCreate, (allowed) => { if (!allowed) close() })
defineExpose({ open, close, setPainterRef })
</script>
