<template>
  <div class="flex flex-col h-full">
    <!-- Header with filter -->
    <div class="flex items-center gap-2 px-3 py-1.5">
      <Popover v-model:open="filterOpen" class="!z-[1200]">
        <template #trigger>
          <Button variant="ghost" size="icon" class="size-7">
            <Icon name="filter" :size="14" />
          </Button>
        </template>
        <template #default>
          <div class="space-y-3 text-left p-3 min-w-[180px]">
            <div>
              <p class="text-xs font-medium mb-1.5 text-muted-foreground">{{ t('common.author') }}</p>
              <div v-for="[user, count] in allUsers" :key="user" class="flex items-center gap-2 py-1 hover:bg-accent/50 rounded px-1 cursor-pointer">
                <input type="checkbox" :id="`fu-${user}`" :checked="selectedUsers.includes(user)" class="size-3.5 rounded border-input" @change="toggleUser(user)" />
                <label :for="`fu-${user}`" class="text-xs cursor-pointer flex-1">{{ user }} ({{ count }})</label>
              </div>
            </div>
            <div>
              <p class="text-xs font-medium mb-1.5 text-muted-foreground">{{ t('common.type') }}</p>
              <div v-for="[type, count] in allTypes" :key="type" class="flex items-center gap-2 py-1 hover:bg-accent/50 rounded px-1 cursor-pointer">
                <input type="checkbox" :id="`ft-${type}`" :checked="selectedTypes.includes(type)" class="size-3.5 rounded border-input" @change="toggleType(type)" />
                <label :for="`ft-${type}`" class="text-xs cursor-pointer flex-1">{{ type }} ({{ count }})</label>
              </div>
            </div>
            <div class="flex gap-2 pt-1">
              <Button variant="ghost" size="sm" class="flex-1 text-xs" @click="selectAll">{{ t('common.selectAll') }}</Button>
              <Button variant="ghost" size="sm" class="flex-1 text-xs" @click="clearAll">{{ t('common.clear') }}</Button>
            </div>
          </div>
        </template>
      </Popover>
    </div>

    <!-- Annotation list -->
    <ScrollArea v-if="groupedEntries.length > 0" class="flex-1 px-1.5 pb-6 text-left">
      <div v-for="[pageNumber, pAnns] in groupedEntries" :key="pageNumber" class="mb-2.5">
        <div class="flex items-center justify-between px-1 py-1">
          <span class="text-xs">{{ t('annotator.comment.page', { value: pageNumber }) }}</span>
          <span class="text-xs">{{ t('annotator.comment.total', { value: pAnns.length }) }}</span>
        </div>

        <div
          v-for="ann in pAnns"
          :key="ann.id"
          :id="`annotation-${ann.id}`"
          :data-annotation-hover-owner="ann.id"
          class="annotation-card border border-border border-[2px] bg-card rounded-lg p-2.5 pt-0.5 mb-2 cursor-pointer leading-relaxed transition-colors"
          :class="{
            '!bg-accent': selectedAnnotationId === ann.id,
            'annotation-card--preview': showAnnotationPreview(ann.id),
          }"
          @click="handleAnnotationClick(ann)"
          @pointerenter="handleAnnotationPointerEnter(ann.id, $event)"
          @pointerleave="handleAnnotationPointerLeave(ann.id)"
          @focusin.capture="handleAnnotationFocus(ann.id)"
          @focusout.capture="handleAnnotationBlur(ann.id, $event)"
        >
          <!-- Card header -->
          <div class="flex min-h-8 items-center gap-2  border-b-[1px] border-border">
            <div class="flex min-w-0 flex-1 items-center gap-1">
              <span
                class="truncate text-sm font-medium"
                :class="{ 'text-primary': isAnnotationHeadingActive(ann.id) }"
              >
                {{ getAnnotationHeading(ann) }}
              </span>
              <Tooltip v-if="ann.native" :content="t('annotator.comment.nativeAnnotation')">
                <template #trigger>
                  <span class="shrink-0 cursor-pointer text-orange-400">
                    <Icon name="exclamation" :size="14" />
                  </span>
                </template>
              </Tooltip>
            </div>
            <div class="flex items-center shrink-0 gap-0.5 ml-auto" @click.stop>
              <!-- Status dropdown -->
              <DropdownMenu
                v-if="can('annotation.change-status', ann)"
                :annotation-hover-owner="ann.id"
              >
                <template #trigger>
                  <Button variant="ghost" size="icon" class="size-6 text-muted-foreground" :title="t('common.status')">
                    <Icon :name="getStatusIcon(ann)" :size="14" />
                  </Button>
                </template>
                <DropdownMenuItem v-for="opt in statusOptions" :key="opt.key" class="flex items-center gap-2 text-xs" @select="addReplyWithStatusDirect(ann, opt.key)">
                  <Icon :name="opt.icon" :size="14" />
                  <span>{{ t(opt.labelKey) }}</span>
                </DropdownMenuItem>
              </DropdownMenu>
              <!-- Action dropdown -->
              <DropdownMenu
                v-if="can('annotation.comment', ann) || can('annotation.edit', ann) || can('annotation.delete', ann)"
                :annotation-hover-owner="ann.id"
                @close-auto-focus="handleAnnotationMenuCloseAutoFocus(ann.id, $event)"
              >
                <template #trigger>
                  <Button variant="ghost" size="icon" class="size-6 text-muted-foreground" title="More"><Icon name="more" :size="14" /></Button>
                </template>
                <DropdownMenuItem v-if="can('annotation.comment', ann)" class="text-xs" @select="handleReplyFromMenu(ann)">{{ t('common.reply') }}</DropdownMenuItem>
                <DropdownMenuItem v-if="can('annotation.edit', ann)" class="text-xs" @select="handleEditFromMenu(ann)">{{ t('common.edit') }}</DropdownMenuItem>
                <DropdownMenuItem v-if="can('annotation.delete', ann)" class="text-xs" @select="deleteAnnotation(ann.id)">{{ t('common.delete') }}</DropdownMenuItem>
              </DropdownMenu>
            </div>
          </div>

          <div class="mt-1 flex min-h-[18px] min-w-0 items-center gap-1 text-[12px] text-muted-foreground">
            <Tooltip :content="getAnnotationTypeLabel(ann)">
              <template #trigger>
                <span
                  class="inline-flex shrink-0 opacity-50"
                  :aria-label="getAnnotationTypeLabel(ann)"
                >
                  <Icon :name="getAnnotationIcon(ann)" :size="12" aria-hidden="true" />
                </span>
              </template>
            </Tooltip>
            <span class="truncate">{{ getAnnotationAuthor(ann) }}</span>
            <template v-if="formatDate(ann.date)">
              <span aria-hidden="true">·</span>
              <span class="shrink-0 whitespace-nowrap">{{ formatDate(ann.date) }}</span>
            </template>
          </div>

          <!-- Comment text / edit -->
          <template v-if="editAnnotationId === ann.id && can('annotation.edit', ann)">
            <AnnotationReferenceInput
              class="mt-1.5"
              :annotations="annotations"
              :exclude-annotation-id="ann.id"
              :annotation-hover-owner="ann.id"
              :initial-content="ann.contentsObj?.text || ''"
              :initial-references="ann.contentsObj?.references"
              :placeholder="t('annotator.comment.reference.commentPlaceholder')"
              @submit="updateComment(ann, $event)"
              @cancel="cancelAnnotationEdit(ann.id)"
            />
          </template>
          <template v-else>
            <p v-if="ann.contentsObj?.text?.trim()" class="mt-1.5  pl-4">
              <AnnotationReferenceText
                :annotations="annotations"
                :content="ann.contentsObj.text"
                :references="ann.contentsObj.references"
                @activate="handleReferenceActivate"
              />
            </p>
          </template>

          <!-- Replies -->
          <div v-for="reply in ann.comments" :key="reply.id" class="mt-2 ml-4 rounded-md bg-secondary p-2">
            <template v-if="editReplyId === reply.id && can('comment.edit', ann, reply)">
              <AnnotationReferenceInput
                :annotations="annotations"
                :exclude-annotation-id="ann.id"
                :annotation-hover-owner="ann.id"
                :initial-content="reply.content"
                :initial-references="reply.references"
                :placeholder="t('annotator.comment.reference.replyPlaceholder')"
                @submit="updateReply(ann, reply, $event)"
                @cancel="cancelReplyEdit(ann.id)"
              />
            </template>
            <template v-else>
              <div class="flex min-h-6 items-center gap-2">
                <span class="min-w-0 flex-1 truncate text-xs font-medium">{{ reply.title }}</span>
                <DropdownMenu
                  v-if="can('comment.edit', ann, reply) || can('comment.delete', ann, reply)"
                  :annotation-hover-owner="ann.id"
                  @close-auto-focus="handleReplyMenuCloseAutoFocus(reply.id, $event)"
                >
                  <template #trigger>
                    <Button variant="ghost" size="icon" class="size-6 shrink-0 p-0">
                      <Icon name="more" :size="14" />
                    </Button>
                  </template>
                  <DropdownMenuItem v-if="can('comment.edit', ann, reply)" class="text-xs" @select="handleEditReplyFromMenu(ann, reply)">{{ t('common.edit') }}</DropdownMenuItem>
                  <DropdownMenuItem v-if="can('comment.delete', ann, reply)" class="text-xs" @select="deleteReplyDirect(ann.id, reply.id)">{{ t('common.delete') }}</DropdownMenuItem>
                </DropdownMenu>
              </div>
              <div v-if="formatDate(reply.date)" class="mt-0.5 text-xs text-muted-foreground">
                {{ formatDate(reply.date) }}
              </div>
              <p v-if="reply.content" class="mt-1">
                <AnnotationReferenceText
                  :annotations="annotations"
                  :content="reply.content"
                  :references="reply.references"
                  @activate="handleReferenceActivate"
                />
              </p>
            </template>
          </div>

          <!-- Reply input -->
          <div v-if="replyAnnotationId === ann.id && can('annotation.comment', ann)" class="mt-2">
            <AnnotationReferenceInput
              :annotations="annotations"
              :exclude-annotation-id="ann.id"
              :annotation-hover-owner="ann.id"
              :placeholder="t('annotator.comment.reference.replyPlaceholder')"
              @submit="addReply(ann, $event)"
              @cancel="cancelReply(ann.id)"
            />
          </div>

          <!-- Reply button -->
          <div v-if="selectedAnnotationId === ann.id && !replyAnnotationId && !editAnnotationId && !editReplyId && can('annotation.comment', ann)" class="mt-2">
            <Button size="sm" class="w-full text-xs" @mousedown.prevent="startReply(ann)">{{ t('common.reply') }}</Button>
          </div>
        </div>
      </div>
    </ScrollArea>

    <div v-else class="flex-1 flex items-center justify-center text-xs text-muted-foreground">
      {{ t('annotator.comment.total', { value: 0 }) }}
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, inject, nextTick, type PropType } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { Popover } from '@/components/ui/popover'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import Icon from '@/components/Icon.vue'
import AnnotationReferenceInput from '@/extensions/annotator/components/annotation_reference_input/AnnotationReferenceInput.vue'
import AnnotationReferenceText from '@/extensions/annotator/components/annotation_reference_text/AnnotationReferenceText.vue'
import {
  annotationDefinitions,
  CommentStatus,
  type IAnnotationStore,
  type IAnnotationComment,
} from '@/extensions/annotator/const/definitions'
import { useAnnotationStore, SelectionSource } from '@/stores/annotationStore'
import { PdfViewerContextKey, UserContextKey } from '@/context/pdfViewerContext'
import {
  formatPDFCompactDateTime,
  formatTimestamp,
  generateUUID,
} from '@/extensions/annotator/utils/utils'
import { useT } from '@/composables/useT'
import type { AnnotationPermissionAction, AnnotationPermissions } from '@/extensions/annotator/types/annotator'
import type { AnnotationReferenceContent } from '@/extensions/annotator/references/annotation_reference'
import { isValidReferenceNumber } from '@/extensions/annotator/references/annotation_numbering'
import { getAnnotationAuthorName } from '@/extensions/annotator/painter/editor/annotation_author_label'
import {
  applyAnnotationCommentDraft,
  applyAnnotationReplyDraft,
  createAnnotationReply,
} from './comment_mutations'
import { useAnnotationHoverSnapshot } from '@/composables/useAnnotationHover'

