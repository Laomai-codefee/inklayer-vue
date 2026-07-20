import { afterEach, describe, expect, it } from 'vitest'

import { globalI18n } from '@/i18n'
import { t } from '../global-t'

describe('global t', () => {
  afterEach(() => {
    globalI18n.global.locale.value = 'zh-CN'
  })

  it('supports i18next namespace keys used by non-component code', () => {
    globalI18n.global.locale.value = 'en-US'

    expect(t('annotator:editor.text.startTyping')).toBe('Start typing…')
    expect(t('annotator:export.fields.author')).toBe('Author')
  })

  it('continues to support Vue i18n dot paths', () => {
    expect(t('annotator.editor.text.startTyping')).toBe('输入文字，回车确认...')
  })
})
