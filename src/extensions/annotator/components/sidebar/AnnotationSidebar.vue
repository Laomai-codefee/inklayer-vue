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
              <p class="text-xs font-medium mb-1.5 text-muted-foreground">{{ $t('common.author') }}</p>
              <div v-for="[user, count] in allUsers" :key="user" class="flex items-center gap-2 py-1 hover:bg-accent/50 rounded px-1 cursor-pointer">
                <input type="checkbox" :id="`fu-${user}`" :checked="selectedUsers.includes(user)" class="size-3.5 rounded border-input" @change="toggleUser(user)" />
                <label :for="`fu-${user}`" class="text-xs cursor-pointer flex-1">{{ user }} ({{ count }})</label>
              </div>
            </div>
            <div>
              <p class="text-xs font-medium mb-1.5 text-muted-foreground">{{ $t('common.type') }}</p>
              <div v-for="[type, count] in allTypes" :key="type" class="flex items-center gap-2 py-1 hover:bg-accent/50 rounded px-1 cursor-pointer">
                <input type="checkbox" :id="`ft-${type}`" :checked="selectedTypes.includes(type)" class="size-3.5 rounded border-input" @change="toggleType(type)" />
                <label :for="`ft-${type}`" class="text-xs cursor-pointer flex-1">{{ type }} ({{ count }})</label>
              </div>
            </div>
            <div class="flex gap-2 pt-1">
              <Button variant="ghost" size="sm" class="flex-1 text-xs" @click="selectAll">{{ $t('common.selectAll') }}</Button>
              <Button variant="ghost" size="sm" class="flex-1 text-xs" @click="clearAll">{{ $t('common.clear') }}</Button>
            </div>
          </div>
        </template>
      </Popover>
    </div>

    <!-- Annotation list -->
    <ScrollArea v-if="groupedEntries.length > 0" class="flex-1 px-1.5 pb-6 text-left">
      <div v-for="[pageNumber, pAnns] in groupedEntries" :key="pageNumber" class="mb-2.5">
        <div class="flex items-center justify-between px-1 py-1">
          <span class="text-xs">{{ $t('annotator.comment.page', { value: pageNumber }) }}</span>
          <span class="text-xs">{{ $t('annotator.comment.total', { value: pAnns.length }) }}</span>
        </div>

        <div
          v-for="ann in pAnns"
          :key="ann.id"
          :id="`annotation-${ann.id}`"
          class="border border-border bg-card rounded-lg p-2.5 mb-2 cursor-pointer leading-relaxed transition-colors"
          :class="selectedAnnotationId === ann.id ? '!bg-accent' : 'hover:bg-muted'"
          @click="handleAnnotationClick(ann)"
        >
          <!-- Card header -->
          <div class="flex items-start">
            <Icon :name="getSubtypeIcon(ann.subtype)" :size="16" class="mt-0.5 text-muted-foreground shrink-0 mr-2" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1">
                <span class="text-xs truncate max-w-[130px]">{{ ann.title }}</span>
                <Tooltip v-if="ann.native" :content="$t('annotator.comment.nativeAnnotation')">
                  <template #trigger>
                    <span class="text-orange-400 shrink-0 cursor-pointer"><Icon name="exclamation" :size="14" /></span>
                  </template>
                </Tooltip>
              </div>
              <span class="text-[10px] text-muted-foreground">{{ formatDate(ann.date) }}</span>
            </div>
            <div class="flex items-center shrink-0 gap-0.5 ml-auto" @click.stop>
              <!-- Status dropdown -->
              <DropdownMenu>
                <template #trigger>
                  <Button variant="ghost" size="icon" class="size-6 text-muted-foreground" :title="$t('common.status')">
                    <Icon :name="getStatusIcon(ann)" :size="14" />
                  </Button>
                </template>
                <DropdownMenuItem v-for="opt in statusOptions" :key="opt.key" class="flex items-center gap-2 text-xs" @select="addReplyWithStatusDirect(ann, opt.key)">
                  <Icon :name="opt.icon" :size="14" />
                  <span>{{ $t(opt.labelKey) }}</span>
                </DropdownMenuItem>
              </DropdownMenu>
              <!-- Action dropdown -->
              <DropdownMenu>
                <template #trigger>
                  <Button variant="ghost" size="icon" class="size-6 text-muted-foreground" title="More"><Icon name="more" :size="14" /></Button>
                </template>
                <DropdownMenuItem class="text-xs" @select="handleReplyFromMenu(ann)">{{ $t('common.reply') }}</DropdownMenuItem>
                <DropdownMenuItem class="text-xs" @select="handleEditFromMenu(ann)">{{ $t('common.edit') }}</DropdownMenuItem>
                <DropdownMenuItem class="text-xs" @select="deleteAnnotation(ann.id)">{{ $t('common.delete') }}</DropdownMenuItem>
              </DropdownMenu>
            </div>
          </div>

          <!-- Comment text / edit -->
          <template v-if="editAnnotationId === ann.id">
            <textarea :ref="(el) => setTextareaRef(el as HTMLTextAreaElement | null)" :value="ann.contentsObj?.text || ''"
              class="w-full min-h-[50px] text-xs rounded border border-input bg-background p-1.5 resize-none mt-1.5" rows="3"
              @input="editComment = ($event.target as HTMLTextAreaElement).value"
              @keydown.enter.exact.prevent="updateComment(ann)"
              @blur="editAnnotationId = null"
            />
            <Button size="sm" class="w-full text-xs mt-1" @mousedown.prevent="updateComment(ann)">{{ $t('common.confirm') }}</Button>
          </template>
          <template v-else>
            <p class="text-xs whitespace-pre-wrap mt-1.5 pl-7" v-if="ann.contentsObj?.text">{{ ann.contentsObj.text }}</p>
          </template>

          <!-- Replies -->
          <div v-for="reply in ann.comments" :key="reply.id" class="bg-secondary rounded-md p-2 mt-2 ml-[22px]">
            <div class="flex items-start">
              <div class="flex-1 min-w-0">
                <template v-if="editReplyId === reply.id">
                  <textarea :ref="(el) => setTextareaRef(el as HTMLTextAreaElement | null)" :value="reply.content"
                    class="w-full min-h-[40px] text-xs rounded border border-input bg-background p-1.5 resize-none" rows="2"
                    @input="editReplyContent = ($event.target as HTMLTextAreaElement).value"
                    @keydown.enter.exact.prevent="updateReply(ann, reply)"
                    @blur="editReplyId = null"
                  />
                  <Button size="sm" class="w-full text-xs mt-1" @mousedown.prevent="updateReply(ann, reply)">{{ $t('common.confirm') }}</Button>
                </template>
                <template v-else>
                  <div class="flex items-center gap-1">
                    <span class="text-xs truncate max-w-[140px]">{{ reply.title }}</span>
                    <span class="text-[10px] text-muted-foreground">{{ formatDate(reply.date) }}</span>
                  </div>
                  <p class="text-xs whitespace-pre-wrap mt-0.5">{{ reply.content }}</p>
                </template>
              </div>
              <DropdownMenu v-if="editReplyId !== reply.id">
                <template #trigger>
                  <Button variant="ghost" size="icon" class="size-5 text-muted-foreground shrink-0 ml-1"><Icon name="more" :size="12" /></Button>
                </template>
                <DropdownMenuItem class="text-xs" @select="handleEditReplyFromMenu(ann, reply)"> {{ $t('common.edit') }}</DropdownMenuItem>
                <DropdownMenuItem class="text-xs" @select="deleteReplyDirect(ann.id, reply.id)">{{ $t('common.delete') }}</DropdownMenuItem>
              </DropdownMenu>
            </div>
          </div>

          <!-- Reply input -->
          <div v-if="replyAnnotationId === ann.id" class="mt-2 pl-7">
            <textarea :ref="(el) => setTextareaRef(el as HTMLTextAreaElement | null)"
              class="w-full min-h-[40px] text-xs rounded border border-input bg-background p-1.5 resize-none" rows="2"
              :placeholder="$t('common.reply') + '...'"
              @input="newReplyContent = ($event.target as HTMLTextAreaElement).value"
              @keydown.enter.exact.prevent="addReply(ann)"
              @blur="replyAnnotationId = null"
            />
            <Button size="sm" class="w-full text-xs mt-1" @mousedown.prevent="addReply(ann)">{{ $t('common.confirm') }}</Button>
          </div>

          <!-- Reply button -->
          <div v-if="selectedAnnotationId === ann.id && !replyAnnotationId && !editAnnotationId && !editReplyId" class="mt-2">
            <Button size="sm" class="w-full text-xs" @mousedown.prevent="startReply(ann)">{{ $t('common.reply') }}</Button>
          </div>
        </div>
      </div>
    </ScrollArea>

    <div v-else class="flex-1 flex items-center justify-center text-xs text-muted-foreground">
      {{ $t('annotator.comment.total', { value: 0 }) }}
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
import { CommentStatus, type IAnnotationStore, type IAnnotationComment, type PdfjsAnnotationSubtype } from '@/extensions/annotator/const/definitions'
import { useAnnotationStore, SelectionSource } from '@/stores/annotationStore'
import { PdfViewerContextKey, UserContextKey } from '@/context/pdfViewerContext'
import { generateUUID, formatTimestamp, formatPDFDate } from '@/extensions/annotator/utils/utils'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  annotations: { type: Array as PropType<IAnnotationStore[]>, default: () => [] },
  selectedId: { type: String, default: null },
})

