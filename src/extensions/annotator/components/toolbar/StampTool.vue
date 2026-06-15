<template>
  <!-- Stamp Popover -->
  <Popover :open="popoverOpen" @update:open="popoverOpen = $event">
    <template #trigger>
      <Button variant="ghost" size="icon" class="size-8"
        :class="active ? 'bg-primary/15 text-primary hover:bg-primary/25' : ''"
        :title="$t('annotator.tool.stamp')">
        <Icon name="stamp" :size="18" />
      </Button>
    </template>

    <div class="w-[200px] p-3">
      <!-- Tabs -->
      <div class="flex rounded-full bg-muted p-0.5 mb-3">
        <button class="flex-1 text-xs py-1 rounded-full transition-colors"
          :class="tab === 'default' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'"
          @click="tab = 'default'">{{ $t('common.default') }}</button>
        <button class="flex-1 text-xs py-1 rounded-full transition-colors"
          :class="tab === 'custom' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'"
          @click="tab = 'custom'">{{ $t('common.custom') }}</button>
      </div>

      <!-- Default stamps -->
      <template v-if="tab === 'default'">
        <div v-if="!allStamps.default.length" class="text-xs text-muted-foreground text-center py-4">
          {{ $t('annotator.editor.stamp.defaultStampNotSet') }}
        </div>
        <ScrollArea v-else class="max-h-[200px]">
          <ul class="space-y-2">
            <li v-for="(s, i) in allStamps.default" :key="i"
              class="h-12 rounded bg-white border border-border overflow-hidden cursor-pointer hover:border-ring transition-colors flex items-center justify-center"
              @click="emitStamp(s); popoverOpen = false">
              <img :src="s" class="h-full max-w-full object-contain p-1" />
            </li>
          </ul>
        </ScrollArea>
      </template>

      <!-- Custom stamps -->
      <template v-if="tab === 'custom'">
        <ScrollArea v-if="allStamps.custom.length" class="max-h-[160px]">
          <ul class="space-y-2">
            <li v-for="(s, i) in allStamps.custom" :key="i"
              class="h-12 rounded bg-white border border-border overflow-hidden cursor-pointer hover:border-ring transition-colors flex items-center justify-center"
              @click="emitStamp(s); popoverOpen = false">
              <img :src="s" class="h-full max-w-full object-contain p-1" />
            </li>
          </ul>
        </ScrollArea>
        <Button variant="outline" size="sm" class="w-full mt-3 text-xs gap-1" @click="openEditor">
          + {{ $t('annotator.common.createStamp') }}
        </Button>
        <Separator class="my-3" />
        <input ref="fileInputRef" type="file" :accept="stampAccept" class="hidden" @change="onFileUpload" />
        <Tooltip :content="uploadHint">
          <template #trigger>
            <Button variant="ghost" size="sm" class="w-full text-xs" @click="fileInputRef?.click()">
              {{ $t('annotator.editor.stamp.upload') }}
            </Button>
          </template>
        </Tooltip>
      </template>
    </div>
  </Popover>

  <!-- Stamp Editor Dialog -->
  <Teleport to="body">
    <div v-if="editorOpen" class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40" @click.self="editorOpen = false">
      <div class="bg-background rounded-lg border border-border shadow-lg w-[550px] max-h-[90vh] overflow-y-auto p-5" @click.stop>
        <h3 class="text-sm font-semibold mb-4">{{ $t('annotator.common.createStamp') }}</h3>

        <!-- Konva Preview -->
        <div ref="konvaContainer" class="h-[120px] rounded-md border border-border bg-muted/30 overflow-hidden mb-4" />

        <!-- Stamp Text -->
        <label class="block mb-4">
          <span class="text-xs text-muted-foreground">{{ $t('annotator.editor.stamp.stampText') }}</span>
          <input v-model="form.stampText"
            class="flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs mt-1 outline-none focus:border-ring"
            @input="renderPreview" />
        </label>

        <!-- Colors row -->
        <div class="grid grid-cols-3 gap-3 mb-4">
          <div class="flex flex-col gap-1">
            <span class="text-xs text-muted-foreground">{{ $t('annotator.editor.stamp.textColor') }}</span>
            <ColorPicker v-model="form.textColor" :presets="colors" @update:model-value="renderPreview" />
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-muted-foreground">{{ $t('annotator.editor.stamp.backgroundColor') }}</span>
            <ColorPicker v-model="form.backgroundColor" :presets="colors" @update:model-value="renderPreview" />
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-muted-foreground">{{ $t('annotator.editor.stamp.borderColor') }}</span>
            <ColorPicker v-model="form.borderColor" :presets="colors" @update:model-value="renderPreview" />
          </div>
        </div>

        <!-- Font style + Border style -->
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div>
            <span class="text-xs text-muted-foreground">{{ $t('annotator.editor.stamp.fontStyle') }}</span>
            <div class="flex gap-1 mt-1">
              <button v-for="s in fontStyles" :key="s.value"
                class="size-7 flex items-center justify-center rounded text-xs border transition-colors"
                :class="form.fontStyle.includes(s.value) ? 'bg-accent border-ring' : 'border-border hover:bg-accent/50'"
                @click="toggleFontStyle(s.value); renderPreview()"><span v-html="s.icon" /></button>
            </div>
          </div>
          <div>
            <span class="text-xs text-muted-foreground">{{ $t('annotator.editor.stamp.fontFamily') }}</span>
            <select v-model="form.fontFamily"
              class="flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs mt-1 outline-none"
              @change="renderPreview">
              <option v-for="f in defaultFontList" :key="f.value" :value="f.value">{{ f.label }}</option>
            </select>
          </div>
        </div>

        <!-- Border style -->
        <div class="mb-4">
          <span class="text-xs text-muted-foreground">{{ $t('annotator.editor.stamp.borderStyle') }}</span>
          <select v-model="form.borderStyle"
            class="flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs mt-1 outline-none"
            @change="renderPreview">
            <option value="solid">{{ $t('annotator.editor.stamp.solid') }}</option>
            <option value="dashed">{{ $t('annotator.editor.stamp.dashed') }}</option>
            <option value="none">{{ $t('annotator.editor.stamp.none') }}</option>
          </select>
        </div>

        <Separator class="my-4" />

        <!-- Timestamp section -->
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div>
            <span class="text-xs text-muted-foreground">{{ $t('annotator.editor.stamp.timestampText') }}</span>
            <div class="flex gap-3 mt-1">
              <label class="flex items-center gap-1 text-xs">
                <input type="checkbox" :checked="form.timestamp.includes('username')" class="size-3"
                  @change="toggleTimestamp('username'); renderPreview()" />
                {{ $t('annotator.editor.stamp.username') }}
              </label>
              <label class="flex items-center gap-1 text-xs">
                <input type="checkbox" :checked="form.timestamp.includes('date')" class="size-3"
                  @change="toggleTimestamp('date'); renderPreview()" />
                {{ $t('annotator.editor.stamp.date') }}
              </label>
            </div>
          </div>
          <div>
            <span class="text-xs text-muted-foreground">{{ $t('annotator.editor.stamp.dateFormat') }}</span>
            <select v-model="form.dateFormat"
              class="flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs mt-1 outline-none"
              :disabled="!form.timestamp.includes('date')"
              @change="renderPreview">
              <optgroup v-for="g in dateFormatOptions" :key="g.label" :label="g.label">
                <option v-for="o in g.options" :key="o.value" :value="o.value">{{ o.label }}</option>
              </optgroup>
            </select>
          </div>
        </div>

        <!-- Custom timestamp text -->
        <label class="block mb-4">
          <span class="text-xs text-muted-foreground">{{ $t('annotator.editor.stamp.customTimestamp') }}</span>
          <input v-model="form.customTimestampText"
            class="flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs mt-1 outline-none focus:border-ring"
            @input="renderPreview" />
        </label>

        <!-- Footer -->
        <div class="flex justify-end gap-3 pt-2">
          <Button variant="outline" class="w-[100px]" @click="editorOpen = false">{{ $t('common.cancel') }}</Button>
          <Button class="w-[100px]" @click="handleOk">{{ $t('common.ok') }}</Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onUnmounted } from 'vue'
