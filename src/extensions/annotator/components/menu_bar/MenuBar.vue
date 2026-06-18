<template>
  <Popover :open="visible" :side="popoverSide" class="!w-max shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]" @update:open="visible = $event" @focus-outside.prevent>
    <!-- Invisible trigger positioned at annotation location -->
    <template #trigger>
      <span
        ref="triggerRef"
        class="fixed pointer-events-none"
        :style="{ left: triggerX + 'px', top: triggerY + 'px', width: '1px', height: '1px' }"
      />
    </template>

    <!-- Style panel (shown when style is toggled, hides buttons) -->
    <div v-if="showStyle && currentAnnotation && isStyleSupported" class="p-3 min-w-[170px]">
      <!-- Header with back button -->
      <div class="flex items-center gap-2 mb-3">
        <Button variant="ghost" size="icon" class="size-6" @click="showStyle = false">
          <span class="flex items-center -rotate-90"><Icon name="downArrow" :size="10" /></span>
        </Button>
        <span class="text-sm font-medium">{{ t('common.color') }}</span>
      </div>

      <!-- Color swatches -->
      <div v-if="isStyleSupported.color">
        <div class="flex flex-wrap gap-2 max-w-[168px]">
          <button
            v-for="c in presetColors"
            :key="c"
            class="size-6 rounded-full cursor-pointer transition-all duration-150 hover:scale-110 border-2"
            :class="currentColor === c ? 'border-primary scale-110' : 'border-foreground/10'"
            :style="{ backgroundColor: c }"
            @click="changeColor(c)"
          />
        </div>
      </div>

      <!-- Stroke width + Opacity -->
      <template v-if="isStyleSupported.strokeWidth || isStyleSupported.opacity">
        <Separator class="my-3" />
        <div class="space-y-3.5">
          <div v-if="isStyleSupported.strokeWidth">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs text-muted-foreground">{{ t('common.strokeWidth') }}</span>
              <span class="text-xs font-medium tabular-nums">{{ currentStrokeWidth }}px</span>
            </div>
            <input type="range" :min="1" :max="20" :value="currentStrokeWidth"
              class="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-secondary accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer"
              @input="changeStrokeWidth(Number(($event.target as HTMLInputElement).value))" />
          </div>
          <div v-if="isStyleSupported.opacity">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs text-muted-foreground">{{ t('common.opacity') }}</span>
              <span class="text-xs font-medium tabular-nums">{{ Math.round(currentOpacity * 100) }}%</span>
            </div>
            <input type="range" :min="1" :max="100" :value="Math.round(currentOpacity * 100)"
              class="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-secondary accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer"
              @input="changeOpacity(Number(($event.target as HTMLInputElement).value) / 100)" />
          </div>
        </div>
      </template>
    </div>

    <!-- Buttons row (hidden when style panel is showing) -->
    <div v-else class="flex items-center gap-0.5 p-1">
      <!-- Comment button -->
      <Button v-if="!isCommentSidebarOpen" variant="ghost" size="sm" class="h-7 px-2 gap-1.5 text-xs" @click="handleOpenComment">
        <Icon name="anno" :size="14" />
        <span>{{ t('common.comment') }}</span>
      </Button>
      <!-- Style button -->
      <Button v-if="isStyleSupported" variant="ghost" size="sm" class="h-7 px-2 gap-1.5 text-xs" @click="showStyle = true">
        <Icon name="paletteSingle" :size="14" />
        <span>{{ t('common.color') }}</span>
      </Button>
      <!-- Delete button -->
      <Button variant="ghost" size="sm" class="h-7 px-2 gap-1.5 text-xs hover:bg-destructive/10 hover:text-destructive" @click="handleDelete">
        <Icon name="delete" :size="14" />
        <span>{{ t('common.delete') }}</span>
      </Button>
    </div>
  </Popover>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import Konva from 'konva'
import type { IRect } from 'konva/lib/types'
import { Popover } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Icon from '@/components/Icon.vue'
import { PdfViewerContextKey } from '@/context/pdfViewerContext'
import {
  annotationDefinitions, type IAnnotationStore,
} from '../../const/definitions'
import { defaultOptions } from '../../const/default_options'
import { PAINTER_WRAPPER_PREFIX } from '../../painter/const'
import { useT } from '@/composables/useT'
const { t } = useT()

const ctx = inject(PdfViewerContextKey)