const props = defineProps({
  annotations: { type: Array as PropType<IAnnotationStore[]>, default: () => [] },
  selectedId: { type: String, default: null },
  annotationPermissions: { type: Object as PropType<AnnotationPermissions>, default: undefined },
})

const emit = defineEmits<{ select: [ann: IAnnotationStore]; delete: [id: string] }>()

const { t } = useT()
const store = useAnnotationStore()
const painter = computed(() => store.painter)
const annotationHover = useAnnotationHoverSnapshot(painter)
const pdfContext = inject(PdfViewerContextKey)
const userContext = inject(UserContextKey)

// Filter
const filterOpen = ref(false)
const selectedUsers = ref<string[]>([])
const selectedTypes = ref<string[]>([])

// Edit/reply
const editAnnotationId = ref<string | null>(null)
const replyAnnotationId = ref<string | null>(null)
const editReplyId = ref<string | null>(null)
const pendingReferenceAnnotationId = ref<string | null>(null)
let pendingReferenceScrollFrame: number | null = null
let pointerHoveredAnnotationId: string | null = null
let focusedAnnotationId: string | null = null

const selectedAnnotationId = computed(() => props.selectedId)
const currentUserName = computed(() => userContext?.user?.value?.name ?? 'Anonymous')

watch(painter, (nextPainter, previousPainter) => {
  if (nextPainter === previousPainter) return
  if (pointerHoveredAnnotationId) {
    previousPainter?.clearAnnotationHover('sidebar-pointer', pointerHoveredAnnotationId)
    nextPainter?.setAnnotationHover('sidebar-pointer', pointerHoveredAnnotationId)
  }
  if (focusedAnnotationId) {
    previousPainter?.clearAnnotationHover('sidebar-focus', focusedAnnotationId)
    nextPainter?.setAnnotationHover('sidebar-focus', focusedAnnotationId)
  }
})

