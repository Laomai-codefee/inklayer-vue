<template>
  <div v-if="snapshot" class="delete-undo-overlay">
    <div
      ref="snackbarRef"
      class="delete-undo-snackbar"
      role="status"
      aria-live="polite"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @focusin="handleFocusIn"
      @focusout="handleFocusOut"
    >
      <p class="delete-undo-message">
        <template
          v-for="(segment, index) in segments"
          :key="`${segment.kind}-${index}`"
        >
          <template v-if="segment.kind === 'text'">{{ segment.value }}</template>
          <AnnotationReferenceHoverCard
            v-else
            :annotation="segment.annotation"
            :preview-comments="segment.comments"
            :activatable="false"
            @open-change="handleReferenceOpenChange(`${segment.annotation.id}-${index}`, $event)"
          >
            <button type="button" class="delete-undo-reference">
              {{ segment.value }}
            </button>
          </AnnotationReferenceHoverCard>
        </template>
      </p>
      <Button size="sm" class="delete-undo-restore text-xs" @click="painter?.undoDelete()">
        {{ t(snapshot.totalCount === 1 ? 'common.restore' : 'common.restoreAll') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, shallowRef, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { Button } from '@/components/ui/button'
import { useT } from '@/composables/useT'
import { globalI18n } from '@/i18n'
import { useAnnotationStore } from '@/stores/annotationStore'
import type { DeleteUndoSnapshot } from '../../painter/delete_undo'
import AnnotationReferenceHoverCard from '../annotation_reference_hover_card/AnnotationReferenceHoverCard.vue'
import {
  getDeleteUndoMessage,
  getDeleteUndoMessageSegments,
  type DeleteUndoTranslate,
} from './message'

const { t } = useT()
const store = useAnnotationStore()
const { painter } = storeToRefs(store)
const snapshot = shallowRef<DeleteUndoSnapshot | null>(null)
const snackbarRef = ref<HTMLDivElement | null>(null)
const hovered = ref(false)
const focused = ref(false)
const openReferences = new Set<string>()
let unsubscribe = () => {}

watch(painter, (nextPainter) => {
  unsubscribe()
  openReferences.clear()
  hovered.value = false
  focused.value = false
  snapshot.value = nextPainter?.getDeleteUndoSnapshot() ?? null
  unsubscribe = nextPainter?.subscribeDeleteUndo(() => {
    snapshot.value = nextPainter.getDeleteUndoSnapshot()
  }) ?? (() => {})
}, { immediate: true })

watch(snapshot, (nextSnapshot) => {
  if (nextSnapshot) return
  openReferences.clear()
  hovered.value = false
  focused.value = false
})

const language = computed(() => String(globalI18n.global.locale.value))
const message = computed(() => snapshot.value
  ? getDeleteUndoMessage(snapshot.value, t as DeleteUndoTranslate, language.value)
  : '')
const segments = computed(() => snapshot.value
  ? getDeleteUndoMessageSegments(message.value, snapshot.value.items)
  : [])

function handleMouseEnter() {
  hovered.value = true
  painter.value?.pauseDeleteUndo()
}

function handleMouseLeave() {
  hovered.value = false
  if (!focused.value && openReferences.size === 0) painter.value?.resumeDeleteUndo()
}

function handleFocusIn() {
  focused.value = true
  painter.value?.pauseDeleteUndo()
}

function handleFocusOut(event: FocusEvent) {
  if (snackbarRef.value?.contains(event.relatedTarget as Node | null)) return
  focused.value = false
  if (!hovered.value && openReferences.size === 0) painter.value?.resumeDeleteUndo()
}

function handleReferenceOpenChange(key: string, open: boolean) {
  if (open) {
    openReferences.add(key)
    painter.value?.pauseDeleteUndo()
    return
  }
  openReferences.delete(key)
  if (!hovered.value && !focused.value && openReferences.size === 0) {
    painter.value?.resumeDeleteUndo()
  }
}

onUnmounted(() => {
  unsubscribe()
  openReferences.clear()
})
</script>

<style scoped>
.delete-undo-overlay {
  position: absolute;
  top: 3px;
  left: 50%;
  z-index: 2147483000;
  width: max-content;
  max-width: calc(100% - 24px);
  pointer-events: none;
  transform: translateX(-50%);
}

.delete-undo-snackbar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 4px 6px;
  border: 1px solid var(--inklayer-border);
  border-radius: 6px;
  background: var(--inklayer-popover);
  color: var(--inklayer-popover-foreground);
  pointer-events: auto;
}

.delete-undo-message {
  min-width: 0;
  overflow: hidden;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-undo-reference {
  appearance: none;
  padding: 0 1px;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: var(--inklayer-primary);
  font: inherit;
  line-height: inherit;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
  cursor: help;
}

.delete-undo-reference:hover {
  background: color-mix(in srgb, var(--inklayer-primary) 12%, transparent);
}

.delete-undo-reference:focus-visible {
  outline: 2px solid var(--inklayer-ring);
  outline-offset: 1px;
}

.delete-undo-restore {
  height: 28px;
  flex: 0 0 auto;
  padding-inline: 10px;
}
</style>
