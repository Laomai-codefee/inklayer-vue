// Annotation type definitions for InkLayer Vue
// Migrated from React TSX — icon field uses string-based names instead of JSX

import { IRect } from 'konva/lib/types'
import type { User } from '@/types'

export type PdfjsAnnotationSubtype =
  | 'None' | 'Link' | 'Text' | 'Widget' | 'Popup' | 'FreeText'
  | 'Line' | 'Square' | 'Circle' | 'PolyLine' | 'Polygon'
  | 'Caret' | 'Ink' | 'Highlight' | 'Underline' | 'Squiggly'
  | 'StrikeOut' | 'Stamp' | 'FileAttachment' | 'Note' | 'Arrow'

export enum PdfjsAnnotationType {
  NONE = 0, TEXT = 1, LINK = 2, FREETEXT = 3, LINE = 4,
  SQUARE = 5, CIRCLE = 6, POLYGON = 7, POLYLINE = 8,
  HIGHLIGHT = 9, UNDERLINE = 10, SQUIGGLY = 11, STRIKEOUT = 12,
  STAMP = 13, CARET = 14, INK = 15, POPUP = 16,
  FILEATTACHMENT = 17, SOUND = 18, MOVIE = 19, WIDGET = 20,
  SCREEN = 21, PRINTERMARK = 22, TRAPNET = 23, WATERMARK = 24,
  THREED = 25, REDACT = 26, NOTE = 27,
}

export enum AnnotationType {
  NONE = -1,
  SELECT = 0,
  HIGHLIGHT = 1,
  STRIKEOUT = 2,
  UNDERLINE = 3,
  FREETEXT = 4,
  RECTANGLE = 5,
  CIRCLE = 6,
  FREEHAND = 7,
  FREE_HIGHLIGHT = 8,
  SIGNATURE = 9,
  STAMP = 10,
  NOTE = 11,
  ARROW = 12,
  CLOUD = 13,
}

/** Icon names used in toolbar — rendered by AnnotationIcon Vue component */
export type AnnotationIconName =
  | 'select' | 'highlight' | 'strikeout' | 'underline'
  | 'rectangle' | 'circle' | 'note' | 'arrow' | 'cloud'
  | 'freehand' | 'freeHighlight' | 'freeText' | 'signature' | 'stamp'

export interface IAnnotationType {
  name: string
  type: AnnotationType
  pdfjsAnnotationType: PdfjsAnnotationType
  subtype: PdfjsAnnotationSubtype
  webSelectionDependencies: boolean
  isOnce: boolean
  resizable: boolean
  draggable: boolean
  icon: AnnotationIconName
  style?: IAnnotationStyle
  styleEditable?: {
    color: boolean
    strokeWidth: boolean
    opacity: boolean
  }
}

export interface IAnnotationStyle {
  color?: string
  fontSize?: number
  opacity?: number
  strokeWidth?: number
}

export interface IAnnotationComment {
  id: string
  title: string
  date: string | null
  content: string
  status?: CommentStatus
}

export enum CommentStatus {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
  Completed = 'Completed',
  None = 'None',
  Closed = 'Closed',
}

export interface IAnnotationContentsObj {
  text: string
  image?: string
}

export interface IAnnotationStore {
  id: string
  pageNumber: number
  konvaString: string
  konvaClientRect: IRect
  title: string
  type: AnnotationType
  color?: string | null
  subtype: PdfjsAnnotationSubtype
  pdfjsType: PdfjsAnnotationType
  date: string | null
  contentsObj?: IAnnotationContentsObj | null
  comments: IAnnotationComment[]
  user: User
  native: boolean
}

