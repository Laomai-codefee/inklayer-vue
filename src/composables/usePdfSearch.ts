// usePdfSearch composable — Vue 3 version
// Migrated from React usePdfSearch hook

import { onScopeDispose, ref, watch, type Ref } from 'vue'
import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'
import type { KeywordResult, MatchSnippet, PageMatch } from '@/types'

interface SearchOptions {
  caseSensitive?: boolean
  entireWord?: boolean
  matchDiacritics?: boolean
}

interface FindControllerState {
  _matchesCountTotal?: number
  _pageMatches?: number[][]
}

interface FindControlStateEvent {
  rawQuery?: string | string[] | null
  source?: FindControllerState
}

async function getPageText(
  pdfViewer: PDFViewer,
  pageIndex: number,
  cache: Map<number, string>
): Promise<string> {
  if (cache.has(pageIndex)) return cache.get(pageIndex)!
  const pageView = pdfViewer.getPageView(pageIndex)
  if (!pageView?.pdfPage) return ''
  const textContent = await pageView.pdfPage.getTextContent()
  const fullText = textContent.items.map((i: any) => i.str).join('')
  cache.set(pageIndex, fullText)
  return fullText
}

export function usePdfSearch(pdfViewer: Ref<PDFViewer | null>) {
  const query = ref('')
  const results = ref<KeywordResult[]>([])
  const searching = ref(false)
  const searchOptions = ref<SearchOptions>({
    caseSensitive: false,
    entireWord: false,
    matchDiacritics: false,
  })
  const textContentCache = new Map<number, string>()
  let searchRequest = 0
  let cancelActiveSearch: (() => void) | null = null

  function cancelPendingSearch() {
    cancelActiveSearch?.()
    cancelActiveSearch = null
  }

  watch(pdfViewer, () => {
    searchRequest += 1
    cancelPendingSearch()
    textContentCache.clear()
  }, { flush: 'sync' })

  onScopeDispose(() => {
    searchRequest += 1
    cancelPendingSearch()
    textContentCache.clear()
  })

  async function jumpToMatch({
    pageNumber,
    matchIndex,
  }: {
    pageNumber: number
    matchIndex: number
  }) {
    const viewer = pdfViewer.value
    if (!viewer || !query.value) return
    const findController = (viewer as any).findController
    if (!findController) return

    viewer.scrollPageIntoView({ pageNumber })

    findController._selected = { pageIdx: pageNumber - 1, matchIdx: matchIndex }
    findController._offset = {
      pageIdx: pageNumber - 1,
      matchIdx: matchIndex - 1,
      wrapped: false,
    }
    findController._highlightMatches = true

    viewer.eventBus.dispatch('find', {
      type: 'again',
      query: query.value,
      caseSensitive: searchOptions.value.caseSensitive,
      entireWord: searchOptions.value.entireWord,
      findPrevious: false,
      matchDiacritics: searchOptions.value.matchDiacritics,
      highlightAll: true,
    })
  }

  async function search(keyword: string, options?: SearchOptions) {
    const viewer = pdfViewer.value
    if (!viewer) return

    const requestId = ++searchRequest
    cancelPendingSearch()
    const effectiveOptions = { ...searchOptions.value, ...options }

    searching.value = true
    query.value = keyword
    searchOptions.value = effectiveOptions

    try {
      const res = await new Promise<KeywordResult | null>((resolve, reject) => {
        const pagesCount = viewer.pagesCount
        let retries = 0
        const maxRetries = 60
        const delay = 200
        let timer: ReturnType<typeof setTimeout> | null = null
        let settled = false
        let latestSource: FindControllerState | null = null

        const cleanup = () => {
          if (timer) {
            clearTimeout(timer)
            timer = null
          }
          viewer.eventBus.off('updatefindcontrolstate', handler)
        }

        const finish = (value: KeywordResult | null) => {
          if (settled) return
          settled = true
          cleanup()
          resolve(value)
        }

        const fail = (error: unknown) => {
          if (settled) return
          settled = true
          cleanup()
          reject(error)
        }

        const check = async () => {
          if (settled || requestId !== searchRequest) {
            finish(null)
            return
          }

          try {
            const pageMatchIndexes = latestSource?._pageMatches
            if (Array.isArray(pageMatchIndexes) && pageMatchIndexes.length === pagesCount) {
              const pageMatches: PageMatch[] = []

              for (let i = 0; i < pageMatchIndexes.length; i++) {
                const matchIndexes = pageMatchIndexes[i]
                if (!matchIndexes?.length) continue

                const fullText = await getPageText(viewer, i, textContentCache)
                if (settled || requestId !== searchRequest) {
                  finish(null)
                  return
                }

                const matches: MatchSnippet[] = matchIndexes.map((charIndex, matchIndex) => {
                  const context = 30
                  const start = Math.max(0, charIndex - 5)
                  const end = Math.min(fullText.length, charIndex + keyword.length + context)
                  return { matchIndex, charIndex, snippet: fullText.slice(start, end) }
                })

                pageMatches.push({
                  pageNumber: i + 1,
                  countTotal: matchIndexes.length,
                  matches,
                })
              }

              finish({
                query: keyword,
                countTotal: latestSource?._matchesCountTotal ?? 0,
                pageMatches,
              })
            } else if (retries < maxRetries) {
              retries += 1
              timer = setTimeout(() => {
                timer = null
                void check()
              }, delay)
            } else {
              finish({ query: keyword, countTotal: 0, pageMatches: [] })
            }
          } catch (error) {
            fail(error)
          }
        }

        const handler = ({ source, rawQuery }: FindControlStateEvent) => {
          const normalizedQuery = Array.isArray(rawQuery) ? rawQuery.join('') : rawQuery
          if (normalizedQuery !== undefined && normalizedQuery !== null && normalizedQuery !== keyword) {
            return
          }

          latestSource = source ?? null
          if (timer) {
            clearTimeout(timer)
            timer = null
          }
          void check()
        }

        cancelActiveSearch = () => finish(null)
        viewer.eventBus.on('updatefindcontrolstate', handler)

        viewer.eventBus.dispatch('find', {
          type: 'highlightallchange',
          query: keyword,
          caseSensitive: effectiveOptions.caseSensitive ?? false,
          entireWord: effectiveOptions.entireWord ?? false,
          findPrevious: false,
          matchDiacritics: effectiveOptions.matchDiacritics ?? false,
          highlightAll: true,
        })
      })

      if (res && requestId === searchRequest) {
        results.value = [res]
      }
    } catch (err) {
      console.error(err)
      if (requestId === searchRequest) {
        results.value = [{ query: keyword, countTotal: 0, pageMatches: [] }]
      }
    } finally {
      if (requestId === searchRequest) {
        cancelActiveSearch = null
        searching.value = false
      }
    }
  }

  function clearSearch() {
    searchRequest += 1
    cancelPendingSearch()
    pdfViewer.value?.eventBus.dispatch('find', { query: '' })
    query.value = ''
    results.value = []
    searching.value = false
  }

  return {
    query,
    results,
    searching,
    searchOptions,
    search,
    clearSearch,
    jumpToMatch,
  }
}
