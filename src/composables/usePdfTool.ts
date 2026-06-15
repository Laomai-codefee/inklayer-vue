// usePdfTool composable — Vue 3 version
// Migrated from React usePdfTool hook

import { PDFDocument, PDFName } from 'pdf-lib'
import type { Ref } from 'vue'

function clearAllAnnotations(pdfDoc: PDFDocument) {
  for (const page of pdfDoc.getPages()) {
    const annotsKey = PDFName.of('Annots')
    if (page.node.has(annotsKey)) {
      page.node.set(annotsKey, pdfDoc.context.obj([]))
    }
  }
}

async function generatePdf(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfDocument: any,
  cleanup = false
): Promise<Uint8Array> {
  const pdfData = await pdfDocument.getData()
  const pdfDoc = await PDFDocument.load(pdfData)
  if (cleanup) {
    clearAllAnnotations(pdfDoc)
  }
  return pdfDoc.save()
}

function downloadPdf(data: Uint8Array, filename: string) {
  const blob = new Blob([data as BlobPart], { type: 'application/pdf' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

function printPdf(data: Uint8Array) {
  const blob = new Blob([data as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = 'none'
  iframe.src = url
  document.body.appendChild(iframe)
  iframe.onload = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => {
      document.body.removeChild(iframe)
      URL.revokeObjectURL(url)
    }, 1000)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function usePdfTool(pdfDocument: Ref<any>) {
  async function downloadClean(filename?: string) {
    if (!pdfDocument.value) return
    const data = await generatePdf(pdfDocument.value, true)
    const fileName = filename || `file_${Date.now()}.pdf`
    downloadPdf(data, fileName)
  }

  async function printClean() {
    if (!pdfDocument.value) return
    const data = await generatePdf(pdfDocument.value, true)
    printPdf(data)
  }

  return { downloadClean, printClean }
}
