<p align="center">
  <img src="https://raw.githubusercontent.com/Laomai-codefee/inklayer-vue/main/public/logo.svg" alt="InkLayer" width="80" />
</p>

<h1 align="center">InkLayer Vue</h1>

<p align="center">
  <a href="./README.md">简体中文</a> <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span> <a href="./README-en-US.md">English</a>
</p>

<p align="center">
  🖊️ A Vue 3 PDF annotation SDK built on PDF.js
  <br/>For building document review, annotation, and commenting systems
</p>

<div align="center">
  <a href="https://www.npmjs.com/package/inklayer-vue" target="_blank">
    <img src="https://img.shields.io/npm/v/inklayer-vue.svg" alt="NPM" />
  </a>
  <a href="./LICENSE" target="_blank">
    <img src="https://img.shields.io/npm/l/inklayer-vue" alt="License" />
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

---

## ✨ Features

- 🚀 **High-performance PDF Viewer** — search, zoom, theme system
- 🖍️ **Annotation System** — text markup, ink, shapes, stamps, signatures
- 💬 **Comment & Review Workflow**
- 💾 **Annotation Editing & Persistence Model**
- 📤 **Export Support** — PDF / Excel
- 🎨 **Customizable UI** — toolbar / sidebar

---

## 📦 Installation

```bash
npm install inklayer-vue
# or
yarn add inklayer-vue
```

---

## 🚀 Quick Start

### PdfAnnotator

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

### PdfViewer

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

## 📖 Component API

Full component API → [📚 Docs](https://inklayer.dev/docs/vue)

---

## 🔗 Related Projects

- [InkLayer React](https://github.com/Laomai-codefee/inklayer-react) — React version

---

## 📄 License

MIT © InkLayer
