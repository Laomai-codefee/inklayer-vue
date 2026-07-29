<template>
  <HoverCardRoot
    v-model:open="open"
    :open-delay="350"
    :close-delay="150"
  >
    <HoverCardTrigger as-child>
      <slot />
    </HoverCardTrigger>

    <HoverCardPortal>
      <HoverCardContent
        align="center"
        :side-offset="4"
        class="annotation-reference-hover-card"
        @click.stop
      >
        <div class="annotation-reference-hover-card__header">
          <span class="annotation-reference-hover-card__identity">
            <button
              type="button"
              class="annotation-reference-hover-card__number"
              :aria-label="t('annotator.comment.reference.open', { value: referenceLabel })"
              @click="activate"
            >
              {{ referenceLabel }}
            </button>
            <span aria-hidden="true" class="annotation-reference-hover-card__separator">·</span>
            <span class="annotation-reference-hover-card__author">{{ authorName }}</span>
          </span>
          <span class="annotation-reference-hover-card__page">
            {{ t('annotator.comment.reference.previewPage', { value: annotation.pageNumber }) }}
          </span>
        </div>

        <blockquote
          v-if="selectedTextPreview"
          class="annotation-reference-hover-card__selected-text"
        >
          {{ selectedTextPreview }}
        </blockquote>

        <p
          v-if="commentPreview"
          class="annotation-reference-hover-card__preview"
        >
          {{ commentPreview }}
        </p>

        <p
          v-if="!hasPreview"
          class="annotation-reference-hover-card__empty"
        >
          {{ t('annotator.comment.reference.previewNoContent') }}
        </p>

        <div
          v-if="replyCount > 0"
          class="annotation-reference-hover-card__footer"
        >
          {{ t('annotator.comment.reference.replyCount', { count: replyCount }) }}
        </div>
      </HoverCardContent>
    </HoverCardPortal>
  </HoverCardRoot>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  HoverCardContent,
  HoverCardPortal,
  HoverCardRoot,
  HoverCardTrigger,
} from 'reka-ui'

import { useT } from '@/composables/useT'
import type { IAnnotationStore } from '../../const/definitions'
import { createAnnotationPreview } from './annotation_preview'

const props = defineProps<{
  annotation: IAnnotationStore
}>()

const emit = defineEmits<{
  activate: [annotationId: string]
}>()

const { t } = useT()
const open = ref(false)
const commentPreview = computed(() =>
  createAnnotationPreview(props.annotation.contentsObj?.text)
)
const selectedTextPreview = computed(() =>
  createAnnotationPreview(props.annotation.contentsObj?.selectedText)
)
const hasPreview = computed(() =>
  Boolean(commentPreview.value || selectedTextPreview.value)
)
const authorName = computed(() =>
  props.annotation.user?.name || props.annotation.title
)
const replyCount = computed(() => props.annotation.comments?.length ?? 0)
const referenceLabel = computed(() =>
  props.annotation.referenceNumber === undefined
    ? props.annotation.title
    : `#${props.annotation.referenceNumber}`
)

function activate() {
  open.value = false
  emit('activate', props.annotation.id)
}
</script>

<style>
.annotation-reference-hover-card {
  z-index: 1200;
  display: grid;
  width: min(301px, calc(100vw - 24px));
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--inklayer-border);
  border-radius: 6px;
  background: var(--inklayer-popover);
  color: var(--inklayer-popover-foreground);
  box-shadow: 0 2px 12px rgb(0 0 0 / 12%);
  outline: none;
}

.dark .annotation-reference-hover-card {
  box-shadow: 0 2px 12px rgb(0 0 0 / 30%);
}

.annotation-reference-hover-card__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  min-width: 0;
  gap: 12px;
}

.annotation-reference-hover-card__identity {
  display: flex;
  align-items: baseline;
  min-width: 0;
  gap: 5px;
  font-size: 12px;
}

.annotation-reference-hover-card__number {
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--inklayer-primary);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}

.annotation-reference-hover-card__number:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.annotation-reference-hover-card__number:focus-visible {
  border-radius: 2px;
  outline: 2px solid var(--inklayer-ring);
  outline-offset: 2px;
}

.annotation-reference-hover-card__separator {
  color: var(--inklayer-muted-foreground);
}

.annotation-reference-hover-card__author {
  overflow: hidden;
  color: var(--inklayer-muted-foreground);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.annotation-reference-hover-card__page {
  flex: 0 0 auto;
  color: var(--inklayer-muted-foreground);
  font-size: 11px;
}

.annotation-reference-hover-card__selected-text,
.annotation-reference-hover-card__preview,
.annotation-reference-hover-card__empty {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.annotation-reference-hover-card__selected-text {
  padding-left: 8px;
  border-left: 2px solid color-mix(in srgb, var(--inklayer-primary) 55%, transparent);
  color: var(--inklayer-muted-foreground);
  font-style: italic;
  -webkit-line-clamp: 2;
}

.annotation-reference-hover-card__empty,
.annotation-reference-hover-card__footer {
  color: var(--inklayer-muted-foreground);
}

.annotation-reference-hover-card__footer {
  font-size: 11px;
}
</style>
