// Lightweight i18n helper — uses the library's own i18n instance
// without requiring app.use(i18n) from the consumer
import i18n from '@/i18n'

export function t(key: string, options?: Record<string, any>): string {
  return i18n.global.t(key, options as any) || key
}

export function useT() {
  return { t }
}
