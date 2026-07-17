import { defineComponent, h, nextTick, shallowRef } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { usePdfViewer, type UseViewerOptions } from '../usePdfViewer'

const pdfMocks = vi.hoisted(() => ({
  getDocument: vi.fn(),
}))

vi.mock('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url', () => ({ default: 'pdf.worker.mjs' }))

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  AnnotationEditorType: { DISABLE: 0 },
  GlobalWorkerOptions: {},
  PDFDataRangeTransport: class {},
  getDocument: pdfMocks.getDocument,
}))

vi.mock('pdfjs-dist/legacy/web/pdf_viewer.mjs', () => ({
  DownloadManager: class {},
  EventBus: class {},
  PDFFindController: class {},
  PDFLinkService: class {
    setViewer = vi.fn()
    setDocument = vi.fn()
  },
  PDFViewer: class {
    cleanup = vi.fn()
    setDocument = vi.fn()
  },
}))

function createDeferredTask() {
  let resolve!: (document: PDFDocumentProxy) => void
  const promise = new Promise<PDFDocumentProxy>(resolvePromise => {
    resolve = resolvePromise
  })
  return {
    promise,
    resolve,
    destroy: vi.fn(),
    onProgress: null,
  }
}

function createDocument(name: string) {
  return {
    name,
    destroy: vi.fn(async () => undefined),
    getMetadata: vi.fn(async () => ({ info: { Title: name } })),
  } as unknown as PDFDocumentProxy
}

describe('usePdfViewer', () => {
  it('ignores a stale loading task when reloads overlap', async () => {
    const firstTask = createDeferredTask()
    const secondTask = createDeferredTask()
    pdfMocks.getDocument.mockReset()
    pdfMocks.getDocument.mockReturnValueOnce(firstTask).mockReturnValueOnce(secondTask)

    const firstDocument = createDocument('first')
    const secondDocument = createDocument('second')
    const onLoadSuccess = vi.fn()
    let viewerState!: ReturnType<typeof usePdfViewer>

    const TestComponent = defineComponent({
      setup() {
        const containerRef = shallowRef<HTMLDivElement | null>(null)
        const options: UseViewerOptions = {
          url: 'document.pdf',
          enableRange: false,
          onLoadSuccess,
        }
        viewerState = usePdfViewer(containerRef, options)
        return () => h('div', { ref: containerRef })
      },
    })

    const wrapper = mount(TestComponent)
    await vi.waitFor(() => expect(pdfMocks.getDocument).toHaveBeenCalledTimes(1))

    const latestLoad = viewerState.reload()
    await vi.waitFor(() => expect(pdfMocks.getDocument).toHaveBeenCalledTimes(2))
    secondTask.resolve(secondDocument)
    await latestLoad
    await nextTick()

    expect((viewerState.pdfDocument.value as PDFDocumentProxy & { name: string }).name).toBe('second')
    expect(onLoadSuccess).toHaveBeenCalledTimes(1)
    expect(onLoadSuccess).toHaveBeenCalledWith(secondDocument)

    firstTask.resolve(firstDocument)
    await firstTask.promise
    await flushPromises()

    expect(firstTask.destroy).toHaveBeenCalled()
    expect(firstDocument.destroy).toHaveBeenCalled()
    expect((viewerState.pdfDocument.value as PDFDocumentProxy & { name: string }).name).toBe('second')
    expect(onLoadSuccess).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })
})