export const annotationDefinitions: IAnnotationType[] = [
  {
    name: 'select',
    type: AnnotationType.SELECT,
    pdfjsAnnotationType: PdfjsAnnotationType.NONE,
    subtype: 'None',
    webSelectionDependencies: false,
    isOnce: false,
    resizable: false,
    draggable: false,
    icon: 'select',
  },
  {
    name: 'highlight',
    type: AnnotationType.HIGHLIGHT,
    pdfjsAnnotationType: PdfjsAnnotationType.HIGHLIGHT,
    subtype: 'Highlight',
    webSelectionDependencies: true,
    isOnce: false,
    resizable: false,
    draggable: false,
    icon: 'highlight',
    style: { color: '#b4fa56' },
    styleEditable: { color: true, strokeWidth: false, opacity: false },
  },
  {
    name: 'strikeout',
    type: AnnotationType.STRIKEOUT,
    pdfjsAnnotationType: PdfjsAnnotationType.STRIKEOUT,
    subtype: 'StrikeOut',
    webSelectionDependencies: true,
    isOnce: false,
    resizable: false,
    draggable: false,
    icon: 'strikeout',
    style: { color: '#ff6b6b' },
    styleEditable: { color: true, opacity: false, strokeWidth: false },
  },
  {
    name: 'underline',
    type: AnnotationType.UNDERLINE,
    pdfjsAnnotationType: PdfjsAnnotationType.UNDERLINE,
    subtype: 'Underline',
    webSelectionDependencies: true,
    isOnce: false,
    resizable: false,
    draggable: false,
    icon: 'underline',
    style: { color: '#1272e8' },
    styleEditable: { color: true, opacity: false, strokeWidth: false },
  },
  {
    name: 'rectangle',
    type: AnnotationType.RECTANGLE,
    pdfjsAnnotationType: PdfjsAnnotationType.SQUARE,
    subtype: 'Square',
    webSelectionDependencies: false,
    isOnce: true,
    resizable: true,
    draggable: true,
    icon: 'rectangle',
    style: { color: '#ff6b6b', strokeWidth: 2, opacity: 1 },
    styleEditable: { color: true, opacity: true, strokeWidth: true },
  },
  {
    name: 'circle',
    type: AnnotationType.CIRCLE,
    pdfjsAnnotationType: PdfjsAnnotationType.CIRCLE,
    subtype: 'Circle',
    webSelectionDependencies: false,
    isOnce: true,
    resizable: true,
    draggable: true,
    icon: 'circle',
    style: { color: '#ff6b6b', strokeWidth: 2, opacity: 1 },
    styleEditable: { color: true, opacity: true, strokeWidth: true },
  },
  {
    name: 'note',
    type: AnnotationType.NOTE,
    pdfjsAnnotationType: PdfjsAnnotationType.TEXT,
    subtype: 'Text',
    webSelectionDependencies: false,
    isOnce: true,
    resizable: false,
    draggable: true,
    icon: 'note',
  },
  {
    name: 'arrow',
    type: AnnotationType.ARROW,
    pdfjsAnnotationType: PdfjsAnnotationType.LINE,
    subtype: 'Arrow',
    webSelectionDependencies: false,
    isOnce: true,
    resizable: true,
    draggable: true,
    icon: 'arrow',
    style: { color: '#ff6b6b', strokeWidth: 2, opacity: 1 },
    styleEditable: { color: true, opacity: true, strokeWidth: true },
  },
  {
    name: 'cloud',
    type: AnnotationType.CLOUD,
    pdfjsAnnotationType: PdfjsAnnotationType.POLYLINE,
    subtype: 'PolyLine',
    webSelectionDependencies: false,
    isOnce: true,
    resizable: true,
    draggable: true,
    icon: 'cloud',
    style: { color: '#ff6b6b', strokeWidth: 2, opacity: 1 },
    styleEditable: { color: true, opacity: true, strokeWidth: true },
  },
  {
    name: 'freehand',
    type: AnnotationType.FREEHAND,
    pdfjsAnnotationType: PdfjsAnnotationType.INK,
    subtype: 'Ink',
    webSelectionDependencies: false,
    isOnce: true,
    resizable: true,
    draggable: true,
    icon: 'freehand',
    style: { color: '#ff6b6b', strokeWidth: 2, opacity: 1 },
    styleEditable: { color: true, opacity: true, strokeWidth: true },
  },
  {
    name: 'freeHighlight',
    type: AnnotationType.FREE_HIGHLIGHT,
    pdfjsAnnotationType: PdfjsAnnotationType.INK,
    subtype: 'Highlight',
    webSelectionDependencies: false,
    isOnce: true,
    resizable: true,
    draggable: true,
    icon: 'freeHighlight',
    style: { color: '#ff6b6b', strokeWidth: 10, opacity: 0.5 },
    styleEditable: { color: true, opacity: true, strokeWidth: false },
  },
  {
    name: 'freeText',
    type: AnnotationType.FREETEXT,
    pdfjsAnnotationType: PdfjsAnnotationType.FREETEXT,
    subtype: 'FreeText',
    webSelectionDependencies: false,
    isOnce: true,
    resizable: true,
    draggable: true,
    icon: 'freeText',
    style: { color: '#000', fontSize: 14 },
    styleEditable: { color: true, opacity: true, strokeWidth: false },
  },
  {
    name: 'signature',
    type: AnnotationType.SIGNATURE,
    pdfjsAnnotationType: PdfjsAnnotationType.STAMP,
    subtype: 'Caret',
    webSelectionDependencies: false,
    isOnce: true,
    resizable: true,
    draggable: true,
    icon: 'signature',
  },
  {
    name: 'stamp',
    type: AnnotationType.STAMP,
    pdfjsAnnotationType: PdfjsAnnotationType.STAMP,
    subtype: 'Stamp',
    webSelectionDependencies: false,
    isOnce: true,
    resizable: true,
    draggable: true,
    icon: 'stamp',
  },
]
