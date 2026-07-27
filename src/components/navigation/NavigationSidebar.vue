<template>
  <aside
    id="InkLayer-navigation-sidebar"
    class="navigation-sidebar z-[2] flex h-full w-60 shrink-0 flex-col overflow-hidden border-r border-border bg-muted motion-reduce:transition-none max-[840px]:absolute max-[840px]:inset-y-0 max-[840px]:left-0 max-[840px]:z-[1000] max-[840px]:w-60 max-[840px]:shadow-[4px_0_24px_rgb(0_0_0/15%)]"
    :class="open
      ? 'max-[840px]:visible max-[840px]:translate-x-0'
      : '!w-0 !border-r-0 max-[840px]:invisible max-[840px]:!w-60 max-[840px]:-translate-x-full navigation-sidebar--hidden'"
    :aria-label="t('viewer.navigation.label')"
    :aria-hidden="!open"
    :inert="!open"
    @transitionend="emit('transitionEnd', $event)"
  >
    <div class="flex h-full w-60 min-w-60 self-end overflow-hidden">
      <Tabs v-model="activePanel" class="flex h-full min-h-0 w-full flex-col">
        <TabsList class="relative z-[2] h-10 w-full shrink-0 rounded-none border-b border-border bg-secondary px-2 py-0">
          <TabsTrigger value="thumbnails" class="h-full min-w-0 flex-1 rounded-none py-0">
            {{ t('viewer.navigation.thumbnails') }}
          </TabsTrigger>
          <TabsTrigger value="outline" class="h-full min-w-0 flex-1 rounded-none py-0">
            {{ t('viewer.navigation.outline') }}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="thumbnails" class="mt-0 min-h-0 flex-1 overflow-auto bg-muted">
          <PdfThumbnailList :page-marker-counts="pageMarkerCounts" />
        </TabsContent>
        <TabsContent value="outline" class="mt-0 min-h-0 flex-1 overflow-auto bg-muted">
          <PdfOutline @navigate="handleOutlineNavigate" />
        </TabsContent>
      </Tabs>
    </div>
  </aside>
  <div
    v-if="open"
    class="absolute inset-0 z-[999] hidden bg-black/20 backdrop-blur-[2px] max-[840px]:block"
    @click="emit('close')"
  />
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PdfViewerContextKey } from '@/context/pdfViewerContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useT } from '@/composables/useT'
import PdfThumbnailList from './PdfThumbnailList.vue'
import PdfOutline from './PdfOutline.vue'
import {
  NAVIGATION_PAGE_MARKERS_CHANGED_EVENT,
  type NavigationPageMarkersChangedEvent,
} from './navigationPageMarkers'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  close: []
  transitionEnd: [event: TransitionEvent]
}>()

const { t } = useT()
const context = inject(PdfViewerContextKey)!
const activePanel = ref('thumbnails')
const markerSources = ref(new Map<string, ReadonlyMap<number, number>>())

watch(context.eventBus, (eventBus, _previous, onCleanup) => {
  markerSources.value = new Map()
  if (!eventBus) return

  const handleMarkersChanged = ({ source, markers }: NavigationPageMarkersChangedEvent) => {
    const next = new Map(markerSources.value)
    if (markers.size > 0) next.set(source, markers)
    else next.delete(source)
    markerSources.value = next
  }

  eventBus.on(NAVIGATION_PAGE_MARKERS_CHANGED_EVENT, handleMarkersChanged)
  onCleanup(() => eventBus.off(NAVIGATION_PAGE_MARKERS_CHANGED_EVENT, handleMarkersChanged))
}, { immediate: true })

const pageMarkerCounts = computed(() => {
  const counts = new Map<number, number>()
  markerSources.value.forEach(markers => {
    markers.forEach((count, pageNumber) => {
      counts.set(pageNumber, (counts.get(pageNumber) ?? 0) + count)
    })
  })
  return counts
})

function handleKeyDown(event: KeyboardEvent) {
  if (props.open && event.key === 'Escape') emit('close')
}

function handleOutlineNavigate() {
  if (window.matchMedia('(max-width: 840px)').matches) emit('close')
}

onMounted(() => document.addEventListener('keydown', handleKeyDown))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeyDown))
</script>

<style scoped>
.navigation-sidebar {
  contain: layout paint;
  transition: width 200ms ease;
}

@media (max-width: 840px) {
  .navigation-sidebar {
    transition: transform 200ms ease, visibility 0ms ease 0ms;
  }

  .navigation-sidebar--hidden {
    transition: transform 200ms ease, visibility 0ms ease 200ms;
  }
}
</style>
