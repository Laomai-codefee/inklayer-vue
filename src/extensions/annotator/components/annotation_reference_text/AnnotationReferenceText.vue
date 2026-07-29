<template>
  <span class="annotation-reference-content">
    <template
      v-for="(segment, index) in segments"
      :key="`${segment.kind}-${index}`"
    >
      <template v-if="segment.kind === 'text'">{{ segment.value }}</template>

      <span
        v-else-if="!annotationsById.has(segment.annotationId)"
        class="annotation-reference-unavailable"
        :aria-label="t('annotator.comment.reference.unavailable', { value: segment.value })"
        :title="t('annotator.comment.reference.unavailable', { value: segment.value })"
      >
        {{ segment.value }}
      </span>

      <AnnotationReferenceHoverCard
        v-else
        :annotation="annotationsById.get(segment.annotationId)!"
        @activate="emit('activate', $event)"
      >
        <button
          type="button"
          class="annotation-reference-link"
          :aria-label="t('annotator.comment.reference.open', { value: segment.value })"
          @click.stop="emit('activate', segment.annotationId)"
        >
          {{ segment.value }}
        </button>
      </AnnotationReferenceHoverCard>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useT } from '@/composables/useT'
import type {
  IAnnotationReference,
  IAnnotationStore,
} from '../../const/definitions'
import { synchronizeAnnotationReferenceLabels } from '../../references/annotation_reference'
import AnnotationReferenceHoverCard from '../annotation_reference_hover_card/AnnotationReferenceHoverCard.vue'
import { createAnnotationReferenceSegments } from './reference_segments'

const props = withDefaults(defineProps<{
  annotations: readonly IAnnotationStore[]
  content?: string
  references?: readonly IAnnotationReference[]
}>(), {
  content: '',
  references: () => [],
})

const emit = defineEmits<{
  activate: [annotationId: string]
}>()

const { t } = useT()
const annotationsById = computed(() =>
  new Map(props.annotations.map(annotation => [annotation.id, annotation]))
)
const synchronized = computed(() =>
  synchronizeAnnotationReferenceLabels(
    props.content,
    props.references,
    props.annotations
  )
)
const segments = computed(() =>
  createAnnotationReferenceSegments(
    synchronized.value.content,
    synchronized.value.references
  )
)
</script>

<style scoped>
.annotation-reference-content {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.annotation-reference-link {
  display: inline;
  appearance: none;
  padding: 0 2px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--inklayer-primary);
  font: inherit;
  line-height: inherit;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
  cursor: pointer;
}

.annotation-reference-link:hover {
  background: color-mix(in srgb, var(--inklayer-primary) 12%, transparent);
}

.annotation-reference-link:focus-visible {
  outline: 2px solid var(--inklayer-ring);
  outline-offset: 1px;
}

.annotation-reference-unavailable {
  color: var(--inklayer-muted-foreground);
  text-decoration: line-through;
  cursor: not-allowed;
}
</style>
