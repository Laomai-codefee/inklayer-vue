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
              v-if="activatable"
              type="button"
              class="annotation-reference-hover-card__number"
              :aria-label="t('annotator.comment.reference.open', { value: referenceLabel })"
              @click="activate"
            >
              {{ referenceLabel }}
            </button>
            <span v-else class="annotation-reference-hover-card__number-static">
              {{ referenceLabel }}
            </span>
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
          v-if="!hasDeletedCommentPreview && annotationPreview"
          class="annotation-reference-hover-card__preview"
        >
          {{ annotationPreview }}
        </p>

        <section
          v-if="hasDeletedCommentPreview"
          class="annotation-reference-hover-card__deleted-comments"
        >
          <div class="annotation-reference-hover-card__deleted-comments-title">
            {{ t('annotator.deleteUndo.deletedCommentPreview') }}
          </div>
          <div
            v-for="comment in previewComments.slice(0, 3)"
            :key="comment.id"
            class="annotation-reference-hover-card__deleted-comment"
          >
            <span class="annotation-reference-hover-card__deleted-comment-author">
              {{ comment.user?.name || comment.title }}
            </span>
            <p class="annotation-reference-hover-card__deleted-comment-content">
              {{ createAnnotationPreview(comment.content) || t('annotator.comment.reference.previewNoContent') }}
            </p>
          </div>
          <div
            v-if="previewComments.length > 3"
            class="annotation-reference-hover-card__deleted-comments-more"
          >
            {{ t('annotator.deleteUndo.deletedCommentsMore', { count: previewComments.length - 3 }) }}
          </div>
        </section>

        <p
          v-if="!hasPreview"
          class="annotation-reference-hover-card__empty"
        >
          {{ t('annotator.comment.reference.previewNoContent') }}
        </p>

        <div
          v-if="replyCount > 0 && !hasDeletedCommentPreview"
          class="annotation-reference-hover-card__footer"
        >
          {{ t('annotator.comment.reference.replyCount', { count: replyCount }) }}
        </div>
      </HoverCardContent>
    </HoverCardPortal>
  </HoverCardRoot>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  HoverCardContent,
  HoverCardPortal,
  HoverCardRoot,
  HoverCardTrigger,
} from 'reka-ui'

import { useT } from '@/composables/useT'
import type { IAnnotationComment, IAnnotationStore } from '../../const/definitions'
import { createAnnotationPreview } from './annotation_preview'

const props = withDefaults(defineProps<{
  annotation: IAnnotationStore
  activatable?: boolean
  previewComments?: readonly IAnnotationComment[]
}>(), {
  activatable: true,
  previewComments: () => [],
})

const emit = defineEmits<{
  activate: [annotationId: string]
  'open-change': [open: boolean]
}>()

const { t } = useT()
const open = ref(false)
const activatable = computed(() => props.activatable)
const previewComments = computed(() => props.previewComments)
const annotationPreview = computed(() =>
  createAnnotationPreview(props.annotation.contentsObj?.text)
)
const selectedTextPreview = computed(() =>
  createAnnotationPreview(props.annotation.contentsObj?.selectedText)
)
const hasDeletedCommentPreview = computed(() => previewComments.value.length > 0)
const hasPreview = computed(() =>
  Boolean(annotationPreview.value || selectedTextPreview.value || hasDeletedCommentPreview.value)
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
  if (!activatable.value) return
  open.value = false
  emit('activate', props.annotation.id)
}

watch(open, value => emit('open-change', value))
</script>

<style>
.annotation-reference-hover-card {
  z-index: 2147483100;
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

.annotation-reference-hover-card__number-static {
  flex: 0 0 auto;
  color: var(--inklayer-primary);
  font-weight: 500;
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

.annotation-reference-hover-card__deleted-comments {
  display: grid;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--inklayer-border);
}

.annotation-reference-hover-card__deleted-comments-title,
.annotation-reference-hover-card__deleted-comment-author,
.annotation-reference-hover-card__deleted-comments-more {
  color: var(--inklayer-muted-foreground);
  font-size: 11px;
}

.annotation-reference-hover-card__deleted-comment {
  display: grid;
  gap: 2px;
}

.annotation-reference-hover-card__deleted-comment-content {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
