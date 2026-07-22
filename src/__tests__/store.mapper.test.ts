/**
 * store.mapper.test.ts — 双向映射层测试
 *
 * 这是整个项目中最关键的测试文件：
 * - 所有函数都是纯函数
 * - 覆盖 15+ 种 AnnotationType 的转换
 * - 测试双向转换（往返一致性）
 */
import { describe, it, expect } from 'vitest'
import {
  storeToAnnotation,
  annotationToStore,
  storesToAnnotations,
  annotationsToStores,
} from '@/core/adapters/store.mapper'
import { AnnotationType, PdfjsAnnotationType } from '@/extensions/annotator/const/definitions'
import type { IAnnotationStore, PdfjsAnnotationSubtype } from '@/extensions/annotator/const/definitions'
import type { Annotation, AnnotationKind } from '@/core/annotation.core'

// =============================================================================
// 测试辅助函数
// =============================================================================

/** 创建基础 IAnnotationStore */
function makeStore(overrides: Partial<IAnnotationStore> = {}): IAnnotationStore {
  return {
    id: 'ann-001',
    pageNumber: 3,
    konvaString: '',
    konvaClientRect: { x: 10, y: 20, width: 100, height: 50 },
    title: 'Test Annotation',
    type: AnnotationType.HIGHLIGHT,
    color: '#ff0000',
    subtype: 'Highlight',
    pdfjsType: PdfjsAnnotationType.HIGHLIGHT,
    date: '2025-01-15T10:30:00Z',
    contentsObj: { text: 'Hello World' },
    comments: [],
    user: { id: 'u1', name: 'Alice' },
    native: false,
    ...overrides,
  }
}

/** 从 store 创建基础 Annotation（通过 storeToAnnotation） */
function makeAnnotation(store: IAnnotationStore): Annotation {
  return storeToAnnotation(store)
}