const visible = ref(false)
const triggerX = ref(0)
const triggerY = ref(0)
const popoverSide = ref<'top' | 'bottom'>('bottom')
const triggerRef = ref<HTMLElement | null>(null)
const currentAnnotation = ref<IAnnotationStore | null>(null)
const showStyle = ref(false)
const currentColor = ref('#ff6b6b')
const currentStrokeWidth = ref(2)
const currentOpacity = ref(1)
let painterRef: any = null

/** Estimated menu bar height — used to decide top/bottom placement */
const ESTIMATED_MENU_HEIGHT = 120

const props = defineProps<{ colors?: string[] }>()
const presetColors = computed(() => props.colors?.length ? props.colors : defaultOptions.colors!)

const isCommentSidebarOpen = computed(() =>
  ctx?.activeSidebarPanel?.value === 'annotator-sidebar-toggle'
)

const isStyleSupported = computed(() => {
  if (!currentAnnotation.value) return null
  return annotationDefinitions.find(a => a.type === currentAnnotation.value!.type)?.styleEditable ?? null
})

function getKonvaShapeFromString(konvaString: string) {
  try { return Konva.Node.create(konvaString).children?.[0] || null }
  catch { return null }
}

function calcPosition(annotation: IAnnotationStore, selectorRect: IRect) {
  const wrapperId = `${PAINTER_WRAPPER_PREFIX}_page_${annotation.pageNumber}`
  const konvaContainer = document.querySelector(`#${wrapperId} .konvajs-content`) as HTMLElement
  if (!konvaContainer) return

  const cr = konvaContainer.getBoundingClientRect()
  const annLeft = selectorRect.x + cr.left
  const annTop = selectorRect.y + cr.top
  const annBottom = annTop + selectorRect.height
  const viewportHeight = window.innerHeight

  // Horizontal: center of annotation
  triggerX.value = annLeft + selectorRect.width / 2

  // Vertical: decide placement based on available space
  const spaceBelow = viewportHeight - annBottom
  if (spaceBelow >= ESTIMATED_MENU_HEIGHT) {
    // Enough room below → trigger at annotation bottom,
    // Popover opens below (side="bottom"), top edge aligned with annotation bottom
    triggerY.value = annBottom
    popoverSide.value = 'bottom'
  } else {
    // Not enough room below → trigger at annotation top,
    // Popover opens above (side="top"), bottom edge aligned with annotation top
    triggerY.value = annTop
    popoverSide.value = 'top'
  }
}

// ========== Public API ==========
function open(annotation: IAnnotationStore, selectorRect: IRect) {
  // Guard: if already open with the same annotation, only update style refs
  // without toggling visibility (prevents flash from close→open cycle).
  // Note: the caller (AnnotatorExtension) already defers this call via
  // nextTick, so the native click event has finished propagating and
  // Radix Popover won't mis-dismiss. We can set visible synchronously.
  const sameAnnotation = currentAnnotation.value?.id === annotation.id

  currentAnnotation.value = annotation
  showStyle.value = false
  try {
    const shape = getKonvaShapeFromString(annotation.konvaString)
    currentStrokeWidth.value = shape?.strokeWidth?.() ?? 2
    currentOpacity.value = shape?.opacity?.() ?? 1
    currentColor.value = annotation.color || shape?.stroke?.() || '#ff6b6b'
  } catch {
    currentStrokeWidth.value = 2; currentOpacity.value = 1
    currentColor.value = annotation.color || '#ff6b6b'
  }
  calcPosition(annotation, selectorRect)

  if (sameAnnotation && visible.value) {
    // Already open for this annotation — no visibility toggle needed.
    // Radix Popover auto-repositions when trigger position changes,
    // so we just update the trigger position without closing/reopening.
    return
  }

  visible.value = true
}

function close() { visible.value = false; currentAnnotation.value = null; showStyle.value = false }

// ========== Actions ==========
function changeColor(color: string) {
  currentColor.value = color
  painterRef?.updateAnnotationStyle(currentAnnotation.value, { color })
}
function changeStrokeWidth(w: number) {
  currentStrokeWidth.value = w
  painterRef?.updateAnnotationStyle(currentAnnotation.value, { strokeWidth: w })
}
function changeOpacity(o: number) {
  currentOpacity.value = o
  painterRef?.updateAnnotationStyle(currentAnnotation.value, { opacity: o })
}
function handleDelete() {
  if (currentAnnotation.value) painterRef?.delete(currentAnnotation.value.id, true)
  close()
}
function handleOpenComment() {
  if (!currentAnnotation.value || !ctx) return
  ctx.openSidebar('annotator-sidebar-toggle')
  close()
}
function setMenuBarPainter(painter: any) { painterRef = painter }

defineExpose({ open, close, setMenuBarPainter })
</script>
