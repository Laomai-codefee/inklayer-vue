<template>
  <div
    ref="rootElement"
    data-annotation-editor
    class="reference-input"
    @click.stop
    @focusout="handleFocusOut"
  >
    <Popover
      :open="menuOpen"
      side="bottom"
      align="start"
      :side-offset="4"
      :collision-padding="8"
      :annotation-hover-owner="annotationHoverOwner"
      class="!z-[1200]"
      @update:open="handleOpenChange"
      @open-auto-focus="preventAutoFocus"
      @close-auto-focus="handleCloseAutoFocus"
    >
      <template #trigger>
        <Textarea
          ref="textareaComponent"
          v-model="content"
          rows="4"
          :placeholder="placeholder"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          :aria-label="t('annotator.comment.reference.inputLabel')"
          :aria-expanded="menuOpen"
          :aria-controls="menuOpen ? listboxId : undefined"
          :aria-activedescendant="activeDescendant"
          class="w-full min-h-[50px] text-xs resize-none mt-1.5 bg-background"
          @input="handleInput"
          @click="updateQueryFromTextarea"
          @keyup="handleKeyUp"
          @keydown="handleKeyDown"
          @compositionstart="isComposing = true"
          @compositionend="handleCompositionEnd"
        />
      </template>

      <div
        :id="listboxId"
        ref="menuElement"
        role="listbox"
        class="reference-menu"
      >
        <div
          v-for="(annotation, index) in candidates"
          :id="`${listboxId}-option-${index}`"
          :key="annotation.id"
          :ref="element => setOptionElement(element, index)"
          role="option"
          :aria-selected="index === boundedActiveIndex"
          class="reference-option"
          @mouseenter="activeIndex = index"
          @mousedown.prevent
          @click="insertReference(annotation)"
        >
          <div class="reference-option-header">
            <span class="reference-number">#{{ annotation.referenceNumber }}</span>
            <span class="reference-page">
              {{ t('annotator.comment.page', { value: annotation.pageNumber }) }}
            </span>
          </div>

          <span class="reference-summary">
            {{ getAnnotationSummary(annotation) || t('annotator.comment.reference.noContent') }}
          </span>

          <span class="reference-meta">
            <Icon
              :name="getAnnotationIcon(annotation)"
              :size="14"
              class="reference-type-icon"
              aria-hidden="true"
            />
            <span class="reference-author">{{ annotation.title }}</span>
            <template v-if="formatDate(annotation.date)">
              <span aria-hidden="true">·</span>
              <span class="reference-date">{{ formatDate(annotation.date) }}</span>
            </template>
          </span>
        </div>

        <div
          v-if="candidates.length === 0"
          class="reference-empty"
        >
          {{ t('annotator.comment.reference.empty') }}
        </div>
      </div>
    </Popover>

    <Button
      type="button"
      class="reference-submit"
      @mousedown.prevent
      @click="submit"
    >
      {{ t('common.confirm') }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  watch,
  type ComponentPublicInstance,
} from 'vue'
import Button from '@/components/ui/button/Button.vue'
import { Popover } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import Icon from '@/components/Icon.vue'
import { useT } from '@/composables/useT'
import {
  annotationDefinitions,
  type IAnnotationReference,
  type IAnnotationStore,
} from '../../const/definitions'
import {
  normalizeAnnotationReferences,
  synchronizeAnnotationReferenceLabels,
  type AnnotationReferenceContent,
} from '../../references/annotation_reference'
import { formatPDFDate } from '../../utils/utils'
import {
  filterAnnotationReferenceCandidates,
  findAnnotationReferenceQuery,
  type AnnotationReferenceQuery,
} from './reference_query'

