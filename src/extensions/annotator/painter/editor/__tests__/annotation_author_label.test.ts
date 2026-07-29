import { describe, expect, it } from 'vitest'

import {
  getAnnotationAuthorLabelText,
  getAnnotationAuthorLabelPosition,
  getAnnotationAuthorName,
} from '../annotation_author_label'

describe('annotation author label', () => {
  describe('author name', () => {
    it('uses the trimmed user name', () => {
      expect(getAnnotationAuthorName({
        user: { id: 'alice', name: '  Alice  ' },
        title: 'Fallback',
      })).toBe('Alice')
    })

    it('falls back to the annotation title', () => {
      expect(getAnnotationAuthorName({
        user: { id: 'alice', name: '   ' },
        title: '  Imported author  ',
      })).toBe('Imported author')
    })

    it('hides the label when no author name is available', () => {
      expect(getAnnotationAuthorName({
        user: { id: 'unknown', name: '' },
        title: '   ',
      })).toBeNull()
    })
  })

  describe('label text', () => {
    it('combines the stable number and author name', () => {
      expect(getAnnotationAuthorLabelText({
        user: { id: 'alice', name: 'Alice' },
        title: 'Fallback',
        referenceNumber: 12,
      })).toBe('#12 · Alice')
    })

    it('falls back independently when either identity part is missing', () => {
      expect(getAnnotationAuthorLabelText({
        user: { id: 'unknown', name: '' },
        title: '',
        referenceNumber: 12,
      })).toBe('#12')
      expect(getAnnotationAuthorLabelText({
        user: { id: 'alice', name: 'Alice' },
        title: 'Fallback',
        referenceNumber: undefined,
      })).toBe('Alice')
    })

    it('does not treat invalid numbers as reference labels', () => {
      expect(getAnnotationAuthorLabelText({
        user: { id: 'alice', name: 'Alice' },
        title: 'Fallback',
        referenceNumber: 0,
      })).toBe('Alice')
    })
  })

  describe('position', () => {
    it('places the label above the selection and aligns it to the right', () => {
      expect(getAnnotationAuthorLabelPosition({
        selectionRect: { x: 50, y: 80, width: 100, height: 60 },
        labelWidth: 70,
        labelHeight: 24,
        stageWidth: 500,
        stageHeight: 700,
      })).toEqual({ x: 80, y: 52 })
    })

    it('keeps the label inside the horizontal page bounds', () => {
      expect(getAnnotationAuthorLabelPosition({
        selectionRect: { x: 10, y: 80, width: 20, height: 60 },
        labelWidth: 70,
        labelHeight: 24,
        stageWidth: 500,
        stageHeight: 700,
      })).toEqual({ x: 0, y: 52 })
    })

    it('moves the label below the selection when there is no room above it', () => {
      expect(getAnnotationAuthorLabelPosition({
        selectionRect: { x: 50, y: 10, width: 100, height: 60 },
        labelWidth: 70,
        labelHeight: 24,
        stageWidth: 500,
        stageHeight: 700,
      })).toEqual({ x: 80, y: 74 })
    })
  })
})
