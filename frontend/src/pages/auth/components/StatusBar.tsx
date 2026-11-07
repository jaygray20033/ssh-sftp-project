export function StatusBar() {
  return (
    <div
      className='flex items-center justify-center gap-2 mt-6 py-2.5 px-4 rounded-full mx-auto w-fit'
      style={{
        background: 'rgba(16,185,129,0.08)',
        border: '1.5px solid rgba(16,185,129,0.2)'
      }}
    >
      <span className='w-2 h-2 rounded-full status-pulse' style={{ background: 'var(--color-up)' }} />
      <span className='text-xs font-semibold' style={{ color: '#059669' }}>
        All systems operational
      </span>
    </div>
  )
}
