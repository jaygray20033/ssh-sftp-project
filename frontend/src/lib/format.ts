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
