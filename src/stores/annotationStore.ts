// InkLayer Vue — Annotation Pinia Store
// Migrated from Zustand (React) to Pinia (Vue)

import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import type { IAnnotationStore, IAnnotationType } from '../extensions/annotator/const/definitions'
import type { Painter } from '../extensions/annotator/painter'

export enum SelectionSource {
  CANVAS = 'canvas',
  SIDEBAR = 'sidebar',
}

interface SelectionInfo {
  store: IAnnotationStore | null
  source: SelectionSource | null
}

export const useAnnotationStore = defineStore('annotation', () => {
  // -- State --
  const annotations = ref<Map<string, IAnnotationStore>>(new Map())
  const originalAnnotations = ref<Map<string, IAnnotationStore>>(new Map())
  const selectedAnnotation = ref<SelectionInfo | null>(null)
  const selectionRevision = ref(0)
  const currentAnnotationType = ref<IAnnotationType | null>(null)
  const dataTransfer = ref<string | null>(null)
  const _painter = shallowRef<Painter | null>(null) as ReturnType<typeof shallowRef<Painter | null>>
  const permissionRevision = ref(0)

  // -- Getters --
  const annotationList = computed(() =>
    Array.from(annotations.value.values())
  )

  const selectedAnnotationStore = computed(() =>
    selectedAnnotation.value?.store ?? null
  )

  // -- Actions --
  function getAnnotation(id: string): IAnnotationStore | undefined {
    return annotations.value.get(id)
  }

  function getByPage(pageNumber: number): IAnnotationStore[] {
    return Array.from(annotations.value.values()).filter(
      (a) => a.pageNumber === pageNumber
    )
  }

  function addAnnotation(annotation: IAnnotationStore, isOriginal = false): IAnnotationStore {
    const newMap = new Map(annotations.value)
    newMap.set(annotation.id, annotation)
    annotations.value = newMap

    if (isOriginal) {
      const newOriginals = new Map(originalAnnotations.value)
      newOriginals.set(annotation.id, annotation)
      originalAnnotations.value = newOriginals
    }

    return annotation
  }

  function restoreAnnotation(annotation: IAnnotationStore, index: number): boolean {
    if (annotations.value.has(annotation.id)) return false

    const entries = Array.from(annotations.value.entries())
    const insertionIndex = Math.max(0, Math.min(index, entries.length))
    entries.splice(insertionIndex, 0, [annotation.id, annotation])
    annotations.value = new Map(entries)
    return true
  }

  function updateAnnotation(
    id: string,
    updates: Partial<IAnnotationStore>
  ): IAnnotationStore | null {
    const existing = annotations.value.get(id)
    if (!existing) {
      console.warn(`Annotation with id ${id} not found.`)
      return null
    }

    const updated = { ...existing, ...updates }
    const newMap = new Map(annotations.value)
    newMap.set(id, updated)
    annotations.value = newMap

    // Update selected if it's the same annotation
    if (selectedAnnotation.value?.store?.id === id) {
      selectedAnnotation.value = {
        ...selectedAnnotation.value,
        store: updated,
      }
    }

    return updated
  }

  function setAnnotationReferenceNumbers(referenceNumbers: ReadonlyMap<string, number>): void {
    const applyReferenceNumbers = (source: Map<string, IAnnotationStore>) => {
      let changed = false
      const result = new Map(source)

      referenceNumbers.forEach((referenceNumber, id) => {
        const annotation = result.get(id)
        if (!annotation || annotation.referenceNumber === referenceNumber) return
        result.set(id, { ...annotation, referenceNumber })
        changed = true
      })

      return changed ? result : source
    }

    annotations.value = applyReferenceNumbers(annotations.value)
    originalAnnotations.value = applyReferenceNumbers(originalAnnotations.value)

    const selectedStore = selectedAnnotation.value?.store
    const selectedReferenceNumber = selectedStore
      ? referenceNumbers.get(selectedStore.id)
      : undefined
    if (
      selectedStore
      && selectedReferenceNumber !== undefined
      && selectedStore.referenceNumber !== selectedReferenceNumber
    ) {
      selectedAnnotation.value = {
        store: { ...selectedStore, referenceNumber: selectedReferenceNumber },
        source: selectedAnnotation.value?.source ?? null,
      }
    }
  }

  function removeAnnotation(id: string): void {
    const newMap = new Map(annotations.value)
    if (newMap.has(id)) {
      newMap.delete(id)
      annotations.value = newMap

      // Clear selection if removed
      if (selectedAnnotation.value?.store?.id === id) {
        selectedAnnotation.value = null
        selectionRevision.value += 1
      }
    } else {
      console.warn(`Annotation with id ${id} not found.`)
    }
  }

  function clearAnnotations(): void {
    annotations.value = new Map()
    originalAnnotations.value = new Map()
    if (selectedAnnotation.value) selectionRevision.value += 1
    selectedAnnotation.value = null
  }

  function setSelectedAnnotation(
    annotation: IAnnotationStore | null,
    source?: SelectionSource
  ): void {
    selectedAnnotation.value = annotation
      ? { store: annotation, source: source ?? null }
      : null
    selectionRevision.value += 1
  }

  function setCurrentAnnotationType(
    annotationType: IAnnotationType | null
  ): void {
    currentAnnotationType.value = annotationType
  }

  function setDataTransfer(value: string | null): void {
    dataTransfer.value = value
  }

  function clearSelectedAnnotation(): void {
    if (!selectedAnnotation.value) return
    selectedAnnotation.value = null
    selectionRevision.value += 1
  }

  function setPainter(p: Painter | null) { _painter.value = p }
  function notifyPainterChanged() { permissionRevision.value += 1 }
  function getPainter(): Painter | null { return _painter.value ?? null }
  const painter = computed(() => _painter.value)

  return {
    // State
    annotations,
    originalAnnotations,
    selectedAnnotation,
    selectionRevision,
    currentAnnotationType,
    dataTransfer,
    _painter,
    permissionRevision,
    // Getters
    annotationList,
    selectedAnnotationStore,
    painter,
    // Actions
    getAnnotation,
    getByPage,
    addAnnotation,
    restoreAnnotation,
    updateAnnotation,
    setAnnotationReferenceNumbers,
    removeAnnotation,
    clearAnnotations,
    setSelectedAnnotation,
    setCurrentAnnotationType,
    setDataTransfer,
    clearSelectedAnnotation,
    setPainter,
    notifyPainterChanged,
    getPainter,
  }
})