function can(action: AnnotationPermissionAction, annotation?: IAnnotationStore, comment?: IAnnotationComment): boolean {
  void props.annotationPermissions?.mode
  void props.annotationPermissions?.can
  void userContext?.user.value?.id
  return painter.value?.can(action, annotation, comment) ?? true
}

// All users/types
const allUsers = computed(() => {
  const map = new Map<string, number>()
  props.annotations.forEach((a) => map.set(a.title, (map.get(a.title) || 0) + 1))
  return Array.from(map.entries())
})
const allTypes = computed(() => {
  const map = new Map<string, number>()
  props.annotations.forEach((a) => map.set(a.subtype, (map.get(a.subtype) || 0) + 1))
  return Array.from(map.entries())
})

watch(() => props.annotations, (anns) => {
  if (!anns.length) { selectedUsers.value = []; selectedTypes.value = []; return }
  selectedUsers.value = [...new Set(anns.map((a) => a.title))]
  selectedTypes.value = [...new Set(anns.map((a) => a.subtype))]
}, { immediate: true })

// ====== Auto-edit/reply when annotation selected from canvas ======
function autoOpenComment(sel: IAnnotationStore) {
  const isEmptyComment = !sel.contentsObj?.text
  const isEmptyReply = !sel.comments?.length
  if (can('annotation.edit', sel) && isEmptyComment && isEmptyReply) {
    editAnnotationId.value = sel.id
  } else if (can('annotation.comment', sel)) {
    replyAnnotationId.value = sel.id
  }
}