// =============================================================================
// storeToAnnotation — 正向转换
// =============================================================================
describe('storeToAnnotation', () => {
  it('应正确转换 HIGHLIGHT 类型', () => {
    const store = makeStore({ type: AnnotationType.HIGHLIGHT, subtype: 'Highlight' })
    const ann = storeToAnnotation(store)

    expect(ann.id).toBe('ann-001')
    expect(ann.kind).toBe('text-markup')
    expect(ann.target.pageIndex).toBe(2) // pageNumber - 1
    expect(ann.target.geometry.type).toBe('quad')
    expect(ann.target.coordinateSystem).toBe('pdf-user-space')
    expect(ann.payload).toEqual({
      kind: 'text-markup',
      variant: 'highlight',
      color: '#ff0000',
    })
    expect(ann.appearance!.strokeColor).toBe('#ff0000')
    expect(ann.appearance!.fillColor).toBe('rgba(255, 0, 0, 0.3)')
    expect(ann.meta!.createdAt).toBe('2025-01-15T10:30:00Z')
    expect(ann.meta!.authorId).toEqual({ id: 'u1', name: 'Alice' })
    expect(ann.meta!.isNative).toBe(false)
    expect(ann.meta!.source).toBe('inklayer')
  })

  it('应正确转换 UNDERLINE 类型', () => {
    const store = makeStore({ type: AnnotationType.UNDERLINE, subtype: 'Underline' })
    const ann = storeToAnnotation(store)

    expect(ann.kind).toBe('text-markup')
    const payload = ann.payload as any
    expect(payload.variant).toBe('underline')
  })

  it('应正确转换 STRIKEOUT 类型', () => {
    const store = makeStore({ type: AnnotationType.STRIKEOUT, subtype: 'StrikeOut' })
    const ann = storeToAnnotation(store)

    expect(ann.kind).toBe('text-markup')
    const payload = ann.payload as any
    expect(payload.variant).toBe('strikeout')
  })

  it('Squiggly 应映射到 text-markup 的 squiggly variant', () => {
    const store = makeStore({ type: AnnotationType.UNDERLINE, subtype: 'Squiggly' })
    const ann = storeToAnnotation(store)

    expect(ann.kind).toBe('text-markup')
    const payload = ann.payload as any
    expect(payload.variant).toBe('squiggly')
  })

  it('应正确转换 RECTANGLE 类型', () => {
    const store = makeStore({
      type: AnnotationType.RECTANGLE,
      subtype: 'Square',
      color: '#00ff00',
    })
    const ann = storeToAnnotation(store)

    expect(ann.kind).toBe('shape')
    expect(ann.target.geometry.type).toBe('rect')
    const payload = ann.payload as any
    expect(payload.shape).toBe('rect')
  })

  it('应正确转换 CIRCLE 类型', () => {
    const store = makeStore({ type: AnnotationType.CIRCLE, subtype: 'Circle' })
    const ann = storeToAnnotation(store)

    expect(ann.kind).toBe('shape')
    expect(ann.target.geometry.type).toBe('rect')
    const payload = ann.payload as any
    expect(payload.shape).toBe('ellipse')
  })

  it('应正确转换 CLOUD 类型', () => {
    const store = makeStore({ type: AnnotationType.CLOUD, subtype: 'PolyLine' })
    const ann = storeToAnnotation(store)

    expect(ann.kind).toBe('shape')
    expect(ann.target.geometry.type).toBe('path')
    const payload = ann.payload as any
    expect(payload.shape).toBe('cloud')
  })

  it('普通 PolyLine 不应被误判为 CLOUD', () => {
    const store = makeStore({ type: AnnotationType.RECTANGLE, subtype: 'PolyLine' })
    const ann = storeToAnnotation(store)

    expect(ann.kind).toBe('shape')
    expect((ann.payload as any).shape).toBe('polygon')
  })

  it('Cloud 往返后应保留业务语义和 Sidebar 类型', () => {
    const original = makeStore({
      type: AnnotationType.CLOUD,
      subtype: 'PolyLine',
      pdfjsType: PdfjsAnnotationType.POLYLINE,
      konvaString: '{"className":"Group","children":[{"className":"Path"}]}',
    })

    const saved = storeToAnnotation(original)
    const restored = annotationToStore(saved)

    expect(saved).toMatchObject({
      kind: 'shape',
      payload: { kind: 'shape', shape: 'cloud' },
    })
    expect(restored).toEqual(original)
    expect(restored).toMatchObject({
      type: AnnotationType.CLOUD,
      pdfjsType: PdfjsAnnotationType.POLYLINE,
      subtype: 'PolyLine',
    })
  })

  it('应兼容修复前保存的 Cloud polygon 数据', () => {
    const saved = storeToAnnotation(makeStore({
      type: AnnotationType.CLOUD,
      subtype: 'PolyLine',
      pdfjsType: PdfjsAnnotationType.POLYLINE,
    }))
    saved.payload = { kind: 'shape', shape: 'polygon' }
    const extensions = saved.extensions as {
      legacy?: { annotationType?: AnnotationType }
    }
    delete extensions.legacy?.annotationType

    expect(annotationToStore(saved)).toMatchObject({
      type: AnnotationType.CLOUD,
      pdfjsType: PdfjsAnnotationType.POLYLINE,
      subtype: 'PolyLine',
    })
  })

  it('应正确转换 FREEHAND 类型', () => {
    const store = makeStore({
      type: AnnotationType.FREEHAND,
      subtype: 'Ink',
      color: '#0000ff',
      konvaClientRect: { x: 0, y: 0, width: 200, height: 3 },
    })
    const ann = storeToAnnotation(store)

    expect(ann.kind).toBe('ink')
    expect(ann.target.geometry.type).toBe('path')
    const payload = ann.payload as any
    expect(payload.kind).toBe('ink')
    expect(payload.color).toBe('#0000ff')
    expect(payload.width).toBe(3) // konvaClientRect.height
  })

  it('应正确转换 FREE_HIGHLIGHT 类型', () => {
    const store = makeStore({
      type: AnnotationType.FREE_HIGHLIGHT,
      subtype: 'Highlight',
      color: '#ffff00',
      konvaClientRect: { x: 0, y: 0, width: 150, height: 10 },
    })
    const ann = storeToAnnotation(store)

    expect(ann.kind).toBe('ink')
    const payload = ann.payload as any
    expect(payload.width).toBe(10)
    expect(payload.color).toBe('#ffff00')
  })

  it('应正确转换 NOTE 类型', () => {
    const store = makeStore({
      type: AnnotationType.NOTE,
      subtype: 'Text',
      title: 'A note title',
      contentsObj: { text: 'Note body text' },
    })
    const ann = storeToAnnotation(store)

    expect(ann.kind).toBe('note')
    const payload = ann.payload as any
    expect(payload.kind).toBe('note')
    expect(payload.text).toBe('Note body text')
  })

  it('NOTE 无 contentsObj 时应 fallback 到 title', () => {
    const store = makeStore({
      type: AnnotationType.NOTE,
      subtype: 'Text',
      title: 'Fallback title',
      contentsObj: null,
    })
    const ann = storeToAnnotation(store)

    const payload = ann.payload as any
    expect(payload.text).toBe('Fallback title')
  })

  it('应正确转换 ARROW 类型', () => {
    const store = makeStore({
      type: AnnotationType.ARROW,
      subtype: 'Arrow',
      konvaClientRect: { x: 50, y: 50, width: 100, height: 60 },
    })
    const ann = storeToAnnotation(store)

    expect(ann.kind).toBe('line')
    expect(ann.target.geometry.type).toBe('line')
    const geom = ann.target.geometry as any
    expect(geom.start).toEqual({ x: 50, y: 50 })
    expect(geom.end).toEqual({ x: 150, y: 110 })

    const payload = ann.payload as any
    expect(payload.arrowStart).toBe(false)
    expect(payload.arrowEnd).toBe(true)
  })

  it('应正确转换 SIGNATURE 类型', () => {
    const store = makeStore({
      type: AnnotationType.SIGNATURE,
      subtype: 'Caret',
      title: '签名区域',
    })
    const ann = storeToAnnotation(store)

    expect(ann.kind).toBe('stamp')
    const payload = ann.payload as any
    expect(payload.kind).toBe('stamp')
    expect(payload.name).toBe('签名区域')
  })

  it('应正确转换 STAMP 类型', () => {
    const store = makeStore({
      type: AnnotationType.STAMP,
      subtype: 'Stamp',
      title: 'APPROVED',
    })
    const ann = storeToAnnotation(store)

    expect(ann.kind).toBe('stamp')
    const payload = ann.payload as any
    expect(payload.kind).toBe('stamp')
    expect(payload.source).toBe('custom')
  })

  it('应正确转换 FREETEXT 类型', () => {
    const store = makeStore({
      type: AnnotationType.FREETEXT,
      subtype: 'FreeText',
      contentsObj: { text: 'Free text content' },
    })
    const ann = storeToAnnotation(store)

    expect(ann.kind).toBe('note')
    const payload = ann.payload as any
    expect(payload.kind).toBe('note')
    expect(payload.text).toBe('Free text content')
  })

  it('未知 type 应 fallback 为 note', () => {
    // NONE 不在 TYPE_TO_KIND 中？实际在但是映射为 note
    const store = makeStore({ type: AnnotationType.NONE, subtype: 'None' })
    const ann = storeToAnnotation(store)

    // NONE -> note
    expect(ann.kind).toBe('note')
  })

  it('应正确转换 pageIndex（1-based → 0-based）', () => {
    const store = makeStore({ pageNumber: 1 })
    const ann = storeToAnnotation(store)
    expect(ann.target.pageIndex).toBe(0)

    const store2 = makeStore({ pageNumber: 42 })
    const ann2 = storeToAnnotation(store2)
    expect(ann2.target.pageIndex).toBe(41)
  })

  it('应保留 extensions 中的 konva 和 legacy 数据', () => {
    const store = makeStore({
      konvaString: 'serialized-konva-data',
      konvaClientRect: { x: 5, y: 10, width: 80, height: 40 },
      title: 'Legacy Title',
      contentsObj: { text: 'body', image: 'img-data' },
      comments: [{ id: 'c1', title: 'Comment', date: null, content: 'Nice!' }],
    })
    const ann = storeToAnnotation(store)

    const ext = ann.extensions as any
    expect(ext.konva.serialized).toBe('serialized-konva-data')
    expect(ext.konva.clientRect).toEqual({ x: 5, y: 10, width: 80, height: 40 })
    expect(ext.legacy.title).toBe('Legacy Title')
    expect(ext.legacy.contentsObj).toEqual({ text: 'body', image: 'img-data' })
    expect(ext.legacy.comments).toHaveLength(1)
  })

  it('native=true 时 meta 应正确标记来源', () => {
    const store = makeStore({ native: true })
    const ann = storeToAnnotation(store)

    expect(ann.meta!.isNative).toBe(true)
    expect(ann.meta!.source).toBe('pdfjs')
  })

  it('无 color 时 appearance 不应有 strokeColor/fillColor', () => {
    const store = makeStore({ color: null })
    const ann = storeToAnnotation(store)

    expect(ann.appearance!.strokeColor).toBeUndefined()
    expect(ann.appearance!.fillColor).toBeUndefined()
  })
})

