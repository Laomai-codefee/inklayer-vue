<template>
  <!-- Signature Popover -->
  <Popover :open="disabled ? false : popoverOpen" @update:open="popoverOpen = disabled ? false : $event">
    <template #trigger>
      <Button variant="ghost" size="icon" class="size-8"
        :class="active ? 'bg-primary/15 text-primary hover:bg-primary/25' : ''"
        :title="t('annotator.tool.signature')"
        :disabled="disabled">
        <Icon name="signature" :size="18" />
      </Button>
    </template>

    <div class="w-[180px] p-3">
      <ScrollArea v-if="allSignatures.length" class="max-h-[200px]">
        <ul class="space-y-2">
          <li v-for="(s, i) in allSignatures" :key="i"
            class="h-12 rounded bg-white border border-border overflow-hidden cursor-pointer hover:border-ring transition-colors flex items-center justify-center"
            @click="selectSig(s); popoverOpen = false">
            <img :src="s" class="h-full max-w-full object-contain p-1" />
          </li>
        </ul>
      </ScrollArea>
      <Button variant="outline" size="sm" class="w-full mt-3 text-xs gap-1" @click="openModal">
        + {{ t('annotator.common.createSignature') }}
      </Button>
    </div>
  </Popover>

  <!-- Editor Dialog -->
  <Teleport to="body">
    <div v-if="modalOpen" class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40" @click.self="modalOpen = false">
      <div class="bg-background text-foreground rounded-lg border border-border shadow-lg w-[550px] max-h-[90vh] overflow-y-auto p-5" @click.stop>
        <h3 class="text-sm font-semibold mb-4">{{ t('annotator.common.createSignature') }}</h3>

        <!-- Mode switcher -->
        <div class="flex justify-center mb-4">
          <div class="flex rounded-full bg-muted p-0.5">
          <button v-for="m in editorModes" :key="m.value"
            class="px-5 py-1.5 text-xs rounded-full transition-colors"
            :class="signatureType === m.value ? 'bg-background shadow-sm font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="setSignatureType(m.value)">{{ m.label }}</button>
          </div>
        </div>

        <!-- Toolbar: colors + font (left) | clear (right) -->
        <div class="flex items-center justify-between mb-2 px-2 py-1.5 border border-border rounded-md">
          <div class="flex items-center gap-1">
            <template v-if="signatureType !== 'Upload'">
              <button v-for="c in signatureColors" :key="c"
                class="size-5 rounded-full border-2 transition-all duration-150 hover:scale-110"
                :class="currentColor === c ? 'border-foreground scale-110' : 'border-transparent'"
                :style="{ backgroundColor: c }"
                @click="changeColor(c)" />
              <select v-if="signatureType === 'Enter'" v-model="fontFamily"
                class="ml-2 text-xs rounded border border-border bg-background text-foreground px-1.5 py-1 outline-none"
                @change="loadFont(fontFamily)">
                <option v-for="f in handwritingFonts" :key="f.value" :value="f.value">{{ f.label }}</option>
              </select>
            </template>
          </div>
          <Button variant="ghost" size="sm" class="text-xs" @click="handleClear">{{ t('common.clear') }}</Button>
        </div>

        <!-- Content area -->
        <div class="relative rounded-md bg-white border border-border overflow-hidden" style="width:420px;height:200px;margin:0 auto;">
          <!-- Enter mode -->
          <Input v-if="signatureType === 'Enter'"
            ref="enterInputRef"
            v-model="typedText"
            class="w-full h-full border-none text-center"
            :placeholder="t('annotator.editor.signature.area')"
            :style="{ color: currentColor, fontFamily, fontSize: '80px', lineHeight: '200px' }" />

          <!-- Draw mode -->
          <template v-if="signatureType === 'Draw'">
            <div class="absolute inset-0 flex items-center justify-center text-gray-300 text-[80px] pointer-events-none select-none">
              {{ t('annotator.editor.signature.area') }}
            </div>
            <div ref="konvaContainerRef" class="w-full h-full relative z-10" style="cursor:crosshair" />
          </template>

          <!-- Upload mode -->
          <template v-if="signatureType === 'Upload'">
            <div v-if="uploadPreview" class="w-full h-full flex items-center justify-center">
              <img :src="uploadPreview" class="max-w-full max-h-full object-contain" />
            </div>
            <div v-else class="w-full h-full flex flex-col items-center justify-center gap-3">
              <input ref="fileInputRef" type="file" :accept="signatureAccept" class="hidden" @change="onFileChange" />
              <Button size="sm" @click="fileInputRef?.click()">{{ t('annotator.editor.signature.choose') }}</Button>
              <p class="text-xs text-muted-foreground text-center px-4">
                {{ t('annotator.editor.signature.uploadHint', { format: signatureAccept, maxSize: formatFileSize(signatureMaxSize) }) }}
              </p>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3 mt-4">
          <Button variant="outline" class="w-[100px]" @click="modalOpen = false">{{ t('common.cancel') }}</Button>
          <Button class="w-[100px]" :disabled="okDisabled" @click="handleOk">{{ t('common.ok') }}</Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import Konva from 'konva'