// Canvas selection when sidebar is already open
watch(() => store.selectedAnnotation, (sel) => {
  if (!sel || sel.source !== SelectionSource.CANVAS || pdfContext?.isSidebarCollapsed.value) return
  nextTick(() => autoOpenComment(sel.store as IAnnotationStore))
})

// Sidebar opens while a canvas annotation is already selected
// (e.g. user clicks Comment button from MenuBar)
let prevCollapsed = pdfContext?.isSidebarCollapsed.value
watch(pdfContext?.isSidebarCollapsed ?? ref(true), (collapsed) => {
  if (collapsed || prevCollapsed === collapsed) { prevCollapsed = collapsed; return }
  prevCollapsed = collapsed
  const sel = store.selectedAnnotation
  if (sel && sel.source === SelectionSource.CANVAS) {
    nextTick(() => autoOpenComment(sel.store as IAnnotationStore))
  }
})

// ====== Filter ======
function toggleUser(user: string) { selectedUsers.value = selectedUsers.value.includes(user) ? selectedUsers.value.filter((u) => u !== user) : [...selectedUsers.value, user] }
function toggleType(type: string) { selectedTypes.value = selectedTypes.value.includes(type) ? selectedTypes.value.filter((t) => t !== type) : [...selectedTypes.value, type] }
function selectAll() { selectedUsers.value = allUsers.value.map(([u]) => u); selectedTypes.value = allTypes.value.map(([t]) => t) }
function clearAll() { selectedUsers.value = []; selectedTypes.value = [] }

