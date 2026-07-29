import {
  onScopeDispose,
  readonly,
  shallowRef,
  watch,
  type Ref,
} from 'vue'

import type { Painter } from '@/extensions/annotator/painter'
import type { AnnotationHoverSnapshot } from '@/extensions/annotator/painter/annotation_hover'

const EMPTY_ANNOTATION_HOVER: AnnotationHoverSnapshot = Object.freeze({
  annotationId: null,
  source: null,
})

export function useAnnotationHoverSnapshot(
  painter: Readonly<Ref<Painter | null | undefined>>
) {
  const snapshot = shallowRef<AnnotationHoverSnapshot>(EMPTY_ANNOTATION_HOVER)
  let unsubscribe: (() => void) | null = null

  const stopWatching = watch(
    painter,
    nextPainter => {
      unsubscribe?.()
      unsubscribe = null
      snapshot.value = nextPainter?.getAnnotationHoverSnapshot()
        ?? EMPTY_ANNOTATION_HOVER

      if (nextPainter) {
        unsubscribe = nextPainter.subscribeAnnotationHover(nextSnapshot => {
          snapshot.value = nextSnapshot
        })
      }
    },
    { immediate: true }
  )

  onScopeDispose(() => {
    stopWatching()
    unsubscribe?.()
  })

  return readonly(snapshot)
}
