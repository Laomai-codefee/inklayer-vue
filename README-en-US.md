<p align="center">
  <img src="https://raw.githubusercontent.com/Laomai-codefee/inklayer-vue/main/public/logo.svg" alt="InkLayer" width="80" />
</p>

<h1 align="center">InkLayer Vue</h1>

<p align="center">
  Extensible Vue3 PDF annotation SDK and viewer built on PDF.js
        <br/>supporting document review, comments, and annotation editing.
</p>

---
English | [简体中文](./README.md)
---
[![NPM](https://img.shields.io/npm/v/inklayer-react.svg)](https://www.npmjs.com/package/inklayer-vue)
[![Demo](https://img.shields.io/badge/demo-online-brightgreen)](https://laomai-codefee.github.io/inklayer-vue/)
[![License](https://img.shields.io/npm/l/inklayer-vue)](./LICENSE)

### [>>Online Demo](https://laomai-codefee.github.io/inklayer-vue/)


---

## ✨ Features

- **Rich Annotation System** — 13 built-in annotation tools: highlight, underline, strikeout, rectangle, circle, arrow, cloud, freehand, free highlight, free text, stamp, signature, and sticky note
- **High-Fidelity PDF Rendering** — Powered by PDF.js with text layer search, smooth zoom, and multi-page scrolling
- **Full Theme System** — 28 built-in Radix-based color themes with automatic dark/light mode support
- **Internationalization** — Built-in zh-CN and en-US locales via `vue-i18n`
- **Highly Customizable UI** — Every toolbar, sidebar, and action button is overridable via Vue named slots
- **`defaultOptions`** — DeepMerge/DeepPartial mechanism for partial configuration injection without boilerplate
- **PDF & Excel Export** — Export annotations to annotated PDF (via pdf-lib) or structured Excel (via exceljs)
- **Extensible Architecture** — Core annotation data model decoupled from rendering; adapter pattern supports PDF.js, Konva, and future renderers
- **Tree-Shakable** — Library build with full ESM/CJS support and TypeScript declaration output

---

## ✍️ Annotation Tools

| Tool | Description |
|------|-------------|
| **Rectangle** | Draw rectangular shapes |
| **Circle** | Draw elliptical shapes |
| **Free Hand** | Free-form ink drawing |
| **Free Highlight** | Transparent free-form highlighting |
| **Arrow** | Draw arrows with directional heads |
| **Cloud** | Draw cloud-shaped polygons |
| **Free Text** | Place editable text boxes |
| **Signature** | Place signatures (upload, draw, type, or defaults) |
| **Stamp** | Place custom/standard stamps (upload images, custom text, or defaults) |
| **Text Highlight** | Highlight selected text |
| **Text Strikeout** | Strike through selected text |
| **Text Underline** | Underline selected text |
| **Sticky Note** | Attach collapsible note annotations |

### ✍️ Editing Existing Annotations

PDF native annotations loaded from documents are fully editable:

Square, Circle, Ink, FreeText, Line, Polygon, PolyLine, Text, Highlight, Underline, StrikeOut

---

## 📦 Installation

```bash
npm install inklayer-vue
pnpm add inklayer-vue
yarn add inklayer-vue
```

---

## 🚀 Quick Start

### PdfAnnotator — Full annotation workspace

```vue
<script setup>
import { PdfAnnotator } from 'inklayer-vue'
import 'inklayer-vue/dist/inklayer-vue.css'

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

### PdfViewer — Read-only viewer with search

```vue
<script setup>
import { PdfViewer } from 'inklayer-vue'
import 'inklayer-vue/dist/inklayer-vue.css'
</script>

<template>
  <PdfViewer
    title="My Document"
    url="/sample.pdf"
  />
</template>
```

---

## 🧩 Components

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

The full-featured PDF annotation workspace. Includes toolbar, annotation sidebar, search sidebar, and all annotation tools.

#### Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| (All base props) | | | Inherits all [Base Props](#base-props-shared-by-both-pdfviewer--pdfannotator) |
| `defaultOptions` | `DeepPartial<PdfAnnotatorOptions>` | `{}` | Partial configuration to merge with system defaults (see example below) |
| `defaultShowAnnotationsSidebar` | `boolean` | `false` | Open the annotation sidebar on mount |
| `enableNativeAnnotations` | `boolean` | `false` | Enable editing of PDF-native annotations |
| `initialAnnotations` | `IAnnotationStore[]` | `[]` | Load existing annotations on mount |

#### ⚙️ `defaultOptions` — DeepPartial + DeepMerge

InkLayer Vue uses a `DeepPartial` + `DeepMerge` pattern for configuration. You only need to specify what you want to override; everything else falls back to sensible defaults.

```vue
<script setup>
const customOptions = {
  signature: {
        defaultSignature: [
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...'],
        type: 'Draw',
        defaultFont: [
            { label: '楷体', value: 'STKaiti', external: false },
            { label: '千图笔锋手写体', value: 'qiantubifengshouxieti', external: true, url: qiantubifengshouxietiFont }
        ]
    },
    stamp: {
        defaultStamp: [
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...']
    }
}
</script>

<template>
  <PdfAnnotator
    url="/document.pdf"
    :user="{ id: 'u1', name: 'Alice' }"
    :default-options="customOptions"
  />
</template>
```

**Full `PdfAnnotatorOptions` structure:**

<details>
<summary>Click to expand</summary>

```ts
interface PdfAnnotatorOptions {
  /** Predefined color palette for annotation tools */
  colors: string[]
  
  /** Signature tool configuration */
  signature: {
    fontFamily?: string
    defaultName?: string
    defaultImage?: string
  }
  
  /** Stamp tool configuration */
  stamp: {
    stamps?: Array<{
      text: string
      color: string
      borderColor?: string
      backgroundColor?: string
    }>
    defaultStamp?: string
  }
}
```
</details>

#### Emits

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

#### Emits

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

## 🧩 Extension Components

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

## 🛠 Composables

| Composable | Description |
|:-----------|:------------|
| `usePdfViewer(containerRef, options)` | Initialize and manage a PDF.js viewer instance |
| `usePdfTool(pdfDocument)` | Download and print PDF utilities |
| `usePdfSearch(pdfViewer)` | Full-text search across PDF pages |
| `useSmoothZoom(options)` | Smooth scroll-based zoom with trackpad pinch support |
| `useSystemAppearance()` | Reactive dark/light mode based on OS preference |
| `exportToExcel(annotations, fileName?)` | Export annotations to an Excel workbook |

---

## 📦 Advanced Usage


### Using with `PdfViewerProvider` (headless mode)

```vue
<script setup>
import { PdfViewerProvider } from 'inklayer-vue'
</script>

<template>
  <PdfViewerProvider url="/document.pdf">
    <!-- Access PDF context anywhere inside this tree -->
    <YourCustomViewer />
  </PdfViewerProvider>
</template>
```

### Importing shadcn-vue UI Components

InkLayer Vue re-exports its internal shadcn-vue components so you can build custom UIs with matching styles:

```vue
<script setup>
import { Button, Input, Tabs, TabsList, TabsTrigger, TabsContent } from 'inklayer-vue'
</script>
```

---

## 🌍 Browser Support

| <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/chrome/chrome_48x48.png" width="24" /> | <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/firefox/firefox_48x48.png" width="24" /> | <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/safari/safari_48x48.png" width="24" /> | <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/edge/edge_48x48.png" width="24" /> |
|:---:|:---:|:---:|:---:|
| Chrome latest | Firefox latest | Safari latest | Edge latest |

---

## 📄 License

MIT © InkLayer
