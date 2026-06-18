// usePdfViewer composable — Vue 3 version
// Migrated from React usePdfViewer hook

import { ref, shallowRef, onUnmounted, onMounted, nextTick, type ShallowRef } from 'vue'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import {
  DownloadManager,
  EventBus,
  PDFFindController,
  PDFLinkService,
  PDFViewer,
} from 'pdfjs-dist/legacy/web/pdf_viewer.mjs'
import {
  AnnotationEditorType,
  getDocument,
  PDFDataRangeTransport,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy,
} from 'pdfjs-dist/legacy/build/pdf.mjs'

import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export interface UseViewerOptions {
  url?: string | URL
  data?: string | number[] | ArrayBuffer | Uint8Array | Uint16Array | Uint32Array
  enableRange?: boolean | 'auto'
  onLoadSuccess?: (pdfDocument: PDFDocumentProxy) => void
  onLoadError?: (error: Error) => void
  onLoadEnd?: () => void
  onViewerInit?: (viewer: PDFViewer) => void
  eventBus?: EventBus
  textLayerMode?: number
  annotationMode?: number
  externalLinkTarget?: number
}

export function usePdfViewer(
  containerRef: Readonly<ShallowRef<HTMLDivElement | null>>,
  options: UseViewerOptions
) {
  const {
    url,
    data,
    enableRange = 'auto',
    onLoadSuccess,
    onLoadError,
    onLoadEnd,
    onViewerInit,
    eventBus: externalEventBus,
    textLayerMode = 1,
    annotationMode = 0,
    externalLinkTarget = 2,
  } = options

  const loading = ref(true)
  const progress = ref(0)
  const pdfDocument = ref<PDFDocumentProxy | null>(null)
  const pdfViewer = shallowRef<PDFViewer | null>(null)
  const eventBus = shallowRef<EventBus | null>(null)
  const metadata = ref<any>(null)
  const loadError = ref<Error | null>(null)

  let cleanupFn: (() => void) | null = null
  let loadingTaskRef: PDFDocumentLoadingTask | null = null

  function isRangeFailure(error: unknown): boolean {
    if (!(error instanceof Error)) return false
    const msg = error.message.toLowerCase()
    return (
      msg.includes('range') ||
      msg.includes('content-length') ||
      msg.includes('unexpected server response') ||
      msg.includes('cors')
    )
  }

  function createPdfViewer(): { bus: EventBus; linkService: PDFLinkService; viewer: PDFViewer } {
    cleanupFn?.()
    cleanupFn = null

    const container = containerRef.value
    if (!container) throw new Error('PDF container not ready')

    // Ensure container is absolutely positioned for pdfjs
    if (!container.style.position) {
      container.style.position = 'absolute'
    }

    const bus = externalEventBus || new EventBus()
    eventBus.value = bus

    const linkService = new PDFLinkService({ eventBus: bus, externalLinkTarget })
    const downloadManager = new DownloadManager()
    const fc = new PDFFindController({ linkService, eventBus: bus })

    const viewer = new PDFViewer({
      container,
      eventBus: bus,
      textLayerMode,
      annotationMode,
      annotationEditorMode: AnnotationEditorType.DISABLE,
      linkService,
      downloadManager,
      removePageBorders: true,
      findController: fc,
    })

    linkService.setViewer(viewer)
    pdfViewer.value = viewer

    cleanupFn = () => {
      try {
        pdfViewer.value?.cleanup()
      } catch {
        // PDF.js viewer may already be in a destroyed state
      }
      pdfViewer.value = null
      if (!externalEventBus) eventBus.value = null
    }

    onViewerInit?.(viewer)
    return { bus, linkService, viewer }
  }

  async function createTransport(urlStr: string): Promise<PDFDataRangeTransport> {
    const headResp = await fetch(urlStr, { method: 'HEAD' })
    const length = Number(headResp.headers.get('Content-Length'))
    if (isNaN(length)) throw new Error('Cannot get PDF length for range loading')

    class MyPDFDataRangeTransport extends PDFDataRangeTransport {
      async requestDataRange(begin: number, end: number) {
        const resp = await fetch(urlStr, {
          headers: { Range: `bytes=${begin}-${end - 1}` },
        })
        const arrayBuffer = await resp.arrayBuffer()
        this.onDataRange(begin, new Uint8Array(arrayBuffer))
      }
    }
    return new MyPDFDataRangeTransport(length, null)
  }

  async function createLoadingTask(useRange: boolean): Promise<PDFDocumentLoadingTask> {
    if (data) {
      return getDocument({ data, disableRange: true, disableStream: true })
    } else if (url && useRange) {
      const transport = await createTransport(String(url))
      return getDocument({ range: transport })
    } else if (url) {
      return getDocument({ url, disableRange: true, disableStream: true })
    }
    throw new Error('Either url or data must be provided')
  }

  async function loadPdf() {
    if (!url && !data) {
      loadError.value = new Error('Either url or data must be provided')
      loading.value = false
      return
    }

    loading.value = true
    progress.value = 0
    loadError.value = null
    pdfDocument.value = null

    const { linkService, viewer } = createPdfViewer()

    let triedRange = false

    try {
      const shouldTryRange = enableRange === true || enableRange === 'auto'
      let _loadingTask: PDFDocumentLoadingTask

      if (shouldTryRange) {
        triedRange = true
        _loadingTask = await createLoadingTask(true)
      } else {
        _loadingTask = await createLoadingTask(false)
      }

      loadingTaskRef = _loadingTask

      _loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
        if (total > 0) {
          progress.value = Math.round((loaded / total) * 100)
        }
      }

      const pdf = await _loadingTask.promise
      pdfDocument.value = pdf
      linkService.setDocument(pdf)
      viewer.setDocument(pdf)

      const docMetadata = await pdf.getMetadata()
      metadata.value = docMetadata
      onLoadSuccess?.(pdf)
    } catch (err) {
      if (enableRange === 'auto' && triedRange && isRangeFailure(err)) {
        console.warn('[PDF] Range failed, fallback to full loading')
        loadingTaskRef?.destroy()
        loadingTaskRef = null

        try {
          const fallbackTask = await createLoadingTask(false)
          loadingTaskRef = fallbackTask

          fallbackTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
            if (total > 0) {
              progress.value = Math.round((loaded / total) * 100)
            }
          }

          const pdf = await fallbackTask.promise
          pdfDocument.value = pdf
          linkService.setDocument(pdf)
          viewer.setDocument(pdf)

          const docMetadata = await pdf.getMetadata()
          metadata.value = docMetadata
          onLoadSuccess?.(pdf)
          return
        } catch (fallbackErr) {
          loadError.value = fallbackErr as Error
          onLoadError?.(fallbackErr as Error)
          return
        }
      }

      loadError.value = err as Error
      onLoadError?.(err as Error)
    } finally {
      loading.value = false
      onLoadEnd?.()
    }
  }

  // Start loading after mount (containerRef must be attached to DOM)
  onMounted(async () => {
    await nextTick()
    loadPdf()
  })

  onUnmounted(() => {
    cleanupFn?.()
    cleanupFn = null
    loadingTaskRef?.destroy()
    loadingTaskRef = null
  })

  return {
    loading,
    progress,
    pdfDocument,
    pdfViewer,
    eventBus,
    metadata,
    loadError,
    reload: loadPdf,
  }
}