import Konva from 'konva'
import { Popover } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import Icon from '@/components/Icon.vue'
import ColorPicker from './ColorPicker.vue'
import { useI18n } from 'vue-i18n'
import { defaultOptions } from '../../const/default_options'
import { formatFileSize } from '../../utils/utils'

const { t: $t } = useI18n({ useScope: 'global' })

const props = defineProps<{ active?: boolean; defaultStamps?: string[]; stampOptions?: typeof defaultOptions.stamp; colors?: string[] }>()
const emit = defineEmits<{ select: [dataUrl: string] }>()

// Options: user-provided first, fallback to system defaults
const stampDefaults = defaultOptions.stamp!
const stamp = computed(() => props.stampOptions || stampDefaults)
const stampAccept = computed(() => stamp.value.accept!)
const stampMaxSize = computed(() => stamp.value.maxSize!)
const defaultFontList = computed(() => stamp.value.editor!.defaultFont!)
const colors = computed(() => props.colors?.length ? props.colors : defaultOptions.colors!)

const uploadHint = computed(() => $t('annotator.editor.signature.uploadHint', { format: stampAccept.value, maxSize: formatFileSize(stampMaxSize.value) }))

const popoverOpen = ref(false)
const tab = ref<'default' | 'custom'>(props.defaultStamps?.length ? 'default' : 'custom')
const customStamps = ref<string[]>([])
const allStamps = computed(() => ({ default: props.defaultStamps || [], custom: customStamps.value }))
const fileInputRef = ref<HTMLInputElement | null>(null)