// =============================================================================
// annotationToStore — 逆向转换
// =============================================================================
describe('annotationToStore', () => {
  it('应逆向转换 HIGHLIGHT Annotation', () => {
    const store = makeStore({ type: AnnotationType.HIGHLIGHT, subtype: 'Highlight' })
    const ann = storeToAnnotation(store)
    const back = annotationToStore(ann)

    expect(back.id).toBe('ann-001')
    expect(back.type).toBe(AnnotationType.HIGHLIGHT)
    expect(back.subtype).toBe('Highlight')
    expect(back.pageNumber).toBe(3) // 恢复 1-based
    expect(back.color).toBe('#ff0000')
    expect(back.native).toBe(false)
  })

  it('应逆向转换 RECTANGLE Annotation', () => {
    const store = makeStore({
      type: AnnotationType.RECTANGLE,
      subtype: 'Square',
      pdfjsType: PdfjsAnnotationType.SQUARE,
    })
    const ann = storeToAnnotation(store)
    const back = annotationToStore(ann)

    expect(back.type).toBe(AnnotationType.RECTANGLE)
    expect(back.subtype).toBe('Square')
    expect(back.pdfjsType).toBe(PdfjsAnnotationType.SQUARE)
  })

  it('应逆向转换 NOTE Annotation', () => {
    const store = makeStore({
      type: AnnotationType.NOTE,
      subtype: 'Text',
      contentsObj: { text: 'My note text' },
    })
    const ann = storeToAnnotation(store)
    const back = annotationToStore(ann)

    expect(back.type).toBe(AnnotationType.NOTE)
    expect(back.contentsObj).toEqual({ text: 'My note text' })
  })

  it('应逆向转换 ARROW Annotation', () => {
    const store = makeStore({
      type: AnnotationType.ARROW,
      subtype: 'Arrow',
      konvaClientRect: { x: 50, y: 50, width: 100, height: 60 },
    })
    const ann = storeToAnnotation(store)
    const back = annotationToStore(ann)

    expect(back.type).toBe(AnnotationType.ARROW)
    expect(back.subtype).toBe('Arrow')
  })

  it('应从 extensions.legacy 恢复 title', () => {
    const store = makeStore({ title: 'Approved Stamp', type: AnnotationType.STAMP, subtype: 'Stamp' })
    const ann = storeToAnnotation(store)
    // 修改 annotation，模拟从 storage 恢复
    ann.extensions = {
      ...ann.extensions,
      legacy: { title: 'Restored Title' },
    }
    const back = annotationToStore(ann)

    expect(back.title).toBe('Restored Title')
  })

  it('无 extensions.legacy 时应从 payload 提取 title（截断到 50 字符）', () => {
    const store = makeStore({
      type: AnnotationType.NOTE,
      subtype: 'Text',
      contentsObj: { text: 'A very long text that should be truncated to fifty characters max' },
    })
    const ann = storeToAnnotation(store)
    // 移除 extensions
    delete ann.extensions
    const back = annotationToStore(ann)

    // slice(0, 50) → 前 50 个字符
    expect(back.title).toBe('A very long text that should be truncated to fifty')
  })

  it('无 meta.authorId 时应返回 unknown 用户', () => {
    const store = makeStore({ user: { id: 'unknown', name: 'Unknown' } })
    const ann = storeToAnnotation(store)
    ann.meta = undefined
    const back = annotationToStore(ann)

    expect(back.user).toEqual({ id: 'unknown', name: 'Unknown' })
  })

  it('应正确恢复 pageNumber（0-based → 1-based）', () => {
    const store = makeStore({ pageNumber: 5 })
    const ann = storeToAnnotation(store)
    const back = annotationToStore(ann)

    expect(back.pageNumber).toBe(5)
  })

  it('应从 geometry 计算 konvaClientRect（rect geometry）', () => {
    const store = makeStore({
      type: AnnotationType.RECTANGLE,
      subtype: 'Square',
      konvaClientRect: { x: 15, y: 25, width: 120, height: 80 },
    })
    const ann = storeToAnnotation(store)
    // 移除 extensions.konva，fallback 到 geometry 计算
    delete (ann.extensions as any)?.konva
    const back = annotationToStore(ann)

    expect(back.konvaClientRect).toEqual({ x: 15, y: 25, width: 120, height: 80 })
  })
})

