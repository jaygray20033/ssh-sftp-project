interface Props {
  text?: string
}

export function AuthDivider({ text }: Props) {
  if (!text) {
    return <div className='h-px my-5' style={{ background: '#E5E7EB' }} />
  }
  return (
    <div className='flex items-center gap-3 my-5'>
      <div className='flex-1 h-px' style={{ background: '#E5E7EB' }} />
      <span className='text-xs font-semibold uppercase tracking-widest' style={{ color: '#9CA3AF' }}>
        {text}
      </span>
      <div className='flex-1 h-px' style={{ background: '#E5E7EB' }} />
    </div>
  )
}
