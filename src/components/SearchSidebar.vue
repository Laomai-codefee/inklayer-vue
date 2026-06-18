<template>
  <div class="p-2 pt-0 h-full flex flex-col">
    <!-- Search header (sticky) -->
    <div class="sticky top-0 z-10 pt-3">
      <!-- Search input with integrated icons -->
      <div class="relative flex items-center">
        <svg class="absolute left-2.5 size-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          :value="query"
          type="text"
          :placeholder="t('viewer.search.placeholder')"
          class="flex h-8 w-full rounded-md border border-input bg-background pl-8 pr-8 text-xs placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          @input="setQuery(($event.target as HTMLInputElement).value)"
          @keydown="handleKeyDown" />
        <button v-if="query.trim()"
          class="absolute right-1.5 inline-flex items-center justify-center size-5 rounded text-muted-foreground hover:text-foreground"
          @click="handleClear">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <!-- Options -->
      <div class="flex items-center gap-3 mt-2">
        <label class="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" :checked="searchOptions.caseSensitive" class="size-3 rounded" @change="setCaseSensitive(($event.target as HTMLInputElement).checked)" />
          {{ t('viewer.search.caseSensitive') }}
        </label>
        <label class="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" :checked="searchOptions.entireWord" class="size-3 rounded" @change="setEntireWord(($event.target as HTMLInputElement).checked)" />
          {{ t('viewer.search.entireWord') }}
        </label>
      </div>

      <hr class="border-border my-2" />

      <!-- Result count + nav (below options, above results, sticky) -->
      <div v-if="!searching && results.length > 0" class="flex items-center justify-between pb-2">
        <span class="text-xs text-muted-foreground">{{ t('viewer.search.resultTotal', { total: results[0].countTotal }) }}</span>
        <div v-if="results[0].countTotal > 0" class="flex gap-1">
          <Button variant="ghost" size="icon" class="size-8" @click="goToPreviousMatch">
            <Icon name="left" :size="14" />
          </Button>
          <Button variant="ghost" size="icon" class="size-8" @click="goToNextMatch">
            <Icon name="right" :size="14" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="searching" class="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
      <span class="size-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
      {{ t('viewer.search.searching') }}
    </div>

    <!-- Results (scrollable) -->
    <div v-if="!searching && results.length > 0" class="flex-1 overflow-y-auto">
      <template v-for="res in results" :key="res.query">
        <div v-for="page in res.pageMatches" :key="page.pageNumber" class="mt-1 mb-3 pl-2">
          <span class="text-xs text-muted-foreground">{{ t('viewer.search.page', { value: page.pageNumber }) }} ({{ page.countTotal }})</span>
          <div v-for="match in page.matches" :key="`${page.pageNumber}-${match.matchIndex}`" class="mt-2">
            <button
              :ref="(el) => setMatchRef(page.pageNumber, match.matchIndex, el as HTMLElement)"
              class="w-full text-left px-2 py-1.5 text-xs rounded border border-border transition-colors cursor-pointer"
              :class="isCurrentMatch(page.pageNumber, match.matchIndex) ? 'bg-primary/15 border-primary/25' : 'hover:bg-muted/50'"
              @click="handleJumpToMatch(page.pageNumber, match.matchIndex)">
              <span class="line-clamp-2 leading-relaxed" v-html="highlightText(match.snippet, res.query)" />
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- No results -->
    <div v-if="!searching && query && results.length === 0" class="flex-1 flex items-center justify-center text-xs text-muted-foreground">
      {{ t('viewer.search.resultTotal', { total: 0 }) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, watch, onUnmounted } from 'vue'
import { usePdfSearch } from '@/composables/usePdfSearch'
import { PdfViewerContextKey } from '@/context/pdfViewerContext'
import { Button } from '@/components/ui/button'
import Icon from '@/components/Icon.vue'
import { useT } from '@/composables/useT'
const { t } = useT()

const ctx = inject(PdfViewerContextKey)!
const { query, results, searching, searchOptions, search, clearSearch, jumpToMatch } = usePdfSearch(ctx.pdfViewer)

function setQuery(val: string) { query.value = val }
function setCaseSensitive(val: boolean) { searchOptions.value.caseSensitive = val }
function setEntireWord(val: boolean) { searchOptions.value.entireWord = val }

const currentMatch = ref<{ pageNumber: number; matchIndex: number } | null>(null)
const matchRefs: Record<string, HTMLElement> = {}

function setMatchRef(pageNumber: number, matchIndex: number, el: HTMLElement | null) { if (el) matchRefs[`${pageNumber}-${matchIndex}`] = el }
function isCurrentMatch(pageNumber: number, matchIndex: number) { return currentMatch.value?.pageNumber === pageNumber && currentMatch.value?.matchIndex === matchIndex }

const allMatches = computed(() => {
  const matches: { pageNumber: number; matchIndex: number }[] = []
  for (const res of results.value)
    for (const page of res.pageMatches)
      for (const match of page.matches)
        matches.push({ pageNumber: page.pageNumber, matchIndex: match.matchIndex })
  return matches
})

function findIndex(match: { pageNumber: number; matchIndex: number }) {
  return allMatches.value.findIndex(m => m.pageNumber === match.pageNumber && m.matchIndex === match.matchIndex)
}

function goToNextMatch() {
  if (!allMatches.value.length) return
  let nextIdx = 0
  if (currentMatch.value) { const cur = findIndex(currentMatch.value); nextIdx = (cur + 1) % allMatches.value.length }
  const next = allMatches.value[nextIdx]; currentMatch.value = next
  jumpToMatch({ pageNumber: next.pageNumber, matchIndex: next.matchIndex }); scrollToMatch(next.pageNumber, next.matchIndex)
}
function goToPreviousMatch() {
  if (!allMatches.value.length) return
  let prevIdx = allMatches.value.length - 1
  if (currentMatch.value) { const cur = findIndex(currentMatch.value); prevIdx = (cur - 1 + allMatches.value.length) % allMatches.value.length }
  const prev = allMatches.value[prevIdx]; currentMatch.value = prev
  jumpToMatch({ pageNumber: prev.pageNumber, matchIndex: prev.matchIndex }); scrollToMatch(prev.pageNumber, prev.matchIndex)
}
function scrollToMatch(pageNumber: number, matchIndex: number) { matchRefs[`${pageNumber}-${matchIndex}`]?.scrollIntoView({ block: 'center' }) }
function handleJumpToMatch(pageNumber: number, matchIndex: number) { currentMatch.value = { pageNumber, matchIndex }; jumpToMatch({ pageNumber, matchIndex }) }

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (results.value.length > 0 || query.value.trim() !== '') clearSearchFn()
  } else if (e.key === 'Enter') {
    if (query.value.trim() === '' && results.value.length > 0) clearSearchFn()
    if (query.value.trim()) { currentMatch.value = null; doSearch() }
  }
}

watch(searchOptions, () => { if (!searching.value && query.value.trim()) doSearch() }, { deep: true })

function handleClear() {
  setQuery('')
  if (results.value.length > 0) { clearSearch(); currentMatch.value = null }
}
function clearSearchFn() { clearSearch(); currentMatch.value = null; setQuery('') }

function doSearch() {
  const kw = query.value.trim()
  if (kw) { clearSearch(); setQuery(kw); currentMatch.value = null; search(kw, { caseSensitive: searchOptions.value.caseSensitive, entireWord: searchOptions.value.entireWord }) }
}

onUnmounted(() => {
  if (results.value.length > 0) clearSearch()
  currentMatch.value = null
  setQuery('')
})

function highlightText(text: string, q: string): string {
  if (!q) return escapeHTML(text)
  const escaped = escapeRegex(q)
  return escapeHTML(text).replace(new RegExp(`(${escaped})`, 'gi'), '<mark style="background:rgba(255,255,0,0.2);padding:0 2px">$1</mark>')
}
function escapeHTML(str: string): string { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
function escapeRegex(str: string): string { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
</script>
