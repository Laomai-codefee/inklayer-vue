// useSystemAppearance composable — Vue 3 version
// Migrated from React useSystemAppearance hook

import { ref, onMounted, onUnmounted } from 'vue'

export function useSystemAppearance() {
  const systemAppearance = ref<'light' | 'dark'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  )

  let mediaQuery: MediaQueryList | null = null
  let handler: ((e: MediaQueryListEvent) => void) | null = null

  onMounted(() => {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    handler = (e: MediaQueryListEvent) => {
      systemAppearance.value = e.matches ? 'dark' : 'light'
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler)
    } else {
      ;(mediaQuery as any).addListener(handler)
    }
  })

  onUnmounted(() => {
    if (mediaQuery && handler) {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler)
      } else {
        ;(mediaQuery as any).removeListener(handler)
      }
    }
  })

  return systemAppearance
}