function emitStamp(d: string) { emit('select', d) }

// Date format options (align React)
const dateFormatOptions = [
  { label: '📅', options: [{ label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }, { label: 'YYYY/MM/DD', value: 'YYYY/MM/DD' }, { label: 'YYYY年MM月DD日', value: 'YYYY年MM月DD日' }, { label: 'DD-MM-YYYY', value: 'DD-MM-YYYY' }, { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' }, { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' }] },
  { label: '⏰', options: [{ label: 'HH:mm:ss', value: 'HH:mm:ss' }, { label: 'HH:mm', value: 'HH:mm' }, { label: 'hh:mm A', value: 'hh:mm A' }] },
  { label: '🗓️', options: [{ label: 'YYYY-MM-DD HH:mm:ss', value: 'YYYY-MM-DD HH:mm:ss' }, { label: 'YYYY-MM-DD HH:mm', value: 'YYYY-MM-DD HH:mm' }, { label: 'DD/MM/YYYY HH:mm', value: 'DD/MM/YYYY HH:mm' }, { label: 'YYYY年MM月DD日 HH:mm', value: 'YYYY年MM月DD日 HH:mm' }] },
]

// Simple date format function (replaces dayjs)
function formatDate(date: Date, fmt: string): string {
  const d = date
  const pad = (n: number) => String(n).padStart(2, '0')
  return fmt
    .replace('YYYY', String(d.getFullYear()))
    .replace('MM', pad(d.getMonth() + 1))
    .replace('DD', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()))
}

// Font styles
const fontStyles = [
  { value: 'bold', label: 'Bold', icon: '<b>B</b>' },
  { value: 'italic', label: 'Italic', icon: '<i>I</i>' },
  { value: 'underline', label: 'Underline', icon: '<u>U</u>' },
  { value: 'strikeout', label: 'Strikeout', icon: '<s>S</s>' },
]

// Form
interface FormData {
  stampText: string; textColor: string; backgroundColor: string; borderColor: string
  borderStyle: string; fontStyle: string[]; fontFamily: string
  timestamp: string[]; customTimestampText: string; dateFormat: string
}
const stampEditor = computed(() => stamp.value.editor!)
const form = reactive<FormData>({
  stampText: $t('annotator.editor.stamp.defaultText'),
  textColor: stampEditor.value.defaultTextColor!,
  backgroundColor: stampEditor.value.defaultBackgroundColor!,
  borderColor: stampEditor.value.defaultBorderColor!,
  borderStyle: stampEditor.value.defaultBorderStyle!,
  fontStyle: [],
  fontFamily: stampEditor.value.defaultFont![0]?.value || 'Arial',
  timestamp: ['username', 'date'],
  customTimestampText: '',
  dateFormat: 'YYYY-MM-DD',
})

function toggleFontStyle(s: string) {
  const i = form.fontStyle.indexOf(s)
  i >= 0 ? form.fontStyle.splice(i, 1) : form.fontStyle.push(s)
}
function toggleTimestamp(key: string) {
  const i = form.timestamp.indexOf(key)
  i >= 0 ? form.timestamp.splice(i, 1) : form.timestamp.push(key)
}

// Editor
const editorOpen = ref(false)
const konvaContainer = ref<HTMLDivElement | null>(null)
let konvaStage: Konva.Stage | null = null

const STAMP_WIDTH = 470
const STAMP_HEIGHT = 120

