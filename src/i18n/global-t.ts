// Shared i18n helper for non-component code (painter, utils, etc.)
import { globalI18n } from '@/i18n'

export function t(key: string, params?: Record<string, string | number>): string {
  try {
    return (globalI18n.global.t(key, params ?? {}) as string) || key.split(':').pop() || key
  } catch {
    return key.split(':').pop() || key
  }
}