const SEPARATOR_PREFIX_PATTERN = /^[\s.,!?;:'"<>/\\，。！？；：、“”‘’《》（）()[\]{}]/
const annotationIcons = new Map(
  annotationDefinitions.map(annotation => [annotation.type, annotation.icon])
)

const props = withDefaults(defineProps<{
  annotations: readonly IAnnotationStore[]
  excludeAnnotationId: string
  initialContent?: string
  initialReferences?: readonly IAnnotationReference[]
  annotationHoverOwner?: string
  placeholder?: string
}>(), {
  initialContent: '',
  initialReferences: () => [],
})

const emit = defineEmits<{
  submit: [draft: AnnotationReferenceContent]
  cancel: []
}>()

const { t } = useT()
const initialDraft = synchronizeAnnotationReferenceLabels(
  props.initialContent,
  props.initialReferences,
  props.annotations
)
const content = ref(initialDraft.content)
const references = ref<IAnnotationReference[]>(initialDraft.references ?? [])
const query = ref<AnnotationReferenceQuery | null>(null)
const activeIndex = ref(0)
const isComposing = ref(false)
const textareaComponent = ref<InstanceType<typeof Textarea> | null>(null)
const rootElement = ref<HTMLDivElement | null>(null)
const menuElement = ref<HTMLDivElement | null>(null)
const optionElements = ref<Array<HTMLElement | null>>([])
const listboxId = `annotation-reference-${useId()}`
let focusFrame: number | null = null
let blurFrame: number | null = null

const candidates = computed(() => filterAnnotationReferenceCandidates(
  props.annotations,
  query.value?.query ?? '',
  props.excludeAnnotationId
))
const menuOpen = computed(() => query.value !== null)
const boundedActiveIndex = computed(() => candidates.value.length > 0
  ? Math.min(activeIndex.value, candidates.value.length - 1)
  : 0)
const activeDescendant = computed(() => menuOpen.value && candidates.value.length > 0
  ? `${listboxId}-option-${boundedActiveIndex.value}`
  : undefined)

watch([boundedActiveIndex, menuOpen], async ([, open]) => {
  if (!open) return
  await nextTick()
  optionElements.value[boundedActiveIndex.value]?.scrollIntoView?.({ block: 'nearest' })
})

onMounted(() => {
  focusFrame = requestAnimationFrame(() => {
    focusFrame = null
    focusTextarea()
  })
})

onBeforeUnmount(() => {
  if (focusFrame !== null) cancelAnimationFrame(focusFrame)
  if (blurFrame !== null) cancelAnimationFrame(blurFrame)
})

function setOptionElement(
  element: Element | ComponentPublicInstance | null,
  index: number
) {
  optionElements.value[index] = element instanceof HTMLElement ? element : null
}

function focusTextarea() {
  textareaComponent.value?.textareaRef?.focus()
}

function preventAutoFocus(event: Event) {
  event.preventDefault()
}

function handleCloseAutoFocus(event: Event) {
  event.preventDefault()
  focusTextarea()
}

function updateQuery(nextContent: string, caretPosition: number) {
  query.value = findAnnotationReferenceQuery(nextContent, caretPosition)
  activeIndex.value = 0
}

function updateQueryFromTextarea(event: Event) {
  const textarea = event.currentTarget as HTMLTextAreaElement
  updateQuery(textarea.value, textarea.selectionStart)
}

function handleInput(event: Event) {
  const textarea = event.currentTarget as HTMLTextAreaElement
  references.value = normalizeAnnotationReferences(
    textarea.value,
    references.value
  ) ?? []
  if (!isComposing.value) updateQuery(textarea.value, textarea.selectionStart)
}

function handleKeyUp(event: KeyboardEvent) {
  if (
    !isComposing.value
    && !['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)
  ) {
    updateQueryFromTextarea(event)
  }
}

function handleCompositionEnd(event: CompositionEvent) {
  isComposing.value = false
  updateQueryFromTextarea(event)
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.isComposing || isComposing.value || event.keyCode === 229) return

  if (menuOpen.value) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (candidates.value.length > 0) {
        activeIndex.value = (boundedActiveIndex.value + 1) % candidates.value.length
      }
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (candidates.value.length > 0) {
        activeIndex.value = (
          boundedActiveIndex.value - 1 + candidates.value.length
        ) % candidates.value.length
      }
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const candidate = candidates.value[boundedActiveIndex.value]
      if (candidate) insertReference(candidate)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      query.value = null
      return
    }
  }

  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    submit()
  }
}

