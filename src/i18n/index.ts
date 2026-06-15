// i18n setup — vue-i18n
import { createI18n } from 'vue-i18n'
import zhCN from './locale/zh-CN'
import enUS from './locale/en-US'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
  globalInjection: true,
})

export default i18n

// Global i18n access for non-component code (painter, utils, etc.)
export { i18n as globalI18n }
