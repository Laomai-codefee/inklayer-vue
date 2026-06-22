<p align="center">
  <img src="https://raw.githubusercontent.com/Laomai-codefee/inklayer-vue/main/public/logo.svg" alt="InkLayer" width="80" />
</p>

<h1 align="center">InkLayer Vue</h1>

<p align="center">
  基于 PDF.js 构建的 Vue 3 PDF 批注 SDK
  <br/>用于快速构建文档审阅、批注与评论系统
</p>

---
简体中文 | [English](./README-en-US.md) 
---
[![NPM](https://img.shields.io/npm/v/inklayer-vue.svg)](https://www.npmjs.com/package/inklayer-vue)  [![License](https://img.shields.io/npm/l/inklayer-vue)](./LICENSE)

[>> 在线演示](https://laomai-codefee.github.io/inklayer-vue/)


---

## 为什么选择 InkLayer

直接用 PDF.js 构建 PDF 批注功能需要处理以下问题：

- 坐标系统映射
- 批注渲染一致性
- 跨页面的状态同步
- 导出和持久化逻辑

InkLayer 提供了一个结构化的抽象层来降低这些复杂度。

---

## 特性

- 批注系统（文本、墨迹、图形、印章等）
- 基于 PDF.js 的渲染抽象
- 评论与审阅工作流
- 可编辑的批注数据模型
- 导出支持（PDF / Excel）
- Vue 3 集成，提供 composable API
- 可自定义的 UI 和主题系统

---

## 安装

```bash
npm install inklayer-vue
yarn add inklayer-vue
```

---

## 快速开始

```vue
<script setup>
import { PdfAnnotator } from 'inklayer-vue'
import 'inklayer-vue/style'

const handleSave = (annotations) => {
  console.log('保存批注：', annotations)
}
</script>

<template>
  <PdfAnnotator
    title="我的文档"
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
    title="我的文档"
    url="/sample.pdf"
  />
</template>
```

---

## 组件

### 基础属性（PdfViewer 和 PdfAnnotator 共用）

| 属性 | 类型 | 默认值 | 说明 |
|:-----|:-----|:--------|:------------|
| `title` | `string` | `'PDF VIEWER'` | 顶部标题栏显示的文档标题 |
| `theme` | `ThemeColor` | `'violet'` | 色彩主题 — 内置 28 种 Radix 配色（见下方列表） |
| `url` | `string \| URL` | — | PDF 文件的 URL（或 Object URL） |
| `data` | `string \| number[] \| TypedArray` | — | PDF 原始二进制数据，支持 base64、字节数组或 TypedArray |
| `locale` | `'zh-CN' \| 'en-US'` | `'zh-CN'` | 界面语言 |
| `initialScale` | `number \| 'auto' \| 'page-fit' \| 'page-width'` | `'auto'` | 初始缩放级别或自适应策略 |
| `layoutStyle` | `{ width?, height? }` | `{}` | 查看器容器的 CSS 尺寸 |
| `enableRange` | `boolean \| 'auto'` | `'auto'` | 是否启用 HTTP Range 请求（用于大型 PDF） |
| `defaultActiveSidebarKey` | `string \| null` | `null` | 默认打开的侧边栏面板 |
| `user` | `User \| null` | — | 当前用户信息（批注器模式下必填） |

**可用主题：** `ruby`、`indigo`、`gray`、`gold`、`bronze`、`brown`、`yellow`、`amber`、`orange`、`tomato`、`red`、`crimson`、`pink`、`plum`、`purple`、`violet`、`iris`、`blue`、`cyan`、`teal`、`jade`、`green`、`grass`、`lime`、`mint`、`sky`

---

### PdfAnnotator

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|:-----|:-----|:--------|:------------|
| （所有基础属性） | | | 继承所有[基础属性](#基础属性pdfviewer-和-pdfannotator-共用) |
| `defaultOptions` | `DeepPartial<PdfAnnotatorOptions>` | `{}` | 部分配置，将与系统默认值深度合并 |
| `defaultShowAnnotationsSidebar` | `boolean` | `false` | 挂载时默认打开批注侧边栏 |
| `enableNativeAnnotations` | `boolean` | `false` | 是否允许编辑 PDF 原生批注 |
| `initialAnnotations` | `IAnnotationStore[]` | `[]` | 挂载时加载已有的批注数据 |

#### 事件

| 事件 | 负载 | 说明 |
|:------|:--------|:------------|
| `save` | `(annotations: Annotation[])` | 用户点击保存按钮时触发 |
| `load` | `()` | PDF 文档加载完成时触发 |
| `annotationAdded` | `(annotation: Annotation)` | 新建批注时触发 |
| `annotationDeleted` | `(id: string)` | 删除批注时触发 |
| `annotationSelected` | `(annotation: Annotation \| null, isClick: boolean)` | 选中批注时触发 |
| `annotationUpdated` | `(annotation: Annotation)` | 修改批注时触发 |

#### 插槽

| 插槽 | 作用域 | 说明 |
|:-----|:------|:------------|
| `actions` | `{ onSave, getAnnotations, exportToExcel, exportToPdf }` | 替换顶部工具栏右侧的默认保存/导出按钮 |

#### 暴露的方法

| 方法 | 签名 | 说明 |
|:-------|:----------|:------------|
| `save` | `() => void` | 以编程方式触发保存 |
| `getAnnotations` | `() => Annotation[]` | 获取当前批注（Core Annotation 格式） |

---

### PdfViewer

只读 PDF 查看器，支持搜索、缩放、主题和可自定义的工具栏 / 侧边栏插槽。

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|:-----|:-----|:--------|:------------|
| （所有基础属性） | | | 继承所有[基础属性](#基础属性pdfviewer-和-pdfannotator-共用) |
| `showTextLayer` | `boolean` | `true` | 是否启用不可见的文本层（用于搜索和文本选择） |
| `showAnnotations` | `boolean` | `false` | 是否显示 PDF 原生批注 |
| `toolbar` | `ToolbarItem[]` | — | 声明式工具栏配置 |
| `actions` | `ActionItem[]` | — | 声明式顶部操作按钮配置 |
| `sidebar` | `SidebarPanel[]` | `[]` | 额外的侧边栏面板（搜索面板默认已包含） |

#### 事件

| 事件 | 负载 | 说明 |
|:------|:--------|:------------|
| `documentLoaded` | `(viewer: PDFViewer)` | PDF 文档和查看器就绪时触发 |
| `eventBusReady` | `(bus: EventBus)` | PDF.js 事件总线可用时触发 |

#### 自定义工具栏

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

#### 自定义侧边栏面板

```vue
<script setup>
const customPanels = [
  { key: 'bookmarks', title: '书签', icon: 'bookmark' },
  { key: 'comments',  title: '评论', icon: 'message-circle' },
]
</script>

<template>
  <PdfViewer url="/document.pdf" :sidebar="customPanels">
    <template #sidebar-bookmarks>
      <div class="p-4">书签面板内容</div>
    </template>
    <template #sidebar-comments>
      <div class="p-4">评论面板内容</div>
    </template>
  </PdfViewer>
</template>
```

#### 自定义操作按钮

```vue
<template>
  <PdfViewer url="/document.pdf">
    <template #actions="{ currentScale }">
      <button @click="handleCustomAction">自定义操作 @ {{ currentScale }}%</button>
    </template>
  </PdfViewer>
</template>
```

---

## 扩展组件

InkLayer Vue 也导出内部构建块组件，供高级定制使用：

| 组件 | 说明 |
|:----------|:------------|
| `PdfViewerProvider` | 上下文提供者，为所有子组件注入 PDF 查看器状态 |
| `AnnotatorExtension` | 核心批注引擎扩展 |
| `AnnotationToolbar` | 内置批注工具栏 |
| `ZoomTool` | 独立缩放控件（默认工具栏中使用） |
| `ColorPicker` | 独立颜色选择器组件 |
| `AnnotationSidebar` | 批注列表面板 |
| `SearchSidebar` | 全文搜索侧边栏面板 |

---

## Composable 函数

| Composable | 说明 |
|:-----------|:------------|
| `usePdfViewer(containerRef, options)` | 初始化并管理 PDF.js 查看器实例 |
| `usePdfTool(pdfDocument)` | PDF 下载和打印工具 |
| `usePdfSearch(pdfViewer)` | PDF 全文搜索 |
| `useSmoothZoom(options)` | 基于滚动和触摸板捏合的平滑缩放 |
| `useSystemAppearance()` | 响应式亮色/暗色模式（跟随系统偏好） |
| `exportToExcel(annotations, fileName?)` | 将批注导出为 Excel 工作簿 |

---

## 浏览器兼支持

Chrome、Firefox、Safari、Edge 最新版本。

---
## 相关项目

- [InkLayer React](https://github.com/Laomai-codefee/inklayer-react) — React 版本
- [PDF.js](https://github.com/mozilla/pdf.js) — 底层 PDF 渲染引擎
---
## 许可证

MIT © InkLayer