const emit = defineEmits<{ select: [ann: IAnnotationStore]; delete: [id: string] }>()

const { t } = useI18n({ useScope: 'global' })
const store = useAnnotationStore()
const painter = computed(() => store.painter)
const pdfContext = inject(PdfViewerContextKey)
const userContext = inject(UserContextKey)

// Filter
const filterOpen = ref(false)
const selectedUsers = ref<string[]>([])
const selectedTypes = ref<string[]>([])

// Edit/reply
const editAnnotationId = ref<string | null>(null)
const editComment = ref('')
const replyAnnotationId = ref<string | null>(null)
const newReplyContent = ref('')
const editReplyId = ref<string | null>(null)
const editReplyContent = ref('')
// Controls whether textarea ref callback should auto-focus.
// true = focus (user clicked Reply/Edit, or sidebar just opened)
// false = skip focus (canvas click while sidebar already open → MenuBar opening)
const shouldFocusTextarea = ref(false)

const selectedAnnotationId = computed(() => props.selectedId)
const currentUserName = computed(() => userContext?.user?.value?.name ?? 'Anonymous')

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
// Aligns React useEffect on [currentAnnotation, isSidebarCollapsed]
// @param shouldFocus - true to auto-focus textarea (sidebar just opened, or user clicked Reply),
//                      false when sidebar already open and canvas annotation clicked (MenuBar is opening)
function autoOpenComment(sel: IAnnotationStore, shouldFocus: boolean = false) {
  shouldFocusTextarea.value = shouldFocus
  const userName = userContext?.user?.value?.name ?? 'Anonymous'
  const isOwn = sel.title === userName
  const isEmptyComment = !sel.contentsObj?.text
  const isEmptyReply = !sel.comments?.length
  if (isOwn && isEmptyComment && isEmptyReply) {
    editAnnotationId.value = sel.id
  } else {
    replyAnnotationId.value = sel.id
  }
}