// =============================================================================
// 往返转换一致性测试（Round-trip）
//
// extensions 会保留精确的旧系统类型，所有已知类型都应无损往返。
// =============================================================================
describe('往返转换一致性', () => {
  const roundTripTypes: Array<{
    name: string
    type: AnnotationType
    subtype: PdfjsAnnotationSubtype
    expectedBackType?: AnnotationType
    expectedBackSubtype?: PdfjsAnnotationSubtype
  }> = [
    { name: 'HIGHLIGHT', type: AnnotationType.HIGHLIGHT, subtype: 'Highlight' },
    { name: 'UNDERLINE', type: AnnotationType.UNDERLINE, subtype: 'Underline' },
    { name: 'STRIKEOUT', type: AnnotationType.STRIKEOUT, subtype: 'StrikeOut' },
    { name: 'RECTANGLE', type: AnnotationType.RECTANGLE, subtype: 'Square' },
    { name: 'CIRCLE', type: AnnotationType.CIRCLE, subtype: 'Circle' },
    { name: 'NOTE', type: AnnotationType.NOTE, subtype: 'Text' },
    { name: 'ARROW', type: AnnotationType.ARROW, subtype: 'Arrow' },
    { name: 'FREEHAND', type: AnnotationType.FREEHAND, subtype: 'Ink' },
    { name: 'SIGNATURE', type: AnnotationType.SIGNATURE, subtype: 'Caret' },
    { name: 'STAMP', type: AnnotationType.STAMP, subtype: 'Stamp' },
    { name: 'CLOUD', type: AnnotationType.CLOUD, subtype: 'PolyLine' },
  ]

  it.each(roundTripTypes)('$name: store → annotation → store id/pageNumber 应保持一致', ({ type, subtype, expectedBackType, expectedBackSubtype }) => {
    const original = makeStore({ type, subtype })
    const ann = storeToAnnotation(original)
    const back = annotationToStore(ann)

    expect(back.id).toBe(original.id)
    expect(back.pageNumber).toBe(original.pageNumber)
    expect(back.type).toBe(expectedBackType ?? original.type)
    expect(back.subtype).toBe(expectedBackSubtype ?? original.subtype)
  })

  it('应在往返转换中保留回复作者身份', () => {
    const original = makeStore({
      comments: [{
        id: 'comment-1',
        title: 'Alice',
        date: '2026-07-19T00:00:00Z',
        content: 'Please review this.',
        user: { id: 'user-alice', name: 'Alice' },
      }],
    })

    const restored = annotationToStore(storeToAnnotation(original))

    expect(restored.comments).toEqual(original.comments)
  })

  it('应兼容没有稳定作者身份的旧回复', () => {
    const original = makeStore({
      comments: [{
        id: 'legacy-comment',
        title: 'Legacy reviewer',
        date: null,
        content: 'No stable author id.',
      }],
    })

    const restored = annotationToStore(storeToAnnotation(original))

    expect(restored.comments).toEqual(original.comments)
    expect(restored.comments[0].user).toBeUndefined()
  })
})

