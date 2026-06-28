<p align="center">
  <img src="https://raw.githubusercontent.com/Laomai-codefee/inklayer-vue/main/public/logo.svg" alt="InkLayer" width="80" />
</p>

<h1 align="center">InkLayer Vue</h1>

<p align="center">
  <a href="./README.md">简体中文</a> <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span> <a href="./README-en-US.md">English</a>
</p>

<p align="center">
  🖊️ 基于 PDF.js 构建的 Vue 3 PDF 批注 SDK
  <br/>用于快速构建文档审阅、批注与评论系统
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
  <a href="https://laomai-codefee.github.io/inklayer-vue/" target="_blank"><b>🔥 在线体验</b></a>
  <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
  <a href="https://inklayer.dev/docs" target="_blank"><b>📚 文档</b></a>
  <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
  <a href="https://github.com/Laomai-codefee/inklayer-vue" target="_blank"><b>⭐ GitHub</b></a>
</div>

---

<p align="center">
  <img src="./screenshot.png" alt="InkLayer Vue Screenshot" width="80%" />
</p>

---

## ✨ 特性

- 🚀 **PDF查看器** — 搜索、缩放、主题系统
- 🖍️ **PDF批注系统** — 文本标记、墨迹、图形、印章、签名
- 💬 **评论与审阅工作流**
- 💾 **批注编辑与持久化模型**
- 📤 **导出支持** — PDF / Excel
- 🎨 **可自定义 UI** — 工具栏 / 侧边栏

---

## 📦 安装

```bash
npm install inklayer-vue
# or
yarn add inklayer-vue
```

---

## 🚀 快速开始

### PdfAnnotator 批注

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

### PdfViewer 查看

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

## 📖 组件 API

查看完整组件 API → [📚 文档](https://inklayer.dev/docs/vue)

---

## 🔗 相关项目

- [InkLayer React](https://github.com/Laomai-codefee/inklayer-react) — React 版本

---

## 📄 许可证

MIT © InkLayer
