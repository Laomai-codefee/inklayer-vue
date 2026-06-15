// usePdfSearch composable — Vue 3 version
// Migrated from React usePdfSearch hook

import { ref, type Ref } from 'vue'
import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'
import type { KeywordResult, MatchSnippet, PageMatch } from '@/types'

interface SearchOptions {
  caseSensitive?: boolean
  entireWord?: boolean
  matchDiacritics?: boolean
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

    searching.value = true
    query.value = keyword
    searchOptions.value = { ...searchOptions.value, ...options }

    const resultsTemp: KeywordResult[] = []

    try {
      const res = await new Promise<KeywordResult>((resolve) => {
        const pagesCount = viewer.pagesCount
        let retries = 0
        const maxRetries = 60
        const delay = 200

        const handler = ({ source }: any) => {
          const check = async () => {
            if (source._pageMatches.length === pagesCount) {
              viewer.eventBus.off('updatefindcontrolstate', handler)

              const pageMatches: PageMatch[] = []

              for (let i = 0; i < source._pageMatches.length; i++) {
                const matchIndexes: number[] = source._pageMatches[i]
                if (!matchIndexes || matchIndexes.length === 0) continue

                const fullText = await getPageText(viewer, i, textContentCache)

                const matches: MatchSnippet[] = matchIndexes.map(
                  (charIndex, matchIndex) => {
                    const context = 30
                    const start = Math.max(0, charIndex - 5)
                    const end = Math.min(
                      fullText.length,
                      charIndex + keyword.length + context
                    )
                    return { matchIndex, charIndex, snippet: fullText.slice(start, end) }
                  }
                )

                pageMatches.push({
                  pageNumber: i + 1,
                  countTotal: matchIndexes.length,
                  matches,
                })
              }

              resolve({
                query: keyword,
                countTotal: source._matchesCountTotal,
                pageMatches,
              })
            } else if (retries < maxRetries) {
              retries++
              setTimeout(check, delay)
            } else {
              viewer.eventBus.off('updatefindcontrolstate', handler)
              resolve({ query: keyword, countTotal: 0, pageMatches: [] })
            }
          }
          check()
        }

        viewer.eventBus.on('updatefindcontrolstate', handler)

        viewer.eventBus.dispatch('find', {
          type: 'highlightallchange',
          query: keyword,
          caseSensitive: options?.caseSensitive ?? false,
          entireWord: options?.entireWord ?? false,
          findPrevious: false,
          matchDiacritics: options?.matchDiacritics ?? false,
          highlightAll: true,
        })
      })

      resultsTemp.push(res)
    } catch (err) {
      console.error(err)
      resultsTemp.push({ query: keyword, countTotal: 0, pageMatches: [] })
    }

    results.value = resultsTemp
    searching.value = false
  }

  function clearSearch() {
    pdfViewer.value?.eventBus.dispatch('find', { query: '' })
    query.value = ''
    results.value = []
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