// =============================================================================
// storesToAnnotations / annotationsToStores — 批量转换
// =============================================================================
describe('批量转换', () => {
  it('storesToAnnotations 应转换数组', () => {
    const stores = [
      makeStore({ id: 'a1', type: AnnotationType.HIGHLIGHT, subtype: 'Highlight' }),
      makeStore({ id: 'a2', type: AnnotationType.RECTANGLE, subtype: 'Square' }),
    ]
    const anns = storesToAnnotations(stores)

    expect(anns).toHaveLength(2)
    expect(anns[0].id).toBe('a1')
    expect(anns[0].kind).toBe('text-markup')
    expect(anns[1].id).toBe('a2')
    expect(anns[1].kind).toBe('shape')
  })

  it('annotationsToStores 应转换数组', () => {
    const stores = [
      makeStore({ id: 'a1', type: AnnotationType.NOTE, subtype: 'Text' }),
      makeStore({ id: 'a2', type: AnnotationType.CLOUD, subtype: 'PolyLine' }),
    ]
    const anns = storesToAnnotations(stores)
    const back = annotationsToStores(anns)

    expect(back).toHaveLength(2)
    expect(back[0].id).toBe('a1')
    expect(back[1].id).toBe('a2')
  })

  it('空数组不应报错', () => {
    expect(storesToAnnotations([])).toEqual([])
    expect(annotationsToStores([])).toEqual([])
  })
})

