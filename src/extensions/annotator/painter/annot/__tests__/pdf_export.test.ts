import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
    PDFArray,
    PDFDict,
    PDFDocument,
    PDFHexString,
    PDFName,
    PDFNumber,
    PDFString
} from 'pdf-lib'
import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'
import { describe, expect, it, vi } from 'vitest'

import {
    AnnotationType,
    PdfjsAnnotationType,
    type IAnnotationStore
} from '../../../const/definitions'
import { buildAnnotatedPdf } from '..'
import { generateCloudPathData } from '../../cloud_path'
import { Transform } from '../../transform/transform'

vi.mock('../../../utils/utils', () => ({
    convertKonvaRectToPdfRect: (
        rect: { x: number; y: number; width: number; height: number },
        pageView: ReturnType<typeof createPageView>
    ) => {
        const scale = pageView.viewport.scale
        const [x1, y1] = pageView.viewport.convertToPdfPoint(rect.x * scale, rect.y * scale)
        const [x2, y2] = pageView.viewport.convertToPdfPoint(
            (rect.x + rect.width) * scale,
            (rect.y + rect.height) * scale
        )
        return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)]
    },
    rgbToPdfColor: (color: string) => {
        const value = color.startsWith('#') ? color.slice(1) : '000000'
        return [0, 2, 4].map(offset => parseInt(value.slice(offset, offset + 2), 16) / 255)
    },
    convertToRGB: () => '#ff0000',
    stringToPDFHexString: (value: string) => PDFHexString.fromText(value),
    formatPDFDate: (value: string) => value,
    getPDFDateTimestamp: () => 0,
    getTimestampString: () => 'test'
}))

const PAGE_WIDTH = 600
const PAGE_HEIGHT = 800
const CLOUD_PATH = generateCloudPathData([
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 180 },
    { x: 100, y: 180 },
    { x: 100, y: 100 }
])

function createPageView(scale = 1) {
    return {
        viewport: {
            scale,
            width: PAGE_WIDTH * scale,
            height: PAGE_HEIGHT * scale,
            convertToPdfPoint: (x: number, y: number) => [x / scale, PAGE_HEIGHT - y / scale]
        }
    }
}

function createViewer(pdfData: Uint8Array, scale = 1): PDFViewer {
    return {
        pdfDocument: { getData: async () => pdfData },
        getPageView: () => createPageView(scale)
    } as unknown as PDFViewer
}

function createAnnotation(overrides: Partial<IAnnotationStore> = {}): IAnnotationStore {
    return {
        id: 'annotation-1',
        pageNumber: 1,
        type: AnnotationType.RECTANGLE,
        pdfjsType: PdfjsAnnotationType.SQUARE,
        subtype: 'Square',
        title: 'Alice',
        date: null,
        user: { id: 'alice', name: 'Alice' },
        comments: [],
        color: '#ff0000',
        konvaString: JSON.stringify({
            className: 'Group',
            attrs: {},
            children: [{ className: 'Rect', attrs: { x: 100, y: 100, width: 80, height: 40, strokeWidth: 2 } }]
        }),
        konvaClientRect: { x: 100, y: 100, width: 80, height: 40 },
        native: false,
        ...overrides
    }
}

async function createBlankPdf(): Promise<Uint8Array> {
    const document = await PDFDocument.create()
    document.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    return document.save()
}

function getAnnotationDictionaries(document: PDFDocument): PDFDict[] {
    const annotations = document.getPage(0).node.lookup(PDFName.of('Annots'), PDFArray)
    return annotations.asArray().map(reference => document.context.lookup(reference, PDFDict))
}

function getNumberArray(dictionary: PDFDict, key: string): number[] {
    const array = dictionary.lookup(PDFName.of(key), PDFArray)
    return array.asArray().map(item => (item as PDFNumber).asNumber())
}

function getNestedNumberArray(dictionary: PDFDict, key: string): number[] {
    const arrays = dictionary.lookup(PDFName.of(key), PDFArray)
    return arrays.lookup(0, PDFArray).asArray().map(item => (item as PDFNumber).asNumber())
}

