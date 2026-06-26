<p align="center">
  <img src="https://raw.githubusercontent.com/Laomai-codefee/inklayer-vue/main/public/logo.svg" alt="InkLayer" width="80" />
</p>

<h1 align="center">InkLayer Vue</h1>

<p align="center">
  A Vue 3 PDF annotation SDK built on top of PDF.js.
  <br/>Simplifies building document review, annotation, and commenting systems.
</p>

---
[简体中文](./README.md) | English 
---
[![NPM](https://img.shields.io/npm/v/inklayer-vue.svg)](https://www.npmjs.com/package/inklayer-vue)  [![License](https://img.shields.io/npm/l/inklayer-vue)](./LICENSE)

[>> Online Demo](https://laomai-codefee.github.io/inklayer-vue/)


---

## Why InkLayer

Building PDF annotation features with PDF.js requires handling:

- coordinate system mapping
- annotation rendering consistency
- state synchronization across pages
- export and persistence logic

InkLayer provides a structured layer to reduce this complexity.

---

## Features

- Annotation system (text, ink, shapes, stamps)
- PDF.js rendering abstraction
- Comment and review workflows
- Editable annotation model
- Export support (PDF / Excel)
- Vue 3 integration with composable API
- Customizable UI and theme system

---

## Installation

```bash
npm install inklayer-vue
yarn add inklayer-vue
```

---

## Quick Start

```vue
<script setup>
import { PdfAnnotator } from 'inklayer-vue'
import 'inklayer-vue/style'

const handleSave = (annotations) => {
  console.log('Save:', annotations)
}
</script>

<template>
  <PdfAnnotator
    title="My Document"
    url="/sample.pdf"
    :user="{ id: 'u1', name: 'Alice' }"
    @save="handleSave"
  />
</template>
```

```vue
<script setup>
import { PdfViewer } from 'inklayer-vue'
import 'inklayer-vue/style'
</script>

<template>
  <PdfViewer
    title="My Document"
    url="/sample.pdf"
  />
</template>
```

---

## Components

### Base Props (shared by both PdfViewer & PdfAnnotator)

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `title` | `string` | `'PDF VIEWER'` | Document title shown in the header |
| `theme` | `ThemeColor` | `'violet'` | Color theme — 28 built-in Radix colors (see list below) |
| `url` | `string \| URL` | — | PDF file URL (or Object URL) |
| `data` | `string \| number[] \| TypedArray` | — | Raw PDF binary data as base64, byte array, or TypedArray |
| `locale` | `'zh-CN' \| 'en-US'` | `'zh-CN'` | UI language |
| `initialScale` | `number \| 'auto' \| 'page-fit' \| 'page-width'` | `'auto'` | Initial zoom level or auto-fit strategy |
| `layoutStyle` | `{ width?, height? }` | `{}` | CSS dimensions for the viewer container |
| `enableRange` | `boolean \| 'auto'` | `'auto'` | Enable HTTP range requests for large PDFs |
| `defaultActiveSidebarKey` | `string \| null` | `null` | Which sidebar panel to open by default |
| `user` | `User \| null` | — | Current user info (required for annotator) |

**Available themes:** `ruby`, `indigo`, `gray`, `gold`, `bronze`, `brown`, `yellow`, `amber`, `orange`, `tomato`, `red`, `crimson`, `pink`, `plum`, `purple`, `violet`, `iris`, `blue`, `cyan`, `teal`, `jade`, `green`, `grass`, `lime`, `mint`, `sky`

---

### PdfAnnotator

#### Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| (All base props) | | | Inherits all [Base Props](#base-props-shared-by-both-pdfviewer--pdfannotator) |
| `defaultOptions` | `DeepPartial<PdfAnnotatorOptions>` | `{}` | Partial configuration to merge with system defaults |
| `defaultShowAnnotationsSidebar` | `boolean` | `false` | Open the annotation sidebar on mount |
| `enableNativeAnnotations` | `boolean` | `false` | Enable editing of PDF-native annotations |
| `initialAnnotations` | `IAnnotationStore[]` | `[]` | Load existing annotations on mount |

#### Events

| Event | Payload | Description |
|:------|:--------|:------------|
| `save` | `(annotations: Annotation[])` | Fires when the user clicks the Save button |
| `load` | `()` | Fires when the PDF document finishes loading |
| `annotationAdded` | `(annotation: Annotation)` | Fires when a new annotation is created |
| `annotationDeleted` | `(id: string)` | Fires when an annotation is deleted |
| `annotationSelected` | `(annotation: Annotation \| null, isClick: boolean)` | Fires when an annotation is selected |
| `annotationUpdated` | `(annotation: Annotation)` | Fires when an annotation is modified |

#### Slots

| Slot | Scope | Description |
|:-----|:------|:------------|
| `actions` | `{ onSave, getAnnotations, exportToExcel, exportToPdf }` | Replace default Save/Export buttons in the header |

#### Exposed Methods

| Method | Signature | Description |
|:-------|:----------|:------------|
| `save` | `() => void` | Programmatically trigger save |
| `getAnnotations` | `() => Annotation[]` | Get current annotations as Core Annotation objects |

---

### PdfViewer

A read-only PDF viewer with search, zoom, theme, and customizable toolbar/sidebar slots.

#### Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| (All base props) | | | Inherits all [Base Props](#base-props-shared-by-both-pdfviewer--pdfannotator) |
| `showTextLayer` | `boolean` | `true` | Enable the invisible text layer for search and selection |
| `showAnnotations` | `boolean` | `false` | Show PDF-native annotations on the rendered pages |
| `toolbar` | `ToolbarItem[]` | — | Declarative toolbar configuration |
| `actions` | `ActionItem[]` | — | Declarative header action buttons |
| `sidebar` | `SidebarPanel[]` | `[]` | Additional sidebar panels beyond search |

#### Events

| Event | Payload | Description |
|:------|:--------|:------------|
| `documentLoaded` | `(viewer: PDFViewer)` | Fires when the PDF document and viewer are ready |
| `eventBusReady` | `(bus: EventBus)` | Fires when the PDF.js event bus is available |

#### Custom Toolbar

```vue
<template>
  <PdfViewer url="/document.pdf" :show-annotations="true">
    <template #toolbar="{ currentScale, zoomIn, zoomOut, setScale }">
      <div class="flex items-center gap-2">
        <button @click="zoomOut">−</button>
        <span>{{ Math.round(currentScale * 100) }}%</span>
        <button @click="zoomIn">+</button>
      </div>
    </template>
  </PdfViewer>
</template>
```

#### Custom Sidebar Panels

```vue
<script setup>
const customPanels = [
  { key: 'bookmarks', title: 'Bookmarks', icon: 'bookmark' },
  { key: 'comments',  title: 'Comments',  icon: 'message-circle' },
]
</script>

<template>
  <PdfViewer url="/document.pdf" :sidebar="customPanels">
    <template #sidebar-bookmarks>
      <div class="p-4">Bookmarks panel content</div>
    </template>
    <template #sidebar-comments>
      <div class="p-4">Comments panel content</div>
    </template>
  </PdfViewer>
</template>
```

#### Custom Actions

```vue
<template>
  <PdfViewer url="/document.pdf">
    <template #actions="{ currentScale }">
      <button @click="handleCustomAction">Custom @ {{ currentScale }}%</button>
    </template>
  </PdfViewer>
</template>
```

---

## Extension Components

InkLayer Vue also exports internal building-block components for advanced customization:

| Component | Description |
|:----------|:------------|
| `PdfViewerProvider` | Context provider wrapping all children with PDF viewer state |
| `AnnotatorExtension` | Core annotation engine extension |
| `AnnotationToolbar` | The built-in annotation toolbar |
| `ZoomTool` | Standalone zoom control (used in default toolbar) |
| `ColorPicker` | Standalone color picker component |
| `AnnotationSidebar` | Annotation list sidebar panel |
| `SearchSidebar` | Full-text search sidebar panel |

---

## Composables

| Composable | Description |
|:-----------|:------------|
| `usePdfViewer(containerRef, options)` | Initialize and manage a PDF.js viewer instance |
| `usePdfTool(pdfDocument)` | Download and print PDF utilities |
| `usePdfSearch(pdfViewer)` | Full-text search across PDF pages |
| `useSystemAppearance()` | Reactive dark/light mode based on OS preference |
| `exportToExcel(annotations, fileName?)` | Export annotations to an Excel workbook |


---

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge latest).

---

## Related Projects

- [InkLayer React](https://github.com/Laomai-codefee/inklayer-react) — React binding
- [PDF.js](https://github.com/mozilla/pdf.js) — Underlying PDF rendering engine

---

## License

MIT © InkLayer
