import type { IAnnotationStore } from '../const/definitions'
import type { AnnotationPermissionAction } from '../types/annotator'

export interface AnnotationControlPermissions {
  comment: boolean
  edit: boolean
  delete: boolean
}

export type AnnotationPermissionCheck = (
  action: AnnotationPermissionAction,
  annotation?: IAnnotationStore,
) => boolean

export function getAnnotationControlPermissions(
  check: AnnotationPermissionCheck,
  annotation: IAnnotationStore,
): AnnotationControlPermissions {
  return {
    comment: check('annotation.comment', annotation),
    edit: check('annotation.edit', annotation),
    delete: check('annotation.delete', annotation),
  }
}

export function hasAnnotationMenuControls(
  permissions: AnnotationControlPermissions,
  isCommentSidebarOpen: boolean,
  isStyleSupported: boolean,
): boolean {
  return (permissions.comment && !isCommentSidebarOpen)
    || (permissions.edit && isStyleSupported)
    || permissions.delete
}
