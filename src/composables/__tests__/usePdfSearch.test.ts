import { effectScope, shallowRef } from 'vue'
import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'
import { usePdfSearch } from '../usePdfSearch'

type Listener = (event: FindEvent) => void

interface FindEvent {
  rawQuery?: string
  source: {
    _matchesCountTotal: number
    _pageMatches: number[][]
  }
}

class FakeEventBus {
  private listeners = new Map<string, Set<Listener>>()
  readonly dispatched: Array<{ name: string; payload: Record<string, unknown> }> = []

  on(name: string, listener: Listener) {
    const listeners = this.listeners.get(name) ?? new Set<Listener>()
    listeners.add(listener)
    this.listeners.set(name, listeners)
  }

  off(name: string, listener: Listener) {
    this.listeners.get(name)?.delete(listener)
  }

  dispatch(name: string, payload: Record<string, unknown>) {
    this.dispatched.push({ name, payload })
  }

  emitFindResult(query: string, pageMatches: number[][]) {
    const event: FindEvent = {
      rawQuery: query,
      source: {
        _matchesCountTotal: pageMatches.reduce((total, matches) => total + matches.length, 0),
        _pageMatches: pageMatches,
      },
    }
    this.listeners.get('updatefindcontrolstate')?.forEach(listener => listener(event))
  }

  listenerCount(name: string) {
    return this.listeners.get(name)?.size ?? 0
  }
}

function createViewer(eventBus: FakeEventBus) {
  return {
    pagesCount: 1,
    eventBus,
    getPageView: () => ({
      pdfPage: {
        getTextContent: async () => ({ items: [{ str: 'A searchable PDF page' }] }),
      },
    }),
  } as unknown as PDFViewer
}

describe('usePdfSearch', () => {
  it('keeps only the latest result when searches overlap', async () => {
    const eventBus = new FakeEventBus()
    const viewer = shallowRef<PDFViewer | null>(createViewer(eventBus))
    const scope = effectScope()
    const searchState = scope.run(() => usePdfSearch(viewer))!

    const firstSearch = searchState.search('first')
    const secondSearch = searchState.search('second')
    eventBus.emitFindResult('first', [[0]])
    eventBus.emitFindResult('second', [[4]])
    await Promise.all([firstSearch, secondSearch])

    expect(searchState.query.value).toBe('second')
    expect(searchState.results.value).toHaveLength(1)
    expect(searchState.results.value[0].query).toBe('second')
    expect(eventBus.listenerCount('updatefindcontrolstate')).toBe(0)
    scope.stop()
  })

  it('removes a pending listener when its scope is disposed', async () => {
    const eventBus = new FakeEventBus()
    const viewer = shallowRef<PDFViewer | null>(createViewer(eventBus))
    const scope = effectScope()
    const searchState = scope.run(() => usePdfSearch(viewer))!

    const pendingSearch = searchState.search('pending')
    expect(eventBus.listenerCount('updatefindcontrolstate')).toBe(1)

    scope.stop()
    await pendingSearch
    expect(eventBus.listenerCount('updatefindcontrolstate')).toBe(0)
  })
})
