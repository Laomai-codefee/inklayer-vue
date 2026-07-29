import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const highlighterInstances = vi.hoisted(() => [] as any[])

vi.mock('web-highlighter', () => ({
    default: class MockHighlighter {
        handlers = new Map<string, (...args: any[]) => void>()
        stop = vi.fn()
        dispose = vi.fn()
        getDoms = vi.fn(() => [])
        removeAll = vi.fn()
        fromRange = vi.fn()
        off = vi.fn((type: string, handler: (...args: any[]) => void) => {
            if (this.handlers.get(type) === handler) this.handlers.delete(type)
        })
        on(type: string, handler: (...args: any[]) => void) {
            this.handlers.set(type, handler)
        }
        constructor() {
            highlighterInstances.push(this)
        }
    }
}))

import { WebSelection } from '../webSelection'

describe('WebSelection lifecycle', () => {
    beforeEach(() => {
        highlighterInstances.length = 0
        document.body.innerHTML = ''
        window.getSelection()?.removeAllRanges()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('removes document and highlighter listeners when destroyed', () => {
        const onSelect = vi.fn()
        const root = document.createElement('div')
        root.textContent = 'selectable text'
        document.body.appendChild(root)
        const webSelection = new WebSelection({ onSelect, onHighlight: vi.fn() })
        webSelection.create(root)

        const range = document.createRange()
        range.selectNodeContents(root)
        window.getSelection()?.addRange(range)
        document.dispatchEvent(new Event('selectionchange'))
        expect(webSelection.isRangeSelectionActive()).toBe(true)
        document.dispatchEvent(new MouseEvent('mouseup'))
        expect(webSelection.isRangeSelectionActive()).toBe(false)
        expect(onSelect).toHaveBeenCalledWith(range)

        onSelect.mockClear()
        webSelection.destroy()
        document.dispatchEvent(new Event('selectionchange'))
        document.dispatchEvent(new MouseEvent('mouseup'))

        expect(onSelect).not.toHaveBeenCalled()
        expect(highlighterInstances[0].off).toHaveBeenCalledWith('selection:create', expect.any(Function))
        expect(highlighterInstances[0].dispose).toHaveBeenCalledOnce()
    })

    it('cleans the previous instance before creating another one', () => {
        const root = document.createElement('div')
        const webSelection = new WebSelection({ onSelect: vi.fn(), onHighlight: vi.fn() })

        webSelection.create(root)
        webSelection.create(root)

        expect(highlighterInstances).toHaveLength(2)
        expect(highlighterInstances[0].dispose).toHaveBeenCalledOnce()
        expect(highlighterInstances[1].dispose).not.toHaveBeenCalled()
    })

    it('ignores text selections outside the PDF viewer root', () => {
        const onSelect = vi.fn()
        const root = document.createElement('div')
        root.textContent = 'PDF text'
        const input = document.createElement('input')
        input.value = '446'
        document.body.append(root, input)
        const webSelection = new WebSelection({ onSelect, onHighlight: vi.fn() })
        webSelection.create(root)

        const range = document.createRange()
        range.selectNodeContents(input)
        vi.spyOn(window, 'getSelection').mockReturnValue({
            type: 'Range',
            anchorNode: input,
            focusNode: input,
            rangeCount: 1,
            toString: () => '446',
            getRangeAt: () => range,
        } as unknown as Selection)
        document.dispatchEvent(new Event('selectionchange'))
        document.dispatchEvent(new MouseEvent('mouseup'))

        expect(onSelect).toHaveBeenCalledWith(null)
        expect(onSelect).not.toHaveBeenCalledWith(range)
        webSelection.destroy()
    })

    it('clears a pending viewer selection when the selection becomes empty', () => {
        const onSelect = vi.fn()
        const root = document.createElement('div')
        root.textContent = 'PDF text'
        document.body.appendChild(root)
        const webSelection = new WebSelection({ onSelect, onHighlight: vi.fn() })
        webSelection.create(root)

        const range = document.createRange()
        range.selectNodeContents(root)
        const getSelection = vi.spyOn(window, 'getSelection')
        getSelection.mockReturnValueOnce({
            type: 'Range',
            anchorNode: root.firstChild,
            focusNode: root.firstChild,
            rangeCount: 1,
            toString: () => 'PDF text',
            getRangeAt: () => range,
        } as unknown as Selection)
        document.dispatchEvent(new Event('selectionchange'))

        onSelect.mockClear()
        getSelection.mockReturnValue({
            type: 'Range',
            anchorNode: root.firstChild,
            focusNode: root.firstChild,
            rangeCount: 0,
            toString: () => '',
        } as unknown as Selection)
        document.dispatchEvent(new Event('selectionchange'))
        document.dispatchEvent(new MouseEvent('mouseup'))

        expect(onSelect).toHaveBeenCalledOnce()
        expect(onSelect).toHaveBeenCalledWith(null)
        webSelection.destroy()
    })
})
