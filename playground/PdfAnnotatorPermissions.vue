<template>
  <div class="grid h-full grid-rows-[auto_minmax(0,1fr)]">
    <div class="flex flex-wrap items-center gap-2 px-3 py-2 border-y border-border">
      <strong>Current user: <span data-testid="current-user">{{ user.name }}</span></strong>
      <Button
        v-for="option in USERS"
        :key="option.id"
        :data-testid="`switch-${option.id}`"
        :aria-pressed="option.id === user.id"
        variant="outline"
        size="sm"
        @click="user = option"
      >
        {{ option.name }}
      </Button>

      <strong class="ml-3">
        Permission: <span data-testid="current-permission">{{ permissionLabel }}</span>
      </strong>
      <Button
        data-testid="permission-owner-only"
        :aria-pressed="permissionPreset === 'owner-only'"
        variant="outline"
        size="sm"
        @click="permissionPreset = 'owner-only'"
      >
        Owner only
      </Button>
      <Button
        data-testid="permission-read-only"
        :aria-pressed="permissionPreset === 'read-only'"
        variant="outline"
        size="sm"
        @click="permissionPreset = 'read-only'"
      >
        Read only
      </Button>
      <span class="ml-auto" data-testid="permission-event">{{ lastEvent }}</span>
    </div>

    <PdfAnnotator
      title="COLLABORATION PERMISSIONS"
      url="https://inklayer.dev/inklayer-demo.pdf"
      :user="user"
      :annotation-permissions="permissions"
      :initial-annotations="INITIAL_ANNOTATIONS"
      default-show-annotation-author-labels
      default-show-annotations-sidebar
      locale="en-US"
      :layout-style="{ height: '100%' }"
      @load="lastEvent = 'PDF loaded'"
      @annotation-added="(annotation) => lastEvent = `Added ${annotation.id}`"
      @annotation-updated="(annotation) => lastEvent = `Updated ${annotation.id}`"
      @annotation-deleted="(id) => lastEvent = `Deleted ${id}`"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import PdfAnnotator from '@/PdfAnnotator.vue'
import type { Annotation } from '@/core/annotation.core'
import type { AnnotationPermissions } from '@/extensions/annotator/types/annotator'
import type { User } from '@/types'

const USERS: User[] = [
  { id: 'alice', name: 'Alice' },
  { id: 'bob', name: 'Bob' },
  { id: 'admin', name: 'Admin' },
]

const OWNER_ONLY_PERMISSIONS: AnnotationPermissions = {
  mode: 'owner-only',
  can: ({ currentUser }) => currentUser?.id === 'admin' ? true : undefined,
}

const READ_ONLY_PERMISSIONS: AnnotationPermissions = {
  can: () => false,
}

const INITIAL_ANNOTATIONS: Annotation[] = [
  {
    id: 'collaboration-alice',
    kind: 'shape',
    target: {
      pageIndex: 0,
      geometry: { type: 'rect', rect: { x: 110, y: 70, width: 220, height: 90 } },
      coordinateSystem: 'pdf-user-space',
    },
    payload: { kind: 'shape', shape: 'rect' },
    appearance: { strokeColor: '#da3324', fillColor: 'rgba(218, 51, 36, 0.3)', opacity: 1 },
    relations: {},
    meta: {
      createdAt: "D:20260719090000+08'00'",
      updatedAt: "D:20260719090000+08'00'",
      authorId: USERS[0],
      isNative: false,
      source: 'inklayer',
    },
    extensions: {
      konva: {
        serialized: JSON.stringify({
          attrs: { name: 'InkLayer_Annotator_shape_group', id: 'collaboration-alice' },
          className: 'Group',
          children: [{
            attrs: {
              x: 110,
              y: 70,
              width: 220,
              height: 90,
              strokeScaleEnabled: false,
              stroke: '#da3324',
            },
            className: 'Rect',
          }],
        }),
        clientRect: { x: 110, y: 70, width: 220, height: 90 },
      },
      pdfjs: { type: 'SQUARE', subtype: 'Square' },
      legacy: {
        title: 'Alice',
        contentsObj: { text: 'Alice owns this annotation.' },
        comments: [{
          id: 'alice-comment',
          title: 'Alice',
          date: "D:20260719090100+08'00'",
          content: 'Bob may reply, but cannot edit this comment.',
          user: USERS[0],
        }],
      },
    },
  },
]

const user = ref<User>(USERS[1])
const permissionPreset = ref<'owner-only' | 'read-only'>('owner-only')
const lastEvent = ref('Waiting for PDF')
const permissions = computed(() => permissionPreset.value === 'read-only'
  ? READ_ONLY_PERMISSIONS
  : OWNER_ONLY_PERMISSIONS)
const permissionLabel = computed(() => permissionPreset.value === 'read-only' ? 'Read only' : 'Owner only')
</script>