function renderPreview() {
  if (!konvaContainer.value) return
  konvaStage?.destroy()

  const stage = new Konva.Stage({ container: konvaContainer.value, width: STAMP_WIDTH, height: STAMP_HEIGHT })
  const layer = new Konva.Layer()

  const { stampText, textColor, backgroundColor, borderColor, borderStyle, fontStyle: fs, fontFamily, timestamp, dateFormat, customTimestampText } = form

  // Font style
  const parts: string[] = []
  if (fs.includes('italic')) parts.push('italic')
  if (fs.includes('bold')) parts.push('bold')
  const fontStyleVal = parts.join(' ') || 'normal'
  const isUnderline = fs.includes('underline')
  const isStrikeout = fs.includes('strikeout')

  // Timestamp parts
  const now = new Date()
  const user = 'User'
  const formattedDate = dateFormat ? formatDate(now, dateFormat) : ''
  const customText = customTimestampText?.trim()
  const tsParts = [
    timestamp.includes('username') ? user : null,
    timestamp.includes('date') ? formattedDate : null,
    customText || null,
  ].filter(Boolean)
  const timestampText = tsParts.join(' · ')

  let textFontSize = 30
  const timeFontSize = 16
  const spacing = 10

  // Measure text
  const tempText = new Konva.Text({ text: stampText, fontSize: textFontSize, fontStyle: fontStyleVal, fontFamily })
  const tempTs = new Konva.Text({ text: timestampText, fontSize: timeFontSize, fontFamily })
  const contentWidth = Math.max(tempText.width(), tempTs.width()) + 60
  const contentHeight = (timestampText ? textFontSize + spacing + timeFontSize : textFontSize * 1.2) + 25

  const shapeWidth = Math.max(contentWidth, 180)
  const shapeHeight = Math.max(contentHeight, 60)

  // Shape
  layer.add(new Konva.Rect({
    name: 'StampGroup',
    width: shapeWidth, height: shapeHeight,
    x: (STAMP_WIDTH - shapeWidth) / 2, y: (STAMP_HEIGHT - shapeHeight) / 2,
    fill: backgroundColor,
    strokeWidth: borderStyle === 'none' ? 0 : 5,
    stroke: borderColor || backgroundColor,
    dash: borderStyle === 'dashed' ? [5, 5] : undefined,
    cornerRadius: 10,
  }))

  if (!timestampText) textFontSize *= 1.2
  const textY = timestampText
    ? (STAMP_HEIGHT - shapeHeight) / 2 + 15
    : (STAMP_HEIGHT - shapeHeight) / 2 + shapeHeight / 2 - textFontSize / 2

  // Stamp text
  layer.add(new Konva.Text({
    text: stampText, x: 0, y: textY, width: STAMP_WIDTH, align: 'center',
    fontSize: textFontSize, fontStyle: fontStyleVal, fontFamily, fill: textColor,
  }))

  // Underline / Strikeout
  const shapeX = (STAMP_WIDTH - shapeWidth) / 2
  if (isUnderline) layer.add(new Konva.Line({ points: [shapeX, textY + textFontSize + 4, shapeX + shapeWidth, textY + textFontSize + 4], stroke: textColor, strokeWidth: 2 }))
  if (isStrikeout) layer.add(new Konva.Line({ points: [shapeX, textY + textFontSize / 2, shapeX + shapeWidth, textY + textFontSize / 2], stroke: textColor, strokeWidth: 2 }))

  // Timestamp
  if (timestampText) {
    layer.add(new Konva.Text({ text: timestampText, x: 0, y: textY + textFontSize + spacing, width: STAMP_WIDTH, align: 'center', fontSize: timeFontSize, fontFamily, fill: textColor }))
  }

  stage.add(layer)
  konvaStage = stage
}

function openEditor() {
  popoverOpen.value = false
  editorOpen.value = true
  nextTick(renderPreview)
}

function handleOk() {
  const layer = konvaStage?.getLayers()[0]
  if (!layer) return
  const shape = layer.getChildren((n) => n.name() === 'StampGroup')[0]
  if (!shape) return
  const dataUrl = konvaStage!.toDataURL({ x: shape.x(), y: shape.y(), width: shape.width(), height: shape.height() })
  if (dataUrl) {
    customStamps.value.push(dataUrl)
    emit('select', dataUrl)
    editorOpen.value = false
  }
}

function onFileUpload(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  const r = new FileReader()
  r.onload = () => {
    const dataUrl = r.result as string
    customStamps.value.push(dataUrl)
    emit('select', dataUrl)
    popoverOpen.value = false
  }
  r.readAsDataURL(f)
}

onUnmounted(() => { konvaStage?.destroy() })
</script>
