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
  const currentAnnotationType = ref<IAnnotationType | null>(null)
  const dataTransfer = ref<string | null>(null)
  const _painter = shallowRef<Painter | null>(null) as ReturnType<typeof shallowRef<Painter | null>>

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

  function removeAnnotation(id: string): void {
    const newMap = new Map(annotations.value)
    if (newMap.has(id)) {
      newMap.delete(id)
      annotations.value = newMap

      // Clear selection if removed
      if (selectedAnnotation.value?.store?.id === id) {
        selectedAnnotation.value = null
      }
    } else {
      console.warn(`Annotation with id ${id} not found.`)
    }
  }

  function clearAnnotations(): void {
    annotations.value = new Map()
    originalAnnotations.value = new Map()
    selectedAnnotation.value = null
  }

  function setSelectedAnnotation(
    annotation: IAnnotationStore | null,
    source?: SelectionSource
  ): void {
    selectedAnnotation.value = {
      store: annotation,
      source: source ?? null,
    }
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
    selectedAnnotation.value = null
  }

  function setPainter(p: Painter | null) { _painter.value = p }
  function getPainter(): Painter | null { return _painter.value ?? null }
  const painter = computed(() => _painter.value)

  return {
    // State
    annotations,
    originalAnnotations,
    selectedAnnotation,
    currentAnnotationType,
    dataTransfer,
    _painter,
    // Getters
    annotationList,
    selectedAnnotationStore,
    painter,
    // Actions
    getAnnotation,
    getByPage,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    clearAnnotations,
    setSelectedAnnotation,
    setCurrentAnnotationType,
    setDataTransfer,
    clearSelectedAnnotation,
    setPainter,
    getPainter,
  }
})
