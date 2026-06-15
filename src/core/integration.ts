/**
 * InkLayer Annotation Integration Layer (Vue)
 * ====================================
 * 
 * 集成层：将 InkLayer Annotation Core 与现有系统（PdfAnnotator）集成。
 * 
 * 功能：
 * - 提交时：IAnnotationStore → Annotation → 存储（支持新旧格式）
 * - 加载时：存储 → Annotation → Konva
 * - 兼容模式：新旧格式互转
 */

import type { Annotation } from './annotation.core'
import { storesToAnnotations, annotationsToStores } from './adapters/store.mapper'
import { pdfJsToAnnotation, annotationToPdfJs } from './adapters/pdfjs.adapter'
import type { IAnnotationStore } from '../extensions/annotator/const/definitions'

export type StorageFormat = 'legacy' | 'core' | 'hybrid'

export interface IntegrationOptions {
  storageFormat?: StorageFormat
  documentId?: string
  defaultAuthorId?: string
  pageSize?: { width: number; height: number }
}

export interface AnnotationStorage {
  version: '1.0' | '2.0'
  documentId?: string
  data: Annotation[] | IAnnotationStore[]
}

/**
 * 创建 Annotation 存储数据
 */
export function createAnnotationStorage(
  stores: IAnnotationStore[],
  options: IntegrationOptions = {}
): AnnotationStorage {
  const { storageFormat = 'hybrid' } = options

  switch (storageFormat) {
    case 'legacy':
      return {
        version: '1.0',
        documentId: options.documentId,
        data: stores,
      }
    case 'core':
      return {
        version: '2.0',
        documentId: options.documentId,
        data: storesToAnnotations(stores),
      }
    case 'hybrid':
    default:
      return {
        version: '2.0',
        documentId: options.documentId,
        data: storesToAnnotations(stores),
      }
  }
}

/**
 * 解析 Annotation 存储数据
 */
export function parseAnnotationStorage(
  storage: AnnotationStorage,
  // @ts-ignore
  _options: IntegrationOptions = {}
): IAnnotationStore[] {
  if (!storage.data) return []

  const { version } = storage

  if (version === '1.0') {
    return storage.data as IAnnotationStore[]
  }

  if (version === '2.0') {
    const annotations = storage.data as Annotation[]
    return annotationsToStores(annotations)
  }

  const firstItem = storage.data[0]
  if (isLegacyStore(firstItem)) {
    return storage.data as IAnnotationStore[]
  }

  try {
    return annotationsToStores(storage.data as Annotation[])
  } catch {
    console.warn('Failed to parse annotation storage, returning empty array')
    return []
  }
}

export function commitAnnotations(
  stores: IAnnotationStore[],
  // @ts-ignore
  _options?: IntegrationOptions
): Annotation[] {
  return storesToAnnotations(stores)
}

export function loadAnnotations(
  storage: AnnotationStorage,
  options?: IntegrationOptions
): IAnnotationStore[] {
  return parseAnnotationStorage(storage, options)
}

export function importFromPdfJs(
  pdfAnnotations: any[],
  options?: IntegrationOptions
): Annotation[] {
  return pdfAnnotations.map(pdfAnn =>
    pdfJsToAnnotation(pdfAnn, {
      documentId: options?.documentId,
      pageSize: options?.pageSize,
      defaultAuthorId: options?.defaultAuthorId || 'imported',
    })
  )
}

export function exportToPdfJs(
  annotations: Annotation[],
  options?: { pageIndex?: number }
): any[] {
  return annotations.map(ann => annotationToPdfJs(ann, options))
}

function isLegacyStore(obj: any): obj is IAnnotationStore {
  return obj && typeof obj === 'object' && 'konvaString' in obj && 'type' in obj
}

export function validateAnnotation(annotation: Annotation): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!annotation.id) errors.push('Missing id')
  if (!annotation.kind) errors.push('Missing kind')

  if (!annotation.target) {
    errors.push('Missing target')
  } else {
    if (annotation.target.pageIndex === undefined) errors.push('Missing target.pageIndex')
    if (!annotation.target.geometry) errors.push('Missing target.geometry')
  }

  return { valid: errors.length === 0, errors }
}

export function validateAnnotations(annotations: Annotation[]): {
  valid: boolean
  results: Array<{ id: string; valid: boolean; errors: string[] }>
} {
  const results = annotations.map(ann => ({
    id: ann.id,
    ...validateAnnotation(ann),
  }))
  return { valid: results.every(r => r.valid), results }
}