// =============================================================================
// Geometry 提取测试
// =============================================================================
describe('Geometry 提取', () => {
  it('RECTANGLE 应生成 rect geometry', () => {
    const store = makeStore({
      type: AnnotationType.RECTANGLE,
      konvaClientRect: { x: 10, y: 20, width: 100, height: 50 },
    })
    const ann = storeToAnnotation(store)
    const geo = ann.target.geometry as any

    expect(geo.type).toBe('rect')
    expect(geo.rect).toEqual({ x: 10, y: 20, width: 100, height: 50 })
  })

  it('HIGHLIGHT 应生成 quad geometry', () => {
    const store = makeStore({
      type: AnnotationType.HIGHLIGHT,
      konvaClientRect: { x: 10, y: 20, width: 100, height: 50 },
    })
    const ann = storeToAnnotation(store)
    const geo = ann.target.geometry as any

    expect(geo.type).toBe('quad')
    expect(geo.quads).toHaveLength(1)
    expect(geo.quads[0].p1).toEqual({ x: 10, y: 20 })
    expect(geo.quads[0].p4).toEqual({ x: 110, y: 70 })
  })

  it('ARROW 应生成 line geometry', () => {
    const store = makeStore({
      type: AnnotationType.ARROW,
      konvaClientRect: { x: 10, y: 20, width: 100, height: 50 },
    })
    const ann = storeToAnnotation(store)
    const geo = ann.target.geometry as any

    expect(geo.type).toBe('line')
    expect(geo.start).toEqual({ x: 10, y: 20 })
    expect(geo.end).toEqual({ x: 110, y: 70 })
  })

  it('FREEHAND 应生成 path geometry', () => {
    const store = makeStore({
      type: AnnotationType.FREEHAND,
      konvaClientRect: { x: 10, y: 20, width: 100, height: 50 },
    })
    const ann = storeToAnnotation(store)
    const geo = ann.target.geometry as any

    expect(geo.type).toBe('path')
    expect(geo.points).toHaveLength(4)
    expect(geo.closed).toBe(true)
  })

  it('CLOUD 应生成 path geometry', () => {
    const store = makeStore({
      type: AnnotationType.CLOUD,
      konvaClientRect: { x: 10, y: 20, width: 100, height: 50 },
    })
    const ann = storeToAnnotation(store)
    const geo = ann.target.geometry as any

    expect(geo.type).toBe('path')
  })
})

// =============================================================================
// adjustOpacity 逻辑测试（通过 storeToAnnotation 验证）
// =============================================================================
describe('颜色透明度', () => {
  it('hex 颜色应转换为 rgba', () => {
    const store = makeStore({ color: '#ff0000' })
    const ann = storeToAnnotation(store)

    expect(ann.appearance!.fillColor).toBe('rgba(255, 0, 0, 0.3)')
    expect(ann.appearance!.strokeColor).toBe('#ff0000')
  })

  it('已是 rgba 颜色应保持不变', () => {
    const store = makeStore({ color: 'rgba(128, 128, 128, 0.5)' })
    const ann = storeToAnnotation(store)

    expect(ann.appearance!.fillColor).toBe('rgba(128, 128, 128, 0.5)')
  })

  it('无颜色时不应生成 fillColor', () => {
    const store = makeStore({ color: null })
    const ann = storeToAnnotation(store)

    expect(ann.appearance!.fillColor).toBeUndefined()
  })
})