const filteredAnnotations = computed(() =>
  props.annotations.filter((a) => selectedUsers.value.includes(a.title) && selectedTypes.value.includes(a.subtype))
)

const groupedEntries = computed(() => {
  const groups = new Map<number, IAnnotationStore[]>()
  for (const ann of filteredAnnotations.value) {
    if (!groups.has(ann.pageNumber)) groups.set(ann.pageNumber, [])
    groups.get(ann.pageNumber)!.push(ann)
  }
  for (const [, list] of groups) list.sort((a, b) => (a.konvaClientRect?.y ?? 0) - (b.konvaClientRect?.y ?? 0))
  return [...groups.entries()].sort(([a], [b]) => a - b)
})

// ====== Icons ======
const annotationDefinitionsByType = new Map(
  annotationDefinitions.map(definition => [definition.type, definition])
)
function getAnnotationIcon(annotation: IAnnotationStore): string {
  return annotationDefinitionsByType.get(annotation.type)?.icon ?? 'select'
}
function getAnnotationTypeLabel(annotation: IAnnotationStore): string {
  const name = annotationDefinitionsByType.get(annotation.type)?.name
  return name ? t(`annotator.tool.${name}`) : annotation.subtype
}
function getAnnotationAuthor(annotation: IAnnotationStore): string {
  return getAnnotationAuthorName(annotation) ?? annotation.title
}
function getAnnotationHeading(annotation: IAnnotationStore): string {
  return isValidReferenceNumber(annotation.referenceNumber)
    ? `#${annotation.referenceNumber}`
    : getAnnotationAuthor(annotation)
}
function formatDate(date: string | null): string {
  return formatPDFCompactDateTime(date)
}
function showAnnotationPreview(annotationId: string): boolean {
  if (annotationHover.value.annotationId !== annotationId) return false
  return annotationHover.value.source === 'canvas'
    || annotationHover.value.source === 'canvas-passive'
}
function isAnnotationHeadingActive(annotationId: string): boolean {
  return selectedAnnotationId.value === annotationId
    || annotationHover.value.annotationId === annotationId
}

const statusOptions = [
  { key: CommentStatus.Accepted, labelKey: 'annotator.comment.status.accepted', icon: 'statusAccepted' },
  { key: CommentStatus.Rejected, labelKey: 'annotator.comment.status.rejected', icon: 'statusRejected' },
  { key: CommentStatus.Cancelled, labelKey: 'annotator.comment.status.cancelled', icon: 'statusCancelled' },
  { key: CommentStatus.Completed, labelKey: 'annotator.comment.status.completed', icon: 'statusCompleted' },
  { key: CommentStatus.Closed, labelKey: 'annotator.comment.status.closed', icon: 'statusClosed' },
  { key: CommentStatus.None, labelKey: 'annotator.comment.status.none', icon: 'statusNone' },
]
function getStatusIcon(ann: IAnnotationStore): string {
  const lastWithStatus = [...(ann.comments || [])].reverse().find((c) => c.status !== undefined && c.status !== null)
  return statusOptions.find((o) => o.key === (lastWithStatus?.status ?? CommentStatus.None))?.icon || 'statusNone'
}


// ====== Menu handlers (DropdownMenu auto-closes on select) ======
function handleReplyFromMenu(ann: IAnnotationStore) {
  if (!can('annotation.comment', ann)) return
  selectAnnotation(ann)
  replyAnnotationId.value = ann.id
}
function handleEditFromMenu(ann: IAnnotationStore) {
  if (!can('annotation.edit', ann)) return
  selectAnnotation(ann)
  editAnnotationId.value = ann.id
}
function handleEditReplyFromMenu(ann: IAnnotationStore, reply: IAnnotationComment) {
  if (!can('comment.edit', ann, reply)) return
  selectAnnotation(ann)
  editReplyId.value = reply.id
}
function handleAnnotationMenuCloseAutoFocus(annotationId: string, event: Event) {
  if (
    editAnnotationId.value === annotationId
    || replyAnnotationId.value === annotationId
  ) {
    event.preventDefault()
  }
}
function handleReplyMenuCloseAutoFocus(replyId: string, event: Event) {
  if (editReplyId.value === replyId) event.preventDefault()
}

function handleAnnotationPointerEnter(annotationId: string, event: PointerEvent) {
  if (event.pointerType === 'touch') return
  pointerHoveredAnnotationId = annotationId
  painter.value?.setAnnotationHover('sidebar-pointer', annotationId)
}

