import { http } from '../axios'
import type { SftpEntry } from '../types'

// Backend routes (B08) live under /hosts/:id/sftp; paths are relative to the SSH
// user's home directory, "." means home. Every call fails with 400
// HOST_KEY_UNVERIFIED when the host key is not trusted yet.

export async function listDir(hostId: string, path = '.') {
  const { data } = await http.get<{ path: string; entries: SftpEntry[] }>(`/hosts/${hostId}/sftp/list`, {
    params: { path }
  })
  return data
}

/** Binary download: must use a blob because auth goes through the Bearer header. */
export async function downloadFile(hostId: string, path: string, fileName: string) {
  const { data } = await http.get<Blob>(`/hosts/${hostId}/sftp/download`, {
    params: { path },
    responseType: 'blob'
  })
  const url = URL.createObjectURL(data)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
  } finally {
    // Revoke a tick later so the browser had time to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

/** Multipart upload; path is a directory, the file keeps its own name inside it. */
export async function uploadFile(hostId: string, path: string, file: File, onProgress?: (percent: number) => void) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await http.post<{ path: string }>(`/hosts/${hostId}/sftp/upload`, form, {
    params: { path },
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    }
  })
  return data.path
}

/** Text content of a small file, for the in-browser editor. */
export async function readFileText(hostId: string, path: string): Promise<string> {
  const { data } = await http.get<Blob>(`/hosts/${hostId}/sftp/download`, { params: { path }, responseType: 'blob' })
  return data.text()
}

export async function renameEntry(hostId: string, from: string, to: string) {
  await http.patch(`/hosts/${hostId}/sftp/rename`, { from, to })
}

export async function makeDir(hostId: string, path: string) {
  await http.post(`/hosts/${hostId}/sftp/mkdir`, { path })
}

/** `recursive` only matters for directories. */
export async function removeEntry(hostId: string, path: string, recursive = false) {
  await http.delete(`/hosts/${hostId}/sftp`, { params: { path, recursive } })
}

export const sftpService = {
  listDir,
  downloadFile,
  uploadFile,
  readFileText,
  renameEntry,
  makeDir,
  removeEntry
}
