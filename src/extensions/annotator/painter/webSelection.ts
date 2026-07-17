import Highlighter from 'web-highlighter'

/**
 * WebSelection 类用于处理网页选区的实用工具类。
 */
export class WebSelection {
    isEditing: boolean // 指示是否启用编辑模式
    onSelect: (range: Range | null) => void // 当选区被选中时调用的回调函数
    onHighlight: (selection: Partial<Record<string, any[]>>) => void
    highlighterObj: null | Highlighter
    private rootElement: HTMLDivElement | null = null
    private isSelecting = false

    /**
     * 构造一个新的 WebSelection 实例。
     * @param onSelect 当选区被选中时调用的回调函数
     */
    constructor({
        onSelect,
        onHighlight
    }: {
        onSelect: (range: Range | null) => void
        onHighlight: (selection: Partial<Record<string, any[]>>) => void
    }) {
        this.isEditing = false
        this.onSelect = onSelect
        this.onHighlight = onHighlight
        this.highlighterObj = null
    }

    /**
     * 在指定的根元素和页码上创建一个高亮器。
     * @param root 要应用高亮器的根元素
     */
    public create(root: HTMLDivElement) {
        this.destroy()
        this.rootElement = root

        this.highlighterObj = new Highlighter({
            $root: root,
            wrapTag: 'mark'
        })
        this.highlighterObj.stop()
        // 监听文本选择变化
        document.addEventListener('selectionchange', this.handleSelectionChange)

        // 监听鼠标松开事件
        document.addEventListener('mouseup', this.handleSelectionEnd)

        // 监听触摸屏操作结束事件
        document.addEventListener('touchend', this.handleSelectionEnd)

        this.highlighterObj.on('selection:create', this.handleHighlightCreated)
    }

    private handleSelectionChange = () => {
        const selection = window.getSelection()
        if (selection?.type === 'Caret' || selection?.anchorNode === null) {
            this.isSelecting = false
            this.onSelect(null)
            return
        }
        if (selection && selection.toString() && selection.rangeCount > 0) {
            const selectedElement = selection.getRangeAt(0).commonAncestorContainer
            this.isSelecting = !!this.rootElement?.contains(selectedElement)
        }
    }

    private handleSelectionEnd = () => {
        if (!this.isSelecting) return
        this.isSelecting = false
        const selection = window.getSelection()
        this.onSelect(selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null)
    }

    private handleHighlightCreated = (data: { sources: Array<{ id: string }> }) => {
        const highlighter = this.highlighterObj
        if (!highlighter) return
        const allSourcesId = data.sources.map((item) => item.id)
        const allSourcesSpan: HTMLElement[] = []
        allSourcesId.forEach((value) => {
            allSourcesSpan.push(...highlighter.getDoms(value))
        })

        const pageSelection = allSourcesSpan.reduce<Record<string, HTMLElement[]>>((acc, span) => {
            const page = span.closest('.page')?.getAttribute('data-page-number') ?? '-1'
            ;(acc[page] ||= []).push(span)
            return acc
        }, {})

        this.onHighlight(pageSelection)
        highlighter.removeAll()
        window.getSelection()?.removeAllRanges()
    }

    public highlight(range: Range | null) {
        if (range) {
            this.highlighterObj?.fromRange(range)
        }
    }

    public destroy() {
        document.removeEventListener('selectionchange', this.handleSelectionChange)
        document.removeEventListener('mouseup', this.handleSelectionEnd)
        document.removeEventListener('touchend', this.handleSelectionEnd)
        if (this.highlighterObj) {
            this.highlighterObj.off('selection:create', this.handleHighlightCreated)
            this.highlighterObj.dispose()
        }
        this.highlighterObj = null
        this.rootElement = null
        this.isSelecting = false
    }
}