import { Popover } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import Icon from '@/components/Icon.vue'
import { useT } from '@/composables/useT'
import { defaultOptions } from '../../const/default_options'
import { loadFontWithFontFace } from '../../utils/fontLoader'
import { formatFileSize } from '../../utils/utils'

const { t } = useT()

const props = defineProps<{ active?: boolean; defaultSignatures?: string[]; signatureOptions?: typeof defaultOptions.signature; disabled?: boolean }>()
const emit = defineEmits<{ select: [dataUrl: string] }>()

// Options: user-provided first, fallback to system defaults
const sigDefaults = defaultOptions.signature!
const sig = computed(() => props.signatureOptions || sigDefaults)
const signatureColors = computed(() => sig.value.colors!)
const signatureAccept = computed(() => sig.value.accept!)
const maxUploadImageSize = 600
const handwritingFonts = computed(() => sig.value.defaultFont!)
const signatureDefaultType = computed(() => sig.value.type!)
const signatureMaxSize = computed(() => sig.value.maxSize!)
const defaultSignatures = computed(() => props.defaultSignatures?.length ? props.defaultSignatures : sigDefaults.defaultSignature!)

const popoverOpen = ref(false)
const customSigs = ref<string[]>([])
const allSignatures = computed(() => [...defaultSignatures.value, ...customSigs.value])
function selectSig(d: string) { if (!props.disabled) emit('select', d) }

async function loadFont(value: string) {
  const fontItem = handwritingFonts.value.find(f => f.value === value)
  if (fontItem?.external) {
    try { await loadFontWithFontFace(fontItem) } catch { /* ignore */ }
  }
}

// Editor
const modalOpen = ref(false)
type SigType = 'Enter' | 'Draw' | 'Upload'
const signatureType = ref<SigType>('Enter')
const editorModes = computed<{ value: SigType; label: string }[]>(() => [
  { value: 'Enter', label: t('common.enter') },
  { value: 'Draw', label: t('common.draw') },
  { value: 'Upload', label: t('common.upload') },
])
const currentColor = ref(signatureColors.value[0])
const typedText = ref('')
const fontFamily = ref(handwritingFonts.value[0]?.value || 'Arial')
const uploadPreview = ref<string | null>(null)

// Controls
const enterInputRef = ref<HTMLInputElement | null>(null)
const konvaContainerRef = ref<HTMLDivElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Konva stage
let konvaStage: Konva.Stage | null = null
const hasDrawn = ref(false)

