<p align="center">
  <img src="https://raw.githubusercontent.com/Laomai-codefee/inklayer-vue/main/public/logo.svg" alt="InkLayer" width="80" />
</p>

<h1 align="center">InkLayer Vue</h1>

<p align="center">
  基于PDF.js构建的可扩展Vue3 PDF注释SDK和查看器
        <br/>支持文档审查、评论和注释编辑。
</p>

---
[English](./README-en-US.md) | 简体中文
---
[![NPM](https://img.shields.io/npm/v/inklayer-vue.svg)](https://www.npmjs.com/package/inklayer-vue)
[![Demo](https://img.shields.io/badge/demo-online-brightgreen)](https://laomai-codefee.github.io/inklayer-vue/)
[![License](https://img.shields.io/npm/l/inklayer-vue)](./LICENSE)

### [>>Online Demo](https://laomai-codefee.github.io/inklayer-vue/)


---

## ✨ 特性

- **丰富的批注系统** — 内置 13 种批注工具：矩形、圆形、自由手绘、自由高亮、箭头、云线、自由文本、签名、印章、文本高亮、文本删除线、文本下划线、便签注释
- **高保真 PDF 渲染** — 基于 PDF.js，支持文本层搜索、平滑缩放和多页滚动
- **完整主题系统** — 28 套基于 Radix 的预设配色，自动支持亮色/暗色模式
- **国际化** — 通过 `vue-i18n` 内置 zh-CN（简体中文）和 en-US（英文）语言支持
- **高度可定制的 UI** — 工具栏、侧边栏、操作按钮均可通过 Vue 具名插槽完全替换
- **`defaultOptions`** — 采用 DeepMerge / DeepPartial 模式，可部分覆盖配置而无需冗余代码
- **PDF 和 Excel 导出** — 支持将批注导出为带批注层的 PDF（基于 pdf-lib）或结构化的 Excel 文件（基于 exceljs）
- **可扩展架构** — 核心批注数据模型与渲染层解耦；适配器模式支持 PDF.js、Konva 及未来渲染引擎
- **Tree-Shaking 友好** — 库模式构建，输出完整 ESM/CJS 格式和 TypeScript 类型声明

---

## ✍️ 批注工具

| 工具 | 说明 |
|------|------|
| **矩形** | 绘制矩形形状 |
| **圆形** | 绘制椭圆形状 |
| **自由手绘** | 自由形式的墨迹绘制 |
| **自由高亮** | 半透明自由形式高亮标记 |
| **箭头** | 绘制带方向箭头的线条 |
| **云线** | 绘制云形多边形 |
| **自由文本** | 放置可编辑的文本框 |
| **签名** | 放置签名（上传图片、手绘、输入文字或默认签名） |
| **印章** | 放置自定义/标准印章（上传图片、自定义文字或默认印章） |
| **文本高亮** | 高亮选中的文本 |
| **文本删除线** | 为选中文本添加删除线 |
| **文本下划线** | 为选中文本添加下划线 |
| **便签注释** | 附加可折叠的注释便签 |

### ✍️ 编辑已有批注

支持编辑从 PDF 文档中加载的原生批注类型：

矩形（Square）、圆形（Circle）、墨迹（Ink）、自由文本（FreeText）、直线（Line）、多边形（Polygon）、折线（PolyLine）、文本（Text）、高亮（Highlight）、下划线（Underline）、删除线（StrikeOut）

---

## 📦 安装

```bash
npm install inklayer-vue
pnpm add inklayer-vue
yarn add inklayer-vue
```

---

## 🚀 快速开始

### PdfAnnotator — 完整批注工作区

```vue
<script setup>
import { PdfAnnotator } from 'inklayer-vue'
import 'inklayer-vue/dist/inklayer-vue.css'

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

### PdfViewer — 只读查看器（带搜索）

```vue
<script setup>
import { PdfViewer } from 'inklayer-vue'
import 'inklayer-vue/dist/inklayer-vue.css'
</script>

<template>
  <PdfViewer
    title="我的文档"
    url="/sample.pdf"
  />
</template>
```

---

## 🧩 组件

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

全功能 PDF 批注工作区。包含工具栏、批注侧边栏、搜索侧边栏和所有批注工具。

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
|:-----|:-----|:--------|:------------|
| （所有基础属性） | | | 继承所有[基础属性](#基础属性pdfviewer-和-pdfannotator-共用) |
| `defaultOptions` | `DeepPartial<PdfAnnotatorOptions>` | `{}` | 部分配置，将与系统默认值深度合并（见下方示例） |
| `defaultShowAnnotationsSidebar` | `boolean` | `false` | 挂载时默认打开批注侧边栏 |
| `enableNativeAnnotations` | `boolean` | `false` | 是否允许编辑 PDF 原生批注 |
| `initialAnnotations` | `IAnnotationStore[]` | `[]` | 挂载时加载已有的批注数据 |

#### ⚙️ `defaultOptions` — DeepPartial + DeepMerge 机制

InkLayer Vue 采用 `DeepPartial` + `DeepMerge` 的配置模式。你只需指定需要覆盖的字段，其余将自动回退到合理的默认值。

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

**`PdfAnnotatorOptions` 完整结构：**

<details>
<summary>点击展开</summary>

```ts
interface PdfAnnotatorOptions {
  /** 批注工具的预设颜色调色板 */
  colors: string[]
  
  /** 签名工具配置 */
  signature: {
    fontFamily?: string
    defaultName?: string
    defaultImage?: string
  }
  
  /** 印章工具配置 */
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

#### 属性

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

## 🧩 扩展组件

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

## 🛠 Composable 函数

| Composable | 说明 |
|:-----------|:------------|
| `usePdfViewer(containerRef, options)` | 初始化并管理 PDF.js 查看器实例 |
| `usePdfTool(pdfDocument)` | PDF 下载和打印工具 |
| `usePdfSearch(pdfViewer)` | PDF 全文搜索 |
| `useSmoothZoom(options)` | 基于滚动和触摸板捏合的平滑缩放 |
| `useSystemAppearance()` | 响应式亮色/暗色模式（跟随系统偏好） |
| `exportToExcel(annotations, fileName?)` | 将批注导出为 Excel 工作簿 |

---

## 📦 高级用法


### 配合 `PdfViewerProvider` 使用（无头模式）

```vue
<script setup>
import { PdfViewerProvider } from 'inklayer-vue'
</script>

<template>
  <PdfViewerProvider url="/document.pdf">
    <!-- 在此组件树内任意位置可访问 PDF 上下文 -->
    <YourCustomViewer />
  </PdfViewerProvider>
</template>
```

### 导入 shadcn-vue UI 组件

InkLayer Vue 重新导出其内部的 shadcn-vue 组件，方便你构建风格统一的自定义 UI：

```vue
<script setup>
import { Button, Input, Tabs, TabsList, TabsTrigger, TabsContent } from 'inklayer-vue'
</script>
```

---

## 🌍 浏览器兼容性

| <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/chrome/chrome_48x48.png" width="24" /> | <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/firefox/firefox_48x48.png" width="24" /> | <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/safari/safari_48x48.png" width="24" /> | <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/edge/edge_48x48.png" width="24" /> |
|:---:|:---:|:---:|:---:|
| Chrome 最新版 | Firefox 最新版 | Safari 最新版 | Edge 最新版 |

---

## 📄 许可证

MIT © InkLayer
