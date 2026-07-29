import { describe, expect, it } from 'vitest'

import { createAnnotationPreview } from '../annotation_preview'

describe('createAnnotationPreview', () => {
  it('normalizes whitespace and truncates long content', () => {
    expect(createAnnotationPreview('  First\n\nsecond  ')).toBe('First second')

    const preview = createAnnotationPreview('a'.repeat(600))
    expect(preview).toHaveLength(501)
    expect(preview.endsWith('…')).toBe(true)
  })

  it('returns an empty preview for missing content', () => {
    expect(createAnnotationPreview(undefined)).toBe('')
    expect(createAnnotationPreview('   ')).toBe('')
  })
})