// Canvas selection when sidebar is already open
// MenuBar Popover has @focus-outside.prevent, so auto-focusing the textarea
// is safe — it won't cause the Popover to dismiss.
watch(() => store.selectedAnnotation, (sel) => {
  if (!sel || sel.source !== SelectionSource.CANVAS || pdfContext?.isSidebarCollapsed.value) return
  nextTick(() => autoOpenComment(sel.store as IAnnotationStore, true))
})

// Sidebar opens while a canvas annotation is already selected
// (e.g. user clicks Comment button from MenuBar)
// shouldFocus=true: MenuBar already closed, safe to focus textarea
let prevCollapsed = pdfContext?.isSidebarCollapsed.value
watch(pdfContext?.isSidebarCollapsed ?? ref(true), (collapsed) => {
  if (collapsed || prevCollapsed === collapsed) { prevCollapsed = collapsed; return }
  prevCollapsed = collapsed
  const sel = store.selectedAnnotation
  if (sel && sel.source === SelectionSource.CANVAS) {
    nextTick(() => autoOpenComment(sel.store as IAnnotationStore, true))
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
const subtypeIconMap: Record<string, string> = {
  Circle: 'circle', FreeText: 'freeText', Ink: 'freehand', Highlight: 'highlight',
  Underline: 'underline', Squiggly: 'freeHighlight', StrikeOut: 'strikeout',
  Stamp: 'stamp', Line: 'arrow', Square: 'rectangle', Polygon: 'freehand',
  PolyLine: 'cloud', Caret: 'signature', Text: 'note', Arrow: 'arrow',
}
function getSubtypeIcon(subtype: PdfjsAnnotationSubtype): string { return subtypeIconMap[subtype] || 'select' }
function formatDate(date: string | null): string { return formatPDFDate(date, true) }

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


// ====== Textarea ref callback: auto-focus when permitted ======
function setTextareaRef(el: HTMLTextAreaElement | null) {
  if (el && shouldFocusTextarea.value) {
    // setTimeout(0): fire after Vue DOM update + Radix setup complete.
    // Safe here because shouldFocusTextarea is only true when MenuBar
    // is NOT simultaneously opening (sidebar open from collapsed, or
    // explicit user Reply/Edit click).
    setTimeout(() => el.focus(), 0)
    shouldFocusTextarea.value = false
  }
}

// ====== Menu handlers (DropdownMenu auto-closes on select) ======
function handleReplyFromMenu(ann: IAnnotationStore) { shouldFocusTextarea.value = true; replyAnnotationId.value = ann.id }
function handleEditFromMenu(ann: IAnnotationStore) { shouldFocusTextarea.value = true; editAnnotationId.value = ann.id }
function handleEditReplyFromMenu(_ann: IAnnotationStore, reply: IAnnotationComment) { shouldFocusTextarea.value = true; editReplyId.value = reply.id; editReplyContent.value = reply.content }
function addReplyWithStatusDirect(ann: IAnnotationStore, status: CommentStatus) {
  const opt = statusOptions.find((o) => o.key === status)
  newReplyContent.value = t(opt?.labelKey ?? 'annotator.comment.status.none')
  addReply(ann, status)
}
function deleteReplyDirect(annId: string, replyId: string) {
  const ann = props.annotations.find((a) => a.id === annId)
  if (!ann || !painter.value) return
  const updatedComments = (ann.comments || []).filter((c) => c.id !== replyId)
  painter.value.update(ann.id, { comments: updatedComments })
}

// ====== Start reply with focus ======
function startReply(ann: IAnnotationStore) {
  shouldFocusTextarea.value = true
  replyAnnotationId.value = ann.id
}

// ====== Annotation click → highlight on canvas ======
function handleAnnotationClick(ann: IAnnotationStore) {
  store.setSelectedAnnotation(ann, SelectionSource.SIDEBAR)
  painter.value?.highlight(ann)
  emit('select', ann)
}

// ====== Update comment ======
function updateComment(ann: IAnnotationStore) {
  if (!painter.value) return
  painter.value.update(ann.id, {
    contentsObj: { ...(ann.contentsObj || { text: '' }), text: editComment.value },
    date: formatTimestamp(Date.now()),
  })
  editAnnotationId.value = null
}

// ====== Add reply ======
function addReply(ann: IAnnotationStore, status?: CommentStatus) {
  if (!painter.value) return
  const newReply: IAnnotationComment = {
    id: generateUUID(),
    title: currentUserName.value,
    date: formatTimestamp(Date.now()),
    content: newReplyContent.value,
    status,
  }
  painter.value.update(ann.id, { comments: [...(ann.comments || []), newReply] })
  replyAnnotationId.value = null
  newReplyContent.value = ''
}

// ====== Update reply ======
function updateReply(ann: IAnnotationStore, reply: IAnnotationComment) {
  if (!painter.value) return
  const updatedComments = (ann.comments || []).map((r) => {
    if (r.id === reply.id) {
      return { ...r, content: editReplyContent.value, date: formatTimestamp(Date.now()), title: currentUserName.value || r.title }
    }
    return r
  })
  painter.value.update(ann.id, { comments: updatedComments })
  editReplyId.value = null
  editReplyContent.value = ''
}

// ====== Delete ======
function deleteAnnotation(id: string) {
  painter.value?.delete(id, true)
  emit('delete', id)
}

// ====== Mount check: sidebar just opened with an existing selection ======
onMounted(() => {
  const sel = store.selectedAnnotation
  if (sel && sel.source === SelectionSource.CANVAS) {
    nextTick(() => autoOpenComment(sel.store as IAnnotationStore, true))
  }
})

// ====== Cleanup on unmount ======
onUnmounted(() => {
  replyAnnotationId.value = null
  editReplyId.value = null
  editAnnotationId.value = null
  store.clearSelectedAnnotation()
})
</script>
