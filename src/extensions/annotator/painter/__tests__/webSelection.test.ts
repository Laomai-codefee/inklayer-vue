import { beforeEach, describe, expect, it, vi } from 'vitest'

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
        document.dispatchEvent(new MouseEvent('mouseup'))
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
})