async function insertReference(annotation: IAnnotationStore) {
  if (!query.value || annotation.referenceNumber === undefined) return

  const label = `#${annotation.referenceNumber}`
  const before = content.value.slice(0, query.value.start)
  const after = content.value.slice(query.value.end)
  const separator = after.length === 0 || !SEPARATOR_PREFIX_PATTERN.test(after)
    ? ' '
    : ''
  const nextContent = `${before}${label}${separator}${after}`
  const nextReferences = [
    ...references.value.filter(reference => reference.label !== label),
    {
      type: 'annotation' as const,
      annotationId: annotation.id,
      label,
    },
  ]
  const selection = before.length + label.length + separator.length

  content.value = nextContent
  references.value = normalizeAnnotationReferences(nextContent, nextReferences) ?? []
  query.value = null
  activeIndex.value = 0
  await nextTick()
  focusTextarea()
  textareaComponent.value?.textareaRef?.setSelectionRange(selection, selection)
}

function submit() {
  emit('submit', synchronizeAnnotationReferenceLabels(
    content.value,
    references.value,
    props.annotations
  ))
}

function handleOpenChange(open: boolean) {
  if (!open) query.value = null
}

function handleFocusOut(event: FocusEvent) {
  const nextTarget = event.relatedTarget
  if (
    nextTarget instanceof Node
    && (
      rootElement.value?.contains(nextTarget)
      || menuElement.value?.contains(nextTarget)
    )
  ) {
    return
  }

  if (blurFrame !== null) cancelAnimationFrame(blurFrame)
  blurFrame = requestAnimationFrame(() => {
    blurFrame = null
    if (
      !rootElement.value?.contains(document.activeElement)
      && !menuElement.value?.contains(document.activeElement)
    ) {
      emit('cancel')
    }
  })
}

function getAnnotationSummary(annotation: IAnnotationStore): string {
  const contents = annotation.contentsObj
  return (contents?.text || contents?.selectedText || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getAnnotationIcon(annotation: IAnnotationStore): string {
  return annotationIcons.get(annotation.type) ?? 'select'
}

function formatDate(date: string | null): string {
  return formatPDFDate(date, true)
}
</script>

<style scoped>
.reference-input {
  position: relative;
  scroll-margin-block: 10px;
}

.reference-submit {
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
}

.reference-menu {
  box-sizing: border-box;
  width: min(var(--reka-popover-trigger-width), calc(100vw - 16px));
  max-height: 300px;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 4px;
}

.reference-option {
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-height: 72px;
  padding: 10px 12px;
  border: 0;
  border-bottom: 1px solid var(--inklayer-border);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.reference-option + .reference-option {
  margin-top: 2px;
}

.reference-option:hover {
  background: var(--inklayer-muted);
}

.reference-option[aria-selected='true'] {
  background: var(--inklayer-accent);
}

.reference-option-header,
.reference-meta {
  display: flex;
  align-items: center;
  min-width: 0;
}

.reference-option-header {
  gap: 8px;
}

.reference-number {
  flex: 0 0 auto;
  padding: 1px 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--inklayer-primary) 12%, transparent);
  color: var(--inklayer-primary);
  font-size: 11px;
  font-weight: 500;
}

.reference-page {
  flex: 0 0 auto;
  margin-left: auto;
  color: var(--inklayer-muted-foreground);
  font-size: 11px;
  white-space: nowrap;
}

.reference-summary {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.35;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.reference-meta {
  gap: 5px;
  overflow: hidden;
  margin-top: 8px;
  color: var(--inklayer-muted-foreground);
  font-size: 11px;
  white-space: nowrap;
}

.reference-type-icon {
  display: inline-flex;
  flex: 0 0 auto;
  opacity: 0.7;
}

.reference-author {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reference-date {
  flex: 0 0 auto;
}

.reference-empty {
  padding: 8px;
  color: var(--inklayer-muted-foreground);
  font-size: 12px;
  text-align: center;
}
</style>
