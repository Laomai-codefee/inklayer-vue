<template>
  <div class="flex items-center gap-2">
    <ZoomTool />
    <Separator orientation="vertical" class="h-6" />

    <!-- Annotation tool buttons with tooltips -->
    <div class="flex gap-3">
      <template v-for="tool in tools" :key="tool.type">
        <!-- STAMP: special popover with image upload -->
        <StampTool
          v-if="tool.type === AnnotationType.STAMP"
          :active="isSelected(tool)"
          :default-stamps="stampOptions?.defaultStamp"
          :stamp-options="stampOptions"
          :colors="colorPresets"
          :disabled="!canCreate"
          @select="(dataUrl) => handleToolClick(tool, dataUrl)"
        />

        <!-- SIGNATURE: special popover with image upload -->
        <SignatureTool
          v-else-if="tool.type === AnnotationType.SIGNATURE"
          :active="isSelected(tool)"
          :default-signatures="signatureOptions?.defaultSignature"
          :signature-options="signatureOptions"
          :disabled="!canCreate"
          @select="(dataUrl) => handleToolClick(tool, dataUrl)"
        />

        <!-- Regular drawing tools + SELECT -->
        <Tooltip v-else :content="t(`annotator.tool.${tool.name}`)">
          <template #trigger>
            <Button
              variant="ghost"
              size="icon"
              class="size-8"
              :class="isSelected(tool) ? 'bg-primary/15 text-primary hover:bg-primary/25 dark:bg-primary/25 dark:text-primary-foreground dark:hover:bg-primary/35' : ''"
              :disabled="tool.type !== AnnotationType.SELECT && !canCreate"
              @click="handleToolClick(tool)"
            >
              <Icon :name="tool.icon" :size="16" />
            </Button>
          </template>
        </Tooltip>
      </template>
    </div>

    <Separator orientation="vertical" class="h-6" />

    <!-- ColorPicker (self-explanatory trigger, no Tooltip wrapper to avoid slot conflict) -->
    <ColorPicker
      :model-value="currentColor"
      :presets="colorPresets"
      :disabled="!isColorEnabled"
      @update:model-value="handleColorChange"
    />

    <Separator orientation="vertical" class="h-6" />

    <Tooltip :content="authorLabelsTooltip">
      <template #trigger>
        <Button
          variant="ghost"
          size="icon"
          class="size-8"
          :class="authorLabelsVisible ? 'bg-primary/15 text-primary hover:bg-primary/25 dark:bg-primary/25 dark:text-primary-foreground dark:hover:bg-primary/35' : ''"
          :disabled="!store.painter"
          :aria-pressed="authorLabelsVisible"
          @click="handleAuthorLabelsToggle"
        >
          <Icon name="authorLabels" :size="18" />
        </Button>
      </template>
    </Tooltip>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip } from '@/components/ui/tooltip'
import Icon from '@/components/Icon.vue'
import ZoomTool from './ZoomTool.vue'
import ColorPicker from './ColorPicker.vue'
import StampTool from './StampTool.vue'
import SignatureTool from './SignatureTool.vue'
import { useAnnotationStore } from '@/stores/annotationStore'
import { annotationDefinitions, AnnotationType, type IAnnotationType } from '@/extensions/annotator/const/definitions'
import { defaultOptions } from '@/extensions/annotator/const/default_options'
import { useT } from '@/composables/useT'
import type { AnnotationPermissions } from '@/extensions/annotator/types/annotator'
import type { User } from '@/types'
const { t } = useT()

const props = defineProps<{ colors?: string[]; signatureOptions?: any; stampOptions?: any; annotationPermissions?: AnnotationPermissions; currentUser?: User }>()
const store = useAnnotationStore()
const selectedType = computed(() => store.currentAnnotationType)
const authorLabelsVisible = ref(false)
const authorLabelShortcut = /mac/i.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Alt'
const authorLabelsTooltip = computed(() => authorLabelsVisible.value
  ? t('annotator.authorLabels.hide')
  : t('annotator.authorLabels.show', { shortcut: authorLabelShortcut }))

watch(() => store.painter, (painter) => {
  authorLabelsVisible.value = painter?.areAnnotationAuthorLabelsVisible() ?? false
}, { immediate: true })

const canCreate = computed(() => {
  void store.permissionRevision
  void props.annotationPermissions?.mode
  void props.annotationPermissions?.can
  void props.currentUser?.id
  return store.painter?.can('annotation.create') ?? true
})

const colorPresets = computed(() => props.colors ?? defaultOptions.colors)

const isColorEnabled = computed(() => canCreate.value && (selectedType.value?.styleEditable?.color ?? false))
const currentColor = computed(() => selectedType.value?.style?.color || colorPresets.value?.[0] || '#ff6b6b')

// Local annotations state with per-tool-type color persistence (align React)
const tools = reactive<IAnnotationType[]>(
  annotationDefinitions.filter(t => t.webSelectionDependencies === false).map(a => ({ ...a, style: { ...a.style } }))
)

function isSelected(tool: IAnnotationType): boolean {
  return selectedType.value?.type === tool.type
}

function handleToolClick(annotation: IAnnotationType, dataTransfer?: string) {
  if (annotation.type !== AnnotationType.SELECT && !canCreate.value) return
  if (selectedType.value?.type === annotation.type) {
    store.setCurrentAnnotationType(null)
    return
  }
  if (dataTransfer && (annotation.type === AnnotationType.STAMP || annotation.type === AnnotationType.SIGNATURE)) {
    store.setDataTransfer(dataTransfer)
  }
  store.setCurrentAnnotationType(annotation)
}

function handleAuthorLabelsToggle() {
  const painter = store.painter
  if (!painter) return
  const visible = !painter.areAnnotationAuthorLabelsVisible()
  painter.setAnnotationAuthorLabelsVisible(visible)
  authorLabelsVisible.value = visible
}

watch(canCreate, (allowed) => {
  if (!allowed && selectedType.value?.type !== AnnotationType.SELECT) {
    store.setDataTransfer(null)
    store.setCurrentAnnotationType(annotationDefinitions[0])
  }
})

function handleColorChange(color: string) {
  if (!selectedType.value) return
  // Update local list for the selected tool type (persistent per-tool, align React)
  const idx = tools.findIndex(a => a.type === selectedType.value!.type)
  if (idx >= 0) {
    tools[idx] = { ...tools[idx], style: { ...tools[idx].style, color } }
  }
  // Also update store's currentAnnotationType for painter
  const updated = { ...selectedType.value, style: { ...(selectedType.value.style || {}), color } }
  store.setCurrentAnnotationType(updated)
}
</script>