function handleAnnotationPointerLeave(annotationId: string) {
  if (pointerHoveredAnnotationId === annotationId) {
    pointerHoveredAnnotationId = null
  }
  painter.value?.clearAnnotationHover('sidebar-pointer', annotationId)
}

function getAnnotationFocusOwner(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null
  return target.closest<HTMLElement>('[data-annotation-hover-owner]')
    ?.dataset.annotationHoverOwner ?? null
}

function handleAnnotationFocus(annotationId: string) {
  if (focusedAnnotationId && focusedAnnotationId !== annotationId) {
    painter.value?.clearAnnotationHover('sidebar-focus', focusedAnnotationId)
  }
  focusedAnnotationId = annotationId
  painter.value?.setAnnotationHover('sidebar-focus', annotationId)
}

function clearAnnotationFocus(annotationId: string) {
  if (focusedAnnotationId !== annotationId) return
  focusedAnnotationId = null
  painter.value?.clearAnnotationHover('sidebar-focus', annotationId)
}

function handleAnnotationBlur(annotationId: string, event: FocusEvent) {
  if (getAnnotationFocusOwner(event.relatedTarget) === annotationId) return
  clearAnnotationFocus(annotationId)
}

function handleDocumentFocusIn(event: FocusEvent) {
  const owner = getAnnotationFocusOwner(event.target)
  if (owner) {
    handleAnnotationFocus(owner)
  } else if (focusedAnnotationId) {
    clearAnnotationFocus(focusedAnnotationId)
  }
}
function addReplyWithStatusDirect(ann: IAnnotationStore, status: CommentStatus) {
  if (!can('annotation.change-status', ann)) return
  const opt = statusOptions.find((o) => o.key === status)
  addReply(ann, {
    content: t('annotator.comment.statusText', {
      value: t(opt?.labelKey ?? 'annotator.comment.status.none'),
    }),
  }, status)
}
function deleteReplyDirect(annId: string, replyId: string) {
  const ann = props.annotations.find((a) => a.id === annId)
  if (!ann || !painter.value) return
  const reply = ann.comments.find((comment) => comment.id === replyId)
  if (!reply || !can('comment.delete', ann, reply)) return
  const updatedComments = (ann.comments || []).filter((c) => c.id !== replyId)
  painter.value.update(ann.id, { comments: updatedComments }, 'comment.delete', reply)
}

// ====== Start reply with focus ======
function startReply(ann: IAnnotationStore) {
  if (!can('annotation.comment', ann)) return
  replyAnnotationId.value = ann.id
}

// ====== Annotation click → highlight on canvas ======
function selectAnnotation(ann: IAnnotationStore) {
  // Reset any open reply/edit states when switching to a different annotation
  if (replyAnnotationId.value !== ann.id) {
    if (focusedAnnotationId && focusedAnnotationId !== ann.id) {
      clearAnnotationFocus(focusedAnnotationId)
    }
    replyAnnotationId.value = null
    editAnnotationId.value = null
    editReplyId.value = null
  }
  store.setSelectedAnnotation(ann, SelectionSource.SIDEBAR)
  painter.value?.highlight(ann)
  emit('select', ann)
}

function handleAnnotationClick(ann: IAnnotationStore) {
  selectAnnotation(ann)
}

watch([groupedEntries, pendingReferenceAnnotationId], async () => {
  const annotationId = pendingReferenceAnnotationId.value
  if (!annotationId) return

  await nextTick()
  if (pendingReferenceScrollFrame !== null) {
    cancelAnimationFrame(pendingReferenceScrollFrame)
  }
  pendingReferenceScrollFrame = requestAnimationFrame(() => {
    pendingReferenceScrollFrame = null
    if (pendingReferenceAnnotationId.value !== annotationId) return

    const target = document.getElementById(`annotation-${annotationId}`)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    pendingReferenceAnnotationId.value = null
  })
})

function handleReferenceActivate(annotationId: string) {
  const annotation = props.annotations.find(item => item.id === annotationId)
  if (!annotation) return

  if (!selectedUsers.value.includes(annotation.title)) {
    selectedUsers.value = [...selectedUsers.value, annotation.title]
  }
  if (!selectedTypes.value.includes(annotation.subtype)) {
    selectedTypes.value = [...selectedTypes.value, annotation.subtype]
  }

  pendingReferenceAnnotationId.value = annotation.id
  store.setSelectedAnnotation(annotation, SelectionSource.SIDEBAR)
  void painter.value?.highlight(annotation)
  emit('select', annotation)
}

