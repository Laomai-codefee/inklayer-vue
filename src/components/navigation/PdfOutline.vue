<template>
  <div v-if="!pdfDocument || stateDocument !== pdfDocument || status === 'loading'" class="outline-state px-4 py-7 text-center text-[13px] leading-6 text-muted-foreground">
    {{ t('viewer.navigation.outlineLoading') }}
  </div>
  <div v-else-if="status === 'error'" class="outline-state px-4 py-7 text-center text-[13px] leading-6 text-muted-foreground">
    {{ t('viewer.navigation.outlineError') }}
  </div>
  <div v-else-if="items.length === 0" class="outline-state px-4 py-7 text-center text-[13px] leading-6 text-muted-foreground">
    {{ t('viewer.navigation.outlineEmpty') }}
  </div>
  <nav v-else class="px-1.5 pb-5 pt-2" :aria-label="t('viewer.navigation.outline')">
    <ul role="tree" class="m-0 list-none p-0">
      <PdfOutlineItem
        v-for="(item, index) in items"
        :key="`outline-${index}`"
        :item="item"
        :item-key="`outline-${index}`"
        :depth="0"
        :selected-item-key="selectedItemKey"
        @navigate="handleNavigate"
      />
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { inject, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { PdfViewerContextKey } from '@/context/pdfViewerContext'
import { useT } from '@/composables/useT'
import PdfOutlineItem from './PdfOutlineItem.vue'

type PdfOutlineItemBase = Awaited<ReturnType<PDFDocumentProxy['getOutline']>>[number]
export type PdfOutlineItemData = Omit<PdfOutlineItemBase, 'items'> & {
  items: PdfOutlineItemData[]
}

interface PdfPageReference {
  num: number
  gen: number
}

const emit = defineEmits<{ navigate: [] }>()
const context = inject(PdfViewerContextKey)!
const { t } = useT()
const pdfDocument = context.pdfDocument
const items = ref<PdfOutlineItemData[]>([])
const status = ref<'loading' | 'ready' | 'error'>('loading')
const stateDocument = shallowRef<PDFDocumentProxy | null>(null)
const selectedItemKey = ref<string | null>(null)
let navigationGeneration = 0

function isPageReference(value: unknown): value is PdfPageReference {
  if (!value || typeof value !== 'object') return false
  const reference = value as Partial<PdfPageReference>
  return Number.isInteger(reference.num) && Number.isInteger(reference.gen)
}

watch(pdfDocument, (document, _previous, onCleanup) => {
  navigationGeneration += 1
  selectedItemKey.value = null
  stateDocument.value = document
  status.value = 'loading'
  items.value = []
  if (!document) return

  let disposed = false
  void document.getOutline().then(
    (outline: PdfOutlineItemBase[] | null) => {
      if (disposed) return
      items.value = (outline ?? []) as PdfOutlineItemData[]
      status.value = 'ready'
    },
    () => {
      if (disposed) return
      status.value = 'error'
    },
  )
  onCleanup(() => {
    disposed = true
    navigationGeneration += 1
  })
}, { immediate: true })

async function handleNavigate(item: PdfOutlineItemData, itemKey: string) {
  const generation = ++navigationGeneration
  if (item.url) {
    emit('navigate')
    return
  }

  const document = pdfDocument.value
  const viewer = context.pdfViewer.value
  if (!document || !viewer || item.dest === null) return

  try {
    const destination = typeof item.dest === 'string'
      ? await document.getDestination(item.dest)
      : item.dest

    if (
      navigationGeneration !== generation
      || context.pdfDocument.value !== document
      || viewer.pdfDocument !== document
      || !Array.isArray(destination)
    ) return

    const reference = destination[0]
    let pageNumber: number | null = null
    if (isPageReference(reference)) {
      pageNumber = document.cachedPageNumber(reference)
      if (!pageNumber) pageNumber = (await document.getPageIndex(reference)) + 1
    } else if (Number.isInteger(reference)) {
      pageNumber = (reference as number) + 1
    }

    if (
      navigationGeneration !== generation
      || context.pdfDocument.value !== document
      || viewer.pdfDocument !== document
      || !pageNumber
      || pageNumber < 1
      || pageNumber > document.numPages
    ) return

    viewer.scrollPageIntoView({ pageNumber, destArray: destination })
    selectedItemKey.value = itemKey
    emit('navigate')
  } catch {
    // Ignore malformed or unresolved PDF destinations.
  }
}

onBeforeUnmount(() => {
  navigationGeneration += 1
})
</script>
