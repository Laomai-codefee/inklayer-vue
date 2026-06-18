/**
 * Demo 示例代码
 * 每个 key 对应一个 demo tab，显示的是给用户看的"如何使用"代码
 */
export const snippets: Record<string, string> = {
  PdfViewerBasic: `<template>
  <PdfViewer
    title="PDF VIEWER"
    url="/sample.pdf"
  />
</template>

<script setup lang="ts">
import { PdfViewer } from 'inklayer-vue'
import 'inklayer-vue/style'
<\/script>`,

  PdfViewerData: `<template>
  <PdfViewer
    title="PDF VIEWER DATA"
    :data="pdfData"
  />
</template>

<script setup lang="ts">
import { PdfViewer } from 'inklayer-vue'
import 'inklayer-vue/style'

const pdfData = '...' // base64 or byte array
<\/script>`,

  PdfViewerCustom: `<template>
  <PdfViewer
      :enable-range="false"
      title="PDF VIEWER CUSTOM"
      :url="pdfUrl"
      :layout-style="{ width: '100vw', height: '96vh' }"
      :show-text-layer="false"
      :show-annotations="true"
      default-active-sidebar-key="sidebar-1"
      :sidebar="customSidebar"
      @event-bus-ready="onEventBusReady"
      @document-loaded="(v) => console.log('document loaded', v)"
    >
      <!-- ====== Custom Actions (replace default Print button) ====== -->
      <template #actions="{ context }">
        <div style="display: flex; gap: 8px">
          <button @click="console.log(context.pdfViewer)">PDF Viewer</button>
          <button @click="context.toggleSidebar()">Toggle Sidebar</button>
          <button @click="context.openSidebar('sidebar-1')">Open Sidebar1</button>
          <button @click="context.closeSidebar()">Close Sidebar</button>
          <button @click="context.print()">Print</button>
          <button @click="context.download('test')">Download</button>
        </div>
      </template>

      <!-- ====== Custom Toolbar (replaces ZoomTool) ====== -->
      <template #toolbar="{ context }">
        <div style="display: flex; gap: 10px">
          <button @click="console.log(context.pdfViewer)">Get PDF Viewer</button>
          <button @click="context.toggleSidebar()">Toggle Sidebar</button>
          <button @click="(context.pdfViewer as any)?.scrollPageIntoView?.({ pageNumber: 1 })">goto page1</button>
          <button @click="(context.pdfViewer as any)?.scrollPageIntoView?.({ pageNumber: 10 })">goto page 10</button>
          <button @click="context.print()">print</button>
        </div>
      </template>

      <!-- ====== Sidebar Panel 1 ====== -->
      <template #sidebar-sidebar-1="{ context }">
        <div style="display: flex; gap: 10px; flex-direction: column; padding: 12px">
          Sidebar 1
          <button @click="context.toggleSidebar()">toggleSidebar</button>
          <button @click="console.log(context.pdfViewer)">Get PDF Viewer</button>
          <button @click="(context.pdfViewer as any)?.scrollPageIntoView?.({ pageNumber: 1 })">goto page1</button>
          <button @click="(context.pdfViewer as any)?.scrollPageIntoView?.({ pageNumber: 10 })">goto page 10</button>
          <button @click="context.print()">print</button>
          <button @click="context.download()">Download</button>
        </div>
      </template>

      <!-- ====== Sidebar Panel 2 ====== -->
      <template #sidebar-sidebar-2>
        <div style="display: flex; gap: 10px; flex-direction: column; padding: 12px">
          Sidebar 2
        </div>
      </template>
    </PdfViewer>
</template>

<script setup lang="ts">
import { PdfViewer } from 'inklayer-vue'
import 'inklayer-vue/style'

const pdfUrl = new URL('./compressed.tracemonkey-pldi-09.pdf', import.meta.url).href

const customSidebar: SidebarPanel[] = [
  { key: 'sidebar-1', title: 'Sidebar 1', icon: '📋' },
  { key: 'sidebar-2', title: 'Sidebar 2', icon: '📌' },
]

function onEventBusReady(eventBus: any) {
  console.log('eventBus', eventBus)
  eventBus?.on('pagerendered', ({ source, pageNumber, cssTransform }: any) => {
    console.log('Page rendered', source, pageNumber, cssTransform)
  })
  eventBus?.on('updateviewarea', (data: any) => {
    console.log('updateviewarea', data)
  })
  eventBus?.on('scalechanging', (data: any) => {
    console.log('scalechanging', data)
  })
  eventBus?.on('pagechanging', (data: any) => {
    console.log('pagechanging', data)
  })
}
<\/script>`,

  PdfAnnotatorBasic: `<template>
  <PdfAnnotator
    title="PDF ANNOTATOR"
    url="/sample.pdf"
    :user="{ id: 'u1', name: 'Alice' }"
    @save="(annotations) => console.log(annotations)"
  />
</template>

<script setup lang="ts">
import { PdfAnnotator } from 'inklayer-vue'
import 'inklayer-vue/style'
<\/script>`,

  PdfAnnotatorCustom: `<template>
  <PdfAnnotator
            theme="violet"
            :enable-range="false"
            title="PDF ANNOTATOR CUSTOM"
            :url="pdfUrl"
            :default-show-annotations-sidebar="true"
            :user="{ id: '9527', name: 'Lao Mai' }"
            :enable-native-annotations="false"
            :initial-annotations="initialAnnotations"
            :default-options="customOptions"
            :layout-style="{ height: '96vh' }"
            @save="(a) => console.log('Saved:', a)"
            @load="() => console.log('🎉 PDF Loaded')"
            @annotation-added="(a) => console.log('➕', (a as any).id, (a as any).kind)"
            @annotation-deleted="(id) => console.log('➖', id)"
            @annotation-updated="(a) => console.log('✏️', (a as any).id)"
            @annotation-selected="(a, isClick) => console.log('👉', (a as any)?.id, isClick)"
        >
            <!-- ====== Custom Actions (align React) ====== -->
            <template #actions="{ onSave, getAnnotations, exportToExcel, exportToPdf }">
                <div style="display: flex; gap: 8px">
                    <button @click="onSave()">💾 Save</button>
                    <button @click="console.log('Core:', getAnnotations())">📦 Log Data</button>
                    <button @click="exportToExcel('Export Excel')">📊 Excel</button>
                    <button @click="exportToPdf('Export PDF')">📄 PDF</button>
                </div>
            </template>
        </PdfAnnotator>
</template>

<script setup lang="ts">
import { PdfAnnotator } from 'inklayer-vue'
import 'inklayer-vue/style'

import qiantubifengshouxietiFont from './fonts/qiantubifengshouxieti.ttf'
const pdfUrl = new URL('./compressed.tracemonkey-pldi-09.pdf', import.meta.url).href

const customOptions = {
    signature: {
        defaultSignature: [
            'data:image/png;base64,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'],
        type: 'Draw' as const,
        defaultFont: [
            { label: '楷体', value: 'STKaiti', external: false },
            { label: '千图笔锋手写体', value: 'qiantubifengshouxieti', external: true, url: qiantubifengshouxietiFont }
        ]
    },
    stamp: {
        defaultStamp: [
            'data:image/png;base64,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']
    }
}

const initialAnnotations = [
    {
        id: 'BzGHwy94HKi2Okm7ViT4a',
        kind: 'shape',
        target: {
            pageIndex: 0,
            geometry: {
                type: 'rect',
                rect: {
                    x: 114.21988950276352,
                    y: 36.83954058623022,
                    width: 407.7093922651926,
                    height: 45.67810206565918
                }
            },
            coordinateSystem: 'pdf-user-space'
        },
        payload: {
            kind: 'shape',
            shape: 'rect'
        },
        appearance: {
            strokeColor: '#da3324',
            fillColor: 'rgba(218, 51, 36, 0.3)',
            opacity: 1
        },
        relations: {},
        meta: {
            createdAt: "D:20251208201803+08'00'",
            updatedAt: "D:20251208201803+08'00'",
            authorId: {
                id: '9528',
                name: 'codefee'
            },
            isNative: false,
            source: 'inklayer'
        },
        extensions: {
            konva: {
                serialized:
                    '{"attrs":{"name":"InkLayer_Annotator_shape_group","id":"BzGHwy94HKi2Okm7ViT4a","draggable":true,"x":-740.6292037573312,"y":13.564867326616417,"scaleX":3.943030872970916,"scaleY":0.6223174668345937},"className":"Group","children":[{"attrs":{"x":217.80000000000004,"y":38.400000000000006,"width":101.4,"height":71.4,"strokeScaleEnabled":false,"stroke":"#da3324"},"className":"Rect"}]}',
                clientRect: {
                    x: 114.21988950276352,
                    y: 36.83954058623022,
                    width: 407.7093922651926,
                    height: 45.67810206565918
                }
            },
            pdfjs: {
                type: 'SQUARE',
                subtype: 'Square'
            },
            legacy: {
                title: 'codefee',
                contentsObj: {
                    text: ''
                },
                comments: [
                    {
                        id: 'yC7Jee40rC8KbgcphjwCN',
                        title: 'Lao Mai',
                        date: "D:20251217153543+08'00'",
                        content: 'Reply'
                    }
                ]
            }
        }
    },
    {
        id: 'PBo08272eddFxgo0-Us2g',
        kind: 'text-markup',
        target: {
            pageIndex: 0,
            geometry: {
                type: 'quad',
                quads: [
                    {
                        p1: {
                            x: 68.296875,
                            y: 148.20000000000002
                        },
                        p2: {
                            x: 516.73125,
                            y: 148.20000000000002
                        },
                        p3: {
                            x: 68.296875,
                            y: 177.253125
                        },
                        p4: {
                            x: 516.73125,
                            y: 177.253125
                        }
                    }
                ]
            },
            coordinateSystem: 'pdf-user-space'
        },
        payload: {
            kind: 'text-markup',
            variant: 'highlight',
            color: '#b4fa56'
        },
        appearance: {
            strokeColor: '#b4fa56',
            fillColor: 'rgba(180, 250, 86, 0.3)',
            opacity: 1
        },
        relations: {},
        meta: {
            createdAt: "D:20260611165820+08'00'",
            updatedAt: "D:20260611165820+08'00'",
            authorId: {
                id: '9527',
                name: 'Lao Mai'
            },
            isNative: false,
            source: 'inklayer'
        },
        extensions: {
            konva: {
                serialized:
                    '{"attrs":{"name":"InkLayer_Annotator_shape_group","id":"PBo08272eddFxgo0-Us2g"},"className":"Group","children":[{"attrs":{"x":93.50625000000001,"y":148.20000000000002,"width":423.225,"height":15.000000000000002,"opacity":0.5,"fill":"#b4fa56"},"className":"Rect"},{"attrs":{"x":68.296875,"y":161.18437500000002,"width":143.4,"height":15.000000000000002,"opacity":0.5,"fill":"#b4fa56"},"className":"Rect"},{"attrs":{"x":214.50000000000003,"y":162.253125,"width":63.139233398437504,"height":15.000000000000002,"opacity":0.5,"fill":"#b4fa56"},"className":"Rect"}]}',
                clientRect: {
                    x: 68.296875,
                    y: 148.20000000000002,
                    width: 448.43437500000005,
                    height: 29.053124999999994
                }
            },
            pdfjs: {
                type: 'HIGHLIGHT',
                subtype: 'Highlight'
            },
            legacy: {
                title: 'Lao Mai',
                contentsObj: {
                    text: 'Mohammad R. Haghighat$, Blake ...n∗, Edwin Smith#, Rick Reitmai'
                },
                comments: []
            }
        }
    }
]
<\/script>`,

  PdfAnnotatorFull: `<template>
  <PdfAnnotator
      theme="amber"
      :enable-range="true"
      title="PDF ANNOTATOR FULL"
      :url="pdfUrl"
      :default-show-annotations-sidebar="true"
      :user="{ id: '9527', name: 'Lao Mai' }"
      :enable-native-annotations="true"
      locale="en-US"
      :initial-annotations="[]"
      :default-options="defaultOptions"
      :layout-style="{ height: '96vh' }"
      @save="(a) => console.log('Saved:', a)"
      @load="() => console.log('🎉 PDF Loaded')"
      @annotation-added="(a) => console.log('➕', (a as any).id, (a as any).kind)"
      @annotation-deleted="(id) => console.log('➖', id)"
      @annotation-updated="(a) => console.log('✏️', (a as any).id)"
      @annotation-selected="(a, isClick) => console.log('👉', (a as any)?.id, isClick)"
    >
      <!-- ====== Custom Actions (align React Full demo) ====== -->
      <template #actions="{ onSave, getAnnotations, exportToExcel, exportToPdf }">
        <div style="display: flex; gap: 8px">
          <button @click="onSave()">💾 Save (InkLayer)</button>
          <button @click="console.log('Core:', getAnnotations())">📦 Get Annotations</button>
          <button @click="exportToExcel('Export Excel')">📊 Export Excel</button>
          <button @click="exportToPdf('Export PDF')">📄 Export PDF</button>
        </div>
      </template>
    </PdfAnnotator>
</template>

<script setup lang="ts">
import { PdfAnnotator } from 'inklayer-vue'
import 'inklayer-vue/style'

const pdfUrl = new URL('./compressed.tracemonkey-pldi-09.pdf', import.meta.url).href

const defaultOptions = {
  colors: ['red'],
  signature: {
    defaultSignature: [
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...' // truncated for brevity, will use empty
    ],
    defaultFont: [
      { label: '楷体', value: 'STKaiti', external: false },
      { label: '千图笔锋手写体', value: 'qiantubifengshouxieti', external: false },
      { label: '平方长安体', value: 'PingFangChangAnTi-2', external: false },
    ]
  },
  stamp: { defaultStamp: [] }
}
<\/script>`,
}