// ====== Update comment ======
function updateComment(ann: IAnnotationStore, draft: AnnotationReferenceContent) {
  if (!painter.value || !can('annotation.edit', ann)) return
  painter.value.update(ann.id, {
    contentsObj: applyAnnotationCommentDraft(ann.contentsObj, draft),
    date: formatTimestamp(Date.now()),
  }, 'annotation.edit')
  editAnnotationId.value = null
  clearAnnotationFocus(ann.id)
}

// ====== Add reply ======
function addReply(
  ann: IAnnotationStore,
  draft: AnnotationReferenceContent,
  status?: CommentStatus
) {
  const action = status === undefined ? 'annotation.comment' : 'annotation.change-status'
  if (!painter.value || !can(action, ann)) return
  const currentUser = userContext?.user.value
  if (!currentUser) return
  const newReply = createAnnotationReply({
    id: generateUUID(),
    title: currentUserName.value,
    date: formatTimestamp(Date.now()),
    draft,
    status,
    user: currentUser,
  })
  painter.value.update(ann.id, { comments: [...(ann.comments || []), newReply] }, action)
  replyAnnotationId.value = null
  clearAnnotationFocus(ann.id)
}

// ====== Update reply ======
function updateReply(
  ann: IAnnotationStore,
  reply: IAnnotationComment,
  draft: AnnotationReferenceContent
) {
  if (!painter.value || !can('comment.edit', ann, reply)) return
  const updatedComments = applyAnnotationReplyDraft(
    ann.comments || [],
    reply.id,
    draft,
    formatTimestamp(Date.now()),
    currentUserName.value || reply.title
  )
  painter.value.update(ann.id, { comments: updatedComments }, 'comment.edit', reply)
  editReplyId.value = null
  clearAnnotationFocus(ann.id)
}

function cancelAnnotationEdit(annotationId: string) {
  editAnnotationId.value = null
  clearAnnotationFocus(annotationId)
}

function cancelReply(annotationId: string) {
  replyAnnotationId.value = null
  clearAnnotationFocus(annotationId)
}

function cancelReplyEdit(annotationId: string) {
  editReplyId.value = null
  clearAnnotationFocus(annotationId)
}

// ====== Delete ======
function deleteAnnotation(id: string) {
  const annotation = props.annotations.find((item) => item.id === id)
  if (!annotation || !can('annotation.delete', annotation)) return
  const deleted = painter.value?.delete(id, true) ?? false
  if (deleted) {
    if (pointerHoveredAnnotationId === id) pointerHoveredAnnotationId = null
    if (focusedAnnotationId === id) focusedAnnotationId = null
    emit('delete', id)
  }
}

// ====== Mount check: sidebar just opened with an existing selection ======
onMounted(() => {
  document.addEventListener('focusin', handleDocumentFocusIn, true)
  const sel = store.selectedAnnotation
  if (sel && sel.source === SelectionSource.CANVAS) {
    nextTick(() => autoOpenComment(sel.store as IAnnotationStore))
  }
})

// ====== Cleanup on unmount ======
onUnmounted(() => {
  document.removeEventListener('focusin', handleDocumentFocusIn, true)
  if (pointerHoveredAnnotationId) {
    painter.value?.clearAnnotationHover('sidebar-pointer', pointerHoveredAnnotationId)
    pointerHoveredAnnotationId = null
  }
  if (focusedAnnotationId) {
    clearAnnotationFocus(focusedAnnotationId)
  }
  if (pendingReferenceScrollFrame !== null) {
    cancelAnimationFrame(pendingReferenceScrollFrame)
    pendingReferenceScrollFrame = null
  }
  pendingReferenceAnnotationId.value = null
  replyAnnotationId.value = null
  editReplyId.value = null
  editAnnotationId.value = null
  store.clearSelectedAnnotation()
})
</script>

<style scoped>
.annotation-card--preview {
  border-color: var(--inklayer-primary);
  background-color: var(--color-accent);
}

@media (hover: hover) and (pointer: fine) {
  .annotation-card:not(.annotation-card--preview):hover {
    background-color: var(--color-accent);
  }
}
</style>
