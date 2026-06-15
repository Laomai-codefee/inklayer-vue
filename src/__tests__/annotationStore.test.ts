/**
 * annotationStore.test.ts — Pinia Store 单元测试
 *
 * 测试批注 Store 的增删改查和选中管理
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnnotationStore, SelectionSource } from '@/stores/annotationStore'
import { AnnotationType, PdfjsAnnotationType } from '@/extensions/annotator/const/definitions'
import type { IAnnotationStore } from '@/extensions/annotator/const/definitions'

/** 创建测试用 IAnnotationStore */
function makeStore(id: string, overrides: Partial<IAnnotationStore> = {}): IAnnotationStore {
  return {
    id,
    pageNumber: 1,
    konvaString: '',
    konvaClientRect: { x: 0, y: 0, width: 100, height: 50 },
    title: `Annotation ${id}`,
    type: AnnotationType.HIGHLIGHT,
    color: '#ff0000',
    subtype: 'Highlight',
    pdfjsType: PdfjsAnnotationType.HIGHLIGHT,
    date: null,
    contentsObj: null,
    comments: [],
    user: { id: 'u1', name: 'Test' },
    native: false,
    ...overrides,
  }
}

describe('useAnnotationStore', () => {
  beforeEach(() => {
    // 创建新的 Pinia 实例并激活，确保测试隔离
    setActivePinia(createPinia())
  })

  describe('addAnnotation', () => {
    it('应添加批注到 store', () => {
      const store = useAnnotationStore()
      const ann = makeStore('ann-1')

      const result = store.addAnnotation(ann)
      expect(result).toBe(ann)
      // annotations 用 ref 包装，Map 内部对象被 reactive 代理，需 deep equal
      expect(store.annotations.get('ann-1')).toEqual(ann)
    })

    it('应返回添加的 annotation', () => {
      const annStore = useAnnotationStore()
      const ann = makeStore('ann-x')
      const result = annStore.addAnnotation(ann)

      expect(result.id).toBe('ann-x')
    })

    it('isOriginal=true 时应同时添加到 originalAnnotations', () => {
      const annStore = useAnnotationStore()
      const ann = makeStore('ann-1')

      annStore.addAnnotation(ann, true)
      expect(annStore.originalAnnotations.get('ann-1')).toEqual(ann)
    })

    it('isOriginal=false 时不应修改 originalAnnotations', () => {
      const annStore = useAnnotationStore()
      const ann = makeStore('ann-1')

      annStore.addAnnotation(ann, false)
      expect(annStore.originalAnnotations.size).toBe(0)
    })

    it('多次添加应覆盖同 ID', () => {
      const annStore = useAnnotationStore()
      const ann1 = makeStore('ann-1', { title: 'First' })
      const ann2 = makeStore('ann-1', { title: 'Second' })

      annStore.addAnnotation(ann1)
      annStore.addAnnotation(ann2)

      expect(annStore.annotations.get('ann-1')!.title).toBe('Second')
      expect(annStore.annotations.size).toBe(1)
    })
  })

  describe('updateAnnotation', () => {
    it('应更新已存在的 annotation', () => {
      const annStore = useAnnotationStore()
      annStore.addAnnotation(makeStore('ann-1', { title: 'Original' }))

      const updated = annStore.updateAnnotation('ann-1', { title: 'Updated' })
      expect(updated!.title).toBe('Updated')
      expect(annStore.annotations.get('ann-1')!.title).toBe('Updated')
    })

    it('不存在的 ID 应返回 null', () => {
      const annStore = useAnnotationStore()
      const result = annStore.updateAnnotation('nonexistent', { title: 'X' })
      expect(result).toBeNull()
    })

    it('更新选中的 annotation 应同步更新 selected', () => {
      const annStore = useAnnotationStore()
      const ann = makeStore('ann-1', { title: 'Original' })
      annStore.addAnnotation(ann)
      annStore.setSelectedAnnotation(ann)

      annStore.updateAnnotation('ann-1', { title: 'Updated' })

      expect(annStore.selectedAnnotationStore!.title).toBe('Updated')
    })
  })

  describe('removeAnnotation', () => {
    it('应移除已存在的 annotation', () => {
      const annStore = useAnnotationStore()
      annStore.addAnnotation(makeStore('ann-1'))

      annStore.removeAnnotation('ann-1')
      expect(annStore.annotations.has('ann-1')).toBe(false)
    })

    it('移除选中的 annotation 应清除选中状态', () => {
      const annStore = useAnnotationStore()
      const ann = makeStore('ann-1')
      annStore.addAnnotation(ann)
      annStore.setSelectedAnnotation(ann)

      annStore.removeAnnotation('ann-1')
      expect(annStore.selectedAnnotation).toBeNull()
    })

    it('移除不存在的 ID 不应报错', () => {
      const annStore = useAnnotationStore()
      expect(() => annStore.removeAnnotation('nonexistent')).not.toThrow()
    })
  })

  describe('clearAnnotations', () => {
    it('应清空所有 annotations', () => {
      const annStore = useAnnotationStore()
      annStore.addAnnotation(makeStore('ann-1'))
      annStore.addAnnotation(makeStore('ann-2'))
      annStore.addAnnotation(makeStore('ann-3'))

      annStore.clearAnnotations()

      expect(annStore.annotations.size).toBe(0)
      expect(annStore.annotationList).toHaveLength(0)
    })

    it('应清空 originalAnnotations', () => {
      const annStore = useAnnotationStore()
      annStore.addAnnotation(makeStore('ann-1'), true)
      annStore.addAnnotation(makeStore('ann-2'), true)

      annStore.clearAnnotations()
      expect(annStore.originalAnnotations.size).toBe(0)
    })

    it('应清除选中状态', () => {
      const annStore = useAnnotationStore()
      const ann = makeStore('ann-1')
      annStore.addAnnotation(ann)
      annStore.setSelectedAnnotation(ann)

      annStore.clearAnnotations()
      expect(annStore.selectedAnnotation).toBeNull()
    })
  })

  describe('getAnnotation', () => {
    it('应返回已存在的 annotation', () => {
      const annStore = useAnnotationStore()
      const ann = makeStore('ann-1')
      annStore.addAnnotation(ann)

      expect(annStore.getAnnotation('ann-1')).toEqual(ann)
    })

    it('不存在的 ID 返回 undefined', () => {
      const annStore = useAnnotationStore()
      expect(annStore.getAnnotation('nonexistent')).toBeUndefined()
    })
  })

  describe('getByPage', () => {
    it('应按页码筛选', () => {
      const annStore = useAnnotationStore()
      annStore.addAnnotation(makeStore('ann-1', { pageNumber: 1 }))
      annStore.addAnnotation(makeStore('ann-2', { pageNumber: 1 }))
      annStore.addAnnotation(makeStore('ann-3', { pageNumber: 2 }))

      const page1 = annStore.getByPage(1)
      expect(page1).toHaveLength(2)
      expect(page1.map(a => a.id)).toEqual(['ann-1', 'ann-2'])

      const page2 = annStore.getByPage(2)
      expect(page2).toHaveLength(1)
      expect(page2[0].id).toBe('ann-3')

      const page3 = annStore.getByPage(3)
      expect(page3).toHaveLength(0)
    })
  })

  describe('annotationList', () => {
    it('应返回数组形式的 annotations', () => {
      const annStore = useAnnotationStore()
      annStore.addAnnotation(makeStore('ann-1'))
      annStore.addAnnotation(makeStore('ann-2'))

      expect(annStore.annotationList).toHaveLength(2)
      expect(Array.isArray(annStore.annotationList)).toBe(true)
    })

    it('空 store 应返回空数组', () => {
      const annStore = useAnnotationStore()
      expect(annStore.annotationList).toEqual([])
    })
  })

  describe('selectedAnnotation / selectedAnnotationStore', () => {
    it('应设置选中的 annotation', () => {
      const annStore = useAnnotationStore()
      const ann = makeStore('ann-1')
      annStore.addAnnotation(ann)
      annStore.setSelectedAnnotation(ann, SelectionSource.SIDEBAR)

      expect(annStore.selectedAnnotation!.store).toEqual(ann)
      expect(annStore.selectedAnnotation!.source).toBe(SelectionSource.SIDEBAR)
      expect(annStore.selectedAnnotationStore).toEqual(ann)
    })

    it('clearSelectedAnnotation 应清除选中', () => {
      const annStore = useAnnotationStore()
      const ann = makeStore('ann-1')
      annStore.addAnnotation(ann)
      annStore.setSelectedAnnotation(ann)

      annStore.clearSelectedAnnotation()
      expect(annStore.selectedAnnotation).toBeNull()
      expect(annStore.selectedAnnotationStore).toBeNull()
    })

    it('setSelectedAnnotation(null) 应将 store 置为 null（source 保留 null）', () => {
      const annStore = useAnnotationStore()
      const ann = makeStore('ann-1')
      annStore.addAnnotation(ann)
      annStore.setSelectedAnnotation(ann)

      annStore.setSelectedAnnotation(null)
      // setSelectedAnnotation(null) 设置 { store: null, source: null } 而非 null
      expect(annStore.selectedAnnotation!.store).toBeNull()
      expect(annStore.selectedAnnotation!.source).toBeNull()
    })

    it('clearSelectedAnnotation 应整体置为 null', () => {
      const annStore = useAnnotationStore()
      const ann = makeStore('ann-1')
      annStore.addAnnotation(ann)
      annStore.setSelectedAnnotation(ann)

      annStore.clearSelectedAnnotation()
      expect(annStore.selectedAnnotation).toBeNull()
    })
  })

  describe('currentAnnotationType', () => {
    it('应设置当前 annotation 类型', () => {
      const annStore = useAnnotationStore()
      expect(annStore.currentAnnotationType).toBeNull()

      annStore.setCurrentAnnotationType({ name: 'highlight', type: AnnotationType.HIGHLIGHT } as any)
      expect(annStore.currentAnnotationType).not.toBeNull()

      annStore.setCurrentAnnotationType(null)
      expect(annStore.currentAnnotationType).toBeNull()
    })
  })

  describe('dataTransfer', () => {
    it('应设置数据传输值', () => {
      const annStore = useAnnotationStore()
      annStore.setDataTransfer('test-data')
      expect(annStore.dataTransfer).toBe('test-data')

      annStore.setDataTransfer(null)
      expect(annStore.dataTransfer).toBeNull()
    })
  })

  describe('painter', () => {
    it('应设置和获取 painter', () => {
      const annStore = useAnnotationStore()
      const mockPainter = { getData: () => [] } as any

      annStore.setPainter(mockPainter)
      expect(annStore.getPainter()).toBe(mockPainter)
      expect(annStore.painter).toBe(mockPainter)

      annStore.setPainter(null)
      expect(annStore.getPainter()).toBeNull()
      expect(annStore.painter).toBeNull()
    })
  })
})
