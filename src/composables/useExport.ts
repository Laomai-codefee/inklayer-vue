// Excel export composable for annotation data

import { t } from '@/i18n/global-t'
import { formatPDFDate } from '@/extensions/annotator/utils/utils'
import { annotationDefinitions } from '@/extensions/annotator/const/definitions'
import type { IAnnotationStore } from '@/extensions/annotator/const/definitions'

function getAnnotationTypeName(type: number): string {
  const def = annotationDefinitions.find(d => d.type === type)
  return def ? t(`annotator:tool.${def.name}`) : 'Unknown'
}

export async function exportToExcel(
  annotations: IAnnotationStore[],
  fileName?: string
): Promise<void> {
  // Build rows
  const rows: Array<Record<string, string | number>> = []
  let index = 1

  for (const ann of annotations) {
    rows.push({
      index,
      id: ann.id,
      page: ann.pageNumber,
      annotationType: getAnnotationTypeName(ann.type),
      recordType: t('annotator:export.recordType.annotation'),
      author: ann.title || ann.user?.name || 'Unknown',
      content: ann.contentsObj?.text || '',
      date: ann.date ? formatPDFDate(ann.date, true) : '',
      status: '',
    })
    index++

    // Export comments/replies too
    for (const comment of ann.comments || []) {
      rows.push({
        index,
        id: ann.id,
        page: ann.pageNumber,
        annotationType: getAnnotationTypeName(ann.type),
        recordType: t('annotator:export.recordType.reply'),
        author: comment.title,
        content: comment.content,
        date: comment.date ? formatPDFDate(comment.date, true) : '',
        status: '',
      })
      index++
    }
  }

  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Annotations')

  sheet.columns = [
    { key: 'index', header: '#', width: 8 },
    { key: 'id', header: t('annotator:export.fields.id'), width: 20 },
    { key: 'page', header: t('annotator:export.fields.page'), width: 10 },
    { key: 'annotationType', header: t('annotator:export.fields.annotationType'), width: 18 },
    { key: 'recordType', header: t('annotator:export.fields.recordType'), width: 12 },
    { key: 'author', header: t('annotator:export.fields.author'), width: 16 },
    { key: 'content', header: t('annotator:export.fields.content'), width: 40 },
    { key: 'date', header: t('annotator:export.fields.date'), width: 22 },
    { key: 'status', header: t('annotator:export.fields.status'), width: 10 },
  ]

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, size: 12 }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '6E56CF' },
    bgColor: { argb: '6E56CF' },
  } as any
  headerRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFF' } }

  // Add data rows
  for (const row of rows) {
    sheet.addRow(row)
  }

  // Auto-fit rows
  for (let i = 2; i <= sheet.rowCount; i++) {
    sheet.getRow(i).height = 24
  }

  // Buffer & download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName || `annotations_${new Date().toISOString().slice(0, 10)}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}
