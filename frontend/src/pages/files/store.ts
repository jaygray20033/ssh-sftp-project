import { create } from 'zustand'
import type { SftpEntry } from '@lib/types'

export type FilesDialog = 'none' | 'mkdir' | 'rename' | 'delete' | 'edit'

interface FilesUIState {
  dialog: FilesDialog
  // The entry the open dialog works on (null for mkdir).
  target: SftpEntry | null
  openDialog: (dialog: Exclude<FilesDialog, 'none'>, entry: SftpEntry | null) => void
  closeDialog: () => void
}

export const useFilesStore = create<FilesUIState>((set) => ({
  dialog: 'none',
  target: null,

  openDialog: (dialog, entry) => set({ dialog, target: entry }),
  closeDialog: () => set({ dialog: 'none', target: null })
}))
