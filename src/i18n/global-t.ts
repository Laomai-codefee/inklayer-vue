// Shared i18n helper for non-component code (painter, utils, etc.)
import { globalI18n } from '@/i18n'

export function t(key: string, params?: Record<string, string | number>): string {
  const normalizedKey = key.replace(':', '.')
  try {
    return (globalI18n.global.t(normalizedKey, params ?? {}) as string) || normalizedKey
  } catch {
    return normalizedKey
  }
}