function getPpmPixels(data: Buffer): { width: number; height: number; pixels: Buffer } {
    let offset = 0
    const tokens: string[] = []
    while (tokens.length < 4) {
        while (offset < data.length && /\s/.test(String.fromCharCode(data[offset]))) offset++
        if (data[offset] === 35) {
            while (offset < data.length && data[offset] !== 10) offset++
            continue
        }
        const start = offset
        while (offset < data.length && !/\s/.test(String.fromCharCode(data[offset]))) offset++
        tokens.push(data.subarray(start, offset).toString('ascii'))
    }
    while (offset < data.length && /\s/.test(String.fromCharCode(data[offset]))) offset++
    if (tokens[0] !== 'P6' || tokens[3] !== '255') throw new Error('Unexpected Poppler PPM output.')
    return { width: Number(tokens[1]), height: Number(tokens[2]), pixels: data.subarray(offset) }
}

function getRedPixelBounds(data: Buffer) {
    const { width, height, pixels } = getPpmPixels(data)
    const redPixels: Array<{ x: number; y: number }> = []
    for (let index = 0; index < pixels.length; index += 3) {
        if (pixels[index] > 150 && pixels[index + 1] < 120 && pixels[index + 2] < 120) {
            const pixel = index / 3
            redPixels.push({ x: pixel % width, y: Math.floor(pixel / width) })
        }
    }
    const xs = redPixels.map(pixel => pixel.x)
    const ys = redPixels.map(pixel => pixel.y)
    return {
        width,
        height,
        count: redPixels.length,
        bounds: {
            left: Math.min(...xs),
            top: Math.min(...ys),
            right: Math.max(...xs),
            bottom: Math.max(...ys)
        }
    }
}

