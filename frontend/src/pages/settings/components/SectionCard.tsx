export function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className='rounded-3xl p-6 space-y-5'
      style={{
        background: 'var(--color-surface)',
        border: '2px solid var(--text)',
        boxShadow: 'var(--clay-shadow-md)'
      }}
    >
      <h2 className='text-base font-bold' style={{ color: 'var(--color-text)' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

export function SaveButton({ loading, text = 'Lưu thay đổi' }: { loading: boolean; text?: string }) {
  return (
    <button type='submit' disabled={loading} className='btn-primary text-sm px-5 py-2.5'>
      {loading ? 'Đang lưu...' : text}
    </button>
  )
}
