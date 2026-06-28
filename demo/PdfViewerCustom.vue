<template>
  <div>
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
  </div>
</template>

<script setup lang="ts">
import PdfViewer from '@/PdfViewer.vue'
import type { SidebarPanel } from '@/context/pdfViewerContext'

const pdfUrl = 'https://inklayer.dev/inklayer-demo.pdf'

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
</script>