function initKonva() {
  if (!konvaContainerRef.value) return
  konvaStage?.destroy()
  konvaStage = new Konva.Stage({
    container: konvaContainerRef.value,
    width: 420,
    height: 200,
  })
  const layer = new Konva.Layer()
  konvaStage.add(layer)

  let painting = false
  let lastLine: Konva.Line | null = null

  konvaStage.on('mousedown touchstart', () => {
    painting = true
    const pos = konvaStage!.getPointerPosition()
    if (!pos) return
    lastLine = new Konva.Line({
      stroke: currentColor.value,
      strokeWidth: 3,
      globalCompositeOperation: 'source-over',
      lineCap: 'round',
      lineJoin: 'round',
      points: [pos.x, pos.y],
    })
    layer.add(lastLine)
  })
  konvaStage.on('mousemove touchmove', (e) => {
    if (!painting || !lastLine) return
    e.evt.preventDefault()
    const pos = konvaStage!.getPointerPosition()
    if (!pos) return
    lastLine.points([...lastLine.points(), pos.x, pos.y])
    hasDrawn.value = true
  })
  konvaStage.on('mouseup touchend', () => { painting = false; lastLine = null })
}

function changeColor(c: string) {
  currentColor.value = c
  if (konvaStage) {
    const lines = konvaStage.getLayers()[0]?.getChildren((n) => n.getClassName() === 'Line') || []
    lines.forEach((line: any) => line.stroke(c))
  }
}

const okDisabled = computed(() => {
  if (signatureType.value === 'Enter') return !typedText.value.trim()
  if (signatureType.value === 'Draw') return !hasDrawn.value
  if (signatureType.value === 'Upload') return !uploadPreview.value
  return true
})

function handleClear() {
  if (signatureType.value === 'Draw') {
    konvaStage?.getLayers()[0]?.destroyChildren()
    hasDrawn.value = false
  }
  typedText.value = ''
  uploadPreview.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function setSignatureType(type: SigType) {
  signatureType.value = type
  typedText.value = ''
  uploadPreview.value = null
  hasDrawn.value = false
  if (type === 'Draw') {
    nextTick(() => { setTimeout(initKonva, 100) })
  } else {
    konvaStage?.destroy()
    konvaStage = null
  }
  if (type === 'Enter') nextTick(() => enterInputRef.value?.focus())
}

async function openModal() {
  if (props.disabled) return
  popoverOpen.value = false
  modalOpen.value = true
  signatureType.value = (signatureDefaultType.value as SigType) || 'Enter'
  typedText.value = ''
  uploadPreview.value = null
  hasDrawn.value = false
  if (signatureType.value === 'Draw') {
    nextTick(() => { setTimeout(initKonva, 100) })
  } else if (signatureType.value === 'Enter') {
    nextTick(() => enterInputRef.value?.focus())
  }
  // Load font
  const fontItem = handwritingFonts.value.find(f => f.value === fontFamily.value)
  if (fontItem?.external) {
    try { await loadFontWithFontFace(fontItem) } catch { /* ignore */ }
  }
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.src = reader.result as string
    img.onload = () => {
      let { width, height } = img
      if (width > height && width > maxUploadImageSize) {
        height = Math.round((height * maxUploadImageSize) / width)
        width = maxUploadImageSize
      } else if (height > maxUploadImageSize) {
        width = Math.round((width * maxUploadImageSize) / height)
        height = maxUploadImageSize
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
      uploadPreview.value = canvas.toDataURL('image/png')
      target.value = ''
    }
  }
  reader.readAsDataURL(file)
}

function handleOk() {
  if (props.disabled) return
  let dataUrl = ''
  if (signatureType.value === 'Draw') {
    dataUrl = konvaStage?.toDataURL() || ''
  } else if (signatureType.value === 'Enter') {
    const canvas = document.createElement('canvas')
    canvas.width = 382; canvas.height = 200
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.font = `80px "${fontFamily.value}", cursive, sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillStyle = currentColor.value
      ctx.fillText(typedText.value, canvas.width / 2, canvas.height / 2)
    }
    dataUrl = canvas.toDataURL('image/png')
  } else if (signatureType.value === 'Upload' && uploadPreview.value) {
    dataUrl = uploadPreview.value
  }
  if (dataUrl) {
    customSigs.value.push(dataUrl)
    emit('select', dataUrl)
  }
  modalOpen.value = false
}
</script>
