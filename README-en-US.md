
<p align="center">
  <img src="https://raw.githubusercontent.com/Laomai-codefee/inklayer-vue/main/public/logo.svg" alt="InkLayer" width="80" />
</p>

<h1 align="center">InkLayer Vue</h1>

<p align="center">
  <a href="./README.md">简体中文</a> <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
  <a href="./README-en-US.md">English</a>
</p>

<p align="center">
  🖊️ A Vue 3 PDF annotation SDK built on PDF.js<br/>
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

## 🔗 Related Projects

- InkLayer React: https://github.com/Laomai-codefee/inklayer-react
- Vue Starter: https://github.com/Laomai-codefee/inklayer-vue-starter
- React Starter: https://github.com/Laomai-codefee/inklayer-react-starter

---

## 📄 License

MIT © InkLayer
