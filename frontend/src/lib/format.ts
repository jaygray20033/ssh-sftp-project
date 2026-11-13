const units = ['B', 'KB', 'MB', 'GB', 'TB']

// Short size label for the Files table.
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'

  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }

  return `${unit === 0 ? String(value) : value.toFixed(1)} ${units[unit]}`
}

const dateTime = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return dateTime.format(date)
}

export function formatFromNow(iso: string | null): string {
  if (!iso) return 'Chưa từng kết nối'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  const minutes = Math.round((Date.now() - date.getTime()) / 60_000)
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`

  const days = Math.round(hours / 24)
  if (days < 30) return `${days} ngày trước`

  return formatDateTime(iso)
}
