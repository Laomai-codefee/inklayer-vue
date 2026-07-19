
<p align="center">
  <img src="https://raw.githubusercontent.com/Laomai-codefee/inklayer-vue/main/public/logo.svg" alt="InkLayer" width="80" />
</p>

<h1 align="center">InkLayer Vue</h1>

<p align="center">
  <a href="./README.md">简体中文</a> <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
  <a href="./README-en-US.md">English</a>
</p>

<p align="center">
  🖊️ A Vue 3 PDF viewer & annotation SDK built on PDF.js<br/>
  For building document review, annotation, and commenting systems
</p>

<div align="center">
  <a href="https://www.npmjs.com/package/inklayer-vue" target="_blank">
    <img src="https://img.shields.io/npm/v/inklayer-vue.svg" />
  </a>
  <a href="./LICENSE" target="_blank">
    <img src="https://img.shields.io/npm/l/inklayer-vue" />
  </a>
</div>

<br/>

<div align="center">
  <a href="https://laomai-codefee.github.io/inklayer-vue/" target="_blank"><b>🔥 Live Demo</b></a>
  <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
  <a href="https://inklayer.dev/docs" target="_blank"><b>📚 Docs</b></a>
  <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
  <a href="https://github.com/Laomai-codefee/inklayer-vue" target="_blank"><b>⭐ GitHub</b></a>
</div>

---

<p align="center">
  <img src="./screenshot.png" alt="InkLayer Vue Screenshot" width="80%" />
</p>

## ⭐ Quick Start (Recommended)

The fastest way to try InkLayer Vue: use the [official starter 🚀 ](https://github.com/Laomai-codefee/inklayer-vue-starter).

```bash
git clone https://github.com/Laomai-codefee/inklayer-vue-starter.git
cd inklayer-vue-starter
npm install
npm run dev
```

Open:

http://localhost:5173

> 💡 The starter comes with a complete PDF annotation example pre-configured — no extra setup needed to experience the full SDK.

---

## ✨ Features

- 🚀 PDF Viewer (zoom / search / theming)
- 🖍️ PDF Annotation System (highlight / ink / shapes / stamps / signatures)
- 💬 Comment & review workflow
- 💾 Annotation data model (persistable)
- 📤 Export support (PDF / Excel)
- 🎨 Customizable UI (toolbar / sidebar)

---

## 📦 Installation

```bash
npm install inklayer-vue
```

---

## 🚀 Basic Usage

### 1. Plugin Registration (Required)

```typescript
import { createApp } from 'vue'
import { inklayerVuePlugin } from 'inklayer-vue'
import App from './App.vue'

const app = createApp(App)
app.use(inklayerVuePlugin)
app.mount('#app')
```

### 2. PdfAnnotator (annotation)

```vue
<script setup>
import { PdfAnnotator } from 'inklayer-vue'
import 'inklayer-vue/style'

const handleSave = (annotations) => {
  console.log('Saved annotations:', annotations)
}
</script>

<template>
  <PdfAnnotator
    title="PDF Annotator"
    url="https://example.com/sample.pdf"
    :user="{ id: 'u1', name: 'Alice' }"
    @save="handleSave"
  />
</template>
```

---

### 3. PdfViewer (viewer)

```vue
<script setup>
import { PdfViewer } from 'inklayer-vue'
import 'inklayer-vue/style'
</script>

<template>
  <PdfViewer
    title="PDF Viewer"
    url="https://example.com/sample.pdf"
  />
</template>
```

---

## 📖 API Docs

👉 https://inklayer.dev/docs/vue

---

## 🔐 Collaborative Annotation Permissions

`user` identifies the current user; callers do not need to provide a separate `role`. In `owner-only` mode, authenticated users may create annotations and replies, while only the annotation owner may move, resize, edit, change status, or delete that annotation. A reply can be edited or deleted only by its author.

```vue
<PdfAnnotator
  :user="currentUser"
  :annotation-permissions="{
    mode: 'owner-only',
    can: ({ currentUser }) =>
      currentUser?.id === 'admin' ? true : undefined
  }"
/>
```

The optional synchronous `can(request)` resolver overrides the mode: return `true` to allow, `false` to deny, or `undefined` to keep the mode's default decision. The request includes `action`, `currentUser`, `annotation`, `comment`, and `defaultAllowed`, so applications can add administrator, workflow-state, or document-level rules.

For a fully read-only annotator, pass `:annotation-permissions="{ can: () => false }"`. Users can still select and inspect annotations, while every mutation is denied.

> These are browser interaction permissions for InkLayer UI and local mutations. Your backend API must still authorize every read and write; client-side decisions are not a security boundary.

---

## 🔗 Related Projects

- InkLayer React: https://github.com/Laomai-codefee/inklayer-react
- Vue Starter: https://github.com/Laomai-codefee/inklayer-vue-starter
- React Starter: https://github.com/Laomai-codefee/inklayer-react-starter

---

## 💬 Feedback

Questions? Feature requests? Drop by [GitHub Discussions](https://github.com/Laomai-codefee/inklayer-vue/discussions) or email us: [codefee@foxmail.com](mailto:codefee@foxmail.com)

Bug reports → [GitHub Issues](https://github.com/Laomai-codefee/inklayer-vue/issues)

---

## 🌐 Runtime Environment

InkLayer Vue is browser-only and does not support server-side rendering (SSR). Load it from a client entry point or a client-only component.

- Vue 3.5+
- Vite 5+ or Webpack 5
- ESM and CommonJS package entry points
- Standard package managers such as npm and pnpm; all runtime dependencies are declared by the package

When using an SSR framework such as Nuxt, disable server rendering for the component and import both the component and its styles on the client only.

---

## 📄 License

MIT © InkLayer