describe('PDF annotation export', () => {
    it('preserves annotations that InkLayer does not replace', async () => {
        const source = await PDFDocument.create()
        const page = source.addPage([PAGE_WIDTH, PAGE_HEIGHT])
        const link = source.context.register(source.context.obj({
            Type: PDFName.of('Annot'),
            Subtype: PDFName.of('Link'),
            Rect: [20, 20, 120, 40]
        }))
        const oldSquare = source.context.register(source.context.obj({
            Type: PDFName.of('Annot'),
            Subtype: PDFName.of('Square'),
            Rect: [10, 10, 30, 30],
            NM: PDFString.of('old-square')
        }))
        page.node.set(PDFName.of('Annots'), source.context.obj([link, oldSquare]))

        const result = await buildAnnotatedPdf(createViewer(await source.save()), [createAnnotation()])
        const exported = await PDFDocument.load(result)
        const subtypes = getAnnotationDictionaries(exported).map(annotation =>
            annotation.lookup(PDFName.of('Subtype'), PDFName).toString()
        )

        expect(subtypes).toEqual(['/Link', '/Square'])
    })

    it.each([
        ['Highlight', AnnotationType.HIGHLIGHT, PdfjsAnnotationType.HIGHLIGHT, 'Highlight'],
        ['Underline', AnnotationType.UNDERLINE, PdfjsAnnotationType.UNDERLINE, 'Underline'],
        ['StrikeOut', AnnotationType.STRIKEOUT, PdfjsAnnotationType.STRIKEOUT, 'StrikeOut']
    ] as const)('applies group transforms to %s QuadPoints', async (expectedSubtype, type, pdfjsType, subtype) => {
        const annotation = createAnnotation({
            type,
            pdfjsType,
            subtype,
            konvaString: JSON.stringify({
                className: 'Group',
                attrs: { x: 20, y: 30, scaleX: 2, scaleY: 1.5 },
                children: [{ className: 'Rect', attrs: { x: 10, y: 20, width: 30, height: 10 } }]
            }),
            konvaClientRect: { x: 40, y: 60, width: 60, height: 15 }
        })

        const result = await buildAnnotatedPdf(createViewer(await createBlankPdf(), 2), [annotation])
        const [textMarkup] = getAnnotationDictionaries(await PDFDocument.load(result))

        expect(textMarkup.lookup(PDFName.of('Subtype'), PDFName).toString()).toBe(`/${expectedSubtype}`)
        expect(getNumberArray(textMarkup, 'QuadPoints')).toEqual([
            40, 740, 100, 740, 40, 725, 100, 725
        ])
    })

    it('exports Cloud as a fidelity-preserving Ink path', async () => {
        const annotation = createAnnotation({
            type: AnnotationType.CLOUD,
            pdfjsType: PdfjsAnnotationType.POLYLINE,
            subtype: 'PolyLine',
            konvaString: JSON.stringify({
                className: 'Group',
                attrs: { x: 20, y: 30, scaleX: 2, scaleY: 1.5 },
                children: [{
                    className: 'Path',
                    attrs: { data: CLOUD_PATH, stroke: '#ff0000', strokeWidth: 2, opacity: 0.75 }
                }]
            }),
            konvaClientRect: { x: 190, y: 157.5, width: 260, height: 165 }
        })

        const result = await buildAnnotatedPdf(createViewer(await createBlankPdf()), [annotation])
        const [cloud] = getAnnotationDictionaries(await PDFDocument.load(result))
        const inkPoints = getNestedNumberArray(cloud, 'InkList')

        expect(cloud.lookup(PDFName.of('Subtype'), PDFName).toString()).toBe('/Ink')
        expect(cloud.lookup(PDFName.of('InkLayerType'), PDFName).toString()).toBe('/Cloud')
        expect(inkPoints.slice(0, 2)).toEqual([220, 620])
        expect(inkPoints.length).toBeGreaterThan(80)
        expect(cloud.lookup(PDFName.of('CA'), PDFNumber).asNumber()).toBe(0.75)
    })

    it('exports FreeText as a bounded Text icon with Unicode metadata', async () => {
        const annotation = createAnnotation({
            type: AnnotationType.FREETEXT,
            pdfjsType: PdfjsAnnotationType.FREETEXT,
            subtype: 'FreeText',
            contentsObj: { text: '中文批注' },
            konvaString: JSON.stringify({
                className: 'Group', attrs: {},
                children: [{ className: 'Text', attrs: { fontSize: 18, opacity: 0.6 } }]
            }),
            konvaClientRect: { x: 100, y: 100, width: 160, height: 30 }
        })

        const result = await buildAnnotatedPdf(createViewer(await createBlankPdf()), [annotation])
        const [text] = getAnnotationDictionaries(await PDFDocument.load(result))

        expect(text.lookup(PDFName.of('Subtype'), PDFName).toString()).toBe('/Text')
        expect(text.lookup(PDFName.of('InkLayerType'), PDFName).toString()).toBe('/FreeText')
        expect(getNumberArray(text, 'Rect')).toEqual([100, 680, 120, 700])
        expect(text.lookup(PDFName.of('InkLayerFontSize'), PDFNumber).asNumber()).toBe(18)
        expect(text.lookup(PDFName.of('InkLayerTextWidth'), PDFNumber).asNumber()).toBe(160)
        expect(text.lookup(PDFName.of('CA'), PDFNumber).asNumber()).toBe(0.6)
        expect(text.lookup(PDFName.of('Contents'), PDFHexString).decodeText()).toBe('中文批注')
    })

    it('intentionally exports Arrow as Ink with a scaled arrowhead', async () => {
        const annotation = createAnnotation({
            type: AnnotationType.ARROW,
            pdfjsType: PdfjsAnnotationType.LINE,
            subtype: 'Arrow',
            konvaString: JSON.stringify({
                className: 'Group',
                attrs: { x: 20, y: 30, scaleX: 2, scaleY: 1.5 },
                children: [{
                    className: 'Arrow',
                    attrs: {
                        points: [10, 20, 40, 50],
                        stroke: '#ff0000',
                        strokeWidth: 2,
                        pointerLength: 10,
                        pointerWidth: 10
                    }
                }]
            }),
            konvaClientRect: { x: 40, y: 60, width: 60, height: 45 }
        })

        const result = await buildAnnotatedPdf(createViewer(await createBlankPdf(), 2), [annotation])
        const [arrow] = getAnnotationDictionaries(await PDFDocument.load(result))
        const inkPoints = getNestedNumberArray(arrow, 'InkList')
        const headLeft = { x: inkPoints[6], y: inkPoints[7] }
        const headRight = { x: inkPoints[8], y: inkPoints[9] }

        expect(arrow.lookup(PDFName.of('Subtype'), PDFName).toString()).toBe('/Ink')
        expect(arrow.lookup(PDFName.of('InkLayerType'), PDFName).toString()).toBe('/Arrow')
        expect(arrow.has(PDFName.of('LE'))).toBe(false)
        expect(inkPoints.slice(0, 4)).toEqual([40, 740, 100, 695])
        expect(Math.hypot(headRight.x - headLeft.x, headRight.y - headLeft.y)).toBeCloseTo(17.68, 2)
    })

    it('restores marked Cloud, FreeText and Arrow annotations to their business types', async () => {
        const cloud = createAnnotation({
            id: 'cloud',
            type: AnnotationType.CLOUD,
            pdfjsType: PdfjsAnnotationType.POLYLINE,
            subtype: 'PolyLine',
            konvaString: JSON.stringify({
                className: 'Group', attrs: {},
                children: [{ className: 'Path', attrs: { data: CLOUD_PATH, stroke: '#ff0000', strokeWidth: 2 } }]
            }),
            konvaClientRect: { x: 85, y: 85, width: 130, height: 110 }
        })
        const freeText = createAnnotation({
            id: 'free-text',
            type: AnnotationType.FREETEXT,
            pdfjsType: PdfjsAnnotationType.FREETEXT,
            subtype: 'FreeText',
            contentsObj: { text: '中文批注' },
            konvaString: JSON.stringify({
                className: 'Group', attrs: {},
                children: [{ className: 'Text', attrs: { fontSize: 18, opacity: 0.6 } }]
            }),
            konvaClientRect: { x: 100, y: 100, width: 160, height: 30 }
        })
        const arrow = createAnnotation({
            id: 'arrow',
            type: AnnotationType.ARROW,
            pdfjsType: PdfjsAnnotationType.LINE,
            subtype: 'Arrow',
            konvaString: JSON.stringify({
                className: 'Group', attrs: {},
                children: [{
                    className: 'Arrow',
                    attrs: {
                        points: [100, 100, 200, 100], stroke: '#ff0000', strokeWidth: 2,
                        pointerLength: 20, pointerWidth: 30, opacity: 0.65
                    }
                }]
            }),
            konvaClientRect: { x: 95, y: 80, width: 110, height: 40 }
        })
        const exportedData = await buildAnnotatedPdf(
            createViewer(await createBlankPdf()),
            [cloud, freeText, arrow]
        )
        const dictionaries = getAnnotationDictionaries(await PDFDocument.load(exportedData))
        const toVertices = (numbers: number[]) => Array.from(
            { length: numbers.length / 2 },
            (_, index) => ({ x: numbers[index * 2], y: numbers[index * 2 + 1] })
        )
        const pdfjsAnnotations = [{
            annotationType: PdfjsAnnotationType.INK,
            id: cloud.id,
            pageNumber: 1,
            pageViewer: createPageView(),
            color: new Uint8ClampedArray([255, 0, 0]),
            borderStyle: { width: 2 },
            inkLists: [toVertices(getNestedNumberArray(dictionaries[0], 'InkList'))],
            titleObj: { str: 'Alice' }, contentsObj: { str: '' }, modificationDate: null, subtype: 'Ink'
        }, {
            annotationType: PdfjsAnnotationType.TEXT,
            id: freeText.id,
            pageNumber: 1,
            pageViewer: createPageView(),
            rect: getNumberArray(dictionaries[1], 'Rect'),
            color: new Uint8ClampedArray([255, 0, 0]),
            borderStyle: { width: 0 },
            titleObj: { str: 'Alice' }, contentsObj: { str: '中文批注' }, modificationDate: null, subtype: 'Text'
        }, {
            annotationType: PdfjsAnnotationType.INK,
            id: arrow.id,
            pageNumber: 1,
            pageViewer: createPageView(),
            rect: getNumberArray(dictionaries[2], 'Rect'),
            color: new Uint8ClampedArray([255, 0, 0]),
            borderStyle: { width: 2 },
            inkLists: [toVertices(getNestedNumberArray(dictionaries[2], 'InkList'))],
            titleObj: { str: 'Alice' }, contentsObj: { str: '' }, modificationDate: null, subtype: 'Ink'
        }]
        const setValue = vi.fn()
        const viewer = {
            pdfDocument: {
                numPages: 1,
                getData: async () => exportedData,
                getPage: async () => ({ getAnnotations: async () => pdfjsAnnotations }),
                annotationStorage: { setValue }
            },
            getPageView: () => createPageView()
        } as unknown as PDFViewer

        const stores = await new Transform(viewer).decodePdfAnnotation()
        expect(stores.get(cloud.id)).toMatchObject({ type: AnnotationType.CLOUD, subtype: 'PolyLine' })
        expect(stores.get(freeText.id)).toMatchObject({
            type: AnnotationType.FREETEXT,
            pdfjsType: PdfjsAnnotationType.FREETEXT,
            subtype: 'FreeText'
        })
        expect(stores.get(arrow.id)).toMatchObject({
            type: AnnotationType.ARROW,
            pdfjsType: PdfjsAnnotationType.LINE,
            subtype: 'Arrow'
        })
        expect(JSON.parse(stores.get(freeText.id)!.konvaString).children[0].attrs).toMatchObject({
            text: '中文批注', fontSize: 18, width: 160, opacity: 0.6
        })
        expect(JSON.parse(stores.get(arrow.id)!.konvaString).children[0].attrs).toMatchObject({
            pointerLength: 20, pointerWidth: 30, opacity: 0.65
        })
        expect(setValue).toHaveBeenCalledTimes(3)
    })

    it('fails before export when an annotation references a missing page', async () => {
        await expect(buildAnnotatedPdf(
            createViewer(await createBlankPdf()),
            [createAnnotation({ pageNumber: 2 })]
        )).rejects.toThrow('references missing page 2')
    })

    const visualTest = spawnSync('pdftoppm', ['-v']).status === 0 ? it : it.skip

    visualTest('renders the curved Cloud path with Poppler', async () => {
        const annotation = createAnnotation({
            type: AnnotationType.CLOUD,
            pdfjsType: PdfjsAnnotationType.POLYLINE,
            subtype: 'PolyLine',
            konvaString: JSON.stringify({
                className: 'Group', attrs: {},
                children: [{
                    className: 'Path',
                    attrs: { data: CLOUD_PATH, stroke: '#ff0000', strokeWidth: 2, opacity: 1 }
                }]
            }),
            konvaClientRect: { x: 85, y: 85, width: 130, height: 110 }
        })
        const exportedData = await buildAnnotatedPdf(createViewer(await createBlankPdf()), [annotation])
        const directory = mkdtempSync(join(tmpdir(), 'inklayer-vue-cloud-'))
        try {
            const input = join(directory, 'cloud.pdf')
            const output = join(directory, 'cloud')
            writeFileSync(input, exportedData)
            execFileSync('pdftoppm', ['-r', '72', '-f', '1', '-singlefile', input, output], { timeout: 5000 })
            const { width, height, count, bounds } = getRedPixelBounds(readFileSync(`${output}.ppm`))

            expect({ width, height }).toEqual({ width: PAGE_WIDTH, height: PAGE_HEIGHT })
            expect(count).toBeGreaterThan(100)
            expect(bounds.left).toBeGreaterThanOrEqual(85)
            expect(bounds.top).toBeLessThan(100)
            expect(bounds.right - bounds.left).toBeGreaterThan(100)
            expect(bounds.bottom - bounds.top).toBeGreaterThan(80)
        } finally {
            rmSync(directory, { recursive: true, force: true })
        }
    })

    visualTest('renders the Arrow head with Poppler', async () => {
        const annotation = createAnnotation({
            type: AnnotationType.ARROW,
            pdfjsType: PdfjsAnnotationType.LINE,
            subtype: 'Arrow',
            konvaString: JSON.stringify({
                className: 'Group', attrs: {},
                children: [{
                    className: 'Arrow',
                    attrs: {
                        points: [100, 100, 200, 100], stroke: '#ff0000', strokeWidth: 2,
                        pointerLength: 20, pointerWidth: 30, opacity: 1
                    }
                }]
            }),
            konvaClientRect: { x: 95, y: 80, width: 110, height: 40 }
        })
        const exportedData = await buildAnnotatedPdf(createViewer(await createBlankPdf()), [annotation])
        const directory = mkdtempSync(join(tmpdir(), 'inklayer-vue-arrow-'))
        try {
            const input = join(directory, 'arrow.pdf')
            const output = join(directory, 'arrow')
            writeFileSync(input, exportedData)
            execFileSync('pdftoppm', ['-r', '72', '-f', '1', '-singlefile', input, output], { timeout: 5000 })
            const { count, bounds } = getRedPixelBounds(readFileSync(`${output}.ppm`))

            expect(count).toBeGreaterThan(100)
            expect(bounds.right - bounds.left).toBeGreaterThan(95)
            expect(bounds.bottom - bounds.top).toBeGreaterThan(20)
        } finally {
            rmSync(directory, { recursive: true, force: true })
        }
    })
})
